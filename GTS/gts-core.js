/* GTS Pickleball 2026 — shared live layer for index.html and live.html.
   Firebase Realtime Database (same project as the IAG site, separate "gts" path),
   organiser PIN, announcements and the connection pill. */
(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBvlflZt28TrZi-nZ6-L8YV1IBqrLiIvsc",
    authDomain: "iag-pickleball.firebaseapp.com",
    databaseURL: "https://iag-pickleball-default-rtdb.firebaseio.com",
    projectId: "iag-pickleball",
    storageBucket: "iag-pickleball.firebasestorage.app",
    messagingSenderId: "1032967317528",
    appId: "1:1032967317528:web:8742c451537507ca37fb6d"
  };
  // SHA-256 of the organiser PIN (the PIN itself is not stored in the page)
  const PIN_HASH = "068d3a71f19af21bb4290ba57ce236acc974c9a5c6013a00c904aa95e88a3e4c";

  // ?db=test points every read and write at a sandbox path (used for rehearsals)
  const ns = (new URLSearchParams(location.search).get("db") || "").replace(/[^a-z0-9]/gi, "");
  const ROOT = ns ? "gts-" + ns : "gts";

  const listeners = { admin: [], status: [] };
  let db = null;
  let isAdmin = false;
  try { isAdmin = sessionStorage.getItem("gts-admin") === "1"; } catch (e) {}

  function emit(type, value) { listeners[type].forEach(fn => { try { fn(value); } catch (e) { console.error(e); } }); }

  function init() {
    if (typeof firebase === "undefined") { emit("status", "offline"); return null; }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    emit("status", "connecting");
    db.ref(".info/connected").on("value", s => emit("status", s.val() ? "live" : "connecting"));
    return db;
  }

  function ref(path) { return db ? db.ref(ROOT + (path ? "/" + path : "")) : null; }

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function unlock(pin) {
    const ok = (await sha256(String(pin).trim().toUpperCase())) === PIN_HASH;
    if (ok) {
      isAdmin = true;
      try { sessionStorage.setItem("gts-admin", "1"); } catch (e) {}
      emit("admin", true);
    }
    return ok;
  }

  function lock() {
    isAdmin = false;
    try { sessionStorage.removeItem("gts-admin"); } catch (e) {}
    emit("admin", false);
  }

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function timeAgo(ts) {
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    const d = new Date(ts);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  /* ---------- Announcements ---------- */
  // el: container element. Renders newest first; organisers get a delete button per item.
  function mountAnnouncements(el, opts) {
    opts = opts || {};
    let items = [];
    const render = () => {
      const list = items.slice(0, opts.limit || 20);
      if (!list.length) {
        el.innerHTML = opts.emptyText ? `<p class="ann-empty">${esc(opts.emptyText)}</p>` : "";
        el.hidden = !opts.emptyText && !isAdmin;
        return;
      }
      el.hidden = false;
      el.innerHTML = list.map(a => `
        <article class="ann-item${a.pinned ? " pinned" : ""}">
          <div class="ann-text">${esc(a.text).replace(/\n/g, "<br>")}</div>
          <div class="ann-meta"><span>${a.pinned ? "📌 Pinned · " : ""}${esc(timeAgo(a.at))}</span>
            ${isAdmin ? `<button type="button" class="ann-del" data-id="${esc(a.id)}">Delete</button>` : ""}</div>
        </article>`).join("");
      el.querySelectorAll(".ann-del").forEach(b => b.addEventListener("click", () => {
        const r = ref("announcements/" + b.dataset.id);
        if (r) r.remove();
      }));
    };
    const r = ref("announcements");
    if (r) r.on("value", snap => {
      const v = snap.val() || {};
      items = Object.keys(v).map(id => Object.assign({ id }, v[id]))
        .filter(a => a && a.text)
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.at - a.at);
      render();
    });
    listeners.admin.push(render);
    render();
  }

  function postAnnouncement(text, pinned) {
    const r = ref("announcements");
    text = String(text || "").trim();
    if (!r || !isAdmin || !text) return Promise.reject(new Error("not allowed"));
    return r.push({ text: text.slice(0, 600), at: firebase.database.ServerValue.TIMESTAMP, pinned: !!pinned });
  }

  /* ---------- PIN dialog (shared markup is injected once) ---------- */
  function ensurePinDialog() {
    let dlg = document.getElementById("gts-pin");
    if (dlg) return dlg;
    dlg = document.createElement("div");
    dlg.id = "gts-pin";
    dlg.className = "gts-modal";
    dlg.hidden = true;
    dlg.innerHTML = `
      <form class="gts-modal-card" autocomplete="off">
        <h3>Organiser login</h3>
        <p>Enter the organiser PIN to update scores and post announcements.</p>
        <input type="password" inputmode="text" maxlength="12" placeholder="PIN" aria-label="Organiser PIN">
        <div class="gts-modal-err" role="alert"></div>
        <div class="gts-modal-actions">
          <button type="button" class="gbtn ghost" data-cancel>Cancel</button>
          <button type="submit" class="gbtn primary">Unlock</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector("form"), input = dlg.querySelector("input"), err = dlg.querySelector(".gts-modal-err");
    dlg.querySelector("[data-cancel]").addEventListener("click", () => { dlg.hidden = true; });
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.hidden = true; });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (await unlock(input.value)) { dlg.hidden = true; }
      else { err.textContent = "Incorrect PIN"; input.value = ""; input.focus(); }
    });
    return dlg;
  }

  function askPin() {
    const dlg = ensurePinDialog();
    dlg.querySelector(".gts-modal-err").textContent = "";
    dlg.querySelector("input").value = "";
    dlg.hidden = false;
    setTimeout(() => dlg.querySelector("input").focus(), 50);
  }

  // A button that toggles organiser mode
  function bindAdminButton(btn) {
    const paint = () => {
      btn.textContent = isAdmin ? "Organiser: log out" : "Organiser login";
      btn.classList.toggle("on", isAdmin);
    };
    btn.addEventListener("click", () => (isAdmin ? lock() : askPin()));
    listeners.admin.push(paint);
    paint();
  }

  function bindStatus(el) {
    const text = { live: "Live", connecting: "Connecting…", offline: "Offline" };
    listeners.status.push(s => { el.dataset.state = s; el.textContent = text[s] || s; });
  }

  window.GTS = {
    init, ref, esc, timeAgo, unlock, lock, askPin,
    get isAdmin() { return isAdmin; },
    get root() { return ROOT; },
    onAdmin: fn => listeners.admin.push(fn),
    onStatus: fn => listeners.status.push(fn),
    mountAnnouncements, postAnnouncement, bindAdminButton, bindStatus
  };
})();
