// wg-glossary.js — rules glossary (2024 conditions, actions, common terms) and
// the term index behind nested tooltips: any tooltip text that names a spell,
// condition, action, feat, invocation, metamagic option, weapon mastery or one
// of the current character's features becomes a hoverable term that opens a
// second tooltip window (see initInfoTooltip in wg-events.js).
//
// Glossary texts are short summaries in our own words of the 2024 rules.

var WGX_GLOSSARY = {
  // ---- Conditions ----
  'Blinded': { kind: 'Condition', body: 'You can\'t see and automatically fail any ability check that needs sight.\nAttack rolls against you have Advantage; your attack rolls have Disadvantage.' },
  'Charmed': { kind: 'Condition', body: 'You can\'t attack the charmer or target them with damaging abilities or magical effects.\nThe charmer has Advantage on ability checks to interact with you socially.' },
  'Deafened': { kind: 'Condition', body: 'You can\'t hear and automatically fail any ability check that needs hearing.' },
  'Exhaustion': { kind: 'Condition', body: 'Cumulative, level 1 to 6. Each level gives −2 per level on every D20 Test and −5 ft Speed per level. At level 6 you die.\nA Long Rest removes one level.' },
  'Frightened': { kind: 'Condition', body: 'Disadvantage on ability checks and attack rolls while the source of fear is in sight.\nYou can\'t willingly move closer to the source.' },
  'Grappled': { kind: 'Condition', body: 'Speed 0 and it can\'t increase.\nDisadvantage on attack rolls against anyone other than the grappler.\nThe grappler can move you, but every foot costs them 1 extra foot (unless you are Tiny or two or more sizes smaller).' },
  'Incapacitated': { kind: 'Condition', body: 'You can\'t take any action, Bonus Action or Reaction, and you can\'t speak.\nYour Concentration is broken.\nIf you are Incapacitated when you roll Initiative, you roll with Disadvantage.' },
  'Invisible': { kind: 'Condition', body: 'Advantage on your Initiative roll.\nYou aren\'t affected by effects that need the target to be seen, unless the creature can see you. What you wear or carry is hidden too.\nAttack rolls against you have Disadvantage; your attack rolls have Advantage (unless the creature can see you).' },
  'Paralyzed': { kind: 'Condition', body: 'Incapacitated, Speed 0.\nYou automatically fail Strength and Dexterity saving throws.\nAttack rolls against you have Advantage, and a hit from within 5 ft is a Critical Hit.' },
  'Petrified': { kind: 'Condition', body: 'You turn to stone (with nonmagical objects you wear and carry); your weight is multiplied by ten and you stop aging.\nIncapacitated, Speed 0. Attack rolls against you have Advantage.\nYou automatically fail Strength and Dexterity saving throws, have Resistance to all damage and Immunity to the Poisoned condition.' },
  'Poisoned': { kind: 'Condition', body: 'Disadvantage on attack rolls and ability checks.' },
  'Prone': { kind: 'Condition', body: 'You can only crawl, or spend half your Speed to stand up.\nDisadvantage on your attack rolls.\nAttack rolls against you have Advantage from within 5 ft, otherwise Disadvantage.' },
  'Restrained': { kind: 'Condition', body: 'Speed 0 and it can\'t increase.\nAttack rolls against you have Advantage; your attack rolls have Disadvantage.\nDisadvantage on Dexterity saving throws.' },
  'Stunned': { kind: 'Condition', body: 'Incapacitated.\nYou automatically fail Strength and Dexterity saving throws.\nAttack rolls against you have Advantage.' },
  'Unconscious': { kind: 'Condition', body: 'Incapacitated and Prone; you drop what you hold and don\'t notice your surroundings. Speed 0.\nYou automatically fail Strength and Dexterity saving throws.\nAttack rolls against you have Advantage, and a hit from within 5 ft is a Critical Hit.' },

  // ---- Actions ----
  'Attack action': { kind: 'Action', body: 'Make one attack with a weapon or an Unarmed Strike (more with Extra Attack). You can equip or unequip one weapon as part of each attack.' },
  'Dash': { kind: 'Action', body: 'Gain extra movement equal to your Speed for this turn.' },
  'Disengage': { kind: 'Action', body: 'Your movement doesn\'t provoke Opportunity Attacks for the rest of the turn.' },
  'Dodge': { kind: 'Action', body: 'Until the start of your next turn, attack rolls against you have Disadvantage if you can see the attacker, and you have Advantage on Dexterity saving throws.\nYou lose this if you are Incapacitated or your Speed is 0.' },
  'Help action': { kind: 'Action', body: 'Either help an ally with an ability check (pick a skill or tool you are proficient in: the next check with it by one ally has Advantage), or distract an enemy within 5 ft (the next attack roll by one ally against it has Advantage). Lasts until the start of your next turn.' },
  'Hide action': { kind: 'Action', body: 'While Heavily Obscured or behind Three-Quarters or Total Cover, and out of every enemy\'s line of sight: make a DC 15 Dexterity (Stealth) check. On a success you are Invisible, and your check total is the DC to find you.\nIt ends when you make noise louder than a whisper, attack, cast a spell with a Verbal component, or someone finds you.' },
  'Influence action': { kind: 'Action', body: 'Try to change a creature\'s attitude: Charisma (Deception, Intimidation, Performance or Persuasion) or Wisdom (Animal Handling).' },
  'Magic action': { kind: 'Action', body: 'Cast a spell with a casting time of an action, or use a magic item or magical feature that needs a Magic action.' },
  'Ready action': { kind: 'Action', body: 'Choose a trigger and a response (an action, or moving up to your Speed). When the trigger happens you can use your Reaction to respond.\nA readied spell must have a casting time of an action, uses its slot now, and needs Concentration until you release it.' },
  'Search action': { kind: 'Action', body: 'Notice something that isn\'t obvious: Wisdom (Insight, Medicine, Perception or Survival).' },
  'Study action': { kind: 'Action', body: 'Recall or work out information: Intelligence (Arcana, History, Investigation, Nature or Religion).' },
  'Utilize action': { kind: 'Action', body: 'Use a nonmagical object.' },
  'Opportunity Attack': { kind: 'Reaction', body: 'When a creature you can see leaves your reach using its action, Bonus Action, Reaction or movement, you can use your Reaction to make one melee attack against it.\nNot provoked by Disengage, or by being moved without using its own movement (teleported, pushed).' },

  // ---- Common terms ----
  'Bonus Action': { kind: 'Rule', body: 'An extra action you can take only when a feature, spell or other ability gives you one. One per turn.' },
  'Reaction': { kind: 'Rule', body: 'An instant response to a trigger, on your turn or someone else\'s. One per round; you regain it at the start of your turn.' },
  'Concentration': { kind: 'Rule', body: 'Some spells last only while you concentrate. It ends when you cast another Concentration spell, become Incapacitated or die.\nWhen you take damage: Constitution saving throw, DC 10 or half the damage (whichever is higher, max DC 30), or the spell ends.' },
  'Advantage': { kind: 'Rule', body: 'Roll two d20s and use the higher roll. Advantage and Disadvantage cancel each other out.' },
  'Disadvantage': { kind: 'Rule', body: 'Roll two d20s and use the lower roll. Advantage and Disadvantage cancel each other out.' },
  'Critical Hit': { kind: 'Rule', body: 'A natural 20 on an attack roll hits regardless of AC. Roll the attack\'s damage dice twice.' },
  'Temporary Hit Points': { kind: 'Rule', body: 'A buffer that is lost before your real Hit Points. They don\'t stack (keep the higher), aren\'t healing, and last until used up or until a Long Rest.' },
  'Resistance': { kind: 'Rule', body: 'You take half damage (rounded down) from that damage type.' },
  'Vulnerability': { kind: 'Rule', body: 'You take double damage from that damage type.' },
  'Immunity': { kind: 'Rule', body: 'You take no damage from that damage type, or the condition can\'t affect you.' },
  'Unarmed Strike': { kind: 'Rule', body: 'A punch, kick or headbutt: 1 + Strength modifier bludgeoning damage.\nInstead of damage you can Grapple or Shove: the target makes a Strength or Dexterity saving throw (its choice), DC 8 + your Strength modifier + Proficiency Bonus.' },
  'Grapple': { kind: 'Rule', body: 'Part of an Unarmed Strike: a target within reach, at most one size larger than you, makes a Strength or Dexterity save (DC 8 + Strength modifier + Proficiency Bonus). On a failure it is Grappled. You need a free hand.' },
  'Shove': { kind: 'Rule', body: 'Part of an Unarmed Strike: a target at most one size larger than you makes a Strength or Dexterity save (DC 8 + Strength modifier + Proficiency Bonus). On a failure you push it 5 ft away or knock it Prone.' },
  'Heavily Obscured': { kind: 'Rule', body: 'Darkness, thick fog or dense foliage. You are effectively Blinded when trying to see something there.' },
  'Lightly Obscured': { kind: 'Rule', body: 'Dim Light, patchy fog or moderate foliage. Disadvantage on Wisdom (Perception) checks that rely on sight.' },
  'Dim Light': { kind: 'Rule', body: 'Makes an area Lightly Obscured.' },
  'Bright Light': { kind: 'Rule', body: 'Normal vision works.' },
  'Half Cover': { kind: 'Rule', body: '+2 to AC and Dexterity saving throws.' },
  'Three-Quarters Cover': { kind: 'Rule', body: '+5 to AC and Dexterity saving throws.' },
  'Total Cover': { kind: 'Rule', body: 'You can\'t be targeted directly by an attack or spell.' },
  'Difficult Terrain': { kind: 'Rule', body: 'Every foot of movement costs 1 extra foot.' },
  'Short Rest': { kind: 'Rule', body: 'At least 1 hour of rest. You can spend Hit Point Dice to heal, and some features recharge.' },
  'Long Rest': { kind: 'Rule', body: 'At least 8 hours (sleep and light activity). You regain all Hit Points, half your Hit Point Dice and all spell slots, and lose one Exhaustion level.' },
};

// "Attack action" also matches "Attack" in phrases like "take the Attack action";
// single-word actions only as "<Name> action" except these three, which are unambiguous.
var WGX_GLOSSARY_ALIASES = { 'Dash action': 'Dash', 'Disengage action': 'Disengage', 'Dodge action': 'Dodge', 'Opportunity Attacks': 'Opportunity Attack' };

// The standard actions, for the "Other actions" row in the Turn widget.
var WGX_STANDARD_ACTIONS = ['Dash', 'Disengage', 'Dodge', 'Help action', 'Hide action', 'Influence action', 'Magic action', 'Ready action', 'Search action', 'Study action', 'Utilize action'];

function wgxGlossaryText(desc) {
  if (desc && typeof desc === 'object') return desc.en || desc.nl || '';
  return String(desc || '');
}

// ---- Term index ----
// name → resolver() returning { title, body }. Static part is built once; the
// current character's features are added per character.
var _wgxTermStatic = null, _wgxTermCharKey = null, _wgxTermIndex = null, _wgxTermRegex = null;

function wgxBuildStaticTerms() {
  var t = {};
  var D = (typeof DATA !== 'undefined') ? DATA : {};
  var pool = D.spellPool || {};
  Object.keys(pool).forEach(function (nm) {
    t[nm] = function () {
      var raw = (typeof WG_CHAR_CACHE !== 'undefined' && typeof state !== 'undefined' && state.characterId) ? WG_CHAR_CACHE[state.characterId] : null;
      if (typeof wgxSpellTooltip === 'function') {
        var stats = raw && typeof wgxSpellStats === 'function' ? wgxSpellStats(raw) : null;
        var tip = wgxSpellTooltip(nm, pool[nm], stats || { dc: '—', atk: '—' }, []);
        if (!stats) tip.body = tip.body.replace(/\n?Spell save DC[^\n]*/, '');
        tip.body = tip.body.replace(/\nClick the spell to cast it\./, '');
        return tip;
      }
      return { title: nm, body: pool[nm].desc || '' };
    };
  });
  (D.feats || []).forEach(function (f) {
    if (!f || !f.name) return;
    t[f.name] = function () { return { title: f.name + ' · Feat', body: wgxGlossaryText(f.desc) }; };
  });
  (D.invocations || []).forEach(function (o) {
    if (!o || !o.name) return;
    t[o.name] = function () { return { title: o.name + ' · Invocation', body: wgxGlossaryText(o.desc) }; };
  });
  (D.metamagic || []).forEach(function (o) {
    if (!o || !o.name) return;
    t[o.name] = function () { return { title: o.name + ' · Metamagic (' + o.cost + ' SP)', body: wgxGlossaryText(o.desc) }; };
  });
  (D.maneuvers || []).forEach(function (o) {
    if (!o || !o.name) return;
    t[o.name] = function () { return { title: o.name + ' · Maneuver', body: wgxGlossaryText(o.desc) }; };
  });
  var wm = D.weaponMasteryDesc || {};
  Object.keys(wm).forEach(function (k) {
    var nm = k.charAt(0).toUpperCase() + k.slice(1);
    t[nm] = function () { return { title: nm + ' · Weapon Mastery', body: wm[k] }; };
  });
  // Glossary last: on a name clash (Resistance the rule vs. the cantrip) the rule wins.
  Object.keys(WGX_GLOSSARY).forEach(function (nm) {
    var g = WGX_GLOSSARY[nm];
    t[nm] = function () { return { title: nm + ' · ' + g.kind, body: g.body }; };
  });
  Object.keys(WGX_GLOSSARY_ALIASES).forEach(function (a) { t[a] = t[WGX_GLOSSARY_ALIASES[a]]; });
  return t;
}

function wgxTermIndex() {
  if (!_wgxTermStatic) _wgxTermStatic = wgxBuildStaticTerms();
  var charId = (typeof state !== 'undefined' && state.characterId) || '';
  var raw = (charId && typeof WG_CHAR_CACHE !== 'undefined') ? WG_CHAR_CACHE[charId] : null;
  var key = charId + ':' + (raw && raw.state ? (raw.state.level || 1) + ':' + (raw.config && raw.config.subclass) : '');
  if (_wgxTermIndex && key === _wgxTermCharKey) return _wgxTermIndex;
  var idx = Object.assign({}, _wgxTermStatic);
  if (raw && typeof wgxCollectFeatures === 'function') {
    try {
      wgxCollectFeatures(raw.config || {}, raw.state || {}).forEach(function (f) {
        var nm = String(f.name || '').replace(/\s*\([^)]*\)$/, '');
        if (nm.length < 4 || idx[nm]) return;
        idx[nm] = function () { return { title: f.name + ' · Feature (level ' + f.level + ')', body: wgxGlossaryText(f.desc) }; };
      });
    } catch (e) {}
  }
  var names = Object.keys(idx).filter(function (n) { return n.length >= 3; })
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
  _wgxTermRegex = names.length ? new RegExp('(^|[^A-Za-z0-9\'])(' + names.join('|') + ')(?![A-Za-z0-9])', 'g') : null;
  _wgxTermIndex = idx;
  _wgxTermCharKey = key;
  return idx;
}

function wgxTermTip(name) {
  var idx = wgxTermIndex();
  var fn = idx[name];
  return fn ? fn() : null;
}

// Fill el with text where known terms become hoverable spans
// (<span class="wg-term" data-term="…">). skipName: the tooltip's own subject.
function wgxLinkifyInto(el, text, skipName) {
  wgxTermIndex();
  var re = _wgxTermRegex;
  text = String(text || '');
  if (!re) { el.textContent = text; return; }
  var skip = String(skipName || '').toLowerCase();
  var last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    var start = m.index + m[1].length, term = m[2];
    if (term.toLowerCase() === skip) continue;
    if (start > last) el.appendChild(document.createTextNode(text.slice(last, start)));
    var sp = document.createElement('span');
    sp.className = 'wg-term';
    sp.setAttribute('data-term', term);
    sp.textContent = term;
    el.appendChild(sp);
    last = start + term.length;
  }
  if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
}
