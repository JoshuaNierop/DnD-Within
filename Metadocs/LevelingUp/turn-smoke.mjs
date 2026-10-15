// turn-smoke.mjs — test of the Your Turn widget, spell-effect countdown and the
// nested-tooltip term links (wg-turn.js, wg-glossary.js, wg-features.js grouping).
// No browser, no Firebase. Run from the project root: node Metadocs/LevelingUp/turn-smoke.mjs
import fs from 'fs';
import { loadEngine, makeChar, autoLevelUp, applyPatch } from './harness.mjs';

const E = loadEngine();
const G = E.__global;
const { DATA } = E;
let pass = 0, fail = 0;
const check = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log(' ✗ ' + name + (detail ? ' — ' + detail : '')); } };

// Minimal DOM for wgxLinkifyInto.
class Node { constructor(t) { this.text = t; } }
class El { constructor() { this.children = []; this.attrs = {}; this.className = ''; this._t = ''; }
  appendChild(c) { this.children.push(c); return c; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  set textContent(v) { this._t = v; this.children = []; }
  get textContent() { return this._t + this.children.map((c) => c.text != null ? c.text : c.textContent).join(''); } }
G.document = { createElement: () => new El(), createTextNode: (t) => new Node(t) };
let encounter = null;
G.WG_CHAR_CACHE = {};
G.state = { characterId: 't' };
G.getEncounter = () => encounter;
const read = (f) => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
for (const f of ['wg-prepare.js', 'wg-resource.js', 'wg-features.js', 'wg-attack.js', 'wg-glossary.js', 'wg-turn.js']) G.eval(read(f));

// 1. Durations
const pool = DATA.spellPool;
const R = (n) => G.wgxSpellDurationRounds(pool[n]);
check('Bless = 10 rounds', R('Bless') === 10, R('Bless'));
check('Fireball = instantaneous', R('Fireball') === 0, R('Fireball'));
check('Mage Armor = 8 hours', R('Mage Armor') === 4800, R('Mage Armor'));
const unparsed = Object.keys(pool).filter((n) => { const r = R(n); return r === -1 && !/dispel|special/i.test(pool[n].dur); });
check('every duration parses (or is until dispelled / special)', unparsed.length === 0, unparsed.join(', '));

// 2. Countdown
const st = {};
encounter = { running: true, round: 3, startedAt: 111, entities: [] };
applyPatch(st, G.wgxSpellEffectPatch(st, 'Bless', pool['Bless']));
let fx = G.wgxActiveEffects(st);
check('cast in round 3 → 10 rounds left', fx.length === 1 && fx[0].status.left === 10, JSON.stringify(fx[0] && fx[0].status));
encounter.round = 12;
check('round 12 → 1 round left', G.wgxActiveEffects(st)[0].status.left === 1);
encounter.round = 13;
check('round 13 → expired and hidden', G.wgxActiveEffects(st).length === 0);
encounter.round = 4;
applyPatch(st, G.wgxSpellEffectPatch(st, 'Hunter\'s Mark', pool['Hunter\'s Mark']));
fx = G.wgxActiveEffects(st);
check('new Concentration spell ends the old one', fx.length === 1 && fx[0].eff.spell === 'Hunter\'s Mark', fx.map((x) => x.eff.spell).join());
applyPatch(st, G.wgxSpellEffectPatch(st, 'Mage Armor', pool['Mage Armor']));
check('non-Concentration spell runs alongside', G.wgxActiveEffects(st).length === 2);
encounter = { running: true, round: 2, startedAt: 222, entities: [] };
fx = G.wgxActiveEffects(st);
check('next fight: 1-hour Hunter\'s Mark adopted from round 1', fx.some((x) => x.eff.spell === 'Hunter\'s Mark' && x.status.left === 599), JSON.stringify(fx.map((x) => [x.eff.spell, x.status.left])));
encounter = { running: false, round: 1, startedAt: 222, entities: [] };
const st2 = {};
applyPatch(st2, G.wgxSpellEffectPatch(st2, 'Bless', pool['Bless']));
fx = G.wgxActiveEffects(st2);
check('cast outside combat: no countdown yet', fx.length === 1 && fx[0].status.left == null);
encounter = { running: true, round: 1, startedAt: 333, entities: [] };
check('…counts from round 1 when a fight starts', G.wgxActiveEffects(st2)[0].status.left === 10);
check('instantaneous spell adds no effect', Object.keys(G.wgxSpellEffectPatch({}, 'Fireball', pool['Fireball'])).length === 0);

// 3. Term links
const el = new El();
G.wgxLinkifyInto(el, 'The target falls Prone and is Frightened. Take the Dash action or cast Fireball.', 'X');
const terms = el.children.filter((c) => c.attrs && c.attrs['data-term']).map((c) => c.attrs['data-term']);
check('conditions, actions and spells become terms', ['Prone', 'Frightened', 'Dash action', 'Fireball'].every((t) => terms.includes(t)), terms.join());
check('text survives linkifying', el.textContent === 'The target falls Prone and is Frightened. Take the Dash action or cast Fireball.', el.textContent);
const el2 = new El();
G.wgxLinkifyInto(el2, 'Fireball explodes.', 'Fireball');
check('a tooltip does not link its own subject', !el2.children.some((c) => c.attrs && c.attrs['data-term']));
check('every glossary term resolves', Object.keys(G.WGX_GLOSSARY).every((t) => { const tip = G.wgxTermTip(t); return tip && tip.title && tip.body; }));
check('every standard action resolves', G.WGX_STANDARD_ACTIONS.every((t) => G.wgxTermTip(t)));
const sTip = G.wgxTermTip('Fireball');
check('spell term shows the spell', sTip && /Level 3/.test(sTip.title) && /Casting time/.test(sTip.body), sTip && sTip.title);

// 4. Your Turn rows for every class at level 5
for (const [cls, sub] of [['rogue', 'soulknife'], ['paladin', 'devotion'], ['wizard', 'evoker'], ['fighter', 'battleMaster'], ['druid', 'moon'], ['cleric', 'life']]) {
  const { config: cfg, state: s } = makeChar(E, cls, 'human', { originFeat: 'Alert' });
  for (let to = 2; to <= 5; to++) autoLevelUp(E, cls, cfg, s, { subclass: sub, asiFeat: 'Ability Score Improvement', optionIndex: 0 });
  G.WG_CHAR_CACHE.t = { config: cfg, state: s };
  const rows = G.wgxTurnRowModel(cfg, s);
  const headers = rows.filter((r) => r.header).map((r) => r.header);
  check(cls + ': Action and Reaction sections', headers.includes('Action') && headers.includes('Reaction'), headers.join());
  check(cls + ': standard actions + Opportunity Attack', rows.some((r) => r.kind === 'std') && rows.some((r) => r.kind === 'oa'));
  const w = { data: {}, layout: {} };
  G.wgxBuildTurn(w);
  const bad = w.data.rows.findIndex((r) => r.some((c) => /undefined|NaN/.test(String(c))));
  check(cls + ': rows render without undefined/NaN', bad < 0, JSON.stringify(w.data.rows[bad]));
  const tipBad = w.data.tooltips.findIndex((t) => t && /undefined|NaN/.test(t[0].title + t[0].body));
  check(cls + ': tooltips without undefined/NaN', tipBad < 0, tipBad >= 0 && JSON.stringify(w.data.tooltips[tipBad][0]).slice(0, 200));
  const passive = G.wgxFeatureRowModel(cfg, s, 'passive');
  const turnNames = rows.filter((r) => r.kind === 'feat').map((r) => r.feat.name);
  check(cls + ': passive features stay out of Your Turn', !passive.some((p) => turnNames.includes(p.feat.name)));
}
const bonusRogue = (() => { const { config: cfg, state: s } = makeChar(E, 'rogue', 'human', { originFeat: 'Alert' }); for (let to = 2; to <= 3; to++) autoLevelUp(E, 'rogue', cfg, s, { subclass: 'thief' }); return G.wgxTurnRowModel(cfg, s); })();
const iBonus = bonusRogue.findIndex((r) => r.header === 'Bonus Action');
check('rogue: Cunning Action under Bonus Action', iBonus >= 0 && bonusRogue.slice(iBonus).some((r) => r.kind === 'feat' && r.feat.name === 'Cunning Action'));

console.log(`\nturn-smoke: ${pass}/${pass + fail} checks passed`);
process.exit(fail ? 1 : 0);
