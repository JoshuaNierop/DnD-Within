// D&D Within — printable character sheet ("Print / Save as PDF").
// Builds a plain, ink-friendly sheet from the engine values and opens it in an
// overlay; @media print in style.css hides everything else while printing.
// Requires: core.js (loadCharConfig/loadCharState, escapeHtml), engine.js, data.js.

var PRINT_SKILLS = [
    ['Acrobatics', 'dex'], ['Animal Handling', 'wis'], ['Arcana', 'int'], ['Athletics', 'str'],
    ['Deception', 'cha'], ['History', 'int'], ['Insight', 'wis'], ['Intimidation', 'cha'],
    ['Investigation', 'int'], ['Medicine', 'wis'], ['Nature', 'int'], ['Perception', 'wis'],
    ['Performance', 'cha'], ['Persuasion', 'cha'], ['Religion', 'int'], ['Sleight of Hand', 'dex'],
    ['Stealth', 'dex'], ['Survival', 'wis']
];
var PRINT_ABILITIES = [['str', 'Strength'], ['dex', 'Dexterity'], ['con', 'Constitution'], ['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']];

function printSheetData(charId) {
    var cached = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[charId]) || null;
    var cfg = (cached && cached.config) || (typeof loadCharConfig === 'function' ? loadCharConfig(charId) : null) || {};
    var st = (cached && cached.state) || (typeof loadCharState === 'function' ? loadCharState(charId) : null) || {};
    return { cfg: cfg, st: st };
}

function printSafe(fn, fallback) { try { var v = fn(); return v == null ? fallback : v; } catch (e) { return fallback; } }

function buildPrintSheetHtml(charId) {
    var d = printSheetData(charId), cfg = d.cfg, st = d.st;
    var esc = escapeHtml, fm = formatMod;
    var lvl = st.level || 1, pb = getProfBonus(lvl);
    var sub = cfg.subclass && DATA[cfg.className] && DATA[cfg.className].subclasses && DATA[cfg.className].subclasses[cfg.subclass];
    var subName = sub ? (sub.name || cfg.subclass) : (cfg.subclass || '');
    var line = [classLabel(cfg.className) + ' ' + lvl + (subName ? ' (' + subName + ')' : ''), speciesLabel(cfg), cfg.background, cfg.alignment].filter(Boolean).join(' · ');

    var h = '<article class="ps-sheet">';
    h += '<header class="ps-head"><div><h1>' + esc(cfg.name || charId) + '</h1><p>' + esc(line) + '</p></div>';
    h += '<div class="ps-head-meta">' + (cfg.player ? 'Player: ' + esc(String(cfg.player)) + '<br>' : '') + 'Printed ' + new Date().toLocaleDateString('en-GB') + '</div></header>';

    // Combat strip
    var maxHp = printSafe(function () { return getMaxHP(cfg, st); }, '—');
    var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : (typeof st.currentHP === 'number' ? st.currentHP : maxHp);
    var init = printSafe(function () { return getInitiative(cfg, st).bonus; }, 0);
    var stats = [
        ['Armor Class', printSafe(function () { return getAC(cfg, st); }, '—')],
        ['Hit Points', curHp + ' / ' + maxHp],
        ['Initiative', fm(init)],
        ['Speed', printSafe(function () { return getSpeed(cfg, st); }, 30) + ' ft'],
        ['Proficiency', fm(pb)],
        ['Hit Dice', (lvl - (st.hitDiceUsed || 0)) + ' / ' + lvl + ' d' + ((DATA[cfg.className] && DATA[cfg.className].hitDie) || '?')],
        ['Passive Perception', 10 + printSafe(function () { return getSkillBonus(cfg, st, 'Perception', 'wis').total; }, 0)],
    ];
    h += '<section class="ps-stats">' + stats.map(function (s) { return '<div class="ps-stat"><span>' + esc(s[0]) + '</span><b>' + esc(String(s[1])) + '</b></div>'; }).join('') + '</section>';

    // Abilities + saves | skills
    h += '<div class="ps-cols">';
    h += '<section class="ps-box"><h2>Abilities &amp; saving throws</h2><table class="ps-table"><tr><th></th><th>Score</th><th>Mod</th><th>Save</th></tr>';
    PRINT_ABILITIES.forEach(function (a) {
        var score = printSafe(function () { return getAbilityScore(cfg, st, a[0]); }, 10);
        var save = printSafe(function () { return getSaveBonus(cfg, st, a[0]); }, { total: getMod(score), prof: false });
        h += '<tr><td>' + a[1] + '</td><td>' + score + '</td><td>' + fm(getMod(score)) + '</td><td>' + (save.prof ? '● ' : '○ ') + fm(save.total) + '</td></tr>';
    });
    h += '</table></section>';
    h += '<section class="ps-box"><h2>Skills</h2><table class="ps-table ps-skills">';
    PRINT_SKILLS.forEach(function (s) {
        var b = printSafe(function () { return getSkillBonus(cfg, st, s[0], s[1]); }, { total: 0 });
        h += '<tr><td>' + (b.expert ? '◆' : b.prof ? '●' : '○') + ' ' + s[0] + ' <span class="ps-dim">(' + s[1].toUpperCase() + ')</span></td><td>' + fm(b.total) + '</td></tr>';
    });
    h += '</table><p class="ps-dim ps-legend">● proficient · ◆ expertise</p></section>';
    h += '</div>';

    // Feats + resources
    var feats = printSafe(function () { return featInstances(cfg, st); }, []).map(function (f) { return f.name; }).filter(Boolean);
    var res = printSafe(function () { return getClassResources(cfg, st); }, []).map(function (r) {
        var max = typeof r.max === 'function' ? printSafe(function () { return r.max(cfg, st); }, null) : r.max;
        return max ? r.label + ' (' + max + ', ' + (r.recharge === 'short' ? 'Short Rest' : 'Long Rest') + ')' : null;
    }).filter(Boolean);
    if (feats.length || res.length) {
        h += '<div class="ps-cols">';
        if (feats.length) h += '<section class="ps-box"><h2>Feats</h2><ul>' + feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul></section>';
        if (res.length) h += '<section class="ps-box"><h2>Resources</h2><ul>' + res.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></section>';
        h += '</div>';
    }

    // Spells
    var cantrips = listOf(st.cantrips), prepared = listOf(st.prepared), book = listOf(st.spellbook);
    var slots = printSafe(function () { return getSpellSlots(cfg.className, lvl, cfg.subclass); }, []);
    if (cantrips.length || prepared.length || book.length) {
        var ab = printSafe(function () { return getSpellcastingAbility(cfg.className, cfg.subclass); }, null);
        h += '<section class="ps-box"><h2>Spells</h2>';
        if (ab) {
            var am = getMod(getAbilityScore(cfg, st, ab));
            h += '<p class="ps-dim">' + String(ab).toUpperCase() + ' · Spell save DC ' + (8 + pb + am) + ' · Spell attack ' + fm(pb + am) + '</p>';
        }
        if (slots && slots.length) h += '<p><b>Slots:</b> ' + slots.map(function (n, i) { return n ? 'L' + (i + 1) + ' ' + n : null; }).filter(Boolean).join(' · ') + '</p>';
        if (cantrips.length) h += '<p><b>Cantrips:</b> ' + esc(cantrips.join(', ')) + '</p>';
        if (prepared.length) h += '<p><b>Prepared:</b> ' + esc(prepared.join(', ')) + '</p>';
        if (book.length) h += '<p><b>Spellbook:</b> ' + esc(book.join(', ')) + '</p>';
        h += '</section>';
    }

    // Inventory
    var items = Array.isArray(st.items) ? st.items : [];
    h += '<section class="ps-box"><h2>Equipment</h2>';
    if (items.length) {
        var total = 0;
        h += '<table class="ps-table ps-inv"><tr><th>Item</th><th>Qty</th><th>Weight</th><th></th></tr>';
        items.forEach(function (it) {
            var q = typeof it.qty === 'number' && it.qty > 0 ? it.qty : 1;
            if (typeof it.weight === 'number') total += it.weight * q;
            var flags = [it.equipped ? 'Equipped' : '', it.attuned ? 'Attuned' : ''].filter(Boolean).join(', ');
            h += '<tr><td>' + esc(it.name || '') + (it.notes ? ' <span class="ps-dim">— ' + esc(it.notes) + '</span>' : '') + '</td><td>' + q + '</td><td>' + (typeof it.weight === 'number' ? Math.round(it.weight * q * 10) / 10 + ' lb' : '') + '</td><td>' + flags + '</td></tr>';
        });
        h += '</table><p class="ps-dim">Total ' + Math.round(total * 10) / 10 + ' lb · Carrying capacity ' + printSafe(function () { return getCarryingCapacity(cfg, st); }, '—') + ' lb</p>';
    } else {
        h += '<p class="ps-dim">No items</p>';
    }
    h += '<p><b>Gold:</b> ' + (st.gold || 0) + ' GP</p></section>';

    if (st.notes && typeof st.notes === 'string') h += '<section class="ps-box"><h2>Notes</h2><p class="ps-notes">' + esc(st.notes) + '</p></section>';
    h += '</article>';
    return h;
}

function openPrintSheet(charId) {
    if (!charId) return;
    closePrintSheet();
    var overlay = document.createElement('div');
    overlay.className = 'print-sheet-overlay';
    overlay.innerHTML = '<div class="print-sheet-bar"><span>Character sheet</span><button type="button" class="btn btn-primary btn-sm" data-ps="print">Print / Save as PDF</button><button type="button" class="btn btn-sm" data-ps="close">Close</button></div>' +
        '<div class="print-sheet-scroll">' + buildPrintSheetHtml(charId) + '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add('printing-sheet');
    overlay.querySelector('[data-ps="print"]').addEventListener('click', function () { window.print(); });
    overlay.querySelector('[data-ps="close"]').addEventListener('click', closePrintSheet);
    document.addEventListener('keydown', _printSheetKey, true);
}
function _printSheetKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closePrintSheet(); } }
function closePrintSheet() {
    var o = document.querySelector('.print-sheet-overlay');
    if (o) o.remove();
    document.body.classList.remove('printing-sheet');
    document.removeEventListener('keydown', _printSheetKey, true);
}
