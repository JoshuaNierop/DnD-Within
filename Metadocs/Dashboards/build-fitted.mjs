// Fitted layouts: re-pack each character's suggested widgets using only fitted
// shapes measured in the real app (fitted-shapes-<device>.json, see Readme in
// default-layouts.mjs header). Usage: node build-fitted.mjs <device> <charId> → fitted-<device>-<charId>.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solve } from './fit-solver.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const [device, id, onlyTabs, budget] = process.argv.slice(2);
const M = JSON.parse(readFileSync(join(here, `fitted-shapes-${device}.json`), 'utf8'));
const T = JSON.parse(readFileSync(join(here, 'template-layouts.json'), 'utf8'));   // written by default-layouts.mjs
const TABLET = { cols: 22, rows: 30 };   // safe page for 810–834 px portrait tablets
const rows = device === "tablet" ? TABLET.rows : M.rows, cols = device === "tablet" ? TABLET.cols : M.tpp;
const FREE = {
  profilePicture: { w: [5, 10], h: [6, 10] },
  map: { w: [12, 26], h: [8, rows] },
  initiativeTracker: { w: device === "tablet" ? [12, 16] : [10, 14], h: [Math.min(rows, 18), rows] },   // auto-fits its height in combat; app minimum width 12 on tablet
};
const outFile = join(here, `fitted-${device}-${id}.json`);
const out = onlyTabs && existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
for (const tab of (onlyTabs ? onlyTabs.split(',') : ['character', 'social', 'exploring', 'combat', 'inventory'])) {
  const order = T[id][device][tab].slice().sort((a, b) => (a.globalCol - b.globalCol) || (a.startRowIdx - b.startRowIdx)).map(w => w.type);
  const pieces = order.map(type => FREE[type] ? { type, free: FREE[type] }
    : { type, shapes: M.chars[id][type].shapes.map(s => [s[0], s[1]]).filter(([w, h]) => w <= Math.min(20, cols) && h <= rows) });
  const t = Date.now();
  const opts = { cols, rows, closeFirst: process.env.CLOSE === "1", attemptMs: +(budget || (device === "tablet" ? 600 : 1500)), gapSteps: process.env.GAPS ? process.env.GAPS.split(",").map(Number) : (device === "tablet" ? [0, 4, 12, 30] : [0, 3, 8, 16, 30]) };
  let res;
  if (device !== "tablet") res = solve({ ...opts, pieces });
  else {
    // page 1: longest priority prefix that packs; page 2: the rest
    let k = pieces.length, p1 = null;
    for (; k > 0 && !p1; k--) p1 = solve({ ...opts, pieces: pieces.slice(0, k) });
    k++;
    const rest = pieces.slice(k);
    const p2 = rest.length ? solve({ ...opts, pieces: rest }) : { widgets: [], gaps: 0, usedCols: 0, usedRows: 0 };
    res = p1 && p2 ? {
      widgets: [...p1.widgets, ...p2.widgets.map(w => ({ ...w, globalCol: w.globalCol + cols }))],
      usedCols: p1.usedCols, usedRows: p1.usedRows, gaps: p1.gaps + p2.gaps, page2: rest.map(p => p.type),
    } : null;
  }
  console.log(id, tab, res ? `${res.usedCols}x${res.usedRows} gaps ${res.gaps}` : 'NO SOLUTION', `${Math.round((Date.now() - t) / 1000)}s`);
  if (res || !out[tab]) out[tab] = res;
}
writeFileSync(outFile, JSON.stringify(out));
