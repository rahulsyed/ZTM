/* GTS Pickleball 2026 — Excel export of the live scores (SheetJS, loaded on demand). */
(function () {
  const XLSX_URL = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  const STAGE = { league: "League", sf1: "Semifinal 1", sf2: "Semifinal 2", final: "Final (best of 3)" };

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = XLSX_URL;
      s.onload = () => ok(window.XLSX);
      s.onerror = () => fail(new Error("Could not load the Excel library"));
      document.head.appendChild(s);
    });
  }

  const fmt = m => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
  const stageOf = m => (m.stage === "league" ? "league" : m.stage === "final" ? "final" : "semi");

  // rows for every match, using live scores and organiser seed picks
  function matchRows(D, E, scores, seeds) {
    const po = {};
    D.divisions.forEach(d => Object.assign(po, E.playoffs(d, D.matches, scores, seeds[d.key] || {})));
    const name = Object.fromEntries(D.divisions.map(d => [d.key, d.name]));
    return D.matches.slice().sort((a, b) => a.start - b.start || a.court - b.court).map(m => {
      const s = m.stage === "league" ? { a: m.a, b: m.b } : po[m.id];
      const r = E.result(stageOf(m), scores[m.id]);
      const sc = scores[m.id] || {};
      return {
        Time: fmt(m.start), Court: m.court, Division: name[m.div], Stage: STAGE[m.stage],
        "Team A": s.a || (s.aNote || "TBD").split(" · ")[0], "Team B": s.b || (s.bNote || "TBD").split(" · ")[0],
        "Game 1": r.games[0] ? r.games[0].join("-") : "", "Game 2": r.games[1] ? r.games[1].join("-") : "", "Game 3": r.games[2] ? r.games[2].join("-") : "",
        Winner: r.done ? (r.winner === "a" ? s.a : s.b) : "",
        "Last updated": sc.at ? new Date(sc.at).toLocaleString() : "",
        "Match ID": m.id
      };
    });
  }

  async function download(D, E, scores, seeds) {
    const X = await loadXLSX();
    const wb = X.utils.book_new();
    const all = matchRows(D, E, scores, seeds);
    const sheet = (rows, widths) => { const ws = X.utils.json_to_sheet(rows); ws["!cols"] = widths.map(w => ({ wch: w })); return ws; };
    const W = [9, 6, 15, 17, 32, 32, 8, 8, 8, 32, 20, 11];
    X.utils.book_append_sheet(wb, sheet(all, W), "All matches");
    D.divisions.forEach(d => {
      const st = E.standings(d, D.matches, scores).rows.map((r, i) => ({
        Rank: i + 1, Team: r.team, Played: r.p, Won: r.w, Lost: r.l, "Points for": r.pf, "Points against": r.pa, "+/-": r.diff,
        Qualifies: i < d.qualify ? (d.qualify === 2 ? "Final" : "Semis") : ""
      }));
      const ws = sheet(st, [6, 34, 7, 6, 6, 11, 14, 6, 10]);
      X.utils.sheet_add_aoa(ws, [[""], ["Matches"]], { origin: -1 });
      X.utils.sheet_add_json(ws, all.filter(r => r.Division === d.name), { origin: -1 });
      X.utils.book_append_sheet(wb, ws, d.name.replace(/[^A-Za-z0-9 .]/g, "").slice(0, 31));
    });
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    X.writeFile(wb, `GTS-Pickleball-Scores-${stamp}.xlsx`);
  }

  window.GTSExport = { download, matchRows, fmt };
})();
