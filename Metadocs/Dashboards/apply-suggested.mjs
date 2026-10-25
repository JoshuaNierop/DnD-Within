// Run 2026-10-23 and 2026-10-25 (after re-measuring desktop): write the suggested layouts to every player's dashboards,
// as if each player pressed Save. Desktop gets the layout; tablet is stored empty
// so wgSeedEmptySlots fills it with the page-width-corrected layout at load.
// Usage: node Metadocs/Dashboards/apply-suggested.mjs <backup.json> [--go]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DB = 'https://dnd-within-firebase-default-rtdb.firebaseio.com';
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', '..', 'wg-defaults.js'), 'utf8');
const LAYOUTS = new Function(src + '; return WG_DEFAULT_LAYOUTS;')();
const SITS = ['character', 'social', 'exploring', 'combat', 'inventory'];

const backupPath = process.argv[2];
const go = process.argv.includes('--go');
if (!backupPath) { console.error('backup path required'); process.exit(1); }
const backup = JSON.parse(readFileSync(backupPath, 'utf8'));

const players = Object.keys(LAYOUTS).filter(id => !id.startsWith('_'));
const now = Date.now();
const empty = () => ({ schemaVersion: 1, widgets: [], currentPage: 0, updatedAt: now });

for (const id of players) {
  const oldMap = backup[id]?.desktop?.exploring?.widgets?.find(w => w.type === 'map')?.map;
  const desktop = {};
  for (const sit of SITS) {
    const widgets = LAYOUTS[id].desktop[sit].map(([type, globalCol, startRowIdx, spanUnits, spanUnitsY]) => {
      const w = { globalCol, spanUnits, startRowIdx, spanUnitsY, title: '', type };
      if (type === 'map') w.map = { dimIdx: oldMap?.dimIdx ?? 0, ...(oldMap?.mapId ? { mapId: oldMap.mapId } : {}) };
      return w;
    });
    desktop[sit] = { schemaVersion: 1, widgets, currentPage: 0, updatedAt: now };
  }
  const tablet = Object.fromEntries(SITS.map(s => [s, empty()]));
  const summary = SITS.map(s => `${s}:${desktop[s].widgets.length}`).join(' ');
  console.log(`${id.padEnd(14)} desktop ${summary}${oldMap?.mapId ? ` (map ${oldMap.mapId})` : ''}`);
  if (!go) continue;
  for (const [device, body] of [['desktop', desktop], ['tablet', tablet]]) {
    const res = await fetch(`${DB}/dw/characters/${encodeURIComponent(id)}/dashboards/${device}.json`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) { console.error(`  ${device}: HTTP ${res.status} ${await res.text()}`); process.exit(1); }
  }
  console.log('  written');
}
if (!go) console.log('dry run — add --go to write');
