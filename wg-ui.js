// ===== wg-ui.js — inputs, palettes, tabs, widget panel, JSON export, sidebar, dev toggles, settings dialog, alignSidebarTop =====
// Extracted from index.html lines 3803-4399 + 4457-4523

// ----- Inputs / Palettes / Tabs / Widget panel / Sidebar / Dev toggles ----- (orig 3803-4399)
// ----- Inputs -----

function bindInputs() {
  // dashPadding → dashboard-globaal
  const dashPadInp = document.getElementById('dashPadding');
  if (dashPadInp) {
    dashPadInp.value = state.config.dashPadding;
    dashPadInp.addEventListener('input', () => {
      const v = parseInt(dashPadInp.value, 10);
      if (!isNaN(v) && v >= 0) {
        state.config.dashPadding = v;
        applyResponsiveHeight();
        recomputeAllWidgets();
        render();
      }
    });
  }

  // cellPadding / widgetPadding / infoBoxSpacing → per-widget (state.widget.cfg)
  ['cellPadding', 'widgetPadding', 'infoBoxSpacing', 'infoBoxPadding'].forEach(id => {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.addEventListener('input', () => {
      const v = parseInt(inp.value, 10);
      if (!isNaN(v) && v >= 0 && state.widget) {
        state.widget.cfg[id] = v;
        recomputeDataLayout();   // cellPadding beïnvloedt boxPx
        compactSpanUnitsY();
        render();
      }
    });
  });

  // V9: Character ID-input is verdwenen — character is dashboard-breed
  // (topbar-dropdown). Data source blijft per-widget.
  // Data source dropdown — per-widget
  const srcSel = document.getElementById('dataSource');
  if (srcSel) {
    srcSel.addEventListener('change', () => {
      const w = state.widget;
      if (!w) return;
      w.data.source = srcSel.value;
      rebuildWidget(w);
      renderWidgetColumnControls();
      const ti = document.getElementById('widgetTitle');
      if (ti) ti.placeholder = autoTitle(w);
      syncSettingsHeader();
      render();
    });
  }

  // Stacking radio-group — per-widget
  const stackGroup = document.getElementById('stacking');
  if (stackGroup) {
    stackGroup.querySelectorAll('input[name="stacking"]').forEach(r => {
      r.addEventListener('change', () => {
        const w = state.widget;
        if (!r.checked || !w) return;
        w.layout.stacking = r.value;
        recomputeBoxPx();
        compactSpanUnitsY();
        render();
      });
    });
  }
}

// ----- Palettes -----
const WG_PALETTES = {
  parchment: {
    label: 'Perkament',
    css: {
      '--tile-info':   '#cc88ff',
      '--tile-info-2': '#88ccff',
      '--tile-info-3': '#99ee66',
      '--user-bg-page':         '#f5ecd6',
      '--user-bg-1':            '#ede0c2',
      '--user-bg-2':            '#e8d9b7',
      '--user-text-regular':    '#2d2415',
      '--user-text-highlight':  '#6b4a16',
      '--user-border':          '#b8a06f',
      '--user-border-soft':     'rgba(184,160,111,0.35)',
      '--user-border-glow':     '#b8a06f',
      '--info-font-body':       "Georgia, 'Times New Roman', serif",
      '--info-font-display':    "Georgia, 'Times New Roman', serif",
    },
    cellRadius: 4,
    widgetRadius: 10,
  },
  positiveGold: {
    label: 'Positive Gold',
    css: {
      '--tile-info':   '#cc88ff',
      '--tile-info-2': '#88ccff',
      '--tile-info-3': '#99ee66',
      // D&D Within exacte tokens uit :root
      '--user-bg-page':         '#0c0a08',           // bg-dark
      '--user-bg-1':            '#221d19',           // bg-elevated (header + info-boxes)
      '--user-bg-2':            '#161311',           // bg-card (widget main)
      '--user-text-regular':    '#9a8e7e',           // text-dim
      '--user-text-highlight':  '#c9a961',           // accent-warm
      '--user-border':          '#3e342c',           // border-light (widget outline)
      '--user-border-soft':     'rgba(201,169,97,0.18)', // hairline-gold (info-box outline)
      '--user-border-glow':     '#fbbf24',           // Amber accent (drag-glow)
      '--info-font-body':       "'Cinzel', 'Trajan Pro', Georgia, serif",
      '--info-font-display':    "'Cinzel', 'Trajan Pro', Georgia, serif",
    },
    cellRadius: 8,      // radius-sm
    widgetRadius: 12,   // radius
  },
};

function applyPalette(name) {
  const p = WG_PALETTES[name];
  if (!p) return;
  state.style.palette = name;
  state.style.cellRadius = p.cellRadius;
  state.style.widgetRadius = p.widgetRadius;
  state.style.infoBoxOutlineOpacity = p.infoBoxOutlineOpacity;
  // Glow wordt nu door is-dragging class getriggerd, niet permanent gezet.
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(p.css)) root.setProperty(k, v);
}

function applyStyle() {
  applyPalette(state.style.palette);
}

function bindStyleInputs() {
  const sel = document.getElementById('paletteSelect');
  if (sel) {
    // Vul dropdown
    sel.innerHTML = '';
    for (const [key, p] of Object.entries(WG_PALETTES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.label;
      sel.appendChild(opt);
    }
    sel.value = state.style.palette;
    sel.addEventListener('change', () => {
      applyPalette(sel.value);
      recomputeAllWidgets();  // font kan verschillen tussen paletten
      render();
    });
  }
}

function bindTabs() {
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });
}

function activateTab(name) {
  document.querySelectorAll('.settings-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.settings-pane').forEach(p => {
    p.classList.toggle('active', p.dataset.pane === name);
  });
}

// Render per-kolom controls (max chars + all caps) in widget tab.
function renderWidgetColumnControls() {
  // Sync stacking-radio's met huidige state (kan door buildRowsFromSource veranderd zijn)
  const stackRadios = document.querySelectorAll('input[name="stacking"]');
  stackRadios.forEach(r => { r.checked = (r.value === state.layout.stacking); });

  const container = document.getElementById('widgetColumnControls');
  if (!container) return;
  container.innerHTML = '';
  const cols = state.data.columns || [];
  if (cols.length === 0) {
    container.innerHTML = '<div class="info-row"><span class="key">(geen kolommen)</span></div>';
    return;
  }
  const inputStyle = 'width:60px;padding:4px 6px;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:4px;font-size:14px;';
  const lblStyle = 'display:flex;align-items:center;gap:6px;font-size:13px;text-transform:none;letter-spacing:normal;color:var(--text);font-weight:500;';
  cols.forEach((col, i) => {
    const maxOn = state.layout.columnMaxChars[i] != null;
    const maxVal = state.layout.columnMaxChars[i] ?? 10;
    const caps = !!state.layout.columnAllCaps[i];
    const hi = !!state.layout.columnHighlight[i];
    const wrap = document.createElement('div');
    wrap.className = 'control';
    wrap.innerHTML = `
      <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;">Kolom ${i+1}: ${col.label}</label>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
        <div class="radio-group">
          <label><input type="radio" name="hi_${i}" data-col-hi="${i}" value="regular" ${!hi ? 'checked' : ''}><span>Regular</span></label>
          <label><input type="radio" name="hi_${i}" data-col-hi="${i}" value="accent"  ${hi ? 'checked' : ''}><span>Accent</span></label>
        </div>
        <label style="${lblStyle}">
          <input type="checkbox" data-col-caps="${i}" ${caps ? 'checked' : ''}> ALL CAPS
        </label>
        <label style="${lblStyle}">
          <input type="checkbox" data-col-maxon="${i}" ${maxOn ? 'checked' : ''}> Max chars
          <input type="number" data-col-max="${i}" min="1" step="1" value="${maxVal}" style="${inputStyle}" ${maxOn ? '' : 'disabled'}>
        </label>
      </div>
    `;
    container.appendChild(wrap);
  });
  container.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('change', handleColumnSettingsChange);
    if (inp.type === 'number') inp.addEventListener('input', handleColumnSettingsChange);
  });
}

function handleColumnSettingsChange(e) {
  const t = e.target;
  if (t.dataset.colHi != null) {
    if (!t.checked) return;
    state.layout.columnHighlight[+t.dataset.colHi] = (t.value === 'accent');
  } else if (t.dataset.colCaps != null) {
    state.layout.columnAllCaps[+t.dataset.colCaps] = t.checked;
  } else if (t.dataset.colMaxon != null) {
    const i = +t.dataset.colMaxon;
    const numInp = document.querySelector(`[data-col-max="${i}"]`);
    if (t.checked) {
      const v = parseInt(numInp.value, 10) || 10;
      state.layout.columnMaxChars[i] = v;
      numInp.disabled = false;
    } else {
      state.layout.columnMaxChars[i] = null;
      numInp.disabled = true;
    }
  } else if (t.dataset.colMax != null) {
    const i = +t.dataset.colMax;
    const v = parseInt(t.value, 10);
    if (!isNaN(v) && v > 0) state.layout.columnMaxChars[i] = v;
  }
  recomputeDataLayout();
  compactSpanUnitsY();
  render();
}

// Synchroniseert alle Data/Widget-panel inputs met de actieve widget.
// Nodig omdat die settings nu per-widget zijn — bij openen of widget-wissel.
function syncWidgetPanel() {
  const w = state.widget;
  if (!w) return;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
  set('dataSource', w.data.source);
  set('widgetType', w.type);
  set('cellPadding', w.cfg.cellPadding);
  set('widgetPadding', w.cfg.widgetPadding);
  set('infoBoxSpacing', w.cfg.infoBoxSpacing);
  set('infoBoxPadding', w.cfg.infoBoxPadding);
  const titleInp = document.getElementById('widgetTitle');
  if (titleInp) {
    titleInp.value = w.title || '';
    titleInp.placeholder = autoTitle(w);
  }
  document.querySelectorAll('input[name="stacking"]').forEach(r => {
    r.checked = (r.value === w.layout.stacking);
  });
  updateStatus();
  renderWidgetColumnControls();
  applyPanelVisibility();
  syncSettingsHeader();
}

// Toont/verbergt tabs (scope + widget-kind) en kind-specifieke controls,
// zodat de widget-instellingen conditionele formulieren zijn.
function applyPanelVisibility() {
  const kind = widgetKind(state.widget);
  let firstVisible = null, activeVisible = false;
  document.querySelectorAll('.settings-tab').forEach(t => {
    const visible = t.dataset.scope === settingsScope &&
                    (!t.dataset.kind || t.dataset.kind === kind);
    t.hidden = !visible;
    if (visible) {
      if (!firstVisible) firstVisible = t;
      if (t.classList.contains('active')) activeVisible = true;
    }
  });
  document.querySelectorAll('.settings-pane [data-kind]').forEach(c => {
    c.classList.toggle('kind-hidden', c.dataset.kind !== kind);
  });
  if (!activeVisible && firstVisible) activateTab(firstVisible.dataset.tab);
}

// Vult de type-dropdown en bindt type- + titel-input (eenmalig).
function bindWidgetPanelInputs() {
  const typeSel = document.getElementById('widgetType');
  if (typeSel) {
    typeSel.innerHTML = '';
    for (const [key, t] of Object.entries(WG_WIDGET_TYPES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = t.label;
      typeSel.appendChild(opt);
    }
    typeSel.addEventListener('change', () => {
      const w = state.widget;
      if (!w) return;
      if (!confirm('Type wisselen overschrijft de widget-grootte en data-source. Doorgaan?')) {
        typeSel.value = w.type;
        return;
      }
      applyWidgetType(w, typeSel.value);
      syncWidgetPanel();
    });
  }
  const titleInp = document.getElementById('widgetTitle');
  if (titleInp) {
    titleInp.addEventListener('input', () => {
      const w = state.widget;
      if (!w) return;
      w.title = titleInp.value;   // leeg = auto-titel
      syncSettingsHeader();
      render();
    });
  }
}

function openWidgetSettings() {
  openSettings('widget');
  activateTab('widget');
}

// ----- Widget JSON export -----
function buildWidgetJson(widget = state.widget) {
  if (!widget) return {};
  const d = widget.data, L = widget.layout;
  const cols = d.columns || [];
  return {
    title:       widget.title || '',
    type:        widget.type,
    source:      d.source,
    stacking:    L.stacking,
    cfg:         { ...widget.cfg },
    columns: cols.map((c, i) => ({
      key:       c.key,
      label:     c.label,
      align:     L.columnAlign[i]     || 'left',
      highlight: !!L.columnHighlight[i],
      allCaps:   !!L.columnAllCaps[i],
      maxChars:  L.columnMaxChars[i] ?? null,
    })),
    widget: {
      globalCol:    widget.globalCol,
      startRowIdx:  widget.startRowIdx,
      spanUnits:    widget.spanUnits,
      spanUnitsY:   widget.spanUnitsY,
    },
  };
}

// ----- Widget library (sidebar) -----
// Monochrome line-icons (currentColor) — geen emoji, consistent met de rechter sidebar.
const _SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const _SVG_CLOSE = '</svg>';
const WG_CAT_ICONS = {
  all:       _SVG_OPEN + '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>' + _SVG_CLOSE,
  character: _SVG_OPEN + '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' + _SVG_CLOSE,
  stats:     _SVG_OPEN + '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="12" width="3" height="8"/><rect x="11" y="8" width="3" height="12"/><rect x="16" y="4" width="3" height="16"/>' + _SVG_CLOSE,
  exploring: _SVG_OPEN + '<circle cx="12" cy="12" r="9"/><polygon points="15.5,8.5 11,11 8.5,15.5 13,13"/>' + _SVG_CLOSE,
  combat:    _SVG_OPEN + '<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>' + _SVG_CLOSE,
  spells:    _SVG_OPEN + '<polygon points="12,3 14,10 21,12 14,14 12,21 10,14 3,12 10,10"/>' + _SVG_CLOSE,
  inventory: _SVG_OPEN + '<path d="M3 7h18l-2 13H5L3 7z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>' + _SVG_CLOSE,
  social:    _SVG_OPEN + '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' + _SVG_CLOSE,
};
const WG_CATEGORIES = [
  { id: 'all',       name: 'All',       icon: WG_CAT_ICONS.all },
  { id: 'character', name: 'Character', icon: WG_CAT_ICONS.character },
  { id: 'stats',     name: 'Stats',     icon: WG_CAT_ICONS.stats },
  { id: 'exploring', name: 'Exploring', icon: WG_CAT_ICONS.exploring },
  { id: 'combat',    name: 'Combat',    icon: WG_CAT_ICONS.combat },
  { id: 'spells',    name: 'Spells',    icon: WG_CAT_ICONS.spells },
  { id: 'inventory', name: 'Inventory', icon: WG_CAT_ICONS.inventory },
  { id: 'social',    name: 'Social',    icon: WG_CAT_ICONS.social },
];

const library = {
  saved: [],
  activeCategory: 'all',
  activeWidgetId: null,
  search: '',
};

function seedDefaultWidgets() {
  // Library-entries verwijzen alleen naar een widget-type; loadWidget →
  // addWidget seedt de rest uit WG_WIDGET_TYPES.
  library.saved = [
    { id: 'abilityScores',  name: 'Ability Scores',  category: 'stats',     config: { type: 'abilityScores' } },
    { id: 'skills',         name: 'Skills',          category: 'stats',     config: { type: 'skills' } },
    { id: 'profilePicture', name: 'Profile picture', category: 'character', config: { type: 'profilePicture' } },
    { id: 'characterInfo',  name: 'Character Info',  category: 'character', config: { type: 'basicInfo' } },
    { id: 'campaignMap',    name: 'Campagne-kaart',  category: 'exploring', config: { type: 'map' } },
  ];
  library.activeWidgetId = 'abilityScores';
}

function renderSidebar() {
  // Categorieën
  const catContainer = document.getElementById('sidebarCategories');
  if (catContainer) {
    catContainer.innerHTML = WG_CATEGORIES.map(c => `
      <button class="cat-item ${c.id === library.activeCategory ? 'active' : ''}" data-cat="${c.id}" title="${c.name}">
        <span class="cat-icon">${c.icon}</span>
      </button>
    `).join('');
    catContainer.querySelectorAll('.cat-item').forEach(b => {
      b.addEventListener('click', () => {
        library.activeCategory = b.dataset.cat;
        // Klik = pin het panel open (vereist voor touch; harmless op desktop)
        document.getElementById('leftSidebar')?.classList.add('pinned');
        renderSidebar();
      });
      // V10: hover over een categorie opent direct die categorie in het panel.
      // Het panel zelf opent al via :hover op de sidebar; de hover op de knop
      // wisselt enkel de actieve categorie. Reset naar 'all' gebeurt pas bij
      // sidebar-collapse (mouseleave / click-outside / Esc).
      b.addEventListener('mouseenter', () => {
        if (library.activeCategory === b.dataset.cat) return;
        library.activeCategory = b.dataset.cat;
        renderSidebar();
      });
    });
  }

  // Widget-list onder actieve categorie
  const wContainer = document.getElementById('sidebarWidgets');
  if (!wContainer) return;
  const cat = WG_CATEGORIES.find(c => c.id === library.activeCategory);
  const filter = library.search.toLowerCase();
  const inCat = w => library.activeCategory === 'all' || w.category === library.activeCategory;
  const matchFilter = w => !filter || w.name.toLowerCase().includes(filter);
  let items = library.saved.filter(w => inCat(w) && matchFilter(w));
  if (library.activeCategory === 'all') {
    items = items.slice().sort((a, b) => a.name.localeCompare(b.name));
  }
  const html = [];
  html.push(`<div class="sidebar-section-label">${cat ? cat.name : ''} (${items.length})</div>`);
  if (items.length === 0) {
    html.push('<div class="widget-item empty">Geen widgets</div>');
  } else {
    html.push(items.map(w => `
      <div class="widget-item ${w.id === library.activeWidgetId ? 'active' : ''}" data-wid="${w.id}">${w.name}</div>
    `).join(''));
  }
  wContainer.innerHTML = html.join('');
  wContainer.querySelectorAll('.widget-item[data-wid]').forEach(it => {
    it.addEventListener('click', () => loadWidget(it.dataset.wid));
  });
}

function loadWidget(id) {
  const entry = library.saved.find(x => x.id === id);
  if (!entry) return;
  library.activeWidgetId = id;
  // De library VOEGT widgets TOE — het wijzigt niet het type van de
  // geselecteerde widget. addWidget seedt het type uit WG_WIDGET_TYPES.
  addWidget({ type: entry.config && entry.config.type });
  renderSidebar();
}

function saveCurrentWidget() {
  const cfg = buildWidgetJson();
  const name = prompt('Naam voor deze widget:', cfg.title || displayTitle(state.widget));
  if (!name) return;
  const cat = prompt('Categorie (stats, combat, spells, inventory, social):', library.activeCategory || 'stats');
  if (!cat) return;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-4);
  library.saved.push({ id, name, category: cat, config: { ...cfg, title: name } });
  library.activeWidgetId = id;
  library.activeCategory = cat;
  renderSidebar();
}

function newWidget() {
  // V8: voeg een nieuwe widget toe aan het dashboard. addWidget seedt het
  // default type, fetcht z'n eigen data en rendert.
  addWidget({ type: WG_DEFAULT_WIDGET_TYPE });
  library.activeWidgetId = null;
  renderSidebar();
}

function bindSidebar() {
  const search = document.getElementById('sidebarSearch');
  if (search) {
    search.addEventListener('input', () => {
      library.search = search.value || '';
      renderSidebar();
    });
  }
  // V11 Phase 3: newWidgetBtn en saveWidgetBtn zijn verwijderd uit de DOM.
  // newWidget() is beschikbaar via de widget-library in de linker sidebar.
  // saveDashboards() is gebonden via bindRightSidebar().

  // V10: bij inklappen (mouseleave / click-outside / Esc) wordt category 'all'
  // de actieve selectie, zodat de zichtbare 'lijntje-naast-knop'-marker bij de
  // 'All'-knop staat wanneer de sidebar dicht is.
  const sidebar = document.getElementById('leftSidebar');
  const resetToAll = () => {
    if (library.activeCategory !== 'all') {
      library.activeCategory = 'all';
      renderSidebar();
    }
  };
  if (sidebar) {
    sidebar.addEventListener('mouseleave', () => {
      if (!sidebar.classList.contains('pinned')) resetToAll();
    });
  }
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('pinned') && !sidebar.contains(e.target)) {
      sidebar.classList.remove('pinned');
      resetToAll();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      sidebar?.classList.remove('pinned');
      document.getElementById('rightSidebar')?.classList.remove('pinned');
      resetToAll();
    }
  });
}

function bindRightSidebar() {
  // Tidy
  document.getElementById('rs-tidy')?.addEventListener('click', () => compactGrid());

  // Settings toggle (element id='settingsToggle' is already bound via _settingsToggle constant above;
  // no need to re-bind here — the existing listener on _settingsToggle covers it)

  // Save
  document.getElementById('rs-save')?.addEventListener('click', () => saveDashboards());

  // Character toggle: click toggles .pinned on right sidebar (opens panel)
  const rightSidebar = document.getElementById('rightSidebar');
  const charToggleBtn = document.getElementById('rs-char-toggle');
  if (rightSidebar && charToggleBtn) {
    charToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rightSidebar.classList.toggle('pinned');
    });
    // Click outside closes the panel
    document.addEventListener('click', (e2) => {
      if (rightSidebar.classList.contains('pinned') && !rightSidebar.contains(e2.target)) {
        rightSidebar.classList.remove('pinned');
      }
    });
  }

  // Edit-values: toggle edit-values mode
  const editValuesBtn = document.getElementById('rs-edit-values');
  if (editValuesBtn) {
    editValuesBtn.addEventListener('click', () => {
      state.config.editValuesMode = !state.config.editValuesMode;
      document.body.classList.toggle('edit-values-active', state.config.editValuesMode);
      editValuesBtn.classList.toggle('active', state.config.editValuesMode);
      // Bug #rC2HV4: bij inschakelen geen hele widget meer geselecteerd laten;
      // in edit-values mode selecteer je alleen losse infoboxen.
      if (state.config.editValuesMode) state.activeWidgetIdx = -1;
      render();
    });
  }
}

function bindExportWidget() {
  const btn = document.getElementById('exportWidgetBtn');
  const out = document.getElementById('exportWidgetJson');
  const status = document.getElementById('exportWidgetStatus');
  if (!btn || !out) return;
  btn.addEventListener('click', async () => {
    const json = JSON.stringify(buildWidgetJson(), null, 2);
    out.value = json;
    try {
      await navigator.clipboard.writeText(json);
      if (status) {
        status.textContent = '✓ gekopieerd';
        setTimeout(() => { status.textContent = ''; }, 1500);
      }
    } catch (e) {
      if (status) status.textContent = '(klik in textarea → Ctrl+A → Ctrl+C)';
    }
  });
}

// ----- Dev-view + dashboard-info toggles -----
// V10: edit-mode is altijd aan — geen setter/toggle meer.
function setDevView(on) {
  state.config.devView = !!on;
  document.body.classList.toggle('dev-view', !!on);
  const inp = document.getElementById('devViewToggleInput');
  if (inp) inp.checked = !!on;
  render();
}

function setShowDashboardInfo(on) {
  state.config.showDashboardInfo = !!on;
  document.body.classList.toggle('show-dashboard-info', !!on);
  const inp = document.getElementById('showDashboardInfoInput');
  if (inp) inp.checked = !!on;
}

function bindSettingsToggles() {
  const dv = document.getElementById('devViewToggleInput');
  if (dv) {
    dv.checked = !!state.config.devView;
    dv.addEventListener('change', () => setDevView(dv.checked));
  }
  const sd = document.getElementById('showDashboardInfoInput');
  if (sd) {
    sd.checked = !!state.config.showDashboardInfo;
    sd.addEventListener('change', () => setShowDashboardInfo(sd.checked));
  }
}


// ----- Settings dialog references + open/close, alignSidebarTop ----- (orig 4457-4523)
// WGI-M4: `let` (niet `const`) zodat WidgetGrid.mount() de refs kan herinitialiseren
// nadat de body-template is geïnjecteerd. Standalone V8 vult ze al op parse-time.
let _settingsPanel = document.getElementById('settingsPanel');
let _settingsOverlay = document.getElementById('settingsOverlay');
let _settingsToggle = document.getElementById('settingsToggle');
let _settingsClose = document.getElementById('settingsClose');

// WGI-M4: aanroepbaar vanuit WidgetGrid.mount() nadat de template in een mount-root
// is geïnjecteerd — herresolved refs binnen de gegeven scope.
function WidgetGridInitSettingsRefs(root) {
  const scope = root || document;
  _settingsPanel = scope.querySelector('#settingsPanel') || scope.getElementById?.('settingsPanel');
  _settingsOverlay = scope.querySelector('#settingsOverlay');
  _settingsToggle = scope.querySelector('#settingsToggle');
  _settingsClose = scope.querySelector('#settingsClose');
  _settingsToggle?.addEventListener('click', () => {
    if (state.activeWidgetIdx >= 0 && state.widget) openWidgetSettings();
    else openSettings('dashboard');
  });
  _settingsClose?.addEventListener('click', closeSettings);
  _settingsOverlay?.addEventListener('click', closeSettings);
}
if (typeof window !== 'undefined') {
  window.WidgetGridInitSettingsRefs = WidgetGridInitSettingsRefs;
}

function syncSettingsHeader() {
  const h = document.getElementById('settingsTitle');
  if (!h) return;
  h.textContent = settingsScope === 'widget'
    ? `Widget — ${displayTitle(state.widget)}`
    : 'Dashboard';
}

function openSettings(scope = 'dashboard') {
  settingsScope = scope;
  if (scope === 'widget') syncWidgetPanel();   // synct waardes + zichtbaarheid
  else applyPanelVisibility();                  // dashboard: alleen tab-zichtbaarheid
  syncSettingsHeader();
  _settingsPanel.classList.add('open');
  _settingsOverlay.classList.add('open');
  _settingsToggle.setAttribute('aria-expanded', 'true');
  _settingsPanel.setAttribute('aria-hidden', 'false');
}
function closeSettings() {
  _settingsPanel.classList.remove('open');
  _settingsOverlay.classList.remove('open');
  _settingsToggle.setAttribute('aria-expanded', 'false');
  _settingsPanel.setAttribute('aria-hidden', 'true');
}
// V9: de topbar-knop opent widget-settings als een widget geselecteerd is,
// anders dashboard-settings. `updateSettingsToggleScope` (in render) kleurt
// de knop mee.
// WGI-M3/M4: bindings staan in WidgetGridInitSettingsRefs() hierboven —
// standalone V8 roept die aan met `null` scope (zoekt globaal); D&D Within roept
// het aan met de mount-root nadat de template is geïnjecteerd.
if (_settingsToggle) {
  // Standalone V8: refs zijn al op parse-time gevuld; bind nu direct.
  WidgetGridInitSettingsRefs();
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSettings(); });

// V9: Delete/Backspace verwijdert de geselecteerde widget (niet wanneer een
// invoerveld focus heeft).
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' ||
             ae.tagName === 'SELECT' || ae.isContentEditable)) return;
  if (state.activeWidgetIdx < 0 || !state.widget) return;
  // V11: allow removing last widget (tab can be empty)
  e.preventDefault();
  if (confirm(`Widget "${displayTitle(state.widget)}" verwijderen?`)) {
    removeWidget(state.activeWidgetIdx);
  }
});

// V9: lijn de bovenste category-knop uit op de bovenkant van het dashboard.
// V10: dezelfde offset ook op het uitklap-panel zetten, zodat zoekveld +
// widget-lijst horizontaal op één lijn staan met de dashboard-top + categorie-knoppen.
function alignSidebarTop() {
  const cat = document.getElementById('sidebarCategories');
  const sidebar = document.getElementById('leftSidebar');
  const panel = sidebar?.querySelector('.sidebar-panel');
  const wrap = document.querySelector('.canvas-wrap');
  if (!cat || !sidebar || !wrap) return;
  const offset = Math.max(0, wrap.getBoundingClientRect().top - sidebar.getBoundingClientRect().top);
  cat.style.paddingTop = offset + 'px';
  if (panel) panel.style.paddingTop = offset + 'px';
}
