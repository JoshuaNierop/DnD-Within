// Bouwt columns/rows/kolom-config voor een widget uit z'n raw data.
// Raakt de titel NIET aan — die is auto (uit source) of door de user gezet.
function buildRowsFromSource(widget) {
  const d = widget.data, L = widget.layout;
  const src = d.source;
  d.tooltips = null;   // per-cel hover-tekst (rows × cols); alleen Skills vult dit nu
  const raw = WG_CHAR_CACHE[state.characterId];   // V9: dashboard-brede character-cache
  if (!raw) { d.rows = []; d.columns = []; return; }
  // Geporte/extra infobox-bronnen (bv. 'hp' uit wg-hp.js) registreren zich in
  // WG_EXTRA_INFOBOX_BUILDERS en bouwen rows/layout zelf.
  if (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined' && WG_EXTRA_INFOBOX_BUILDERS[src]) {
    WG_EXTRA_INFOBOX_BUILDERS[src](widget);
    return;
  }
  if (src === 'abilities') {
    // baseAbilities zit binnen `config` in de D&D Within schema
    const ab = (raw.config && raw.config.baseAbilities) || raw.baseAbilities || {};
    d.columns = [
      { key: 'ability', label: 'Ability' },
      { key: 'score',   label: 'Score' },
      { key: 'mod',     label: 'Modifier' },
    ];
    L.columnHighlight = [false, true, false];
    L.columnAlign = ['left', 'center', 'right'];
    L.columnMaxChars = [3, null, null];
    L.columnAllCaps = [true, false, false];
    L.stacking = 'vertical';
    const abInfo = (typeof WG_ABILITY_INFO === 'object' && WG_ABILITY_INFO) ? WG_ABILITY_INFO : {};
    const abTips = [];
    d.rows = ['str','dex','con','int','wis','cha'].map(k => {
      const score = ab[k];
      const hasScore = (typeof score === 'number');
      const m = hasScore ? Math.floor((score - 10) / 2) : 0;
      const modStr = hasScore ? `(${m >= 0 ? '+' : ''}${m})` : '—';
      const name = WG_ABILITY_LABELS[k];
      const modSigned = `${m >= 0 ? '+' : ''}${m}`;
      // Tooltips: naam = wat de ability bestuurt; score = WAAR de waarde vandaan
      // komt (samenstelling); modifier = de bonus die je overal optelt.
      abTips.push([
        { title: name, body: abInfo[k] || '' },
        { title: name + ' score', body: hasScore
            ? `Your ${name} score of ${score}. Set at character creation (point buy, standard array, or rolled), then raised by your background's ability score increases and any Ability Score Improvements or feats taken as you level up.`
            : 'Not set yet.' },
        { title: `${name} modifier ${modSigned}`, body: (abInfo[k] || '') + (hasScore ? `\n\nApplied to every ${titleizeAbility(k)}-based roll.` : '') },
      ]);
      return [
        name,
        String(score ?? '—'),
        modStr,
      ];
    });
    d.tooltips = abTips;
  }
  if (src === 'basicInfo') {
    const cfg = raw.config || {};
    const lvl = (raw.state && typeof raw.state.level === 'number') ? raw.state.level : 1;
    const capLocal = (s) => (typeof capitalize === 'function')
      ? capitalize(s)
      : (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
    const raceTxt  = (typeof raceDisplayName === 'function') ? raceDisplayName(cfg.race) : capLocal(cfg.race);
    const classTxt = (typeof classDisplayName === 'function') ? classDisplayName(cfg.className) : capLocal(cfg.className);
    const subTxt   = (typeof subclassDisplayName === 'function') ? subclassDisplayName(cfg.subclass) : capLocal(cfg.subclass);
    const dash = '—';
    // Vaste veld-volgorde; archetype alleen vanaf het level waarop je een
    // subclass kiest (5.5e = level 3) of zodra er al één gekozen is. De
    // edit-handler leest dezelfde field-key uit d.fieldKeys[rowIdx].
    const fields = [
      { key: 'race',       label: 'Race',       value: cfg.race ? raceTxt : dash },
      { key: 'className',  label: 'Class',      value: cfg.className ? classTxt : dash },
      { key: 'background', label: 'Background', value: cfg.background ? capLocal(cfg.background) : dash },
      { key: 'age',        label: 'Age',        value: (cfg.age != null && cfg.age !== '') ? String(cfg.age) : dash },
    ];
    if (cfg.subclass || lvl >= 3) {
      fields.push({ key: 'subclass', label: 'Archetype', value: cfg.subclass ? subTxt : dash });
    }
    d.columns = [
      { key: 'field', label: 'Field' },
      { key: 'value', label: 'Value' },
    ];
    d.fieldKeys = fields.map(f => f.key);   // rowIdx → config-field voor edit-write-back
    d.rows = fields.map(f => [f.label, f.value]);
    // Tooltips: korte uitleg per veld (zelfde tip op label- en waarde-cel).
    var biTipBody = {
      race:       "Your ancestry — sets your size, speed, and racial traits.",
      className:  "Your profession — sets your hit die, proficiencies, and class features.",
      background: "Your life before adventuring — grants skill & tool proficiencies and a starting feat.",
      age:        "Your character's age in years.",
      subclass:   "Your subclass — a specialization within your class, chosen at level 3.",
    };
    d.tooltips = fields.map(function (f) {
      var tip = { title: f.label, body: biTipBody[f.key] || '' };
      return [tip, tip];
    });
    L.columnHighlight = [false, true];
    L.columnAlign     = ['left', 'right'];
    L.columnMaxChars  = [null, null];
    L.columnAllCaps   = [false, false];
    L.stacking = 'horizontal';
  }
  if (src === 'skills') {
    const cfg = raw.config || {};
    const ab = cfg.baseAbilities || {};
    const proficient = new Set(cfg.defaultSkills || []);
    // Proficiency bonus: lees uit config, fallback +2 (level 1-4 standaard)
    const profBonus = (typeof cfg.proficiencyBonus === 'number') ? cfg.proficiencyBonus : 2;
    const fmtBonus = (n) => `${n >= 0 ? '+' : ''}${n}`;
    d.columns = [
      { key: 'prof',  label: 'Prof' },
      { key: 'skill', label: 'Skill' },
      { key: 'bonus', label: 'Bonus' },
    ];
    const expert = new Set(cfg.expertSkills || []);
    const tips = [];
    const descMap = (typeof WG_SKILL_DESC === 'object' && WG_SKILL_DESC) ? WG_SKILL_DESC : {};
    d.rows = WG_SKILLS.map(s => {
      const score = ab[s.ability];
      const mod = (typeof score === 'number') ? Math.floor((score - 10) / 2) : 0;
      const isProf = proficient.has(s.key);
      const isExpert = expert.has(s.key);
      const mark = isExpert ? '★' : (isProf ? '●' : '○');
      const total = mod + (isExpert ? 2 * profBonus : (isProf ? profBonus : 0));
      const abName = titleizeAbility(s.ability);
      const fullAb = WG_ABILITY_LABELS[s.ability] || abName;
      // Tooltips (#bug Ov6e4Bv9): proficiency-status, skill-uitleg, bonus-opbouw.
      const parts = [`${fmtBonus(mod)} from ${fullAb}`];
      if (isProf || isExpert) parts.push(`+${profBonus} proficiency`);
      if (isExpert) parts.push(`+${profBonus} expertise`);
      const bonusBody = parts.join('\n') + `\n= ${fmtBonus(total)}`;
      const profBody = isExpert ? 'Expertise — your proficiency bonus counts double for this skill.'
        : (isProf ? 'Proficient — your proficiency bonus is added.' : 'Not proficient — only the ability modifier applies.');
      tips.push([
        { title: 'Proficiency', body: profBody },
        { title: `${s.label} (${fullAb})`, body: descMap[s.key] || `${s.label} uses your ${fullAb} modifier.` },
        { title: 'Modifier breakdown', body: bonusBody },
      ]);
      return [
        mark,
        { main: s.label, suffix: ' (' + abName + ')' },
        fmtBonus(total),
      ];
    });
    d.tooltips = tips;
    L.columnHighlight = [false, false, true];
    L.columnAlign     = ['center', 'left', 'right'];
    L.columnMaxChars  = [null, 8, null];
    L.columnAllCaps   = [false, false, false];
    L.columnExtraClass = ['is-prof-col', null, null];
    L.columnMinWidthPx = [20, null, null];
    L.columnFontScale  = [1.25, 1, 1];   // matcht CSS .is-prof-col { font-size: 1.25em }
    L.stacking = 'horizontal';
  }
}

// Herbouwt rows + layout van een widget uit z'n al-geladen raw data
// (gebruikt na source/type-wissel; geen nieuwe fetch nodig).
function rebuildWidget(widget) {
  withWidget(widget, () => {
    buildRowsFromSource(widget);
    recomputeDataLayout();
    compactSpanUnitsY();
  });
}

// ----- Text measurement -----
let _measureCtx = null;
function measureCtx() {
  if (!_measureCtx) {
    const c = document.createElement('canvas');
    _measureCtx = c.getContext('2d');
  }
  return _measureCtx;
}

function measureCellPx(text, isHighlight, fontScale) {
  const ctx = measureCtx();
  const baseFs = state.config.fontSize + (isHighlight ? 1 : -1);
  // fontScale is een em-multiplier (CSS-conventie: 1em = root/body font, default 16px).
  // Cellen met fontScale != 1 hebben een CSS-override (bv. .is-prof-col { font-size: 1.25em })
  // die de SVG-attribuut font-size overschrijft. Voor accurate measure gebruiken we de
  // CSS-resolved size (rootFs × scale) in plaats van baseFs × scale.
  let fs = baseFs;
  if (fontScale && fontScale > 0 && fontScale !== 1) {
    const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    fs = rootFs * fontScale;
  }
  // Match SVG .info-box-text styling: 600 weight + actief body-font
  const font = getComputedStyle(document.documentElement).getPropertyValue('--info-font-body').trim()
    || 'system-ui, -apple-system, sans-serif';
  ctx.font = `600 ${fs}px ${font}`;
  // Handle { main, suffix } objects
  let fullText = '';
  if (text && typeof text === 'object' && text.main) {
    fullText = String(text.main ?? '') + String(text.suffix ?? '');
  } else {
    fullText = String(text ?? '');
  }
  return ctx.measureText(fullText).width;
}

// Pas per-kolom transformaties toe (allCaps + maxChars) op een raw cel-waarde.
// Ondersteunt { main, suffix } objects voor skill-labels met ability-suffix.
function displayValue(raw, colIdx) {
  // Handle object format { main, suffix }
  let main = '', suffix = '';
  if (raw && typeof raw === 'object' && raw.main) {
    main = String(raw.main ?? '');
    suffix = String(raw.suffix ?? '');
  } else {
    main = String(raw ?? '');
  }
  
  const allCaps = !!state.layout.columnAllCaps?.[colIdx];
  if (allCaps) main = main.toUpperCase();
  const max = state.layout.columnMaxChars?.[colIdx];
  if (max != null && main.length > max) {
    const cut = main.slice(0, max);
    main = allCaps ? cut : cut + '.';
  }
  return main + suffix;
}

function recomputeColumnPxWidths() {
  const cols = state.data.columns || [];
  const rows = state.data.rows || [];
  const pad = state.cfg.cellPadding || 0;
  const highlights = state.layout.columnHighlight || [];
  const minWidths = state.layout.columnMinWidthPx || [];
  const fontScales = state.layout.columnFontScale || [];
  state.layout.columnPxWidths = cols.map((_, ci) => {
    const isHighlight = !!highlights[ci];
    const fontScale = fontScales[ci] || 1;
    let maxPx = 0;
    for (const r of rows) {
      const w = measureCellPx(displayValue(r[ci], ci), isHighlight, fontScale);
      if (w > maxPx) maxPx = w;
    }
    const measured = Math.ceil(maxPx + 2 * pad);
    const minW = minWidths[ci] ?? null;
    return Math.max(measured, minW !== null ? minW : 0);
  });
}

// Cel-rijhoogte: font-driven, symmetrisch met de breedte-berekening
// (gemeten tekst + 2×cellPadding). Hoogste cel-font is highlight = fontSize + 1;
// 1.35 ≈ regelhoogte-factor zodat de tekst altijd past.
function cellRowPxH() {
  const { fontSize } = state.config;
  const { cellPadding } = state.cfg;
  return Math.ceil((fontSize + 1) * 1.35) + 2 * cellPadding;
}

function recomputeBoxPx() {
  const widths = state.layout.columnPxWidths;
  const cols = state.data.columns.length;
  if (cols === 0 || widths.length === 0) {
    state.layout.boxPxW = 0;
    state.layout.boxPxH = 0;
    return;
  }
  const rowH = cellRowPxH();
  // infoBoxPadding: lege ruimte rond de cel-stack, binnen de info-box-outline.
  const ipad = 2 * (state.cfg.infoBoxPadding || 0);
  if (state.layout.stacking === 'horizontal') {
    state.layout.boxPxW = widths.reduce((a, b) => a + b, 0) + ipad;
    state.layout.boxPxH = rowH + ipad;
  } else {
    state.layout.boxPxW = Math.max(...widths) + ipad;
    state.layout.boxPxH = rowH * cols + ipad;
  }
}

// Compose helper voor alle callers die na data/font/stacking-changes alles
// in één stap willen herberekenen.
function recomputeDataLayout() {
  recomputeColumnPxWidths();
  recomputeBoxPx();
}

function updateStatus() {
  const el = document.getElementById('dataStatus');
  if (!el) return;
  const id = state.characterId;
  const s = WG_CHAR_STATUS[id] || 'idle';
  if (s === 'loading') el.innerHTML = `<span class="mode-pill">…</span>${id}`;
  else if (s === 'ready') {
    const rows = state.widget && state.widget.data ? (state.widget.data.rows || []).length : 0;
    el.innerHTML = `<span class="mode-pill">OK</span>${id} · ${rows} rijen`;
  }
  else if (s === 'error') el.innerHTML = `<span class="mode-pill" style="background:var(--alert)">ERR</span>${WG_CHAR_ERROR[id] || 'fout'}`;
  else el.textContent = '—';
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(t) { return Math.max(0, Math.min(1, t)); }

function viewportFactor() {
  return clamp01((window.innerWidth - WG_VP_MIN) / (WG_VP_MAX - WG_VP_MIN));
}
function viewportMode() {
  const w = window.innerWidth;
  if (w < WG_BP_MOBILE) return 'mobile';
  if (w < WG_BP_TABLET) return 'tablet';
  return 'desktop';
}
function applyResponsive() {
  const t = viewportFactor();
  const r = state.responsive;
  state.config.dashTile         = Math.round(lerp(r.dashTile.mobile,         r.dashTile.desktop,         t));
  state.config.dashMinSpacing   = Math.round(lerp(r.dashMinSpacing.mobile,   r.dashMinSpacing.desktop,   t));
  state.config.fontSize         = lerp(r.fontSize.mobile, r.fontSize.desktop, t);
  // V11: hot-swap device class on breakpoint cross
  const newDevice = currentDevice();
  if (newDevice !== state.device) {
    if (dragHandle) return; // drag-guard: ignore resize during active drag
    state.device = newDevice;
    ensureSituation(state.device, state.activeSituation);
    if (!state.widgets.length) pulseSidebar();
  }
}

// ===== Widget-types: presets die een nieuwe widget seeden (size + source).
// `kind` bepaalt de renderer: 'infobox' (data-grid) of 'map' (campagne-kaart).
const WG_SOURCE_LABELS = { abilities: 'Ability Scores', skills: 'Skills', basicInfo: 'Character Info' };
const WG_WIDGET_TYPES = {
  abilityScores: { label: 'Ability Scores', kind: 'infobox', source: 'abilities', spanUnits: 4, spanUnitsY: 6,
                   cfg: { cellPadding: 0, widgetPadding: 4, infoBoxSpacing: 2, infoBoxPadding: 2 } },
  skills:        { label: 'Skills',         kind: 'infobox', source: 'skills',    spanUnits: 5, spanUnitsY: 15,
                   cfg: { cellPadding: 0, widgetPadding: 4, infoBoxSpacing: 2, infoBoxPadding: 2 } },
  map:           { label: 'Campagne-kaart',  kind: 'map',   spanUnits: 13, spanUnitsY: 11 },
  profilePicture:{ label: 'Profile picture', kind: 'image', spanUnits: 5,  spanUnitsY: 7  },
  basicInfo:     { label: 'Character Info',  kind: 'infobox', source: 'basicInfo', spanUnits: 6, spanUnitsY: 6,
                   cfg: { cellPadding: 0, widgetPadding: 4, infoBoxSpacing: 2, infoBoxPadding: 2 } },
  combatTracker:    { label: 'Combat Tracker',    kind: 'combat', spanUnits: 14, spanUnitsY: 11,
                      cfg: { widgetPadding: 0, transpose: false } },
  initiativeTracker:{ label: 'Initiative Tracker', kind: 'combat', spanUnits: 6,  spanUnitsY: 11,
                      cfg: { widgetPadding: 0, transpose: false } },
};
const WG_DEFAULT_WIDGET_TYPE = 'abilityScores';

// ===== Edit-config registry (V11 Phase 3.2) =====
// Defines which column index in which source is editable, and how to write it to Firebase.
const WG_EDIT_CONFIG = {
  abilities: {
    editColumnIdx: 1,  // score-kolom (data: [label, score, modStr])
    type: 'number',
    min: 1, max: 30, step: 1,
  },
  skills: {
    editColumnIdx: 0,  // prof-bolletjes-kolom
    type: 'cycle',
    cycle: ['○', '●', '★'],
  },
  // Bug #G0tAIk (2026-06-04): Character Info (basicInfo) is op verzoek NIET meer
  // bewerkbaar vanuit het dashboard — race/class/etc. bewerk je op de sheet, niet
  // hier (voorkomt ook de display-naam ↔ interne-key desync). Widget toont alleen.
};

function nextSkillMark(current) {
  const cycle = WG_EDIT_CONFIG.skills.cycle;
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}


function widgetKind(w) { return (w && WG_WIDGET_TYPES[w.type]) ? WG_WIDGET_TYPES[w.type].kind : 'infobox'; }

// Gedeelde campagne-maps (uit D&D Within Firebase /dw/world/maps). Eén keer
// geladen en gecached; alle map-widgets delen deze data.
// WGI-M2: pre-seed from D&D Within's localStorage('dw_maps') when present.
// Standalone V8 starts null and lazy-fetches via fetchMapsData on first map widget.
let WG_MAPS_CACHE = (function() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('dw_maps');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && Array.isArray(parsed.dimensions)) ? parsed : null;
  } catch (e) { return null; }
})();
let _mapsFetchState = 'idle';     // idle | loading | ready | error
// Cache: image src -> { nw, nh } natural pixel dimensions for letterbox pin-offset calculation.
const WG_MAP_IMAGE_DIMS = new Map();

// Verse per-widget sub-objecten. Function declarations → gehoist, dus bruikbaar
// in de `state`-literal hieronder.
function makeWidgetData(source = 'abilities') {
  return { source, columns: [], rows: [] };   // V9: characterId/raw/status/error zijn dashboard-breed
}
function makeWidgetLayout() {
  return {
    stacking: 'horizontal',    // horizontal | vertical
    columnPxWidths: [],        // px-breedte per kolom = ceil(maxMeasure + 2*cellPadding)
    columnAlign: ['left', 'center', 'right'],  // per kolom (alleen voor horizontal)
    columnHighlight: [],       // per kolom: true = highlight-tekst, false = regular
    columnMaxChars: [],        // per kolom: null = geen limiet, anders max chars
    columnAllCaps: [],         // per kolom: true = uppercase render
    columnMinWidthPx: [],      // per kolom: null = geen minimum, anders px
    columnExtraClass: [],      // per kolom: null = geen extra CSS-klasse, anders string
    columnFontScale: [],       // per kolom: null/1 = base font, anders em-scale (sync met CSS in columnExtraClass)
    boxPxW: 0,                 // info-box pixel-breedte (som horizontal / max vertical)
    boxPxH: 0,                 // info-box pixel-hoogte (font-driven)
  };
}
function makeWidgetCfg() {
  return { cellPadding: 0, widgetPadding: 8, infoBoxSpacing: 5, infoBoxPadding: 2 };
}
// cfg-default voor een widget-type: type-specifiek indien gedefinieerd in
// WG_WIDGET_TYPES, anders de generieke default.
function makeTypeCfg(typeKey) {
  const t = WG_WIDGET_TYPES[typeKey];
  return (t && t.cfg) ? { ...t.cfg } : makeWidgetCfg();
}
// Per-widget map-state (alleen voor type-'map' widgets).
function makeWidgetMap() {
  return { dimIdx: 0, mapId: null, history: [] };
}
// Per-widget image-state (voor 'image'-kind widgets, bv. Profile picture).
function makeWidgetImage() {
  return { src: null };
}

// V11: default geometry shared across all tabs (Joshua-keuze: shared, not per-tab)
// leftX/topY = offset van de grid binnen de canvas. Klein gehouden zodat
// widgets tot dicht aan de rand van de canvas-wrap kunnen (verzoek 2026-06-04).
function defaultDashboardGeom() {
  return { leftX: 2, width: 455, topY: 2, height: 230 };
}

// V11: factory for one situation slot
function makeSituationState() {
  return { widgets: [], currentPage: 0, activeWidgetIdx: -1, schemaVersion: 1 };
}

// V11: current device class from viewport width
function currentDevice() {
  const w = window.innerWidth;
  if (w < WG_BP_MOBILE) return 'mobile';
  if (w < WG_BP_TABLET) return 'tablet';
  return 'desktop';
}

const WG_SITUATIONS = ['character', 'social', 'exploring', 'combat', 'inventory'];
// DM-modus situatie-tabs (DM Dashboard, character-onafhankelijk). Widgets per
// tab komen later; de tabs zelf bestaan nu al. Zie memory dnd_within_dm_dashboard.
const WG_SITUATIONS_DM = ['social', 'exploring', 'combat', 'ambient'];
// Actieve situatie-lijst voor de huidige mount-context.
function wgSituations() {
  return state.context === 'dm' ? WG_SITUATIONS_DM : WG_SITUATIONS;
}

const state = {
  responsive: JSON.parse(JSON.stringify(WG_RESPONSIVE_DEFAULTS)), // deep copy zodat user kan tweaken
  config: {
    dashTile: 40,
    dashMinSpacing: 5,
    fontSize: 12,
    dashPadding: 20,
    editMode: true,            // V10: edit-mode is altijd actief; handles tonen op proximity
    devView: false,            // dev-view: amber-grid + dev-panels (toggle in settings)
    showDashboardInfo: false,  // V10: dashboard-info-blok onder canvas (toggle in settings)
    editValuesMode: false,      // V11 Phase 3.2: edit-values mode voor abilities + skills
    pinAddMode: null,           // V11 Phase 3.3: widget-index in pin-add-mode, or null
  },
  dashboard: defaultDashboardGeom(), // V11: shared across tabs (Joshua-keuze)
  style: {
    palette: 'positiveGold',
    cellRadius: 8,
    widgetRadius: 12,
  },
  characterId: 'saya',           // V9: dashboard-breed — alle character-widgets volgen dit
  context: 'character',          // DM-dashboard: 'character' | 'dm' — zet via mount({context})
  dmCampaignId: null,            // DM-modus: campaign waaraan dashboard+monsters hangen
  activeSituation: 'character',  // V11: welke tab open is
  device: 'desktop',             // V11: current device class; set bij init via currentDevice()
  // V11: per-device, per-situation widget state. All starts empty; Firebase in next phase.
  dashboardsByDevice: {
    mobile:  {},
    tablet:  {},
    desktop: {},
  },
};

// V11: ensure a situation slot exists for device+situation, lazy-init if needed
function ensureSituation(device, situation) {
  if (!state.dashboardsByDevice[device][situation]) {
    state.dashboardsByDevice[device][situation] = makeSituationState();
  }
  return state.dashboardsByDevice[device][situation];
}

// V11: shorthand -> active slot
function activeSituationSlot() {
  return ensureSituation(state.device, state.activeSituation);
}

// V11: proxy getters so all existing callsites (state.widgets.push etc.) work unchanged
Object.defineProperty(state, 'widgets', {
  get() { return activeSituationSlot().widgets; },
  configurable: true,
});
Object.defineProperty(state, 'activeWidgetIdx', {
  get() { return activeSituationSlot().activeWidgetIdx; },
  set(v) { activeSituationSlot().activeWidgetIdx = v; },
  configurable: true,
});
Object.defineProperty(state, 'currentPage', {
  get() { return activeSituationSlot().currentPage; },
  set(v) { activeSituationSlot().currentPage = v; },
  configurable: true,
});

// EMPTY-fallbacks voor de proxy-getters wanneer er geen widget is.
const EMPTY_DATA = makeWidgetData();
const EMPTY_LAYOUT = makeWidgetLayout();
const EMPTY_CFG = makeWidgetCfg();

Object.defineProperty(state, 'widget', {
  get() {
    if (!state.widgets.length) return null;
    const idx = Math.max(0, Math.min(state.activeWidgetIdx, state.widgets.length - 1));
    return state.widgets[idx];
  },
  configurable: true,
});

// state.data / state.layout / state.cfg zijn proxies naar de ACTIEVE widget.
// render() wisselt activeWidgetIdx per widget, dus tijdens het tekenen wijzen
// deze vanzelf naar de juiste widget — net als state.widget.
Object.defineProperty(state, 'data',   { get() { return state.widget?.data   ?? EMPTY_DATA;   }, configurable: true });
Object.defineProperty(state, 'layout', { get() { return state.widget?.layout ?? EMPTY_LAYOUT; }, configurable: true });
Object.defineProperty(state, 'cfg',    { get() { return state.widget?.cfg    ?? EMPTY_CFG;    }, configurable: true });

// Multi-select (transient, per huidige tab — niet geserialiseerd). Bevat de
// EXTRA geselecteerde indices náást de actieve (state.activeWidgetIdx blijft de
// "primaire"/laatst-aangeklikte die de settings opent). Wordt gewist bij
// tab-/situatie-wissel (clearSelection) en bij klik in lege ruimte.
let wgSelectedIdxs = [];
// Alle geselecteerde indices (actief + extra's), uniek + geldig.
function wgGetSelectedIdxs() {
  const n = state.widgets.length;
  const set = new Set(wgSelectedIdxs.filter(i => i >= 0 && i < n));
  if (state.activeWidgetIdx >= 0 && state.activeWidgetIdx < n) set.add(state.activeWidgetIdx);
  return [...set];
}
function wgIsSelected(i) {
  return i === state.activeWidgetIdx || wgSelectedIdxs.indexOf(i) >= 0;
}
function wgSetSelection(idxs) { wgSelectedIdxs = (idxs || []).slice(); }
function wgClearMultiSelection() { wgSelectedIdxs = []; }

// V11: deselect active widget in current tab
function clearSelection() {
  state.activeWidgetIdx = -1;
  wgSelectedIdxs = [];
}

// V11: pulse left sidebar amber once (empty-tab feedback, ~600ms)
function pulseSidebar() {
  const sidebar = document.getElementById('leftSidebar');
  if (!sidebar) return;
  sidebar.classList.remove('pulse-empty');
  void sidebar.offsetWidth; // force reflow to restart animation
  sidebar.classList.add('pulse-empty');
  sidebar.addEventListener('animationend', () => sidebar.classList.remove('pulse-empty'), { once: true });
}

// Voer fn uit met `widget` tijdelijk als actieve widget (cursor-binding), zodat
// state.data/layout/cfg/widget binnen fn naar die widget verwijzen.
function withWidget(widget, fn) {
  const prev = state.activeWidgetIdx;
  const idx = state.widgets.indexOf(widget);
  if (idx >= 0) state.activeWidgetIdx = idx;
  try { return fn(); }
  finally { state.activeWidgetIdx = prev; }
}

// Herbereken data-layout voor ALLE widgets (na globale wijziging zoals
// resize/font/palette die measureText beïnvloedt).
function recomputeAllWidgets() {
  // V9 pass A — data-layout herberekenen (leest spans, muteert ze niet)
  for (const w of state.widgets) {
    withWidget(w, () => recomputeDataLayout());
  }
  // V9 pass B — viewport-resize: hoogte mag groeien (content blijft passen)
  // maar nooit krimpen (dashboard-resize maakt een widget nooit kleiner).
  for (const w of state.widgets) {
    withWidget(w, () => compactSpanUnitsY(true));
  }
}

// Settings-scope: 'dashboard' (topbar-gear) of 'widget' (widget-gear).
let settingsScope = 'dashboard';
