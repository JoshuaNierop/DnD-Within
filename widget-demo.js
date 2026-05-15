// D&D Within — Widget Demo Page
// Toont elke widget in min / default / max configuratie naast elkaar zodat we
// snel kunnen verifiëren dat sizes logisch zijn en niemand loze ruimte heeft.
// Route: #/widget-demo (geregistreerd in app.js).
// Requires: widgets.js, dashboard-data.js, core.js (loadCharConfig/State).

// Per-widget character: voor class-specifieke widgets kiezen we een character
// die de bijbehorende mechanic heeft, anders fallt het terug op widgetEmpty().
var WIDGET_DEMO_CHAR_MAP = {
    'sneak-attack': 'ren',         // rogue
    'metamagic': 'saya',           // sorcerer
    'spell-slots': 'varragoth',    // wizard
    'spells-prepared': 'varragoth',
    'class-resources': 'saya',     // sorcery points
    'family-diagram': 'ren'
};

function widgetDemoDefaultChar() {
    var u = (typeof currentUser === 'function') ? currentUser() : null;
    if (u && typeof getUserCharacters === 'function') {
        var chars = getUserCharacters(u.id);
        if (chars && chars.length) return chars[0];
    }
    return 'varragoth';
}

function renderWidgetDemo() {
    var bp = 'desktop';
    var cellH = (typeof dashboardCellHeightPx === 'function') ? dashboardCellHeightPx() : 34;
    var fontPx = (typeof dashboardBodyFontPx === 'function') ? dashboardBodyFontPx() : 13.5;

    // Wrapper krijgt .dashboard.bp-desktop zodat CSS-vars van die class erven.
    var html = '<div class="widget-demo-page dashboard bp-' + bp + '" data-bp="' + bp + '">';
    html += '<header class="widget-demo-header">';
    html += '<div>';
    html += '<h1>Widget Configuraties</h1>';
    html += '<p class="widget-demo-sub">Cell ~' + cellH + 'px · body-font ' + fontPx + 'px · intrinsic auto-fit grid (S/M/L/XL spans)</p>';
    html += '</div>';
    html += '<div class="widget-demo-actions">';
    var fsCurrent = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    var fsList = ['small', 'medium', 'large'];
    var fsLabels = { small: 'A⁻ Small', medium: 'A Medium', large: 'A⁺ Large' };
    html += '<div class="widget-demo-fs">';
    for (var fi = 0; fi < fsList.length; fi++) {
        var fk = fsList[fi];
        html += '<button class="dash-bp-btn' + (fk === fsCurrent ? ' active' : '') + '" data-action="dashboard-set-fs" data-fs="' + fk + '">' + fsLabels[fk] + '</button>';
    }
    html += '</div>';
    html += '<a class="btn btn-ghost" href="#/home">← Terug naar home</a>';
    html += '</div>';
    html += '</header>';

    var grouped = widgetTypesByCategory();
    var catOrder = ['core', 'combat', 'spells', 'social', 'exploring', 'story', 'family', 'custom'];
    var defaultChar = widgetDemoDefaultChar();

    for (var ci = 0; ci < catOrder.length; ci++) {
        var cat = catOrder[ci];
        var items = grouped[cat] || [];
        if (!items.length) continue;
        var catDef = null;
        for (var k = 0; k < WIDGET_CATEGORIES.length; k++) {
            if (WIDGET_CATEGORIES[k].id === cat) { catDef = WIDGET_CATEGORIES[k]; break; }
        }
        html += '<section class="widget-demo-cat">';
        html += '<h2>' + (catDef ? (catDef.icon + ' ' + catDef.label) : cat) + '</h2>';
        html += '<div class="widget-demo-list">';
        for (var wi = 0; wi < items.length; wi++) {
            var typeId = items[wi].type;
            var def = items[wi].def;
            var charForWidget = WIDGET_DEMO_CHAR_MAP[typeId] || defaultChar;
            html += renderWidgetDemoCard(typeId, def, charForWidget);
        }
        html += '</div></section>';
    }

    html += '</div>';
    return html;
}

// Render één widget met 3 instances (min, default, max) als preview.
function renderWidgetDemoCard(typeId, def, charId) {
    var config = (typeof loadCharConfig === 'function') ? loadCharConfig(charId) : null;
    var state = (typeof loadCharState === 'function') ? loadCharState(charId) : null;
    if (!config || !state) {
        return '<article class="widget-demo-card widget-demo-card-empty"><h3>' + escapeHtml(def.label) + '</h3><p class="widget-demo-error">Geen character data (' + charId + ').</p></article>';
    }

    // Demo-cel afmetingen: 76px breed × cellH px hoog. Bewust niet vol-breedte
    // — we willen drie instances naast elkaar passen op normale schermen.
    var cellW = 64;
    var cellH = (typeof dashboardCellHeightPx === 'function') ? dashboardCellHeightPx() : 34;
    var gap = 4;

    var sizes = [
        { label: 'min', wh: def.minSize },
        { label: 'default', wh: def.defaultSize },
        { label: 'max', wh: def.maxSize }
    ];

    var html = '<article class="widget-demo-card">';
    html += '<header class="widget-demo-card-head">';
    html += '<h3><span class="widget-icon">' + (def.icon || '◇') + '</span> ' + escapeHtml(def.label) + '</h3>';
    html += '<p class="widget-demo-desc">' + escapeHtml(def.description || '') + '</p>';
    html += '<p class="widget-demo-meta">';
    html += '<span>min ' + def.minSize.join('×') + '</span>';
    html += '<span>default ' + def.defaultSize.join('×') + '</span>';
    html += '<span>max ' + def.maxSize.join('×') + '</span>';
    html += '<span class="widget-demo-meta-char">data: ' + charId + '</span>';
    html += '</p>';
    html += '</header>';

    html += '<div class="widget-demo-grid">';
    for (var i = 0; i < sizes.length; i++) {
        var s = sizes[i];
        var w = s.wh[0];
        var h = s.wh[1];
        var pxW = w * cellW + (w - 1) * gap;
        var pxH = h * cellH + (h - 1) * gap;
        var inst = { wid: 'demo_' + typeId + '_' + s.label, type: typeId, x: 0, y: 0, w: w, h: h, config: {} };
        // Default text-content voor text-widget zodat de preview niet leeg is.
        if (typeId === 'text') {
            inst.config = {
                title: 'Sample title',
                body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac massa nec mi sodales lacinia. Nulla facilisi.'
            };
        }
        var ctx = { charId: charId, config: config, state: state, editable: false, instance: inst, breakpoint: 'desktop' };
        var content = '';
        try { content = buildWidgetContent(def, inst, ctx, false); }
        catch (e) { content = '<div class="widget-body widget-error">render failed: ' + escapeHtml(String(e && e.message || e)) + '</div>'; }

        html += '<div class="widget-demo-instance">';
        html += '<div class="widget-demo-instance-label">' + s.label + ' · ' + w + '×' + h + ' (' + pxW + '×' + pxH + 'px)</div>';
        html += '<div class="widget widget-' + typeId + ' widget-demo-frame" style="width:' + pxW + 'px;height:' + pxH + 'px;">';
        html += content;
        html += '</div>';
        html += '</div>';
    }
    html += '</div></article>';
    return html;
}
