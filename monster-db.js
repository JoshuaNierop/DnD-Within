// D&D Within — Monster Manual database (all MM 2025 stat blocks, see Metadocs/Monsters/Rules.md)
// The data (monsters-data.js) is only loaded when the DM opens the picker or the
// SRD tab of the combat picker. A creature stores a flat copy of the stat block plus
// `base: {id, name, cr, v}` so it can be re-based or scaled later.
// Requires: core.js (escapeHtml/escapeAttr), ui-world.js (LORE_ABILITY_KEYS)

var MONSTER_DB_VERSION = 2;   // bump when monsters-srd.js is rebuilt (lazy file is outside the ?v= hook)
var _monsterDbPromise = null;

function loadMonsterDb() {
    if (window.DW_MONSTER_DB) return Promise.resolve(window.DW_MONSTER_DB);
    if (_monsterDbPromise) return _monsterDbPromise;
    _monsterDbPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'monsters-data.js?v=' + MONSTER_DB_VERSION;
        s.onload = function () { window.DW_MONSTER_DB ? resolve(window.DW_MONSTER_DB) : reject(new Error('Monster database is empty')); };
        s.onerror = function () { _monsterDbPromise = null; s.remove(); reject(new Error('Could not load the monster database')); };
        document.head.appendChild(s);
    });
    return _monsterDbPromise;
}
function monsterDbList() { return (window.DW_MONSTER_DB && window.DW_MONSTER_DB.monsters) || []; }
function monsterDbGet(id) {
    var list = monsterDbList();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
}
function monsterDbAttribution() {
    return 'Monster Manual (2025) stat blocks. SRD monsters include material from the System Reference Document 5.2 by Wizards of the Coast LLC, licensed under CC-BY-4.0; descriptions of the other monsters are paraphrased.';
}

// Creature fields that come from the stat block. Identity/social fields are never touched.
var MONSTER_DB_FIELDS = ['size', 'mtype', 'alignment', 'cr', 'profBonus', 'initiative', 'ac', 'hp', 'speed', 'abilities',
    'saves', 'skills', 'resistances', 'immunities', 'condImmunities', 'vulnerabilities', 'gear', 'senses', 'languages',
    'traits', 'actions', 'bonusActions', 'reactions', 'legendary', 'spellcasting'];

// ===== Editor: base row (DM-only, Creatures editor page 1) =====
function monsterBaseRowHtml(base) {
    var html = '<div class="monster-base-row" id="lore-entry-base-row">';
    html += '<input type="hidden" id="lore-entry-f-base" value="' + escapeAttr(base ? JSON.stringify(base) : '') + '">';
    html += '<span class="login-label">Base stat block</span>';
    html += '<span class="monster-base-val" id="lore-entry-base-val">' + monsterBaseLabel(base) + '</span>';
    html += '<button type="button" class="btn btn-sm" data-action="open-monster-db-picker">' + (base ? 'Change' : 'Start from Monster Manual') + '</button>';
    html += '<button type="button" class="btn btn-sm btn-ghost" data-action="unlink-monster-base"' + (base ? '' : ' hidden') + '>Unlink</button>';
    html += '</div>';
    return html;
}
function monsterBaseLabel(base) {
    if (!base) return '<span class="text-dim">None — custom creature</span>';
    return escapeHtml(base.name) + (base.cr != null ? ' <span class="text-dim">CR ' + escapeHtml(String(base.cr)) + '</span>' : '');
}
function monsterBaseChipHtml(base) {
    return '<div class="monster-base-chip" title="' + escapeAttr(monsterDbAttribution()) + '">Base: ' + escapeHtml(base.name) +
        (base.cr != null ? ' · CR ' + escapeHtml(String(base.cr)) : '') + ' <span class="text-dim">(' + (base.src === 'MM' ? 'Monster Manual' : 'SRD 5.2') + ')</span></div>';
}
function setEditorBase(base) {
    var hid = document.getElementById('lore-entry-f-base');
    if (hid) hid.value = base ? JSON.stringify(base) : '';
    var val = document.getElementById('lore-entry-base-val');
    if (val) val.innerHTML = monsterBaseLabel(base);
    var row = document.getElementById('lore-entry-base-row');
    if (row) {
        var pick = row.querySelector('[data-action="open-monster-db-picker"]');
        if (pick) pick.textContent = base ? 'Change' : 'Start from Monster Manual';
        var un = row.querySelector('[data-action="unlink-monster-base"]');
        if (un) un.hidden = !base;
    }
}
// Does the open editor already hold stat-block values? (decides whether "overwrite" is offered)
function editorHasStatValues() {
    for (var i = 0; i < MONSTER_DB_FIELDS.length; i++) {
        var k = MONSTER_DB_FIELDS[i];
        if (k === 'abilities') {
            for (var a = 0; a < LORE_ABILITY_KEYS.length; a++) {
                var ae = document.getElementById('lore-entry-f-ab-' + LORE_ABILITY_KEYS[a]);
                if (ae && ae.value !== '') return true;
            }
            continue;
        }
        var el = document.getElementById('lore-entry-f-' + k);
        if (el && el.value.trim() !== '') return true;
    }
    return false;
}
// Fill the editor DOM (never storage: Save stays the only write). Visibility toggles are left alone.
function fillEditorFromMonster(rec, overwrite) {
    var n = 0;
    function put(el, val) {
        if (!el || val == null || val === '') return;
        if (el.value.trim() !== '' && !overwrite) return;
        if (el.value === String(val)) return;
        el.value = String(val);
        n++;
    }
    MONSTER_DB_FIELDS.forEach(function (k) {
        if (k === 'abilities') {
            LORE_ABILITY_KEYS.forEach(function (ak) { put(document.getElementById('lore-entry-f-ab-' + ak), rec.abilities && rec.abilities[ak]); });
            return;
        }
        put(document.getElementById('lore-entry-f-' + k), rec[k]);
    });
    // Identity: only fill what is still empty (a named NPC keeps its own name)
    var first = document.getElementById('lore-entry-f-firstName');
    if (first && !first.value.trim()) { first.value = rec.name; n++; }
    var sp = document.getElementById('lore-entry-f-race');
    if (sp && !sp.value.trim()) { sp.value = rec.name; n++; }
    setEditorBase({ id: rec.id, name: rec.name, cr: rec.cr, src: rec.src || 'SRD', v: MONSTER_DB_VERSION });
    var form = document.querySelector('.lore-entry-modal-active .lore-entry-form');
    if (form && typeof autoGrowAll === 'function') autoGrowAll(form);
    return n;
}

// ===== Picker window =====
var _monsterPicker = { q: '', type: '', size: '', crMin: '', crMax: '', open: '' };
var MONSTER_CR_STEPS = ['0', '1/8', '1/4', '1/2'].concat(Array.from({ length: 30 }, function (_, i) { return String(i + 1); }));
function crToNum(cr) { return cr.indexOf('/') > 0 ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr); }

function monsterPickerFilter() {
    var f = _monsterPicker, q = f.q.trim().toLowerCase();
    var lo = f.crMin === '' ? -1 : crToNum(f.crMin), hi = f.crMax === '' ? 99 : crToNum(f.crMax);
    return monsterDbList().filter(function (m) {
        if (q && m.name.toLowerCase().indexOf(q) < 0 && m.mtype.toLowerCase().indexOf(q) < 0) return false;
        if (f.type && m.typeKey !== f.type) return false;
        if (f.size && m.size.indexOf(f.size) < 0) return false;
        return m.crNum >= lo && m.crNum <= hi;
    });
}
function monsterPickerRowsHtml() {
    var list = monsterPickerFilter();
    if (!list.length) return '<div class="monster-db-empty">No monsters match these filters.</div>';
    return list.map(function (m) {
        var open = _monsterPicker.open === m.id;
        var h = '<div class="monster-db-row' + (open ? ' is-open' : '') + '" data-id="' + escapeAttr(m.id) + '">';
        h += '<button type="button" class="monster-db-head" data-action="monster-db-toggle" data-id="' + escapeAttr(m.id) + '" aria-expanded="' + open + '">';
        h += '<span class="monster-db-name">' + escapeHtml(m.name) + '</span>';
        h += '<span class="monster-db-meta">' + escapeHtml(m.size + ' ' + m.mtype) + '</span>';
        h += '<span class="monster-db-cr">CR ' + escapeHtml(m.cr) + '</span></button>';
        if (open) {
            h += '<div class="monster-db-detail">';
            h += '<div class="monster-db-stats">AC ' + escapeHtml(m.ac) + ' · HP ' + escapeHtml(m.hp) + ' · Speed ' + escapeHtml(m.speed) + '</div>';
            ['resistances', 'immunities', 'condImmunities', 'vulnerabilities', 'senses', 'languages'].forEach(function (k) {
                if (!m[k]) return;
                var lbl = { resistances: 'Resistances', immunities: 'Immunities', condImmunities: 'Condition immunities', vulnerabilities: 'Vulnerabilities', senses: 'Senses', languages: 'Languages' }[k];
                h += '<div class="monster-db-line"><span class="text-dim">' + lbl + '</span> ' + escapeHtml(m[k]) + '</div>';
            });
            h += '<button type="button" class="btn btn-primary btn-sm" data-action="monster-db-use" data-id="' + escapeAttr(m.id) + '">Use ' + escapeHtml(m.name) + '</button>';
            h += '</div>';
        }
        return h + '</div>';
    }).join('');
}
function openMonsterDbPicker(opts) {
    opts = opts || {};
    closeMonsterDbPicker();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay monster-db-overlay';
    overlay.innerHTML = '<div class="modal-card monster-db-card" role="dialog" aria-modal="true" aria-label="Monster Manual">' +
        '<div class="modal-header"><h2>Monster Manual</h2><button type="button" class="modal-close" data-action="monster-db-close" aria-label="Close">&times;</button></div>' +
        '<div class="monster-db-body"><div class="monster-db-loading">Loading monsters…</div></div></div>';
    document.body.appendChild(overlay);
    overlay._opts = opts;
    overlay.addEventListener('click', onMonsterPickerClick);
    overlay.addEventListener('input', onMonsterPickerInput);
    overlay.addEventListener('change', onMonsterPickerInput);
    document.addEventListener('keydown', onMonsterPickerKey, true);
    loadMonsterDb().then(function () { renderMonsterPickerBody(overlay); }, function (err) {
        var body = overlay.querySelector('.monster-db-body');
        if (body) body.innerHTML = '<p class="login-error">' + escapeHtml(err.message) + '. Check your connection and try again.</p>';
    });
}
function renderMonsterPickerBody(overlay) {
    var f = _monsterPicker, opts = overlay._opts || {};
    var types = {}, sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
    monsterDbList().forEach(function (m) { types[m.typeKey] = true; });
    var h = '<div class="monster-db-filters">';
    h += '<input type="search" class="edit-input monster-db-search" data-filter="q" placeholder="Search name or type…" value="' + escapeAttr(f.q) + '" autocomplete="off">';
    h += '<select class="edit-input" data-filter="type" aria-label="Type"><option value="">All types</option>' + Object.keys(types).sort().map(function (t) {
        return '<option value="' + escapeAttr(t) + '"' + (f.type === t ? ' selected' : '') + '>' + escapeHtml(t.charAt(0).toUpperCase() + t.slice(1)) + '</option>';
    }).join('') + '</select>';
    h += '<select class="edit-input" data-filter="size" aria-label="Size"><option value="">All sizes</option>' + sizes.map(function (s) {
        return '<option' + (f.size === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select>';
    ['crMin', 'crMax'].forEach(function (k) {
        h += '<select class="edit-input" data-filter="' + k + '" aria-label="' + (k === 'crMin' ? 'Minimum CR' : 'Maximum CR') + '"><option value="">' + (k === 'crMin' ? 'CR from' : 'CR to') + '</option>' +
            MONSTER_CR_STEPS.map(function (c) { return '<option' + (f[k] === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>';
    });
    h += '</div>';
    h += '<div class="monster-db-count text-dim" aria-live="polite"></div>';
    h += '<div class="monster-db-list">' + monsterPickerRowsHtml() + '</div>';
    h += '<div class="monster-db-foot">';
    if (opts.showOverwrite) h += '<label class="monster-db-overwrite"><input type="checkbox" id="monster-db-overwrite"> Overwrite fields that already have a value</label>';
    h += '<p class="monster-db-attrib text-dim">' + escapeHtml(monsterDbAttribution()) + '</p>';
    h += '</div>';
    var body = overlay.querySelector('.monster-db-body');
    body.innerHTML = h;
    updateMonsterPickerCount(overlay);
    var s = body.querySelector('.monster-db-search');
    if (s) s.focus();
}
function updateMonsterPickerCount(overlay) {
    var c = overlay.querySelector('.monster-db-count');
    if (c) c.textContent = monsterPickerFilter().length + ' of ' + monsterDbList().length + ' monsters';
}
function refreshMonsterPickerList(overlay) {
    var list = overlay.querySelector('.monster-db-list');
    if (list) list.innerHTML = monsterPickerRowsHtml();
    updateMonsterPickerCount(overlay);
}
function onMonsterPickerInput(e) {
    var k = e.target.dataset && e.target.dataset.filter;
    if (!k) return;
    _monsterPicker[k] = e.target.value;
    refreshMonsterPickerList(e.currentTarget);
}
function onMonsterPickerClick(e) {
    var overlay = e.currentTarget;
    if (e.target === overlay || e.target.closest('[data-action="monster-db-close"]')) { closeMonsterDbPicker(); return; }
    var tog = e.target.closest('[data-action="monster-db-toggle"]');
    if (tog) {
        _monsterPicker.open = (_monsterPicker.open === tog.dataset.id) ? '' : tog.dataset.id;
        refreshMonsterPickerList(overlay);
        return;
    }
    var use = e.target.closest('[data-action="monster-db-use"]');
    if (use) {
        var rec = monsterDbGet(use.dataset.id);
        var ow = overlay.querySelector('#monster-db-overwrite');
        var opts = overlay._opts || {};
        closeMonsterDbPicker();
        if (rec && typeof opts.onPick === 'function') opts.onPick(rec, { overwrite: !ow || ow.checked });
    }
}
function onMonsterPickerKey(e) {
    if (e.key === 'Escape' && document.querySelector('.monster-db-overlay')) { e.stopPropagation(); closeMonsterDbPicker(); }
}
function closeMonsterDbPicker() {
    var el = document.querySelector('.monster-db-overlay');
    if (el) el.remove();
    document.removeEventListener('keydown', onMonsterPickerKey, true);
}

// Editor buttons live in the body-level lore modal, so they need a document-level delegate.
document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-action="open-monster-db-picker"]')) {
        var hasValues = editorHasStatValues();
        openMonsterDbPicker({
            showOverwrite: hasValues,
            onPick: function (rec, o) {
                var n = fillEditorFromMonster(rec, o.overwrite);
                if (typeof showToast === 'function') showToast(rec.name + ': ' + n + ' field' + (n === 1 ? '' : 's') + ' filled', 'success');
            }
        });
        return;
    }
    if (e.target.closest('[data-action="unlink-monster-base"]')) {
        setEditorBase(null);
        if (typeof showToast === 'function') showToast('Unlinked — the stat block values stay as they are', 'info');
    }
});
