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

// Wat elke ability bestuurt — voor de hover/long-press-tooltips op de
// Ability-Scores-widget. Engels-only (i18n-lock).
const WG_ABILITY_INFO = {
  str: 'Physical power. Used for melee attack & damage rolls, Athletics, jumping, lifting, and carrying capacity.',
  dex: 'Agility and reflexes. Used for AC in light/no armor, initiative, ranged & finesse attacks, Acrobatics, Stealth, and Sleight of Hand.',
  con: 'Health and stamina. Used for your hit points, Concentration saving throws, and resisting exhaustion.',
  int: 'Reasoning and memory. Used for Arcana, History, Investigation, Nature, and Religion checks.',
  wis: 'Awareness and insight. Used for Perception, Insight, Medicine, Survival, and Animal Handling checks.',
  cha: 'Force of personality. Used for Deception, Intimidation, Performance, and Persuasion checks.',
};

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

// Skill-omschrijvingen (#bug Ov6e4Bv9 — hover-tooltips op de Skills-widget):
// korte uitleg + wanneer de skill van toepassing is. Engels-only (zie i18n-lock).
const WG_SKILL_DESC = {
  acrobatics:     'Stay on your feet, keep your balance, or perform a stunt. Used when slipping, tumbling, or crossing a tightrope or icy surface.',
  animalHandling: 'Calm, control, or read the intentions of an animal. Used to soothe a mount, train a beast, or sense whether a creature will attack.',
  arcana:         'Recall lore about spells, magic items, planes, and arcane symbols. Used to identify a spell being cast or understand a magical effect.',
  athletics:      'Cover physical activity like climbing, jumping, and swimming. Used to scale a wall, grapple a foe, or swim against a current.',
  deception:      'Convincingly hide the truth through words or actions. Used to lie, disguise intent, or fast-talk your way past a guard.',
  history:        'Recall lore about events, people, kingdoms, and ancient wars. Used to remember a historical fact or recognise a legendary item.',
  insight:        "Read a creature's true intentions and emotions. Used to detect a lie, predict a next move, or gauge someone's mood.",
  intimidation:   'Influence others through threats, hostility, or force of presence. Used to coerce information or back someone down.',
  investigation:  'Look for clues and make deductions from them. Used to find a hidden object, spot a trap, or work out how something was done.',
  medicine:       'Stabilise a dying creature or diagnose an illness. Used to stop death saves or identify a poison or disease.',
  nature:         'Recall lore about terrain, plants, animals, and weather. Used to identify a creature or predict natural hazards.',
  perception:     'Spot, hear, or otherwise notice the presence of something. Used to detect hidden creatures, listen at a door, or keep watch.',
  performance:    'Delight an audience with music, dance, acting, or storytelling. Used to entertain a crowd or busk for coin.',
  persuasion:     'Influence others honestly with tact, grace, and good faith. Used to negotiate, win trust, or convince diplomatically.',
  religion:       'Recall lore about deities, rites, holy symbols, and cults. Used to recognise a religious practice or identify undead lore.',
  sleightOfHand:  'Perform manual trickery: planting, palming, or lifting. Used to pick a pocket, conceal an object, or disarm a small trap.',
  stealth:        'Conceal yourself: move silently and stay out of sight. Used to sneak past enemies, hide, or set up an ambush.',
  survival:       'Follow tracks, hunt, navigate, and endure the wild. Used to track a quarry, find safe shelter, or avoid getting lost.',
};
