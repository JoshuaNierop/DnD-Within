// Regressietests voor de bugfix-ronde van 2026-09-23.
//   #P0hwaBZ — Eldritch Knight / Arcane Trickster spellcasting (third caster)
//   #P0hvu6q — background ability-bonus telde niet mee in baseAbilities
//
// Draaien vanuit de repo-root:  node Metadocs/smoke-bugfix-2026-09.cjs
// Geen browser nodig: data.js/engine.js/core.js worden in een vm-context geladen
// met minimale stubs voor localStorage, t() en syncUpload.

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function eq(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.log('FAIL  ' + msg + '  got=' + JSON.stringify(actual) + ' want=' + JSON.stringify(expected));
    failures++;
  }
}

// ---------------------------------------------------------------------------
// Deel 1 — engine: third-caster spellcasting
// ---------------------------------------------------------------------------
(function engineTests() {
  const ctx = { console };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('data.js'), ctx, { filename: 'data.js' });
  vm.runInContext(read('engine.js'), ctx, { filename: 'engine.js' });

  const { getMaxPrepared, getMaxCantrips, getSpellSlots, getSpellListClass, getSpellcastingAbility } = ctx;
  const DATA = vm.runInContext('DATA', ctx);

  // Prepared spells: vaste 2024-kolom, identiek voor EK en AT, geen ability-mod.
  eq(getMaxPrepared({ level: 3 }, 3, 'fighter', 'eldritchKnight'), 3, 'EK L3 prepared');
  eq(getMaxPrepared({ level: 7 }, 3, 'fighter', 'eldritchKnight'), 5, 'EK L7 prepared');
  eq(getMaxPrepared({ level: 20 }, 5, 'fighter', 'eldritchKnight'), 13, 'EK L20 prepared');
  eq(getMaxPrepared({ level: 2 }, 3, 'fighter', 'eldritchKnight'), 0, 'EK L2 prepared (nog geen subclass)');
  eq(getMaxPrepared({ level: 5 }, 3, 'rogue', 'arcaneTrickster'), 4, 'AT L5 prepared');

  // Niet-casters blijven 0, volle casters blijven ongewijzigd.
  eq(getMaxPrepared({ level: 10 }, 3, 'fighter', ''), 0, 'fighter zonder EK blijft non-caster');
  eq(getMaxPrepared({ level: 10 }, 3, 'rogue', 'soulknife'), 0, 'soulknife blijft non-caster');
  eq(getMaxPrepared({ level: 3 }, 4, 'wizard'), 6, 'wizard L3 prepared (tabel)');
  eq(getMaxPrepared({ level: 9 }, 4, 'wizard'), 13, 'wizard L9 prepared (legacy formule)');

  // Cantrips: EK 2→3, AT 3→4, sprong op level 10.
  eq(getMaxCantrips(3, 'fighter', 'eldritchKnight'), 2, 'EK L3 cantrips');
  eq(getMaxCantrips(10, 'fighter', 'eldritchKnight'), 3, 'EK L10 cantrips');
  eq(getMaxCantrips(3, 'rogue', 'arcaneTrickster'), 3, 'AT L3 cantrips');
  eq(getMaxCantrips(10, 'rogue', 'arcaneTrickster'), 4, 'AT L10 cantrips');
  eq(getMaxCantrips(1, 'wizard'), DATA.wizard.cantripsKnown[1], 'wizard cantrips ongewijzigd');

  // Slots komen uit de bestaande third-caster-tabel en starten op level 3.
  eq(getSpellSlots('fighter', 3, 'eldritchKnight'), [2, 0, 0, 0], 'EK L3 slots');
  eq(getSpellSlots('fighter', 2, 'eldritchKnight'), [], 'EK L2 slots leeg');
  eq(getSpellSlots('fighter', 19, 'eldritchKnight'), DATA.thirdCasterSlots[19], 'EK L19 slots');

  // Spell-bron en ability.
  eq(getSpellListClass('fighter', 'eldritchKnight'), 'wizard', 'EK kiest uit de wizard-lijst');
  eq(getSpellListClass('rogue', 'arcaneTrickster'), 'wizard', 'AT kiest uit de wizard-lijst');
  eq(getSpellListClass('cleric', 'life'), 'cleric', 'cleric blijft cleric');
  eq(getSpellcastingAbility('fighter', 'eldritchKnight'), 'int', 'EK gebruikt INT');
  eq(DATA.thirdCasterFixedCantrips.arcaneTrickster, ['Mage Hand'], 'AT heeft Mage Hand verplicht');
})();

// ---------------------------------------------------------------------------
// Deel 2 — core: background-bonus in baseAbilities + eenmalige migratie
// ---------------------------------------------------------------------------
(function migrationTests() {
  const store = {};
  const ctx = {
    console,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    t: (k) => k,
    syncUpload: () => {},
    window: {}, document: { addEventListener() {} },
    setTimeout, location: { pathname: '/' }, history: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('data.js'), ctx, { filename: 'data.js' });
  try {
    vm.runInContext(read('core.js'), ctx, { filename: 'core.js' });
  } catch (e) {
    console.log('core.js laadwaarschuwing (browser-only code):', e.message);
  }

  const { applyBgBonusesToAbilities, stripBgBonusesFromAbilities, loadCharConfig } = ctx;

  const bonuses = { str: 2, dex: 0, con: 0, int: 1, wis: 0, cha: 0 };
  const rawScores = { str: 15, dex: 10, con: 14, int: 13, wis: 12, cha: 8 };
  const withBonus = applyBgBonusesToAbilities(rawScores, bonuses);
  eq(withBonus.str, 17, 'Guard +2 STR: 15 → 17');
  eq(withBonus.int, 14, 'Guard +1 INT: 13 → 14');
  eq(withBonus.con, 14, 'CON ongemoeid');
  eq(stripBgBonusesFromAbilities(withBonus, bonuses), rawScores, 'strip is de exacte inverse van apply');

  // Wizard-character van vóór de fix wordt eenmalig gerepareerd.
  store['dw_charconfig_varragoth'] = JSON.stringify({
    id: 'varragoth', name: 'Varragoth', abilityMethod: 'array',
    backgroundBonuses: bonuses, baseAbilities: rawScores,
  });
  const first = loadCharConfig('varragoth');
  eq(first.baseAbilities.str, 17, 'migratie telt de bonus op');
  eq(first.abilityBonusApplied, true, 'migratie zet de vlag');
  eq(loadCharConfig('varragoth').baseAbilities.str, 17, 'idempotent: 2e load telt niet nogmaals op');
  eq(loadCharConfig('varragoth').baseAbilities.int, 14, 'idempotent: INT blijft 14');

  // Legacy characters (SEED_DATA-vorm, geen abilityMethod) hebben de bonus al
  // in hun scores staan en mogen NIET opgehoogd worden.
  store['dw_charconfig_ren'] = JSON.stringify({
    id: 'ren', name: 'Ren',
    backgroundBonuses: { dex: 2, con: 1 }, baseAbilities: { dex: 17, con: 15 },
  });
  const ren = loadCharConfig('ren');
  eq(ren.baseAbilities.dex, 17, 'legacy DEX ongewijzigd');
  eq(ren.baseAbilities.con, 15, 'legacy CON ongewijzigd');
  eq(!!ren.abilityBonusApplied, false, 'legacy krijgt geen vlag');
})();

if (failures) {
  console.log('\n' + failures + ' test(s) FAILED');
  process.exitCode = 1;
} else {
  console.log('ALL TESTS PASS');
}
