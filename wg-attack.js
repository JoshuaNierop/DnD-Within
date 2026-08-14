// wg-attack.js — Attacks widget: attack options derived from the character's
// carried weapons (state.items ⋈ DATA.itemDB) plus class/subclass attack
// features (Soulknife Psychic Blades, rogue Sneak Attack). To-hit = ability
// mod (finesse/ranged → best of Str/Dex resp. Dex) + proficiency bonus;
// damage = weapon die + ability mod. Read-only v1 — built for Ren (Soulknife
// rogue), but renders for any character with weapons in their inventory.
//
// Load order: NA wg-state.js (WG_WIDGET_TYPES). Gebruikt runtime-globals
// invLookup (wg-inventory.js), getProfBonus (engine.js), WG_CHAR_CACHE.

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

// Eén attack-row uit een itemDB-weapon-entry.
function wgxWeaponAttack(db, cfg, prof) {
  var props = db.properties || [];
  var isRanged = /ranged/.test(db.subtype || '');
  var isFinesse = props.indexOf('finesse') !== -1;
  var str = wgxMod(cfg, 'str'), dex = wgxMod(cfg, 'dex');
  var mod = isRanged ? dex : (isFinesse ? Math.max(str, dex) : str);
  var lines = [(db.dmg || '—') + ' ' + (db.damageType || '') + ' damage.'];
  if (props.length) lines.push('Properties: ' + props.join(', ') + '.');
  if (db.range) lines.push('Range: ' + db.range.normal + '/' + db.range.long + ' ft.');
  if (db.mastery) {
    var mDesc = (typeof DATA !== 'undefined' && DATA.items && DATA.items.weaponMasteryDesc) || {};
    var mName = db.mastery.charAt(0).toUpperCase() + db.mastery.slice(1);
    lines.push('Mastery — ' + mName + ': ' + (mDesc[db.mastery] || ''));
  }
  lines.push('\nTo hit: ' + wgxSigned(mod) + ' (' + (isRanged ? 'Dex' : (isFinesse ? 'finesse, best of Str/Dex' : 'Str')) + ') ' + wgxSigned(prof) + ' proficiency = ' + wgxSigned(mod + prof) + '.');
  return {
    name: db.name,
    hit: wgxSigned(mod + prof),
    dmg: (db.dmg || '—') + (mod ? wgxSigned(mod) : ''),
    tip: { title: db.name, body: lines.join('\n') },
  };
}

// Attack-lijst voor de huidige character: subclass-specials → weapons → riders.
function wgxCollectAttacks(cfg, st) {
  var lvl = st.level || 1;
  var prof = (typeof getProfBonus === 'function') ? getProfBonus(lvl) : 2;
  var dex = wgxMod(cfg, 'dex'), str = wgxMod(cfg, 'str');
  var out = [];

  // Soulknife (rogue L3+): Psychic Blades — finesse, dus Dex voor Ren.
  if (cfg.className === 'rogue' && cfg.subclass === 'soulknife' && lvl >= 3) {
    var pbMod = Math.max(str, dex);
    out.push({
      name: 'Psychic Blade', hit: wgxSigned(pbMod + prof), dmg: '1d6' + wgxSigned(pbMod),
      tip: { title: 'Psychic Blade · Soulknife', body:
        '1d6' + wgxSigned(pbMod) + ' psychic damage. Finesse, thrown (range 60 ft). The blade vanishes after the attack.\n\n' +
        'Bonus Action: attack with a second blade for 1d4' + wgxSigned(pbMod) + ' psychic (requires a free hand).\n\n' +
        'To hit: ' + wgxSigned(pbMod) + ' (finesse) ' + wgxSigned(prof) + ' proficiency = ' + wgxSigned(pbMod + prof) + '.' },
    });
  }

  // Weapons uit de inventory (state.items), gededupliceerd op itemDB-id.
  var seen = {};
  var items = Array.isArray(st.items) ? st.items : [];
  for (var i = 0; i < items.length; i++) {
    var db = (typeof invLookup === 'function') ? invLookup(items[i] && items[i].name) : null;
    if (!db || db.type !== 'weapon' || seen[db.id]) continue;
    seen[db.id] = true;
    out.push(wgxWeaponAttack(db, cfg, prof));
  }

  // Fallback: geen weapons → Unarmed Strike (2024: 1 + Str bludgeoning).
  if (!out.length) {
    out.push({
      name: 'Unarmed Strike', hit: wgxSigned(str + prof), dmg: String(Math.max(1, 1 + str)),
      tip: { title: 'Unarmed Strike', body: 'Bludgeoning damage equal to 1 + your Strength modifier. Instead of damage you can attempt to Grapple or Shove.' },
    });
  }

  // Sneak Attack-rider (rogue): once per turn, geen eigen attack roll.
  if (cfg.className === 'rogue') {
    var dice = Math.ceil(lvl / 2);
    out.push({
      name: 'Sneak Attack', hit: '1/turn', dmg: dice + 'd6',
      tip: { title: 'Sneak Attack (' + dice + 'd6)', body:
        'Once per turn, add ' + dice + 'd6 damage to a hit with a finesse or ranged weapon (Psychic Blades count) if you have advantage, or if an ally is within 5 ft of the target and you don\'t have disadvantage.' },
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
