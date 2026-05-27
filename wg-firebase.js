// ----- Firebase fetch -----
// V9: characters zijn dashboard-breed. Eén cache per ID; alle widgets die
// character-data tonen (abilities, skills, profielfoto) volgen state.characterId.
let WG_CHAR_CACHE  = {};     // { id: raw }
let WG_CHAR_STATUS = {};     // { id: 'loading'|'ready'|'error' }
let WG_CHAR_ERROR  = {};     // { id: message | null }
let WG_CHAR_LIST   = [];     // [{ id, name }] — voor de dropdown

async function fetchCharacterData(id) {
  if (!id) return;
  if (WG_CHAR_STATUS[id] === 'loading' || WG_CHAR_STATUS[id] === 'ready') return;
  WG_CHAR_STATUS[id] = 'loading';
  if (id === state.characterId) updateStatus();
  try {
    const res = await fetch(`${FIREBASE_DB}/dw/characters/${encodeURIComponent(id)}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json) throw new Error('not found');
    WG_CHAR_CACHE[id]  = json;
    WG_CHAR_STATUS[id] = 'ready';
    WG_CHAR_ERROR[id]  = null;
  } catch (err) {
    WG_CHAR_STATUS[id] = 'error';
    WG_CHAR_CACHE[id]  = null;
    WG_CHAR_ERROR[id]  = err.message;
  }
  if (id === state.characterId) {
    rebuildAllInfoboxWidgets();
    updateStatus();
    // V11: seedDefaultWidgets seeds the sidebar LIBRARY (4 widget-types), not the dashboard.
    // Dashboard-default-seed is correct removed; library-seed must stay.
    if (!library.saved.length && WG_CHAR_STATUS[id] === 'ready') {
      seedDefaultWidgets();
    }
    renderSidebar();
  }
  render();
}

function rebuildAllInfoboxWidgets() {
  for (const w of state.widgets) {
    if (widgetKind(w) === 'infobox') rebuildWidget(w);
  }
}

async function fetchCharacterList() {
  try {
    const res = await fetch(`${FIREBASE_DB}/dw/characters.json?shallow=true`);
    const obj = await res.json();
    const ids = Object.keys(obj || {});
    const names = await Promise.all(ids.map(async id => {
      try {
        const r = await fetch(`${FIREBASE_DB}/dw/characters/${encodeURIComponent(id)}/config/name.json`);
        const n = await r.json();
        return typeof n === 'string' && n ? n : null;
      } catch { return null; }
    }));
    WG_CHAR_LIST = ids
      .map((id, i) => ({ id, name: names[i] || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
    renderCharacterSelect();
  } catch (e) {
    console.warn('character-lijst kon niet geladen worden', e);
  }
}

function renderCharacterSelect() {
  const sel = document.getElementById('characterSelect');
  if (!sel) return;
  const list = WG_CHAR_LIST.length ? WG_CHAR_LIST.slice() : [];
  if (!list.some(c => c.id === state.characterId)) {
    list.unshift({ id: state.characterId, name: state.characterId });
  }
  sel.innerHTML = list.map(c =>
    `<option value="${c.id}"${c.id === state.characterId ? ' selected' : ''}>${c.name}</option>`
  ).join('');
}

function selectCharacter(id) {
  if (!id || id === state.characterId) return;
  state.characterId = id;
  // V11: flush all device dashboards on character switch
  state.dashboardsByDevice = { mobile: {}, tablet: {}, desktop: {} };
  clearSelection();
  // fetch character data if not cached (infobox widgets will auto-rebuild when added)
  if (!WG_CHAR_CACHE[id]) fetchCharacterData(id);
  updateStatus();
  renderCharacterSelect();
  recomputeAllWidgets();
  render();
  renderSidebar();
  alignSidebarTop();
  // V11: load dashboards from Firebase after character switch
  loadDashboards(id);
}

// ===== V11 Phase 2: Firebase save/load =====

// Toast helper -- minimale floating notification.
// WGI-M2: when running inside D&D Within (where core.js already defines a global
// showToast with the same (msg, type) signature), defer to that one for visual
// consistency. Standalone V8 uses the local implementation below.
function _wgShowToastImpl(msg, type) {
  type = type || 'info';
  const existing = document.getElementById('_toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = '_toast';
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: '9999',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    color: '#fff',
    background: type === 'error' ? '#c0392b' : '#2d7d4a',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    pointerEvents: 'none',
    opacity: '1',
    transition: 'opacity 0.4s ease',
  });
  document.body.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.remove(); }, 420);
  }, 3000);
}
// `var` (niet `const`) — D&D Within heeft al een globale `showToast` functie in core.js.
// Met `var` redeclareren we vrij; de uitdrukking kiest DnD's versie als die er is.
var showToast = (typeof window !== 'undefined' && typeof window.showToast === 'function')
  ? window.showToast
  : _wgShowToastImpl;

// Serialize one widget to the Firebase save schema.
// Persists: positional primitives + cfg + map.{dimIdx,mapId} + image.src
// Omits: widget.data (rows), widget.layout (computed), widget.map.history
function serializeWidget(widget) {
  const out = {
    globalCol:   widget.globalCol,
    spanUnits:   widget.spanUnits,
    startRowIdx: widget.startRowIdx,
    spanUnitsY:  widget.spanUnitsY,
    title:       widget.title || '',
    type:        widget.type,
    cfg:         widget.cfg ? Object.assign({}, widget.cfg) : {},
  };
  if (widget.map) {
    out.map = {
      dimIdx: widget.map.dimIdx != null ? widget.map.dimIdx : 0,
      mapId:  widget.map.mapId  != null ? widget.map.mapId  : null,
    };
  }
  if (widget.image && widget.image.src) {
    out.image = { src: widget.image.src };
  }
  return out;
}

// Inverse of serializeWidget: rebuild a full runtime widget from saved data.
// Fills in derived fields (data/layout/map/image defaults) then calls rebuildWidget.
function widgetFromSaved(saved) {
  const typeKey = saved.type || WG_DEFAULT_WIDGET_TYPE;
  const t = WG_WIDGET_TYPES[typeKey] || WG_WIDGET_TYPES[WG_DEFAULT_WIDGET_TYPE];
  const widget = {
    globalCol:   saved.globalCol   != null ? saved.globalCol   : 0,
    startRowIdx: saved.startRowIdx != null ? saved.startRowIdx : 0,
    spanUnits:   saved.spanUnits   != null ? saved.spanUnits   : (t.spanUnits  || 3),
    spanUnitsY:  saved.spanUnitsY  != null ? saved.spanUnitsY  : (t.spanUnitsY || 2),
    title:       saved.title       || '',
    type:        typeKey,
    data:        makeWidgetData(t.source || 'abilities'),
    layout:      makeWidgetLayout(),
    cfg:         saved.cfg ? Object.assign({}, saved.cfg) : makeTypeCfg(typeKey),
    map:         null,
    image:       null,
  };
  if (t.kind === 'map') {
    widget.map = makeWidgetMap();
    if (saved.map) {
      widget.map.dimIdx = saved.map.dimIdx != null ? saved.map.dimIdx : 0;
      widget.map.mapId  = saved.map.mapId  != null ? saved.map.mapId  : null;
    }
  }
  if (t.kind === 'image') {
    widget.image = makeWidgetImage();
    if (saved.image && saved.image.src) widget.image.src = saved.image.src;
  }
  // rebuild data/layout from WG_CHAR_CACHE if available
  if (t.kind === 'infobox' && WG_CHAR_CACHE[state.characterId]) {
    rebuildWidget(widget);
  }
  return widget;
}

// Minimum skeleton for an empty situation (never send null -- Firebase would delete the key)
function emptySituationPayload() {
  return { schemaVersion: 1, widgets: [], currentPage: 0, updatedAt: Date.now() };
}

// Serialize all 5 situations for state.device into a PATCH body.
function buildSavePayload() {
  const payload = {};
  for (const sit of WG_SITUATIONS) {
    const slot = state.dashboardsByDevice[state.device][sit];
    if (!slot || !slot.widgets || !slot.widgets.length) {
      payload[sit] = emptySituationPayload();
    } else {
      payload[sit] = {
        schemaVersion: 1,
        widgets: slot.widgets.map(serializeWidget),
        currentPage: slot.currentPage != null ? slot.currentPage : 0,
        updatedAt: Date.now(),
      };
    }
  }
  return payload;
}

// PATCH current device dashboard to Firebase.
// V11 phase 2: deze knop verhuist in Phase 3 naar right sidebar; tijdelijk hijacked voor save-dashboard.
async function saveDashboards() {
  const charId = state.characterId;
  if (!charId) { showToast('Geen character geselecteerd', 'error'); return; }
  const payload = buildSavePayload();
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/dashboards/' + state.device + '.json';
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    // Race check: if character changed during save, warn user
    if (state.characterId !== charId) {
      showToast('Character gewijzigd tijdens save', 'error');
      return;
    }
    showToast('Opgeslagen');
  } catch (err) {
    showToast('Save faalde · ' + err.message, 'error');
  }
}

// GET all dashboards for a character and populate state.dashboardsByDevice.
async function loadDashboards(charId) {
  if (!charId) return;
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/dashboards.json';
  let tree = null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    tree = await res.json();
  } catch (err) {
    console.warn('[loadDashboards] fetch failed:', err);
    showToast('Kon dashboards niet laden', 'error');
    pulseSidebar();
    return;
  }

  // Guard: character may have changed during async fetch
  if (state.characterId !== charId) return;

  // tree is null (no data yet) or { mobile: {...}, tablet: {...}, desktop: {...} }
  const devices = ['mobile', 'tablet', 'desktop'];
  for (const device of devices) {
    const deviceData = tree && tree[device] ? tree[device] : {};
    state.dashboardsByDevice[device] = {};
    for (const sit of WG_SITUATIONS) {
      const saved = deviceData[sit];
      if (!saved) {
        // No data for this situation -- leave as lazy-init (empty on first access)
        continue;
      }
      if (saved.schemaVersion !== 1) {
        console.warn('[loadDashboards] skip migration stub for situation', sit, '(schemaVersion', saved.schemaVersion + ')');
        continue;
      }
      const slot = makeSituationState();
      slot.currentPage = saved.currentPage != null ? saved.currentPage : 0;
      slot.widgets = (saved.widgets || []).map(function(w) { return widgetFromSaved(w); });
      state.dashboardsByDevice[device][sit] = slot;
    }
  }

  // After loading, if any map widgets exist and WG_MAPS_CACHE is empty, fetch maps
  const allSlots = Object.values(state.dashboardsByDevice[state.device]);
  const needsMaps = allSlots.some(function(slot) {
    return slot && slot.widgets && slot.widgets.some(function(w) { return widgetKind(w) === 'map'; });
  });
  if (needsMaps && !WG_MAPS_CACHE) {
    fetchMapsData().then(function() {
      recomputeAllWidgets();
      render();
    });
  }

  // Render current situation
  recomputeAllWidgets();
  render();
  renderSidebar();

  // Pulse sidebar if active tab is empty
  if (!state.widgets.length) pulseSidebar();
}

// ===== end V11 Phase 2 =====

