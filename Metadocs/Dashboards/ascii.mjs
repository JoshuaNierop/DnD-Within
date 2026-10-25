// Print a fitted tablet layout as ASCII pages: node ascii.mjs <charId> [tab]
import { readFileSync } from 'node:fs';
const [id, only] = process.argv.slice(2), P = 23, R = 30;
const f = JSON.parse(readFileSync(new URL(`fitted-tablet-${id}.json`, import.meta.url)));
const A = { profilePicture: 'P', basicInfo: 'I', hpBase: 'H', abilityScores: 'A', savingThrows: 'S', skills: 'K', conditions: 'C', classResource: 'R', featuresActive: 'F', featuresPassive: 'f', spellSlots: 'L', preparedSpells: 's', levelUp: 'U', longRest: 'Z', map: 'M', turnActions: 'T', attacks: 'X', initiativeTracker: 'N', inventory: 'V' };
for (const [tab, r] of Object.entries(f)) {
  if (only && tab !== only) continue;
  const pages = Math.max(...r.widgets.map(w => Math.floor(w.globalCol / P))) + 1;
  const g = Array.from({ length: R }, () => Array(pages * P).fill('.'));
  for (const w of r.widgets) for (let x = 0; x < w.spanUnits; x++) for (let y = 0; y < w.spanUnitsY; y++) g[w.startRowIdx + y][w.globalCol + x] = A[w.type] || '?';
  console.log(`== ${id} ${tab}`);
  for (const row of g) console.log(Array.from({ length: pages }, (_, p) => row.slice(p * P, p * P + P).join('')).join('  |  '));
}
