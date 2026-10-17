// wg-attack.js — Attacks widget: attack options derived from the character's
// carried weapons (state.items ⋈ DATA.itemDB) plus class/subclass attack
// features. To-hit = ability mod + proficiency (+ Archery, − Exhaustion);
// damage = weapon die + ability mod (+ Dueling / Thrown Weapon Fighting).
// Class features: Martial Arts (Monk: Dex, Martial Arts die), pact weapon
// (Pact of the Blade: Cha), Dazzling Footwork (College of Dance: Bardic
// Inspiration die), Psychic Blades (Soulknife), riders for Sneak Attack and
// Rage, and the number of attacks per Attack action. Read-only.
//
// Load order: after wg-state.js (WG_WIDGET_TYPES). Uses runtime globals
// invLookup (wg-inventory.js), getProfBonus/getExhaustion (engine.js), WG_CHAR_CACHE.

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};

Object.assign(WG_WIDGET_TYPES, {
  attacks: {
    label: 'Attacks', kind: 'infobox', source: 'attacks',
    spanUnits: 6, spanUnitsY: 5,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.attacks = 'Attacks';

function wgxMod(cfg, key) {
  var v = (cfg.baseAbilities && cfg.baseAbilities[key]);
  return (typeof v === 'number') ? Math.floor((v - 10) / 2) : 0;
}
function wgxSigned(n) { return (n >= 0 ? '+' : '') + n; }
function wgxDieSize(dmg) { var m = /d(\d+)/.exec(dmg || ''); return m ? +m[1] : 0; }

// Attacks per Attack action: Extra Attack (Fighter 5/11/20, Barbarian, Monk,
// Paladin, Ranger 5, Valor Bard 6) and Thirsting Blade (pact weapon only).
function wgxAttacksPerAction(cfg, st) {
  var cn = cfg.className, lvl = st.level || 1;
  if (cn === 'fighter') return lvl >= 20 ? 4 : lvl >= 11 ? 3 : lvl >= 5 ? 2 : 1;
  if ((cn === 'barbarian' || cn === 'monk' || cn === 'paladin' || cn === 'ranger') && lvl >= 5) return 2;
  if (cn === 'bard' && cfg.subclass === 'valor' && lvl >= 6) return 2;
  return 1;
}
function wgxMartialArtsDie(lvl) { return lvl >= 17 ? 12 : lvl >= 11 ? 10 : lvl >= 5 ? 8 : 6; }
function wgxRageDamage(lvl) { return lvl >= 16 ? 4 : lvl >= 9 ? 3 : 2; }

// Shared context for every attack row of one character.
function wgxAttackCtx(cfg, st) {
  var lvl = st.level || 1;
  var styles = (typeof listOf === 'function') ? listOf(st.fightingStyles) : (st.fightingStyles || []);
  var inv = (typeof listOf === 'function') ? listOf(st.invocations) : (st.invocations || []);
  return {
    lvl: lvl,
    prof: (typeof getProfBonus === 'function') ? getProfBonus(lvl) : 2,
    ex: (typeof getExhaustion === 'function') ? getExhaustion(st) : 0,
    str: wgxMod(cfg, 'str'), dex: wgxMod(cfg, 'dex'), cha: wgxMod(cfg, 'cha'),
    style: function (n) { return styles.indexOf(n) !== -1; },
    blade: inv.indexOf('Pact of the Blade') !== -1,
    thirsting: inv.indexOf('Thirsting Blade') !== -1,
    monk: cfg.className === 'monk',
    perAction: wgxAttacksPerAction(cfg, st),
  };
}

// Build one row from to-hit parts and damage parts ([{ label, value }]).
function wgxAttackRow(name, die, dmgType, hitParts, dmgParts, notes) {
  var hit = hitParts.reduce(function (a, p) { return a + p.value; }, 0);
  var bonus = dmgParts.reduce(function (a, p) { return a + p.value; }, 0);
  var lines = notes.slice();
  lines.push('\nTo hit: ' + hitParts.map(function (p) { return wgxSigned(p.value) + ' ' + p.label; }).join(' ') + ' = ' + wgxSigned(hit) + '.');
  lines.push('Damage: ' + die + dmgParts.map(function (p) { return ' ' + wgxSigned(p.value) + ' ' + p.label; }).join('') + (dmgType ? ' ' + dmgType : '') + '.');
  return { name: name, hit: wgxSigned(hit), dmg: die + (bonus ? wgxSigned(bonus) : ''), tip: { title: name, body: lines.join('\n') } };
}

// One attack row from an itemDB weapon entry.
function wgxWeaponAttack(db, cfg, ctx) {
  var props = db.properties || [];
  var sub = db.subtype || '';
  var isRanged = /ranged/.test(sub);
  var isFinesse = props.indexOf('finesse') !== -1;
  var monkWeapon = ctx.monk && !isRanged && (/simple/.test(sub) || props.indexOf('light') !== -1);
  var pact = ctx.blade && !isRanged;
  var abil = isRanged ? 'Dex' : (isFinesse || monkWeapon) && ctx.dex > ctx.str ? 'Dex' : 'Str';
  var mod = abil === 'Dex' ? ctx.dex : ctx.str;
  if (pact && ctx.cha > mod) { abil = 'Cha'; mod = ctx.cha; }
  var die = db.dmg || '—';
  var notes = [];
  if (monkWeapon && wgxDieSize(die) < wgxMartialArtsDie(ctx.lvl)) { die = '1d' + wgxMartialArtsDie(ctx.lvl); notes.push('Martial Arts: monk weapon, uses your Martial Arts die.'); }
  else if (monkWeapon) notes.push('Martial Arts: monk weapon, you can use Dexterity.');
  if (pact) notes.push('Pact of the Blade: as your pact weapon you can use Charisma.' + (ctx.thirsting ? ' Thirsting Blade: attack twice with it.' : ''));
  if (props.length) notes.push('Properties: ' + props.join(', ') + '.');
  if (db.range) notes.push('Range: ' + db.range.normal + '/' + db.range.long + ' ft.');
  if (db.mastery) {
    var mDesc = (typeof DATA !== 'undefined' && DATA.items && DATA.items.weaponMasteryDesc) || {};
    notes.push('Mastery — ' + db.mastery.charAt(0).toUpperCase() + db.mastery.slice(1) + ': ' + (mDesc[db.mastery] || ''));
  }
  var hitParts = [{ label: abil, value: mod }, { label: 'proficiency', value: ctx.prof }];
  if (isRanged && ctx.style('Archery')) hitParts.push({ label: 'Archery', value: 2 });
  if (ctx.ex) hitParts.push({ label: 'Exhaustion', value: -2 * ctx.ex });
  var dmgParts = mod ? [{ label: abil, value: mod }] : [];
  if (!isRanged && props.indexOf('two-handed') === -1 && ctx.style('Dueling')) {
    dmgParts.push({ label: 'Dueling', value: 2 });
    notes.push('Dueling: only while you hold no other weapon.');
  }
  if (props.indexOf('thrown') !== -1 && ctx.style('Thrown Weapon Fighting')) notes.push('Thrown Weapon Fighting: +2 damage when you throw it.');
  if (!isRanged && (props.indexOf('two-handed') !== -1 || props.indexOf('versatile') !== -1) && ctx.style('Great Weapon Fighting')) notes.push('Great Weapon Fighting: wielding it in two hands, treat a 1 or 2 on a damage die as a 3.');
  return wgxAttackRow(db.name, die, db.damageType || '', hitParts, dmgParts, [(db.dmg || '—') + ' ' + (db.damageType || '') + ' damage.'].concat(notes));
}

// Attack list for the character: subclass specials → weapons → unarmed → riders.
function wgxCollectAttacks(cfg, st) {
  // Effective ability scores (base + Ability Score Improvements / feats).
  if (typeof getEffectiveAbilities === 'function' && cfg.baseAbilities) cfg = Object.assign({}, cfg, { baseAbilities: getEffectiveAbilities(cfg, st) });
  var ctx = wgxAttackCtx(cfg, st);
  var lvl = ctx.lvl, str = ctx.str, dex = ctx.dex;
  var exPart = ctx.ex ? [{ label: 'Exhaustion', value: -2 * ctx.ex }] : [];
  var out = [];

  // Soulknife (rogue L3+): Psychic Blades — finesse.
  if (cfg.className === 'rogue' && cfg.subclass === 'soulknife' && lvl >= 3) {
    var pbMod = Math.max(str, dex), pbAb = dex >= str ? 'Dex' : 'Str';
    out.push(wgxAttackRow('Psychic Blade', '1d6', 'psychic', [{ label: pbAb, value: pbMod }, { label: 'proficiency', value: ctx.prof }].concat(exPart), [{ label: pbAb, value: pbMod }],
      ['Finesse, thrown (range 60 ft). The blade vanishes after the attack.', 'Bonus Action: attack with a second blade for 1d4' + wgxSigned(pbMod) + ' psychic (requires a free hand).']));
  }

  // Weapons from the inventory (state.items), deduplicated on itemDB id.
  var seen = {};
  var items = Array.isArray(st.items) ? st.items : [];
  for (var i = 0; i < items.length; i++) {
    var db = (typeof invLookup === 'function') ? invLookup(items[i] && items[i].name) : null;
    if (!db || db.type !== 'weapon' || seen[db.id]) continue;
    seen[db.id] = true;
    out.push(wgxWeaponAttack(db, cfg, ctx));
  }

  // Unarmed Strike: Martial Arts (Monk), Dazzling Footwork (College of Dance), or 1 + Str.
  var danceBard = cfg.className === 'bard' && cfg.subclass === 'dance' && lvl >= 3;
  if (ctx.monk || danceBard) {
    var uAb = dex >= str ? 'Dex' : 'Str', uMod = Math.max(str, dex);
    var uDie = ctx.monk ? '1d' + wgxMartialArtsDie(lvl) : '1d' + (lvl >= 15 ? 12 : lvl >= 10 ? 10 : lvl >= 5 ? 8 : 6);
    out.push(wgxAttackRow('Unarmed Strike', uDie, 'bludgeoning', [{ label: uAb, value: uMod }, { label: 'proficiency', value: ctx.prof }].concat(exPart), uMod ? [{ label: uAb, value: uMod }] : [],
      [ctx.monk ? 'Martial Arts: use Dexterity and your Martial Arts die; Bonus Action: one more Unarmed Strike after the Attack action.'
                : 'Dazzling Footwork: without armor or Shield, use Dexterity and your Bardic Inspiration die. You can still Grapple or Shove instead.']));
  } else if (!out.length) {
    out.push({
      name: 'Unarmed Strike', hit: wgxSigned(str + ctx.prof - 2 * ctx.ex), dmg: String(Math.max(1, 1 + str)),
      tip: { title: 'Unarmed Strike', body: 'Bludgeoning damage equal to 1 + your Strength modifier. Instead of damage you can attempt to Grapple or Shove.' },
    });
  }

  // Attacks per Attack action, shown on every weapon/unarmed row.
  if (ctx.perAction > 1) out.forEach(function (a) { a.tip.body += '\nAttack action: ' + ctx.perAction + ' attacks.'; });

  // Riders (no attack roll of their own).
  if (cfg.className === 'rogue') {
    var dice = Math.ceil(lvl / 2);
    out.push({
      name: 'Sneak Attack', hit: '1/turn', dmg: dice + 'd6',
      tip: { title: 'Sneak Attack (' + dice + 'd6)', body:
        'Once per turn, add ' + dice + 'd6 damage to a hit with a finesse or ranged weapon (Psychic Blades count) if you have advantage, or if an ally is within 5 ft of the target and you don\'t have disadvantage.' },
    });
  }
  if (cfg.className === 'barbarian') {
    var rd = wgxRageDamage(lvl);
    out.push({
      name: 'Rage damage', hit: 'Rage', dmg: wgxSigned(rd),
      tip: { title: 'Rage damage (+' + rd + ')', body: 'While raging, add +' + rd + ' to the damage of attacks that use Strength (weapon or Unarmed Strike).' },
    });
  }
  return out;
}

function wgxBuildAttacks(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var d = widget.data, L = widget.layout;
  d.columns = [
    { key: 'name', label: 'Attack' },
    { key: 'hit',  label: 'Hit' },
    { key: 'dmg',  label: 'Damage' },
  ];
  var atks = wgxCollectAttacks(cfg, st);
  d.rows = atks.map(function (a) { return [a.name, a.hit, a.dmg]; });
  d.tooltips = atks.map(function (a) { return [a.tip, a.tip, a.tip]; });
  L.columnHighlight = [false, true, false];
  L.columnAlign = ['left', 'center', 'right'];
  L.columnMaxChars = [16, null, null];
  L.columnAllCaps = [false, false, false];
  L.columnExtraClass = [null, null, null];
  L.columnMinWidthPx = [null, 34, 48];
  L.columnFontScale = [1, 1, 1];
  L.rowExtraClass = atks.map(function () { return null; });
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.attacks = wgxBuildAttacks;
