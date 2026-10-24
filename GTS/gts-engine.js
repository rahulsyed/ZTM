/* GTS Pickleball 2026 — scoring rules (no DOM, no Firebase; also runs under Node for tests).
   League: one game (to 11, 10-minute cap). Semis: one game to 15. Finals: best of 3 to 7.
   Standings: wins, then point difference, then head-to-head (two-way ties), then points for. */
(function (root) {
  const MAX_POINTS = 21;
  // PJ's rules: league (and final) games to 11, win by 2, capped at 15 (first to 15 wins).
  // Semis to 15, win by 2, capped at 21.
  const TARGET = { league: 11, semi: 15, final: 11 };
  const CAP = { league: 15, semi: 21, final: 15 };

  function toInt(v) {
    if (v === "" || v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!/^\d{1,2}$/.test(s)) return NaN;
    return parseInt(s, 10);
  }

  // One game: returns {ok, a, b, error}.
  // A winner below the target is allowed (time cap). Above the target the winner must lead by exactly 2.
  function checkGame(a, b, target, cap) {
    target = target || 11;
    cap = cap || MAX_POINTS;
    const x = toInt(a), y = toInt(b);
    if (x === null || y === null) return { ok: false, error: "Enter both scores" };
    if (isNaN(x) || isNaN(y) || x > cap || y > cap) return { ok: false, error: `Scores must be whole numbers from 0 to ${cap} (first to ${cap} wins)` };
    if (x === y) return { ok: false, error: "A game can't end in a tie" };
    const w = Math.max(x, y), l = Math.min(x, y);
    // at the cap, the next point wins: cap–(cap-1) is allowed
    if (w === cap && l === cap - 1 && cap > target) return { ok: true, a: x, b: y };
    if (w > target && w - l !== 2) return { ok: false, error: `Over ${target} points the winner must win by 2 (e.g. ${target + 1}–${target - 1}), or first to ${cap}` };
    if (w === target && l === target - 1) return { ok: false, error: `${target}–${target - 1} isn't finished: play on until someone leads by 2 (e.g. ${target + 1}–${target - 1})` };
    return { ok: true, a: x, b: y };
  }

  const isBestOf3 = stage => stage === "final";

  // Validate what an organiser typed. games: [[a,b],[a,b],[a,b]] (empty strings allowed for unused games)
  // Returns {ok, value, error}; value is what gets stored.
  function validate(stage, games) {
    const target = TARGET[stage] || 11;
    if (!isBestOf3(stage)) {
      const g = checkGame(games[0][0], games[0][1], target, CAP[stage]);
      return g.ok ? { ok: true, value: { a: g.a, b: g.b } } : { ok: false, error: g.error };
    }
    const filled = games.map(g => !(toInt(g[0]) === null && toInt(g[1]) === null));
    const out = [];
    let wa = 0, wb = 0;
    for (let i = 0; i < 3; i++) {
      if (!filled[i]) continue;
      if (i > 0 && !filled[i - 1]) return { ok: false, error: `Fill game ${i} before game ${i + 1}` };
      if (wa === 2 || wb === 2) return { ok: false, error: "Match was already won — remove the extra game" };
      const g = checkGame(games[i][0], games[i][1], target, CAP[stage]);
      if (!g.ok) return { ok: false, error: `Game ${i + 1}: ${g.error}` };
      out.push([g.a, g.b]);
      g.a > g.b ? wa++ : wb++;
    }
    if (!out.length) return { ok: false, error: "Enter at least game 1" };
    // Partial best-of-3 is allowed (match in progress); it simply has no winner yet.
    return { ok: true, value: { g: out } };
  }

  // Result of a stored score: {done, winner:'a'|'b'|null, games:[[a,b]...], wa, wb, pa, pb}
  function result(stage, stored) {
    const empty = { done: false, winner: null, games: [], wa: 0, wb: 0, pa: 0, pb: 0 };
    if (!stored) return empty;
    if (!isBestOf3(stage)) {
      if (typeof stored.a !== "number" || typeof stored.b !== "number" || stored.a === stored.b) return empty;
      return { done: true, winner: stored.a > stored.b ? "a" : "b", games: [[stored.a, stored.b]], wa: +(stored.a > stored.b), wb: +(stored.b > stored.a), pa: stored.a, pb: stored.b };
    }
    const games = Array.isArray(stored.g) ? stored.g.filter(g => Array.isArray(g) && g.length === 2) : [];
    let wa = 0, wb = 0, pa = 0, pb = 0;
    games.forEach(([x, y]) => { pa += x; pb += y; if (x > y) wa++; else if (y > x) wb++; });
    const winner = wa >= 2 ? "a" : wb >= 2 ? "b" : null;
    return { done: !!winner, winner, games, wa, wb, pa, pb };
  }

  // Standings for one division
  function standings(div, matches, scores) {
    const st = {};
    div.teams.forEach(t => { st[t] = { team: t, p: 0, w: 0, l: 0, pf: 0, pa: 0 }; });
    const league = matches.filter(m => m.div === div.key && m.stage === "league");
    const h2h = {};
    league.forEach(m => {
      const r = result("league", scores[m.id]);
      if (!r.done || !st[m.a] || !st[m.b]) return;
      const A = st[m.a], B = st[m.b];
      A.p++; B.p++;
      A.pf += r.pa; A.pa += r.pb; B.pf += r.pb; B.pa += r.pa;
      const win = r.winner === "a" ? m.a : m.b, lose = r.winner === "a" ? m.b : m.a;
      st[win].w++; st[lose].l++;
      h2h[win + "|" + lose] = (h2h[win + "|" + lose] || 0) + 1;
    });
    const rows = Object.values(st).map(r => Object.assign(r, { diff: r.pf - r.pa }));
    rows.sort((x, y) => {
      if (y.w !== x.w) return y.w - x.w;
      if (y.diff !== x.diff) return y.diff - x.diff;
      // head-to-head only decides a clean two-way tie
      const tied = rows.filter(r => r.w === x.w && r.diff === x.diff);
      if (tied.length === 2) {
        const xy = h2h[x.team + "|" + y.team] || 0, yx = h2h[y.team + "|" + x.team] || 0;
        if (xy !== yx) return yx - xy;
      }
      if (y.pf !== x.pf) return y.pf - x.pf;
      return div.teams.indexOf(x.team) - div.teams.indexOf(y.team);
    });
    const played = league.filter(m => result("league", scores[m.id]).done).length;
    return { rows, played, total: league.length, complete: played === league.length };
  }

  // Who plays each playoff match. seeds = organiser overrides {sf1a, sf1b, sf2a, sf2b, fa, fb}
  // Returns {matchId: {a, b, aNote, bNote, confirmed}}
  function playoffs(div, matches, scores, seeds) {
    seeds = seeds || {};
    const table = standings(div, matches, scores);
    const seed = n => (table.rows[n - 1] || {}).team || null;
    const pick = (key, auto, note) => seeds[key] ? { team: seeds[key], note: "Set by organiser", fixed: true }
      : { team: table.complete ? auto : null, note: table.complete ? note : `${note} · now ${auto || "TBD"}`, fixed: table.complete };
    const out = {};
    const k = div.key;
    if (div.qualify === 2) {
      const a = pick("fa", seed(1), "Seed 1"), b = pick("fb", seed(2), "Seed 2");
      out[k + "-final"] = { a: a.team, b: b.team, aNote: a.note, bNote: b.note, confirmed: a.fixed && b.fixed };
      return out;
    }
    const s1a = pick("sf1a", seed(1), "Seed 1"), s1b = pick("sf1b", seed(4), "Seed 4");
    const s2a = pick("sf2a", seed(2), "Seed 2"), s2b = pick("sf2b", seed(3), "Seed 3");
    out[k + "-sf1"] = { a: s1a.team, b: s1b.team, aNote: s1a.note, bNote: s1b.note, confirmed: s1a.fixed && s1b.fixed };
    out[k + "-sf2"] = { a: s2a.team, b: s2b.team, aNote: s2a.note, bNote: s2b.note, confirmed: s2a.fixed && s2b.fixed };
    const w = id => {
      const p = out[id], r = result("semi", scores[id]);
      return p.confirmed && r.done ? (r.winner === "a" ? p.a : p.b) : null;
    };
    const fa = seeds.fa ? { team: seeds.fa, note: "Set by organiser", fixed: true } : { team: w(k + "-sf1"), note: "Winner SF1", fixed: !!w(k + "-sf1") };
    const fb = seeds.fb ? { team: seeds.fb, note: "Set by organiser", fixed: true } : { team: w(k + "-sf2"), note: "Winner SF2", fixed: !!w(k + "-sf2") };
    out[k + "-final"] = { a: fa.team, b: fb.team, aNote: fa.note, bNote: fb.note, confirmed: fa.fixed && fb.fixed };
    return out;
  }

  // Champion and runner-up once the final is decided
  function podium(div, matches, scores, seeds) {
    const p = playoffs(div, matches, scores, seeds)[div.key + "-final"];
    const r = result("final", scores[div.key + "-final"]);
    if (!p.confirmed || !r.done) return null;
    return r.winner === "a" ? { champion: p.a, runnerUp: p.b } : { champion: p.b, runnerUp: p.a };
  }

  const api = { checkGame, validate, result, standings, playoffs, podium, isBestOf3, TARGET, CAP, MAX_POINTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GTSEngine = api;
})(typeof window !== "undefined" ? window : globalThis);
