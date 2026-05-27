const WG_SVG_NS = 'http://www.w3.org/2000/svg';

// Responsive scaling rules: elke variabele heeft min (mobiel) en max (desktop).
// Tussen viewport-breedte WG_VP_MIN en WG_VP_MAX wordt lineair geïnterpoleerd.
// Responsive ranges per variabele: mobiel-waarde ↔ desktop-waarde.
// Wordt nu in state.responsive gehouden zodat user ze via inputs kan aanpassen.
const WG_RESPONSIVE_DEFAULTS = {
  dashTile:         { mobile: 20, desktop: 30 },
  dashMinSpacing:   { mobile: 4,  desktop: 8 },
  fontSize:         { mobile: 10, desktop: 12 },
};
const WG_VP_MIN = 480;
const WG_VP_MAX = 1280;
const WG_BP_MOBILE = 600;
const WG_BP_TABLET = 1024;

// WGI-M2: prefer DnD Within's FIREBASE_CONFIG.databaseURL when V8 is loaded inside D&D Within.
// Standalone V8 falls back to the hardcoded URL (same DB).
const FIREBASE_DB = (typeof window !== 'undefined' && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.databaseURL)
  ? window.FIREBASE_CONFIG.databaseURL
  : 'https://dnd-within-firebase-default-rtdb.firebaseio.com';
const WG_ABILITY_LABELS = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

function titleizeAbility(abilityKey) {
  const map = { 'str': 'Str', 'dex': 'Dex', 'con': 'Con', 'int': 'Int', 'wis': 'Wis', 'cha': 'Cha' };
  return map[abilityKey] || abilityKey.toUpperCase().substring(0, 3);
}

// D&D 5.5e skill → ability mapping
const WG_SKILLS = [
  { key: 'acrobatics',     label: 'Acrobatics',      ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana',         label: 'Arcana',          ability: 'int' },
  { key: 'athletics',      label: 'Athletics',       ability: 'str' },
  { key: 'deception',      label: 'Deception',       ability: 'cha' },
  { key: 'history',        label: 'History',         ability: 'int' },
  { key: 'insight',        label: 'Insight',         ability: 'wis' },
  { key: 'intimidation',   label: 'Intimidation',    ability: 'cha' },
  { key: 'investigation',  label: 'Investigation',   ability: 'int' },
  { key: 'medicine',       label: 'Medicine',        ability: 'wis' },
  { key: 'nature',         label: 'Nature',          ability: 'int' },
  { key: 'perception',     label: 'Perception',      ability: 'wis' },
  { key: 'performance',    label: 'Performance',     ability: 'cha' },
  { key: 'persuasion',     label: 'Persuasion',      ability: 'cha' },
  { key: 'religion',       label: 'Religion',        ability: 'int' },
  { key: 'sleightOfHand',  label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth',        label: 'Stealth',         ability: 'dex' },
  { key: 'survival',       label: 'Survival',        ability: 'wis' },
];
