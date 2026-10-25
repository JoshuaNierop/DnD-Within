// Fitted layouts: re-pack each character's suggested widgets using only fitted
// shapes measured in the real app (fitted-shapes-<device>.json, see Readme in
// default-layouts.mjs header). Usage: node build-fitted.mjs <device> <charId> → fitted-<device>-<charId>.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solve } from './fit-solver.mjs';
import { packPages } from './page-packer.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const [device, id, onlyTabs, budget] = process.argv.slice(2);
const M = JSON.parse(readFileSync(join(here, `fitted-shapes-${device}.json`), 'utf8'));
const T = JSON.parse(readFileSync(join(here, 'template-layouts.json'), 'utf8'));   // written by default-layouts.mjs
const TABLET = { cols: 23, rows: 30 };   // safe page for 744–1023 px portrait tablets at WG_TABLET_CFG
// Generic layouts (characters without their own entry) borrow a party member's shapes.
const SHAPES_OF = { _full: 'saya', _half: 'barius', _martial: 'ren' };
const rows = device === "tablet" ? TABLET.rows : M.rows, cols = device === "tablet" ? TABLET.cols : M.tpp;
const FREE = {
  profilePicture: { w: [5, 10], h: [6, 10] },
  map: { w: [12, 26], h: [8, rows] },
  initiativeTracker: { w: device === "tablet" ? [13, 17] : [10, 14], h: [Math.min(rows, 18), rows] },   // auto-fits its height in combat; app minimum ~355 px wide on tablet
};
// Tablet: preferred sizes for free-size widgets, largest first.
const TABLET_SIZES = {
  profilePicture: [[9, 9], [8, 8], [7, 7], [6, 6]],
  map: [[23, 14], [23, 12], [18, 12], [14, 10], [12, 8]],
  initiativeTracker: [[15, 24], [13, 22], [13, 18]],
};
const outFile = join(here, `fitted-${device}-${id}.json`);
const out = onlyTabs && existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
for (const tab of (onlyTabs ? onlyTabs.split(',') : ['character', 'social', 'exploring', 'combat', 'inventory'])) {
  const order = T[id][device][tab].slice().sort((a, b) => (a.globalCol - b.globalCol) || (a.startRowIdx - b.startRowIdx)).map(w => w.type);
  const pieces = order.map(type => FREE[type] ? { type, free: FREE[type] }
    : { type, shapes: M.chars[SHAPES_OF[id] || id][type].shapes.map(s => [s[0], s[1]]).filter(([w, h]) => w <= Math.min(20, cols) && h <= rows) });
  const t = Date.now();
  const opts = { cols, rows, closeFirst: process.env.CLOSE === "1", attemptMs: +(budget || (device === "tablet" ? 600 : 1500)), gapSteps: process.env.GAPS ? process.env.GAPS.split(",").map(Number) : (device === "tablet" ? [0, 4, 12, 30] : [0, 3, 8, 16, 30]) };
  let res;
  if (device !== "tablet") res = solve({ ...opts, pieces });
  else {
    const r = packPages({ cols, rows, pieces: pieces.map(p => p.free ? { type: p.type, sizes: TABLET_SIZES[p.type] } : p) });
    res = { ...r, usedCols: cols, usedRows: rows, gaps: r.pages.length * cols * rows - r.widgets.reduce((a, w) => a + w.spanUnits * w.spanUnitsY, 0) };
  }
  console.log(id, tab, res ? `${res.usedCols}x${res.usedRows} gaps ${res.gaps}${res.pages ? ' pages ' + res.pages.map(p => p.join(',')).join(' | ') : ''}` : 'NO SOLUTION', `${Math.round((Date.now() - t) / 1000)}s`);
  if (res || !out[tab]) out[tab] = res;
}
writeFileSync(outFile, JSON.stringify(out));
