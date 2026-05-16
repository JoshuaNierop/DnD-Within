// D&D Within — Dashboard Data Layer (simplified for intrinsic-grid model)
//
// Storage shape per character (localStorage key: dw_dashboard_<charId>):
//   {
//     tabs:    [ {id, label, icon, hidden, custom?}, ... ],
//     widgets: { tabId: [ {wid, type, size, starred?, config?}, ... ] }
//   }
//
// "size" is one of 'S' | 'M' | 'L' | 'XL' (= 1, 2, 3, 4 column-spans).
// Order in the array = display order. No per-breakpoint variants — the CSS
// auto-fit grid handles responsive packing automatically.
//
// Requires: core.js, sync.js

// ====================================================================
// Tab catalog
// ====================================================================
var DASHBOARD_DEFAULT_TABS = [
    { id: 'overview',  label: 'Overview',  icon: '✣', system: true,  legacy: true  },
    { id: 'stats',     label: 'Stats',     icon: '☆', system: true,  legacy: true  },
    { id: 'social',    label: 'Social',    icon: '♠', system: true,  legacy: false },
    { id: 'exploring', label: 'Exploring', icon: '⚑', system: true,  legacy: false },
    { id: 'combat',    label: 'Combat',    icon: '⚔', system: true,  legacy: true  },
    { id: 'spells',    label: 'Spells',    icon: '✨', system: true,  legacy: true  },
    { id: 'story',     label: 'Story',     icon: '✎', system: true,  legacy: true  },
    { id: 'family',    label: 'Family',    icon: '⚶', system: true,  legacy: false },
    { id: 'inventory', label: 'Inventory', icon: '⛂', system: true,  legacy: true  }
];

// Font-size scaling. Tokens consumed in dashboard.css via html[data-font-size].
function dashboardBodyFontPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small') return 12;
    if (fs === 'large') return 16;
    return 13.5;
}

// Backwards-compat shim — widget-demo.js still references this.
// The new system has no fixed cell size; we return a representative value
// for the demo preview only.
function dashboardCellHeightPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small') return 44;
    if (fs === 'large') return 60;
    return 52;
}

// Map a legacy discrete size back to a [w, h] pair for the W×H model.
function _sizeToWH(size) {
    switch (size) {
        case 'S':  return [2, 2];
        case 'M':  return [4, 3];
        case 'L':  return [6, 4];
        case 'XL': return [12, 5];
    }
    return [4, 3];
}

// ====================================================================
// Storage
// ====================================================================
function dashboardKey(charId) { return 'dw_dashboard_' + charId; }

function loadDashboardConfig(charId) {
    var key = dashboardKey(charId);
    var saved = null;
    try {
        var raw = localStorage.getItem(key);
        if (raw) saved = JSON.parse(raw);
    } catch (e) { saved = null; }

    if (!saved || typeof saved !== 'object') saved = {};
    if (!Array.isArray(saved.tabs))   saved.tabs   = [];
    if (!saved.widgets || typeof saved.widgets !== 'object') saved.widgets = {};

    // Migration A: legacy Gridstack shape {layouts: {tabId: {desktop:[{x,y,w,h}], ...}}}
    // → flat per-tab array with explicit w/h.
    if (saved.layouts && typeof saved.layouts === 'object' && !Object.keys(saved.widgets).length) {
        var migrated = {};
        for (var tabId in saved.layouts) {
            if (!Object.prototype.hasOwnProperty.call(saved.layouts, tabId)) continue;
            var layout = saved.layouts[tabId];
            var source = (layout && Array.isArray(layout.desktop) && layout.desktop.length) ? layout.desktop :
                         (layout && Array.isArray(layout.tablet)) ? layout.tablet :
                         (layout && Array.isArray(layout.mobile)) ? layout.mobile : [];
            var sorted = source.slice().sort(function(a, b) {
                if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
                return (a.x || 0) - (b.x || 0);
            });
            migrated[tabId] = sorted.map(function(w) {
                return {
                    wid: w.wid || generateWidgetId(),
                    type: w.type,
                    w: w.w || 4,
                    h: w.h || 3,
                    starred: !!w.starred,
                    config: w.config || {}
                };
            });
        }
        saved.widgets = migrated;
        delete saved.layouts;
        try { localStorage.setItem(key, JSON.stringify({ tabs: saved.tabs, widgets: saved.widgets })); } catch (e) {}
    }

    // Migration B: intermediate shape {widgets: {tabId: [{size: 'M'}]}}
    // (the S/M/L/XL phase that just happened) → fold size → w/h pair.
    if (saved.widgets && typeof saved.widgets === 'object') {
        var dirty = false;
        for (var tid in saved.widgets) {
            if (!Object.prototype.hasOwnProperty.call(saved.widgets, tid)) continue;
            var arr = saved.widgets[tid];
            if (!Array.isArray(arr)) continue;
            for (var ai = 0; ai < arr.length; ai++) {
                var w2 = arr[ai];
                if (w2 && w2.size && (typeof w2.w !== 'number' || typeof w2.h !== 'number')) {
                    var wh = _sizeToWH(w2.size);
                    w2.w = wh[0];
                    w2.h = wh[1];
                    delete w2.size;
                    dirty = true;
                }
            }
        }
        if (dirty) {
            try { localStorage.setItem(key, JSON.stringify({ tabs: saved.tabs, widgets: saved.widgets })); } catch (e) {}
        }
    }

    // Merge stored tab overrides with defaults
    var stored = {};
    for (var i = 0; i < saved.tabs.length; i++) stored[saved.tabs[i].id] = saved.tabs[i];

    var merged = [];
    var seen = {};
    var orderSource = saved.tabs.length ? saved.tabs : DASHBOARD_DEFAULT_TABS;
    for (var j = 0; j < orderSource.length; j++) {
        var entry = orderSource[j];
        var def = dashboardFindDefaultTab(entry.id);
        if (def) {
            merged.push({
                id: def.id,
                label: entry.label || def.label,
                icon: entry.icon || def.icon,
                system: true,
                legacy: def.legacy,
                hidden: !!entry.hidden
            });
        } else if (entry.custom) {
            merged.push({
                id: entry.id,
                label: entry.label || entry.id,
                icon: entry.icon || '○',
                system: false,
                custom: true,
                hidden: !!entry.hidden
            });
        }
        seen[entry.id] = true;
    }
    for (var k = 0; k < DASHBOARD_DEFAULT_TABS.length; k++) {
        var d = DASHBOARD_DEFAULT_TABS[k];
        if (!seen[d.id]) merged.push({ id: d.id, label: d.label, icon: d.icon, system: true, legacy: d.legacy, hidden: false });
    }

    return { tabs: merged, widgets: saved.widgets };
}

function dashboardFindDefaultTab(id) {
    for (var i = 0; i < DASHBOARD_DEFAULT_TABS.length; i++) {
        if (DASHBOARD_DEFAULT_TABS[i].id === id) return DASHBOARD_DEFAULT_TABS[i];
    }
    return null;
}

function saveDashboardConfig(charId, dashConfig) {
    var key = dashboardKey(charId);
    var slim = {
        tabs: dashConfig.tabs.map(function(t) {
            var o = { id: t.id, label: t.label, icon: t.icon, hidden: !!t.hidden };
            if (t.custom) o.custom = true;
            return o;
        }),
        widgets: dashConfig.widgets || {}
    };
    localStorage.setItem(key, JSON.stringify(slim));
    if (typeof syncUpload === 'function') syncUpload(key);
}

// ====================================================================
// Per-tab widget arrays
// ====================================================================
function loadTabWidgets(charId, tabId) {
    var cfg = loadDashboardConfig(charId);
    var arr = cfg.widgets[tabId];
    if (Array.isArray(arr)) return JSON.parse(JSON.stringify(arr));
    return null;
}

function saveTabWidgets(charId, tabId, widgets) {
    var cfg = loadDashboardConfig(charId);
    cfg.widgets[tabId] = widgets.map(function(w) {
        var def = WIDGET_REGISTRY[w.type] || {};
        var fallback = def.defaultSize || [4, 3];
        return {
            wid: w.wid || generateWidgetId(),
            type: w.type,
            w: parseInt(w.w, 10) || fallback[0],
            h: parseInt(w.h, 10) || fallback[1],
            starred: !!w.starred,
            config: w.config || {}
        };
    });
    saveDashboardConfig(charId, cfg);
}

// Default per-tab widget layouts. Returned as deep clone so callers can mutate.
function dashboardDefaultWidgetsForTab(tabId) {
    var src = DASHBOARD_DEFAULT_WIDGETS[tabId];
    if (!src) return [];
    return JSON.parse(JSON.stringify(src));
}

// Defaults in W×H grid units. Order in array = render order; the dashboard
// outer grid auto-flows dense so smaller widgets fill gaps after larger ones.
var DASHBOARD_DEFAULT_WIDGETS = {
    overview: [
        { type: 'hp-tracker',     w: 4,  h: 3 },
        { type: 'core-stats',     w: 8,  h: 3 },
        { type: 'inspiration',    w: 2,  h: 2 },
        { type: 'passive-scores', w: 4,  h: 2 },
        { type: 'xp-tracker',     w: 6,  h: 2 },
        { type: 'ability-scores', w: 12, h: 3 },
        { type: 'quote',          w: 12, h: 2 }
    ],
    stats: [
        { type: 'ability-scores', w: 12, h: 3 },
        { type: 'saving-throws',  w: 4,  h: 5 },
        { type: 'skills',         w: 4,  h: 8 },
        { type: 'ability-radar',  w: 4,  h: 5 },
        { type: 'passive-scores', w: 6,  h: 2 },
        { type: 'proficiencies',  w: 6,  h: 3 },
        { type: 'class-features', w: 12, h: 4 }
    ],
    combat: [
        { type: 'hp-tracker',     w: 4,  h: 3 },
        { type: 'core-stats',     w: 8,  h: 3 },
        { type: 'death-saves',    w: 4,  h: 2 },
        { type: 'inspiration',    w: 2,  h: 2 },
        { type: 'sneak-attack',   w: 3,  h: 2 },
        { type: 'concentration',  w: 3,  h: 2 },
        { type: 'conditions',     w: 12, h: 4 },
        { type: 'weapons',        w: 6,  h: 5 },
        { type: 'combat-log',     w: 6,  h: 5 }
    ],
    spells: [
        { type: 'concentration',   w: 12, h: 2 },
        { type: 'spell-slots',     w: 6,  h: 5 },
        { type: 'spells-prepared', w: 6,  h: 7 },
        { type: 'metamagic',       w: 6,  h: 4 }
    ],
    story: [
        { type: 'quote', w: 12, h: 2 },
        { type: 'tibf',  w: 8,  h: 6 },
        { type: 'image', w: 4,  h: 6, config: { title: 'Portrait' } },
        { type: 'text',  w: 12, h: 6, config: { title: 'Background', body: '' } }
    ],
    inventory: [
        { type: 'currency',      w: 8, h: 2 },
        { type: 'attuned-items', w: 4, h: 3 },
        { type: 'inventory',     w: 8, h: 7 },
        { type: 'text',          w: 4, h: 7, config: { title: 'Notes', body: '' } }
    ],
    social: [
        { type: 'tibf',          w: 12, h: 6 },
        { type: 'proficiencies', w: 6,  h: 4 },
        { type: 'text',          w: 6,  h: 4, config: { title: 'Allies / Enemies', body: '' } }
    ],
    exploring: [
        { type: 'senses',        w: 8,  h: 3 },
        { type: 'proficiencies', w: 4,  h: 4 },
        { type: 'image',         w: 6,  h: 5, config: { title: 'Region map' } },
        { type: 'text',          w: 6,  h: 5, config: { title: 'Locations', body: '' } }
    ],
    family: [
        { type: 'family-diagram', w: 12, h: 7 }
    ]
};

// ====================================================================
// Widget instance ids
// ====================================================================
function generateWidgetId() {
    return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function ensureWidgetIds(widgets) {
    if (!Array.isArray(widgets)) return widgets;
    for (var i = 0; i < widgets.length; i++) {
        if (!widgets[i].wid) widgets[i].wid = generateWidgetId();
    }
    return widgets;
}

// ====================================================================
// Templates (per user, copied to character on apply)
// ====================================================================
function dashboardTemplatesKey() {
    var u = (typeof currentUser === 'function') ? currentUser() : null;
    return 'dw_dashtemplates_' + (u ? u.id : 'anon');
}

function loadDashboardTemplates() {
    try {
        var raw = localStorage.getItem(dashboardTemplatesKey());
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

function saveDashboardTemplates(arr) {
    var key = dashboardTemplatesKey();
    localStorage.setItem(key, JSON.stringify(arr || []));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function saveTabAsTemplate(charId, tabId, templateName) {
    var widgets = loadTabWidgets(charId, tabId);
    if (!widgets) widgets = dashboardDefaultWidgetsForTab(tabId);
    var templates = loadDashboardTemplates();
    var tpl = {
        id: 't_' + Date.now().toString(36),
        name: templateName || (tabId + ' template'),
        sourceTabId: tabId,
        widgets: JSON.parse(JSON.stringify(widgets)),
        created: Date.now()
    };
    templates.push(tpl);
    saveDashboardTemplates(templates);
    return tpl;
}

function applyTemplateToTab(charId, templateId, targetTabId) {
    var templates = loadDashboardTemplates();
    var tpl = null;
    for (var i = 0; i < templates.length; i++) if (templates[i].id === templateId) { tpl = templates[i]; break; }
    if (!tpl) return false;
    var cloned = (tpl.widgets || []).map(function(w) {
        var def = WIDGET_REGISTRY[w.type] || {};
        var fb = def.defaultSize || [4, 3];
        return {
            wid: generateWidgetId(),
            type: w.type,
            w: parseInt(w.w, 10) || fb[0],
            h: parseInt(w.h, 10) || fb[1],
            starred: !!w.starred,
            config: w.config || {}
        };
    });
    saveTabWidgets(charId, targetTabId, cloned);
    return true;
}
