// ===== wg-mount.js — bootstrap + WidgetGrid namespace =====
// WGI-M1: extracted from index.html lines 4525-4604.
// WGI-M3: WidgetGridInit() function + WIDGET_GRID_DEFER_INIT auto-call gate.
// WGI-M4: WidgetGrid namespace met mount(rootEl, opts) + unmount() API,
// body-template injection voor inline-integratie in D&D Within.

function WidgetGridInit() {
  window.addEventListener('resize', () => {
    // Bij window-resize: responsive-scalen + columnPxWidths hercomputeren
    // (fontSize verandert mee, dus measureText geeft andere px-waardes).
    applyResponsive();
    applyResponsiveWidth();
    applyResponsiveHeight();
    recomputeAllWidgets();
    render();
    alignSidebarTop();
  });

  bindInputs();
  bindResponsiveInputs();
  bindStyleInputs();
  bindWidgetPanelInputs();
  bindTabs();
  bindSettingsToggles();
  bindExportWidget();
  // V11 Phase 3: right sidebar bindings
  bindRightSidebar();
  // V9: paginanavigatie + character-dropdown (characterSelect is now in right sidebar, binding stays)
  document.getElementById('characterSelect')?.addEventListener('change', (e) => selectCharacter(e.target.value));
  document.getElementById('pageNav')?.addEventListener('click', (e) => {
    const arrow = e.target.closest('[data-page-arrow]');
    if (arrow) { goToPage(state.currentPage + (arrow.dataset.pageArrow === 'next' ? 1 : -1)); return; }
    const dot = e.target.closest('[data-page-dot]');
    if (dot) goToPage(parseInt(dot.dataset.pageDot, 10));
  });
  bindSidebar();
  renderSidebar();
  applyStyle();

  // V11: situatie-tabs — volledig lifecycle met per-tab state.
  document.querySelectorAll('.dash-tab').forEach(t => {
    t.addEventListener('click', () => {
      const situation = t.dataset.situation;
      if (!situation) return;
      if (dragHandle) return; // drag-guard: ignore click during active drag
      if (situation === state.activeSituation) return; // already active, no-op
      // lazy-init the target situation slot
      ensureSituation(state.device, situation);
      state.activeSituation = situation;
      clearSelection();
      // toggle active class on tabs
      document.querySelectorAll('.dash-tab').forEach(o => o.classList.toggle('active', o === t));
      // render the new tab
      recomputeAllWidgets();
      render();
      renderSidebar();
      alignSidebarTop();
      // map-data: fetch if new tab has map widgets and cache is empty
      if (state.widgets.some(w => widgetKind(w) === 'map') && !WG_MAPS_CACHE) fetchMapsData();
      // pulse sidebar if tab is empty (feedback to user)
      if (!state.widgets.length) pulseSidebar();
    });
  });
  // V11: set initial device class before any render
  state.device = currentDevice();
  // ensure the initial situation slot exists
  ensureSituation(state.device, state.activeSituation);
  // V9: responsive eerst (zet dashTile/dashMinSpacing op de viewport-waarden),
  // PAS DAARNA setDevView/render — anders normaliseert de eerste render op
  // verkeerde tpp/rpp en krimpen spans onterecht.
  applyResponsive();
  applyResponsiveWidth();
  applyResponsiveHeight();
  setDevView(state.config.devView);
  setShowDashboardInfo(state.config.showDashboardInfo);
  render();
  if (state.context === 'dm') {
    // DM Dashboard: geen character-fetch. Reset de widget-library (anders
    // blijven character-widgets van een vorige character-mount staan) en laad
    // het DM-dashboard (per campaign).
    seedDefaultWidgets();
    renderSidebar();
    loadDashboards();
  } else {
    // Speler-dashboard: reset de widget-library expliciet naar de speler-palette.
    // (Fix 2026-06-07) `library` is een module-global die blijft staan na een
    // DM-dashboard bezoek; daardoor toonde een speler-dashboard de DM-only
    // "Combat Tracker" i.p.v. de reguliere speler-widgets. seedDefaultWidgets()
    // branch't zelf op state.context, dus dit zet altijd de juiste palette.
    seedDefaultWidgets();
    renderSidebar();
    // V9: één dashboard-brede character + lijst voor de dropdown.
    renderCharacterSelect();          // init met huidige id alvast
    fetchCharacterList();              // populeer dropdown async
    fetchCharacterData(state.characterId);
    // V11 Phase 2: load dashboards from Firebase on boot
    loadDashboards(state.characterId);
  }
  // V11: pulse sidebar on initial open as onboarding hint (overridden if dashboards load)
  pulseSidebar();
  // Lijn de bovenste category-knop uit op de canvas-top.
  alignSidebarTop();
}

// WGI-M4: V8 body markup als template-functie (orig index.html lines 1077-1254).
// Wordt geïnjecteerd in de mount-root door WidgetGrid.mount(rootEl, opts).
// context 'character' (default) of 'dm' (DM Dashboard) bepaalt de situatie-tabs
// en of de character-only sidebar-sectie verschijnt.
function wgBodyTemplate(context) {
  const isDM = context === 'dm';
  const tabs = isDM
    ? [['social', 'Social'], ['exploring', 'Exploring'], ['combat', 'Combat'], ['ambient', 'Ambient']]
    : [['character', 'Character'], ['social', 'Social'], ['exploring', 'Exploring'], ['combat', 'Combat'], ['inventory', 'Inventory']];
  const tabsHtml = tabs.map((tb, i) =>
    `<button class="dash-tab${i === 0 ? ' active' : ''}" data-situation="${tb[0]}">${tb[1]}</button>`
  ).join('\n    ');
  // Character-only sidebar-sectie (character-dropdown) — niet in DM-modus.
  const charSection = isDM ? '' : `
    <div class="rs-char-section">
      <div class="sidebar-section-label">Character</div>
      <select id="characterSelect" class="character-select" aria-label="Character" title="Character"></select>
    </div>`;
  const charToggleBtn = isDM ? '' : `
    <button class="rs-btn cat-item" id="rs-char-toggle" aria-label="Character wisselen" title="Character wisselen">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    </button>`;
  return `
<header class="app-topbar">
  <div class="topbar-spacer-left" aria-hidden="true"></div>
  <nav class="dash-tabs" id="dashTabs" aria-label="Situatie dashboards">
    ${tabsHtml}
  </nav>
  <div class="topbar-spacer-right" aria-hidden="true"></div>
</header>
<div class="app-row">
<aside class="sidebar" id="leftSidebar" aria-label="Widget library">
  <nav class="sidebar-categories" id="sidebarCategories" aria-label="Categories"></nav>
  <div class="sidebar-panel">
    <div class="sidebar-search">
      <input type="search" id="sidebarSearch" placeholder="Search widgets…" aria-label="Search widgets">
    </div>
    <div class="sidebar-widgets" id="sidebarWidgets"></div>
  </div>
</aside>
<aside class="sidebar right-sidebar" id="rightSidebar" aria-label="Dashboard tools">
  <div class="sidebar-panel">${charSection}
  </div>
  <nav class="sidebar-categories">
    <button class="rs-btn cat-item" id="rs-tidy" aria-label="Tidy widgets" title="Tidy — repack widgets compactly">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="8" height="10" rx="1"/>
        <rect x="13" y="3" width="8" height="6" rx="1"/>
        <rect x="13" y="11" width="8" height="10" rx="1"/>
        <rect x="3" y="15" width="8" height="6" rx="1"/>
      </svg>
    </button>
    <button class="rs-btn cat-item" id="settingsToggle" aria-label="Open settings" aria-expanded="false" title="Settings">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
    ${charToggleBtn}
    <button class="rs-btn cat-item" id="rs-edit-values" aria-label="Edit values" title="Edit values">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
    <button class="rs-btn cat-item" id="rs-save" aria-label="Save dashboard" title="Save dashboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
    </button>
  </nav>
</aside>
<main class="app-main">

<aside class="settings-panel" id="settingsPanel" aria-hidden="true">
  <div class="settings-header">
    <h2 id="settingsTitle">Settings</h2>
    <button class="settings-close" id="settingsClose" aria-label="Close settings">×</button>
  </div>
  <div class="settings-tabs" role="tablist">
    <button class="settings-tab active" data-tab="data" data-scope="widget" data-kind="infobox" role="tab">Data</button>
    <button class="settings-tab" data-tab="widget" data-scope="widget" role="tab">Widget</button>
    <button class="settings-tab" data-tab="style" data-scope="dashboard" role="tab">Style</button>
    <button class="settings-tab" data-tab="dev" data-scope="dashboard" role="tab">Dev</button>
  </div>
  <div class="settings-body">
    <div class="settings-pane active" data-pane="data">
      <div class="controls">
        <div class="control"><label>Data source</label>
          <select id="dataSource" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:6px;font-size:16px;">
            <option value="abilities">Ability Scores (6 rows)</option>
            <option value="skills">Skills (18 rows)</option>
          </select>
        </div>
        <div class="control"><label>Status</label><div class="readout" id="dataStatus">—</div></div>
      </div>
    </div>
    <div class="settings-pane" data-pane="widget">
      <div class="controls">
        <div class="control"><label>Title</label><input type="text" id="widgetTitle" placeholder="—"></div>
        <div class="control"><label>Type</label>
          <select id="widgetType" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:6px;font-size:16px;"></select>
        </div>
        <div class="control" data-kind="combat"><label>Table orientation</label>
          <div class="radio-group" id="combatTranspose">
            <label><input type="radio" name="combatTranspose" value="normal" checked><span>Rows</span></label>
            <label><input type="radio" name="combatTranspose" value="transpose"><span>Columns</span></label>
          </div>
        </div>
        <div class="control" data-kind="inventory"><label>Display</label>
          <div class="radio-group" id="invDisplay">
            <label><input type="radio" name="invDisplay" value="text" checked><span>Text</span></label>
            <label><input type="radio" name="invDisplay" value="image"><span>Image</span></label>
          </div>
        </div>
        <div class="control" data-kind="infobox"><label>Stacking</label>
          <div class="radio-group" id="stacking">
            <label><input type="radio" name="stacking" value="horizontal" checked><span>Horizontal</span></label>
            <label><input type="radio" name="stacking" value="vertical"><span>Vertical</span></label>
          </div>
        </div>
        <div class="control" data-kind="infobox"><label>Cel-padding (px)</label><input type="number" id="cellPadding" value="0" min="0" step="1"></div>
        <div class="control"><label>Widget padding (px)</label><input type="number" id="widgetPadding" value="8" min="0" step="1"></div>
        <div class="control" data-kind="infobox"><label>Info-box spacing (px)</label><input type="number" id="infoBoxSpacing" value="5" min="0" step="1"></div>
        <div class="control" data-kind="infobox"><label>Info-box padding (px)</label><input type="number" id="infoBoxPadding" value="2" min="0" step="1"></div>
        <div id="widgetColumnControls" data-kind="infobox" style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 10px;"></div>
        <div class="control" style="grid-column: 1 / -1;">
          <label>Export widget JSON</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <button id="exportWidgetBtn" style="padding:8px 12px;background:var(--accent);color:var(--bg);border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Generate + copy</button>
            <span id="exportWidgetStatus" style="font-size:12px;color:var(--muted);"></span>
          </div>
          <textarea id="exportWidgetJson" readonly style="margin-top:6px;width:100%;height:160px;background:var(--bg);border:1px solid var(--border);color:var(--text);padding:8px;border-radius:6px;font:12px/1.4 ui-monospace,monospace;resize:vertical;"></textarea>
        </div>
      </div>
    </div>
    <div class="settings-pane" data-pane="style">
      <div class="controls">
        <div class="control" style="grid-column: 1 / -1;">
          <label>Color palette</label>
          <select id="paletteSelect" style="background:var(--bg);border:1px solid var(--border);color:var(--text);padding:8px 10px;border-radius:6px;font-size:16px;"></select>
        </div>
        <div class="control" style="grid-column: 1 / -1;">
          <label>Display</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);text-transform:none;letter-spacing:normal;font-weight:500;padding:4px 0;">
            <input type="checkbox" id="devViewToggleInput"> Developer view (grid + dev panels)
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);text-transform:none;letter-spacing:normal;font-weight:500;padding:4px 0;">
            <input type="checkbox" id="showDashboardInfoInput"> Show dashboard info under canvas
          </label>
        </div>
      </div>
    </div>
    <div class="settings-pane" data-pane="dev">
      <div class="controls">
        <div class="control"><label>Viewport</label><div class="readout" id="vpReadout">—</div></div>
        <div class="control" data-rv="dashTile">
          <label>Dashboard tile</label>
          <div class="range-inputs"><input type="number" data-end="mobile" min="2" step="1"><input type="number" data-end="desktop" min="2" step="1"></div>
          <div class="range-tags"><span>mob</span><span>desk</span></div>
          <div class="range-curr" id="dashTile_curr">—</div>
        </div>
        <div class="control" data-rv="dashMinSpacing">
          <label>Dashboard spacing</label>
          <div class="range-inputs"><input type="number" data-end="mobile" min="0" step="1"><input type="number" data-end="desktop" min="0" step="1"></div>
          <div class="range-tags"><span>mob</span><span>desk</span></div>
          <div class="range-curr" id="dashMinSpacing_curr">—</div>
        </div>
        <div class="control" data-rv="fontSize">
          <label>Font size (UI)</label>
          <div class="range-inputs"><input type="number" data-end="mobile" min="6" step="1"><input type="number" data-end="desktop" min="6" step="1"></div>
          <div class="range-tags"><span>mob</span><span>desk</span></div>
          <div class="range-curr" id="fontSize_curr">—</div>
        </div>
        <div class="control"><label>Dashboard padding (px)</label><input type="number" id="dashPadding" value="20" min="0" step="1"></div>
      </div>
    </div>
  </div>
</aside>
<div class="settings-overlay" id="settingsOverlay"></div>

<div class="canvas-wrap">
  <svg id="canvas" xmlns="http://www.w3.org/2000/svg"></svg>
</div>
<div class="page-nav" id="pageNav" style="display:none;"></div>

<div class="info show-on-toggle">
  <div class="info-box" id="dashInfo"><h3>Dashboard</h3></div>
  <div class="info-box" id="widgetInfo"><h3>Widget</h3></div>
  <div class="info-box" id="infoBoxInfo"><h3>Info boxes</h3></div>
</div>

</main>
</div>
`;
}

// WGI-M4: public mount/unmount API for inline integration in D&D Within.
const WidgetGrid = {
  /**
   * Mount V8 dashboard binnen rootEl. Bouwt V8's body-template in rootEl,
   * herinitialiseert DOM-refs binnen die scope en bootstrap-d de bind* +
   * fetch sequence.
   *
   * @param {HTMLElement} rootEl - .character-page / .dm-page div (mount target)
   * @param {{characterId?: string, canEdit?: boolean, context?: 'character'|'dm', campaignId?: string}} opts
   */
  mount(rootEl, opts) {
    if (!rootEl) return;
    opts = opts || {};
    if (rootEl._wgMounted) return; // idempotent
    state.context = opts.context === 'dm' ? 'dm' : 'character';
    state.dmCampaignId = opts.campaignId || null;
    rootEl.innerHTML = wgBodyTemplate(state.context);
    if (opts.characterId) state.characterId = opts.characterId;
    // Default actieve tab per context (DM heeft geen 'character'-tab).
    state.activeSituation = (state.context === 'dm') ? 'social' : 'character';
    if (typeof WidgetGridInitSettingsRefs === 'function') {
      WidgetGridInitSettingsRefs(rootEl);
    }
    rootEl._wgMounted = true;
    WidgetGrid._mountedRoot = rootEl;
    WidgetGridInit();
  },
  /**
   * Cleanup wanneer DnD navigeert weg van character-page. Leegt de DOM
   * binnen rootEl; document-level listeners (pointer, keydown) blijven
   * staan maar zijn benign omdat hun handlers state-checks doen.
   */
  unmount() {
    const root = WidgetGrid._mountedRoot;
    if (!root) return;
    root._wgMounted = false;
    root.innerHTML = '';
    WidgetGrid._mountedRoot = null;
    // V11: reset widgets/active situation zodat volgende mount fresh start
    if (typeof state !== 'undefined') {
      state.dashboardsByDevice = { mobile: {}, tablet: {}, desktop: {} };
      state.activeWidgetIdx = -1;
      // Reset naar character-context zodat de volgende mount (bv. character-page)
      // niet per ongeluk in DM-modus blijft.
      state.context = 'character';
      state.dmCampaignId = null;
      state.activeSituation = 'character';
    }
  },
  // Exposed voor debug + dev-tools
  get state() { return typeof state !== 'undefined' ? state : null; },
};
if (typeof window !== 'undefined') {
  window.WidgetGrid = WidgetGrid;
  window.WidgetGridInit = WidgetGridInit;
}

// Auto-boot unless deferred (standalone V8 = auto; D&D Within = deferred).
if (typeof window === 'undefined' || !window.WIDGET_GRID_DEFER_INIT) {
  WidgetGridInit();
}
