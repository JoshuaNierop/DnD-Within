// One-off (2026-10-23): add "The Ledger of Names" (handout, 200 names) as a lore item,
// and fix/add the ledger creatures (Yra -> Eira Voss, Gribble Mossfoot, Frederique Nox,
// new Barabas Bellweather). Re-reads live data and locates entries by id, not index.
// Usage: node Metadocs/ledger-import.mjs [--go]
const DB = 'https://dnd-within-firebase-default-rtdb.firebaseio.com/dw/world/lore_cats';
const go = process.argv.includes('--go');

const DEBT = {
  lc: 'Labor covenant', ps: 'Pledged service', sp: 'Service of passage', wp: 'Writ of passage',
  ds: 'Debt of shelter', os: 'Oath of safe return', tf: 'Trade forfeiture', gs: 'Guardian surety',
  bo: 'Bloodline obligation', io: 'Inheritance obligation', md: 'Medical debt', bp: 'Bond of protection',
  fv: 'Family service / Voss line',
};
const STATUS = { B: 'Bound', T: 'Transferred', R: 'In review' };
// name|debt|years|status, numbered 0001..0200 in order
const RAW = `
Eira Voss|fv|150|B
Briar Valehart|lc|15|B
Eamon Westmere|ps|20|B
Rowan Hartwell|wp|99|T
Thalia Nightingale|ds|5|B
Arlen Oakheart|os|75|B
Ambrose Crowhurst|tf|99|B
Adeline Hartwell|gs|20|B
Calder Hollowmere|bo|30|B
Aldric Larkspur|bo|30|B
Zephyr Greymoor|lc|9|B
Jasper Stonecroft|md|25|B
Selene Redfern|bp|60|B
Jasper Brackenvale|io|5|B
Soren Greycairn|bo|40|B
Selene Wildmere|sp|60|T
Rowan Valehart|gs|3|B
Galen Hallowmere|tf|9|R
Ansel Duskryn|lc|15|B
Quill Crowhurst|bp|9|B
Silas Whitlock|ps|3|B
Thalia Starling|ps|60|B
Liora Crowhurst|os|5|B
Isolde Vellstone|os|15|B
Quill Goldleaf|io|3|T
Anwen Ashenford|bo|75|B
Celeste Oakheart|lc|12|B
Selene Duskwater|sp|3|B
Merrick Hallowmere|lc|99|B
Lucan Marshfield|tf|30|B
Arlen Rookwood|tf|75|T
Odessa Westmere|gs|15|B
Theron Hartwell|ds|5|B
Hazel Wildmere|io|5|B
Celeste Winterborne|lc|9|B
Gideon Morrow|wp|99|B
Rosamund Hartwell|io|3|B
Eldric Redfern|ps|40|B
Aldric Fairweather|io|30|B
Brenna Candlewick|md|15|B
Lysander Starling|lc|15|B
Anwen Ravenscar|sp|60|T
Silas Brackenvale|os|15|R
Lucan Wyrmwood|tf|3|B
Anwen Greycairn|sp|12|B
Orin Blackbriar|ps|9|R
Kael Goldleaf|ps|3|B
Sabine Ravenscar|md|40|B
Finnian Fenwick|os|99|B
Anwen Frostmere|lc|5|B
Dahlia Crowhurst|gs|60|B
Dorian Hollowmere|md|15|B
Sabine Stonecroft|ds|12|T
Jack Holloway|bo|12|B
Lysander Redfern|ps|25|B
Adeline Wyrmwood|os|75|B
Corin Oakheart|bo|5|B
Beatrice Moonbrook|os|15|B
Amara Hartwell|bo|20|B
Arlen Duskryn|bp|12|B
Finnian Ashenford|sp|40|T
Rosamund Frostmere|lc|7|R
Evander Stonecroft|lc|5|B
Aldric Vellstone|os|20|B
Bellamy Fenwick|bo|20|T
Eldric Thornfield|bo|7|B
Rowan Winterborne|bo|75|B
Arlen Willowcrest|md|60|B
Jasper Greycairn|io|60|B
Aurelia Morrow|ds|3|T
Corin Blackbriar|lc|75|T
Caldus Kestrel|bp|5|B
Astrid Valehart|bp|5|R
Odessa Hallowmere|bp|40|B
Eldric Valehart|ps|40|B
Lysander Willowcrest|md|75|B
Brenna Westmere|ps|40|B
Rosamund Lockwood|bp|99|T
Astrid Dawnmere|md|40|B
Wren Oakheart|lc|5|B
Selene Kestrel|io|40|B
Rosamund Wildmere|gs|25|B
Dorian Candlewick|ps|12|B
Celeste Reedwater|wp|40|B
Eamon Blackbriar|sp|20|B
Briar Westmere|wp|75|B
Beatrice Ironwood|tf|15|R
Rosamund Starling|io|99|B
Celeste Hallowmere|os|20|B
Selene Lockwood|ps|99|R
Emrys Reedwater|io|7|B
Amara Whitlock|os|5|B
Calla Yewfall|ps|3|B
Eamon Reedwater|gs|15|T
Maren Winterborne|bp|3|B
Ambrose Valehart|tf|7|T
Flora Duskwater|sp|99|B
Merrick Brackenvale|wp|75|B
Lucan Thornfield|bp|12|B
Calder Morrow|tf|20|B
Beatrice Hollowmere|lc|60|B
Cedric Stonecroft|ps|9|B
Calder Thornfield|gs|9|B
Odessa Oakheart|bo|99|R
Gideon Hollowmere|tf|7|R
Caldus Crowhurst|tf|5|B
Odessa Nightingale|bp|40|B
Quill Thornfield|md|40|R
Gribble Mossfoot|tf|60|R
Caldus Willowcrest|lc|99|B
Zephyr Moonbrook|sp|15|B
Astrid Marshfield|bp|25|T
Aurelia Nightingale|bo|75|B
Lysander Hartwell|lc|20|B
Gideon Ironwood|wp|15|R
Gideon Reedwater|md|5|B
Nerys Redfern|ds|7|R
Cressida Larkspur|bo|40|B
Aurelia Emberfall|io|40|B
Calder Ashford|ds|12|R
Ambrose Ravenscar|tf|5|B
Eamon Stonecroft|tf|60|R
Cressida Willowcrest|lc|12|B
Liora Ironwood|ps|60|B
Cedric Kestrel|ps|3|T
Corin Fairweather|lc|12|B
Zephyr Lockwood|tf|99|B
Evander Ravenscar|bp|40|B
Jasper Starling|io|15|B
Lucan Larkspur|ds|12|B
Amara Wildmere|sp|99|B
Talia Wildmere|ps|60|B
Linnea Willowcrest|lc|60|B
Fenna Duskwater|wp|5|B
Talia Brackenvale|gs|3|T
Finnian Willowcrest|bp|5|B
Bellamy Silverthorn|io|9|B
Wren Brightmere|lc|5|B
Hazel Reedwater|gs|60|B
Fenna Wildmere|md|5|R
Theron Ashford|os|12|B
Dorian Ashenford|tf|5|B
Bellamy Valehart|bo|15|B
Thalia Ashford|lc|99|B
Thalia Silverthorn|gs|5|R
Eamon Winterborne|gs|15|T
Soren Hollowmere|bo|25|B
Corin Starling|sp|15|B
Vesper Crowhurst|bo|75|B
Caldus Oakheart|io|99|T
Wren Valehart|sp|5|B
Barabas Bellweather|wp|30|B
Fenna Yewfall|md|30|B
Evander Rookwood|io|15|B
Cressida Wildmere|md|9|T
Caldus Nightingale|gs|75|B
Ilyra Larkspur|ps|60|B
Briar Ashenford|ps|7|B
Galen Larkspur|lc|99|B
Theron Candlewick|sp|75|T
Dahlia Greycairn|md|40|B
Cedric Hartwell|bo|40|B
Rosamund Cinderfall|lc|15|T
Selene Blackbriar|ps|60|R
Theron Willowcrest|tf|30|B
Brenna Wildmere|bo|99|B
Hazel Stonecroft|tf|7|B
Gideon Starling|gs|75|B
Liora Greycairn|ds|3|B
Odessa Starling|wp|75|B
Celeste Valehart|io|40|B
Aurelia Ironwood|gs|75|B
Fenna Silverthorn|gs|12|B
Jasper Nightingale|io|75|B
Anwen Ashford|bo|99|B
Vesper Wildmere|ds|12|T
Jasper Winterborne|os|15|B
Soren Crowhurst|io|7|B
Rowan Candlewick|bp|15|B
Elowen Whitlock|io|3|B
Cedric Hallowmere|bo|40|B
Finnian Cinderfall|sp|15|B
Elara Starling|gs|12|B
Emrys Hollowmere|md|20|R
Emrys Candlewick|lc|25|B
Caldus Duskryn|sp|5|B
Theron Marshfield|bo|20|B
Frederique Nox|bp|9|B
Hazel Duskwater|os|60|B
Sabine Cinderfall|md|30|B
Orin Crowhurst|md|3|R
Ansel Frostmere|wp|30|B
Dorian Lockwood|ps|7|B
Caldus Larkspur|lc|12|B
Zephyr Starling|lc|30|B
Selene Stonecroft|md|99|B
Zephyr Winterborne|wp|12|B
Cressida Ravenscar|md|5|B
Wren Hollowmere|io|99|B
Rosamund Blackbriar|sp|99|B
`.trim().split('\n');

const ledger = RAW.map((line, i) => {
  const [name, d, years, s] = line.split('|');
  if (!DEBT[d] || !STATUS[s]) throw new Error('bad row ' + (i + 1) + ': ' + line);
  return { no: String(i + 1).padStart(4, '0'), name, debt: DEBT[d], years: Number(years), status: STATUS[s] };
});
if (ledger.length !== 200) throw new Error('expected 200 rows, got ' + ledger.length);

const get = async p => (await fetch(`${DB}/${p}.json`)).json();
const write = async (method, p, body) => {
  console.log(`${method} ${p}`);
  if (!go) return;
  const res = await fetch(`${DB}/${p}.json`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { console.error(`  HTTP ${res.status} ${await res.text()}`); process.exit(1); }
};

const items = await get('items');
const monsters = await get('monsters');
if (!Array.isArray(items) || !Array.isArray(monsters)) throw new Error('lore_cats not arrays');
if (items.some(e => e && e.name === 'The Ledger of Names')) throw new Error('ledger already exists');

const ledgerId = 'le' + Date.now();
const ledgerToken = `[[lore:${ledgerId}|The Ledger of Names]]`;
const listed = name => {
  const r = ledger.find(x => x.name === name);
  return `Listed in ${ledgerToken} as no. ${r.no} (${r.debt}, ${r.years} years, ${r.status.toLowerCase()}).`;
};

await write('PUT', `items/${items.length}`, {
  id: ledgerId,
  name: 'The Ledger of Names',
  description: 'The Caravan of Elsewhere | Register of Bound Souls. Volume XIII, five leaves, 200 names. Property of the Keeper of the Covenant.\n' +
    'Certified under the true name of the Thirteenth Keeper: Cassian Veyr Morcant.\n\n' +
    '"No name may be struck from this register without the Keeper\'s seal. All names herein remain subject to the Covenant of Binding."',
  effect: '',
  ledger,
});

const idx = id => {
  const i = monsters.findIndex(e => e && e.id === id);
  if (i < 0) throw new Error('creature not found: ' + id);
  return i;
};
const withDesc = (e, text) => (e.description ? e.description.trim() + '\n' : '') + text;

const eira = idx('le1790373662727');
await write('PATCH', `monsters/${eira}`, { firstName: 'Eira', name: 'Eira Voss', description: withDesc(monsters[eira], listed('Eira Voss')) });

const gribble = idx('le1790370474502');
await write('PATCH', `monsters/${gribble}`, { firstName: 'Gribble', lastName: 'Mossfoot', name: 'Gribble Mossfoot',
  description: withDesc(monsters[gribble], 'Also known as Harry and Quickfingers.\n' + listed('Gribble Mossfoot')) });

const nox = idx('le1790372894731');
await write('PATCH', `monsters/${nox}`, { description: withDesc(monsters[nox], listed('Frederique Nox')) });

if (monsters.some(e => e && /barabas/i.test(e.name || ''))) throw new Error('Barabas already exists');
// Same field set + visibility as the other caravan creatures (copied from Eira's record).
const tpl = monsters[eira];
const barabas = {};
for (const k of Object.keys(tpl)) barabas[k] = typeof tpl[k] === 'string' ? '' : tpl[k];
Object.assign(barabas, { id: 'le' + (Date.now() + 1), firstName: 'Barabas', lastName: 'Bellweather', name: 'Barabas Bellweather',
  hidden: false, description: listed('Barabas Bellweather') });
await write('PUT', `monsters/${monsters.length}`, barabas);

if (!go) console.log('dry run — add --go to write');
