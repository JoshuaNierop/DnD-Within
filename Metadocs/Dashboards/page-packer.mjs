// Tablet page packer. A portrait tablet shows one fixed page (cols × rows) at a
// time, so instead of an exact fill this fills pages in priority order:
// every widget goes where its bottom edge ends highest (then leftmost), in the
// fitted shape that does that best. A widget that no longer fits waits for the
// next page, and smaller widgets behind it may still use the room left on the
// current page. Free-size widgets (portrait, map, initiative tracker) try their
// preferred sizes largest first.
//
// That greedy rule is run once as is and then with seeded random shape picks;
// the result with the fewest pages wins, then the one that pushes
// high-priority widgets least far back, then the most compact.
//
// packPages({ cols, rows, pieces: [{ type, shapes: [[w,h],..] } | { type, sizes: [[w,h],..] }] })
//   → { widgets, pages: [[type,..],..] }  (globalCol includes page * cols)

export function packPages({ cols, rows, pieces, tries = 400 }) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const n = pieces.length;
  let best = null;
  for (let t = 0; t < tries; t++) {
    const res = packOnce(cols, rows, pieces, t === 0 ? null : rnd);
    const pageOf = Object.fromEntries(res.pages.flatMap((ps, i) => ps.map(type => [type, i])));
    const push = pieces.reduce((a, p, i) => a + pageOf[p.type] * (n - i), 0);
    const height = res.widgets.reduce((a, w) => a + (w.startRowIdx + w.spanUnitsY) * (1 + Math.floor(w.globalCol / cols)), 0);
    const score = [res.pages.length, push, height];
    if (!best || cmp(score, best.score) < 0) best = { ...res, score };
  }
  delete best.score;
  return best;
}
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function packOnce(cols, rows, pieces, rnd) {
  const widgets = [], pages = [];
  let rest = pieces.slice();
  for (let page = 0; rest.length; page++) {
    const grid = new Uint8Array(cols * rows), placed = [], later = [];
    const free = (c, r, w, h) => {
      if (c + w > cols || r + h > rows) return false;
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (grid[y * cols + x]) return false;
      return true;
    };
    // best spot for one size: highest bottom edge, then leftmost
    const spot = (w, h) => {
      for (let r = 0; r + h <= rows; r++) for (let c = 0; c + w <= cols; c++) if (free(c, r, w, h)) return { c, r };
      return null;
    };
    for (const p of rest) {
      let best = null;
      if (p.sizes) {
        const start = rnd && rnd() < 0.3 ? 1 : 0;   // random variant: sometimes one size smaller
        for (const [w, h] of p.sizes.slice(Math.min(start, p.sizes.length - 1))) { const s = spot(w, h); if (s) { best = { ...s, w, h }; break; } }
      } else {
        // random variant: sometimes only one random shape is on the table
        const shapes = rnd && p.shapes.length > 1 && rnd() < 0.35 ? [p.shapes[Math.floor(rnd() * p.shapes.length)]] : p.shapes;
        for (const [w, h] of shapes) {
          const s = spot(w, h);
          if (!s) continue;
          const cand = { ...s, w, h };
          if (!best || s.r + h < best.r + best.h || (s.r + h === best.r + best.h && (s.c < best.c || (s.c === best.c && w < best.w)))) best = cand;
        }
      }
      if (!best) { later.push(p); continue; }
      for (let y = best.r; y < best.r + best.h; y++) for (let x = best.c; x < best.c + best.w; x++) grid[y * cols + x] = 1;
      placed.push(p.type);
      widgets.push({ type: p.type, globalCol: page * cols + best.c, startRowIdx: best.r, spanUnits: best.w, spanUnitsY: best.h });
    }
    if (!placed.length) throw new Error(`does not fit on an empty page: ${later.map(p => p.type).join(', ')}`);
    pages.push(placed);
    rest = later;
  }
  return { widgets, pages };
}
