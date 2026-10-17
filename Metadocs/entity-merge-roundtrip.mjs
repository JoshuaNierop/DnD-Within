// Entity-merge phase 0: offline round-trip test (Entity-Merge-Plan.md §3/§4).
// Replays ensureEntityIds + migrateNpcsIntoCreatures (ui-world.js, families.js)
// on an RTDB dump with a stubbed localStorage, in two scenarios:
//   1. "as dumped"  — the dump as it is (already migrated → must be a no-op)
//   2. "pre-merge"  — the dump with the migration undone (creatures with _fromNpc,
//                     _npcsMerged and linkedCreatureId removed) → full migration
// Checks: every NPC id exactly once in lore_cats.monsters; no NPC field lost;
// a second run makes zero changes; every linkedNpcKey has a linkedCreatureId;
// dw_npcs unchanged apart from the backfill fields (id, firstName, lastName, name, family).
// usage: node Metadocs/entity-merge-roundtrip.mjs [dump.json]   (default: newest Metadocs/rtdb-dw-*.json)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const dumpPath = process.argv[2] || fs.readdirSync(here).filter((f) => /^rtdb-dw-.*\.json$/.test(f)).sort().map((f) => path.join(here, f)).pop();
if (!dumpPath) { console.error('No dump found: pass a dw-level RTDB dump (Metadocs/rtdb-dw-*.json).'); process.exit(1); }
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));
const world = dump.world || (dump.dw && dump.dw.world);
if (!world) { console.error('Dump has no world/ node: ' + dumpPath); process.exit(1); }

let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else { fail++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); } };
const clone = (o) => JSON.parse(JSON.stringify(o));

function sandbox(w) {
  const store = {
    dw_npcs: JSON.stringify(w.npcs || { npcs: [] }),
    dw_lore_cats: JSON.stringify(w.lore_cats || {}),
    dw_families: JSON.stringify(w.families || { families: {}, members: {}, unions: {} }),
  };
  const writes = [];
  const c = {
    console,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    syncUpload: (k) => writes.push(k),
    document: { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } },
  };
  c.window = c;
  vm.createContext(c);
  for (const f of ['families.js', 'ui-world.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), c, { filename: f });
  const run = () => { writes.length = 0; c.ensureEntityIds(true); c.migrateNpcsIntoCreatures(true); return writes.slice(); };
  const read = () => ({ npcs: JSON.parse(store.dw_npcs), lc: JSON.parse(store.dw_lore_cats), fams: JSON.parse(store.dw_families) });
  return { run, read };
}

const BACKFILL = ['id', 'firstName', 'lastName', 'name', 'family'];
function verify(label, w) {
  const before = clone(w);
  const sb = sandbox(w);
  sb.run();
  const after = sb.read();
  const npcs = (after.npcs.npcs || []).filter(Boolean);
  const mons = (after.lc.monsters || []).filter(Boolean);

  check(label + ': every NPC has an id', npcs.every((n) => n.id));
  for (const n of npcs) {
    const hits = mons.filter((m) => m.id === n.id);
    check(label + ': NPC ' + n.id + ' exactly once in monsters', hits.length === 1, hits.length + '×');
    if (hits.length !== 1) continue;
    // Empty NPC values ('' / null) don't count: the creature editor drops empty fields on save.
    const lost = Object.keys(n).filter((k) => !(k in hits[0]) && n[k] !== '' && n[k] != null);
    check(label + ': NPC ' + n.id + ' keeps every field', !lost.length, 'missing ' + lost.join(', '));
  }
  const origNpcs = ((before.npcs || {}).npcs || []).filter(Boolean);
  check(label + ': NPC count unchanged', origNpcs.length === npcs.length, origNpcs.length + ' → ' + npcs.length);
  origNpcs.forEach((o, i) => {
    const n = npcs[i] || {};
    const changed = Object.keys(Object.assign({}, o, n)).filter((k) => !BACKFILL.includes(k) && JSON.stringify(o[k]) !== JSON.stringify(n[k]));
    check(label + ': dw_npcs[' + i + '] only backfill fields changed', !changed.length, changed.join(', '));
  });
  const nonNpcBefore = ((before.lore_cats || {}).monsters || []).filter((m) => m && !m._fromNpc).length;
  check(label + ': existing creatures kept', mons.filter((m) => !m._fromNpc).length === nonNpcBefore);
  for (const [mid, m] of Object.entries(after.fams.members || {})) {
    if (m && m.linkedNpcKey != null && m.linkedNpcKey !== '') check(label + ': member ' + mid + ' linkedNpcKey → linkedCreatureId', !!m.linkedCreatureId);
  }
  const second = sb.run();
  check(label + ': second run makes zero writes', second.length === 0, second.join(', '));
  return { npcs: npcs.length, creatures: mons.length };
}

// Scenario 2: undo the migration that is already in the dump.
function premerge(w) {
  const p = clone(w);
  if (p.lore_cats) {
    p.lore_cats.monsters = (p.lore_cats.monsters || []).filter((m) => m && !m._fromNpc);
    delete p.lore_cats._npcsMerged;
  }
  for (const m of Object.values((p.families || {}).members || {})) if (m) delete m.linkedCreatureId;
  return p;
}

const a = verify('as dumped', world);
const b = verify('pre-merge', premerge(world));
console.log('entity-merge round-trip (' + path.basename(dumpPath) + '): ' + pass + '/' + (pass + fail) + ' checks passed · ' +
  a.npcs + ' NPCs, ' + a.creatures + ' creatures as dumped, ' + b.creatures + ' after replay');
process.exit(fail ? 1 : 0);
