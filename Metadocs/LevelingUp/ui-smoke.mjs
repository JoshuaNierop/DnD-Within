// ui-smoke.mjs — targeted render test of the level-up window for what is new or ambiguous
// (L6-20 mechanics). Drives the real wgxOpenLevelUpModal / wgxRenderLUStep with a fake DOM:
// no browser, no Firebase. Run from the project root: node Metadocs/LevelingUp/ui-smoke.mjs
import { loadEngine, makeChar, autoLevelUp, makePick } from './harness.mjs';

const E = loadEngine();
const G = E.__global;
const { DATA } = E;
let pass = 0, fail = 0;
const check = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log(' ✗ ' + name + (detail ? ' — ' + detail : '')); } };

// fake DOM: the window writes its HTML into one card object
const card = { innerHTML: '' };
G.document = {
  querySelector: (sel) => (sel === '.wgx-lu-card' ? card : null),
  createElement: () => ({ className: '', innerHTML: '', addEventListener() {}, remove() {} }),
  body: { appendChild() {} },
};
G.WG_CHAR_CACHE = {};

// Build a character at `level` (auto picks), open the level-up window for level+1, render every step
// (making picks as it goes) and return { html per step id, picked, delta }.
function walk(label, cls, sub, level, race = 'human', prefs = {}) {
  const { config: cfg, state: st } = makeChar(E, cls, race, { originFeat: 'Alert' });
  const p = Object.assign({ subclass: sub, lineage: undefined, asiFeat: 'Ability Score Improvement', optionIndex: 0, invocations: ['Pact of the Blade'] }, prefs);
  for (let to = 2; to <= level; to++) autoLevelUp(E, label, cfg, st, p);
  G.WG_CHAR_CACHE.t = { config: cfg, state: st };
  G.wgxOpenLevelUpModal('t');
  const LU = G.wgxLU, pages = {};
  for (let guard = 0; guard < 60; guard++) {
    const step = LU.steps[LU.stepIdx];
    G.wgxRenderLUStep();
    const key = step.kind === 'choice' ? step.choice.id + (step.choice.opt ? ':' + step.choice.opt : '') + (step.choice.owner ? ':' + step.choice.owner + '.' + step.choice.pick : '') : step.kind;
    pages[key] = card.innerHTML;
    check(label + ' — ' + key + ' renders without "undefined"/"NaN"', !/undefined|NaN/.test(card.innerHTML.replace(/data-[a-z-]+="[^"]*"/g, '')), card.innerHTML.match(/.{40}(undefined|NaN).{20}/)?.[0]);
    if (step.kind === 'choice' && !G.wgxStepComplete(step, LU.picked)) {
      if (prefs.pick && prefs.pick(step, LU.picked)) { /* custom pick */ } else makePick(E, step, cfg, st, LU.delta, LU.picked, p);
      G.wgxRegenLUSteps();
    }
    if (LU.stepIdx >= LU.steps.length - 1) break;
    LU.stepIdx++;
  }
  G.wgxRenderLUStep(); pages.summary = card.innerHTML;
  return { pages, picked: LU.picked, delta: LU.delta, cfg, st };
}
const page = (r, prefix) => Object.entries(r.pages).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v).join('\n');
const options = (html) => [...html.matchAll(/data-val="([^"]+)"/g)].map((m) => m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&'));

// 1. One-of-N option steps (new step type): labels, all options, swap note, summary
{
  const r = walk('Cleric 6→7', 'cleric', 'life', 6);
  const h = page(r, 'option:blessedStrikes');
  check('Blessed Strikes step shows both options', options(h).join() === 'Divine Strike,Potent Spellcasting', options(h).join());
  check('Blessed Strikes in the summary', /Blessed Strikes/.test(r.pages.summary));
  const r2 = walk('Hunter 6→7', 'ranger', 'hunter', 6);
  check('Defensive Tactics says it can switch on a Short or Long Rest', /Short or Long Rest/.test(page(r2, 'option:defensiveTactics')));
  const r3 = walk('Draconic 5→6', 'sorcerer', 'draconic', 5);
  check('Elemental Affinity offers 5 damage types', options(page(r3, 'option:elementalAffinity')).length === 5);
  const r4 = walk('Wild Heart 5→6', 'barbarian', 'wildHeart', 5);
  check('Aspect of the Wilds: Owl/Panther/Salmon + Long Rest note', options(page(r4, 'option:aspectOfTheWilds')).join() === 'Owl,Panther,Salmon' && /Long Rest/.test(page(r4, 'option:aspectOfTheWilds')));
}
// 2. Magical Discoveries (Lore 6): spells from three lists, cantrips allowed, nothing above level 3
{
  const r = walk('Lore 5→6', 'bard', 'lore', 5);
  const h = page(r, 'featSpells:fp.magicalDiscoveries');
  const opts = options(h);
  check('Magical Discoveries step exists', !!h);
  check('… header names Cleric, Druid or Wizard lists', /Cleric, Druid or Wizard lists/.test(h), h.match(/<h3>[^<]*<\/h3>/)?.[0]);
  check('… offers a Cleric-only spell (Spiritual Weapon) and a cantrip (Guidance)', opts.includes('Spiritual Weapon') && opts.includes('Guidance'));
  check('… no spell above level 3', opts.every((n) => (DATA.spellPool[n] || {}).level <= 3), opts.filter((n) => DATA.spellPool[n].level > 3).join());
  check('… no Bard-list-only filter (Fireball, a Wizard spell, is there)', opts.includes('Fireball'));
}
// 3. Magical Secrets (Bard 10): new prepared spells may come from the Wizard list
{
  const r = walk('Bard 9→10', 'bard', 'lore', 9);
  const opts = options(r.pages.spells || '');
  check('Bard 10 spell picker includes Wizard spells (Fireball) and stays ≤ level 5', opts.includes('Fireball') && opts.every((n) => DATA.spellPool[n].level <= 5));
  check('Bard 9 (no Magical Secrets) does not', !options(walk('Bard 8→9', 'bard', 'lore', 8).pages.spells || '').includes('Fireball'));
}
// 4. Mystic Arcanum (Warlock 11): level 6 Warlock spells only
{
  const r = walk('Warlock 10→11', 'warlock', 'fiend', 10);
  const h = page(r, 'featSpells:fp.mysticArcanum');
  const opts = options(h);
  check('Mystic Arcanum step titled with level 6', /Mystic Arcanum \(level 6\)/.test(h));
  check('… only level 6 Warlock spells', opts.length > 0 && opts.every((n) => DATA.spellPool[n].level === 6 && DATA.spells.warlock[6].includes(n)), opts.join());
}
// 5. Spell Mastery (Wizard 18): one-action spells only; Signature Spells (20): two level 3 picks
{
  const r = walk('Wizard 17→18', 'wizard', 'evocation', 17);
  const m1 = options(page(r, 'featSpells:fp.spellMastery.mastery1')), m2 = options(page(r, 'featSpells:fp.spellMastery.mastery2'));
  check('Spell Mastery level 1 + 2 steps, all "1 action"', m1.length && m2.length && m1.concat(m2).every((n) => DATA.spellPool[n].time === '1 action'), m1.concat(m2).filter((n) => DATA.spellPool[n].time !== '1 action').join());
  check('… Find Familiar (1 hour) is not offered', !m1.includes('Find Familiar'));
  const r2 = walk('Wizard 19→20', 'wizard', 'evocation', 19);
  const sig = page(r2, 'featSpells:fp.signatureSpells');
  check('Signature Spells asks for 2 level 3 spells', /choose 2 level 3 spells/.test(sig), sig.match(/<h3>[^<]*<\/h3>/)?.[0]);
}
// 6. Epic Boon (19): boons offered, +1 allowed above 20, Boon of Skill expertise on any skill
{
  let boonPicked = false;
  const r = walk('Fighter 18→19', 'fighter', 'champion', 18, 'human', {
    pick(step, picked) {
      if (step.choice.id === 'asi' && !boonPicked) { picked.asi = { type: 'feat', feat: 'Boon of Skill' }; boonPicked = true; return true; }
      return false;
    },
  });
  check('Level 19 ASI step lists Epic Boons', /Boon of Skill/.test(page(r, 'asi')));
  const ab = page(r, 'featAbility');
  check('Epic Boon ability step allows 20 → 21 (cap 30)', /20 → 21/.test(ab) || !/already 20/.test(ab), ab.match(/<span class="wgx-lu-cost">[^<]*/g)?.join(' | '));
  const xp = page(r, 'featExpertise');
  check('Boon of Skill expertise offers skills you are not proficient in (Animal Handling)', options(xp).includes('animalHandling'), options(xp).join());
}
// 7. Champion 7: second Fighting Style, the first one marked known
{
  const r = walk('Champion 6→7', 'fighter', 'champion', 6);
  const h = r.pages.fightingStyle || '';
  check('Champion 7 asks for a Fighting Style', !!h);
  check('… the style you have is shown as known', (r.st.fightingStyles || []).every((s) => h.includes(s) && /known/.test(h)));
}
// 8. Wild Shape picker: no Fly forms before druid level 8, Fly forms (marked) from 8
{
  const r = walk('Druid 3→4', 'druid', 'land', 3);
  const o4 = options(r.pages.wildShapeForms || '');
  check('Druid 4: no Fly forms (Bat, Blood Hawk)', o4.length && !o4.includes('Bat') && !o4.includes('Blood Hawk'), o4.join());
  const r8 = walk('Druid 7→8', 'druid', 'land', 7);
  check('Druid 8: Fly forms offered and labelled', /Giant Eagle|Blood Hawk|Raven/.test(r8.pages.wildShapeForms || '') && /· Fly/.test(r8.pages.wildShapeForms || ''));
}
// 9. Level Down names what it removes (options and feature spells)
{
  const r = walk('Lore 5→6 down', 'bard', 'lore', 5);
  const patch = G.wgxBuildLevelUpPatch(r.cfg, r.st, r.delta, r.picked);
  const st6 = G.wgxApplyPaths(r.st, patch.statePatch);
  const down = G.wgxBuildLevelDownPatch(r.cfg, st6);
  check('Level Down lists the Magical Discoveries spells', down.lost.some((l) => /^Spells: /.test(l)), down.lost.join(' | '));
  const c = walk('Cleric 6→7 down', 'cleric', 'life', 6);
  const st7 = G.wgxApplyPaths(c.st, G.wgxBuildLevelUpPatch(c.cfg, c.st, c.delta, c.picked).statePatch);
  check('Level Down lists Blessed Strikes', G.wgxBuildLevelDownPatch(c.cfg, st7).lost.some((l) => /Blessed Strikes/.test(l)));
}
// 10. Confirm sends a PATCH Firebase accepts: no path inside another path (HTTP 400)
{
  const overlap = (p) => { const ks = Object.keys(p || {}); return ks.filter((a) => ks.some((b) => b !== a && b.startsWith(a + '/'))); };
  const sent = [];
  const origState = G.wgxPatchState, origConfig = G.wgxPatchConfig, origToast = G.showToast;
  G.wgxPatchState = async (id, p) => { sent.push(p); };
  G.wgxPatchConfig = async (id, p) => { sent.push(p); };
  G.showToast = () => {};
  for (const [label, cls, sub, lvl] of [['Sorcerer 1→2', 'sorcerer', 'draconic', 1], ['Wizard 3→4', 'wizard', 'evoker', 3], ['Fighter 2→3', 'fighter', 'champion', 2]]) {
    sent.length = 0;
    walk(label, cls, sub, lvl);
    await G.wgxConfirmLevelUp();
    const bad = sent.flatMap(overlap);
    check(label + ' — confirm PATCH has no overlapping paths', sent.length && !bad.length, bad.join(', '));
    const st = sent[sent.length - 1] || {};   // config (if any) is patched first, state last
    const rec = st['levelChoices/' + (lvl + 1)];
    check(label + ' — _picked stored with the level record', !!((rec && rec._picked) || st['levelChoices/' + (lvl + 1) + '/_picked']));
  }
  G.wgxPatchState = origState; G.wgxPatchConfig = origConfig; G.showToast = origToast;
}

console.log('\nui-smoke: ' + pass + '/' + (pass + fail) + ' checks passed');
if (fail) process.exit(1);
