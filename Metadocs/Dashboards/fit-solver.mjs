// Fitted dashboard packer. Every content widget gets one of its measured fitted
// shapes (smallest width for a row count, exact height); free-size widgets
// (portrait, map, initiative tracker) take any size in their range. For a target
// block width T (narrowest first) it looks for an exact fill of T × rows, allowing
// a small number of empty cells only when an exact fill does not exist.
// Search: first empty cell in column-major order, pieces in priority order,
// pruned on remaining area.
//
// solve({ cols, rows, pieces: [{ type, shapes: [[w,h],..] } | { type, free: {w:[a,b], h:[a,b]} }] })
//   → { widgets, usedCols, gaps } | null

export function solve({ cols, rows, pieces, attemptMs = 250, gapSteps = [0, 2, 4, 8, 12, 18, 26], minCols = 0, lowMs = 120, closeFirst = false }) {
  const n = pieces.length;
  const areaMin = pieces.map(p => p.shapes ? Math.min(...p.shapes.map(([w, h]) => w * h)) : p.free.w[0] * p.free.h[0]);
  const areaMax = pieces.map(p => p.shapes ? Math.max(...p.shapes.map(([w, h]) => w * h)) : p.free.w[1] * p.free.h[1]);
  const totalMin = areaMin.reduce((a, b) => a + b, 0);
  const startT = Math.max(minCols, Math.ceil(totalMin / rows), ...pieces.map(p => p.shapes ? Math.min(...p.shapes.map(s => s[0])) : p.free.w[0]));

  // Block height H: full height first; sparse tabs may use a lower block.
  const hMin = Math.max(...pieces.map(p => p.shapes ? Math.min(...p.shapes.map(s => s[1])) : p.free.h[0]));
  let best = null;
  for (let H = rows; H >= hMin; H--) {
    const t0 = Math.max(startT0(H), 1);
    if (best && t0 * rows >= best.score) continue;
    for (let T = t0; T <= cols; T++) {
      if (best && T * rows >= best.score) break;
      let found = null;
      for (const G of gapSteps) { found = attempt(T, H, G, H === rows ? attemptMs : lowMs); if (found) break; }
      if (found) {
        const score = T * rows + 5 * found.gaps;
        if (!best || score < best.score) best = { ...found, score };
        if (found.gaps === 0) break;                         // wider cannot beat an exact fill
      }
    }
    if (H === rows && best && best.gaps === 0) break;   // dense tab, perfect full-height fill
  }
  return best;

  function startT0(H) {
    return Math.max(minCols, Math.ceil(totalMin / H), ...pieces.map(p => p.shapes ? Math.min(...p.shapes.filter(s => s[1] <= H).map(s => s[0]).concat([Infinity])) : p.free.w[0]));
  }

  function attempt(T, rows, G, budget) {
    const grid = new Uint8Array(T * rows);
    const used = new Array(n).fill(false);
    const place = [];
    const t0 = Date.now();
    let filled = 0, gapsUsed = 0, result = null, minLeft = totalMin, maxLeft = areaMax.reduce((a, b) => a + b, 0);
    const free = (c, r, w, h) => {
      if (c + w > T || r + h > rows) return false;
      for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) if (grid[x * rows + y]) return false;
      return true;
    };
    const set = (c, r, w, h, v) => { for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) grid[x * rows + y] = v; };
    const runDown = (c, r) => { let k = 0; while (r + k < rows && !grid[c * rows + r + k]) k++; return k; };
    const runRight = (c, r) => { let k = 0; while (c + k < T && !grid[(c + k) * rows + r]) k++; return k; };

    function opts(i, c, r) {
      const p = pieces[i], down = runDown(c, r), right = runRight(c, r);
      if (p.shapes) return p.shapes.filter(([w, h]) => h <= down && w <= right);
      const out = [];
      for (let h = Math.min(p.free.h[1], down); h >= p.free.h[0]; h--)
        for (let w = Math.min(p.free.w[1], right); w >= p.free.w[0]; w--) out.push([w, h]);
      // prefer filling the full free run below, then larger
      out.sort((a, b) => ((b[1] === down) - (a[1] === down)) || (b[0] * b[1] - a[0] * a[1]));
      return out;
    }

    function dfs() {
      if (result || Date.now() - t0 > budget) return;
      const empty = T * rows - filled - gapsUsed;
      if (empty - (G - gapsUsed) > maxLeft) return;           // cannot cover what is left
      if (minLeft > empty) return;                              // pieces left do not fit
      let c = -1, r = -1;
      outer: for (let x = 0; x < T; x++) for (let y = 0; y < rows; y++) if (!grid[x * rows + y]) { c = x; r = y; break outer; }
      if (c < 0 || place.length === n) {
        if (place.length === n && empty <= G - gapsUsed) result = place.map(p => ({ ...p }));
        return;
      }
      const down = runDown(c, r), cand = [];
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        for (const [w, h] of opts(i, c, r)) cand.push([i, w, h]);
      }
      // closing a column exactly (piece reaches the next obstacle below) first, then priority
      if (closeFirst) cand.sort((a, b) => ((a[2] !== down) - (b[2] !== down)) || (a[0] - b[0]));
      for (const [i, w, h] of cand) {
        {
          if (!free(c, r, w, h)) continue;
          set(c, r, w, h, 1); used[i] = true; filled += w * h; minLeft -= areaMin[i]; maxLeft -= areaMax[i];
          place.push({ i, c, r, w, h });
          dfs();
          place.pop(); used[i] = false; filled -= w * h; minLeft += areaMin[i]; maxLeft += areaMax[i]; set(c, r, w, h, 0);
          if (result || Date.now() - t0 > budget) return;
        }
      }
      if (gapsUsed < G) {
        gapsUsed++; set(c, r, 1, 1, 2);
        dfs();
        set(c, r, 1, 1, 0); gapsUsed--;
      }
    }
    dfs();
    if (!result) return null;
    const area = result.reduce((a, p) => a + p.w * p.h, 0);
    return {
      widgets: result.map(p => ({ type: pieces[p.i].type, globalCol: p.c, startRowIdx: p.r, spanUnits: p.w, spanUnitsY: p.h })),
      usedCols: T, usedRows: rows, gaps: T * rows - area,
    };
  }
}
