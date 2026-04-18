// D&D Within — World Pages (maps, timeline, lore, notes, tooltips)
// Requires: core.js

// ============================================================
// Section 20: Maps Page
// ============================================================

var activeDimension = 0;
var activeMapId = null;
var mapZoom = 1;
var mapPanX = 0;
var mapPanY = 0;
var addingPin = false;

function getMapsData() {
    var saved = localStorage.getItem('dw_maps');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {
        dimensions: [
            {
                id: 'valoria',
                name: 'Valoria',
                maps: [
                    { id: 'world', name: t('maps.worldmap'), image: null, isRoot: true, pins: [] }
                ]
            }
        ]
    };
}

function saveMapsData(data) {
    localStorage.setItem('dw_maps', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_maps');
}

function renderMaps() {
    var data = getMapsData();
    var dims = data.dimensions || [];
    if (activeDimension >= dims.length) activeDimension = 0;
    var dim = dims[activeDimension] || { maps: [] };

    var html = '<div class="maps-page">';

    // Dimension tabs at top
    html += '<div class="maps-header">';
    html += '<h1>' + t('maps.title') + '</h1>';
    html += '<div class="dimension-tabs">';
    for (var d = 0; d < dims.length; d++) {
        var activeClass = d === activeDimension ? ' active' : '';
        html += '<button class="dimension-tab' + activeClass + '" data-action="select-dimension" data-dim="' + d + '">' + escapeHtml(dims[d].name) + '</button>';
    }
    if (isDM()) {
        html += '<button class="dimension-tab dimension-add" data-action="add-dimension">+</button>';
    }
    html += '</div>';
    html += '</div>';

    if (activeMapId) {
        // MAP VIEWER MODE
        var map = null;
        for (var mi = 0; mi < dim.maps.length; mi++) {
            if (dim.maps[mi].id === activeMapId) { map = dim.maps[mi]; break; }
        }

        if (!map) {
            activeMapId = null;
            return renderMaps();
        }

        // Breadcrumb / back button
        html += '<div class="map-breadcrumb">';
        if (window._mapHistory && window._mapHistory.length > 0) {
            var prevMap = window._mapHistory[window._mapHistory.length - 1];
            var prevName = '';
            var prevDim = data.dimensions[prevMap.dim];
            if (prevDim) {
                for (var bmi = 0; bmi < prevDim.maps.length; bmi++) {
                    if (prevDim.maps[bmi].id === prevMap.mapId) { prevName = prevDim.maps[bmi].name; break; }
                }
            }
            html += '<button class="btn btn-ghost btn-sm" data-action="map-go-back">&larr; ' + escapeHtml(prevName || t('maps.prevmap')) + '</button>';
            html += '<span class="map-breadcrumb-sep">&#8250;</span>';
        } else {
            html += '<button class="btn btn-ghost btn-sm" data-action="map-back">&larr; ' + t('maps.allmaps') + '</button>';
        }
        html += '<span class="map-title">' + escapeHtml(map.name) + '</span>';
        if (isDM()) {
            html += '<button class="btn btn-ghost btn-sm" data-action="add-pin">' + t('maps.addpin') + '</button>';
            html += '<label class="btn btn-ghost btn-sm">' + t('maps.changeimage') + '<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-map" data-map-id="' + map.id + '" style="color:var(--danger);">&#128465; Delete map</button>';
        }
        html += '</div>';

        // Map viewer
        html += '<div class="map-viewer" id="map-viewer">';
        html += '<div class="map-canvas" id="map-canvas" style="transform: scale(' + mapZoom + ') translate(' + mapPanX + 'px, ' + mapPanY + 'px);">';

        if (map.image) {
            html += '<img src="' + map.image + '" alt="' + escapeAttr(map.name) + '" class="map-image" draggable="false">';
        } else {
            html += '<div class="map-placeholder">';
            if (isDM()) {
                html += '<label class="map-upload-prompt">' + t('maps.uploadprompt') + '<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
            } else {
                html += '<p>' + t('maps.noimageyet') + '</p>';
            }
            html += '</div>';
        }

        // Render pins
        var pins = map.pins || [];
        // Build a lookup for map names (across all dimensions)
        var allMapsLookup = {};
        for (var dli = 0; dli < dims.length; dli++) {
            var dlMaps = dims[dli].maps || [];
            for (var dlmi = 0; dlmi < dlMaps.length; dlmi++) {
                allMapsLookup[dlMaps[dlmi].id] = { name: dlMaps[dlmi].name, dimName: dims[dli].name, dimIdx: dli };
            }
        }

        for (var pi = 0; pi < pins.length; pi++) {
            var pin = pins[pi];
            var isLink = pin.targetMap && allMapsLookup[pin.targetMap];
            var pinClass = isLink ? 'map-pin has-link' : 'map-pin';
            html += '<div class="' + pinClass + '" style="left:' + pin.x + '%;top:' + pin.y + '%;" data-pin-idx="' + pi + '"';
            if (isLink) {
                var targetInfo = allMapsLookup[pin.targetMap];
                html += ' data-action="goto-map" data-target="' + pin.targetMap + '" data-target-dim="' + targetInfo.dimIdx + '"';
                html += ' title="Ga naar: ' + escapeAttr(targetInfo.name) + '"';
            }
            html += '>';
            if (isLink) {
                html += '<div class="pin-dot pin-portal">&#9670;</div>';
            } else {
                html += '<div class="pin-dot"></div>';
            }
            if (pin.label) {
                html += '<span class="pin-label">' + escapeHtml(pin.label);
                if (isLink) html += ' <span class="pin-link-icon">&#8594;</span>';
                html += '</span>';
            }
            if (isDM()) {
                html += '<button class="pin-delete" data-action="delete-pin" data-pin-idx="' + pi + '">&times;</button>';
            }
            html += '</div>';
        }

        html += '</div>'; // map-canvas

        // Zoom controls
        html += '<div class="map-zoom-controls">';
        html += '<button class="zoom-btn" data-action="zoom-in">+</button>';
        html += '<button class="zoom-btn" data-action="zoom-reset">&#8634;</button>';
        html += '<button class="zoom-btn" data-action="zoom-out">&minus;</button>';
        html += '</div>';

        html += '</div>'; // map-viewer

        // Pin adding mode indicator
        if (addingPin) {
            html += '<div class="pin-add-overlay">';
            html += '<p>' + t('maps.clicktoplace') + '</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="cancel-add-pin">' + t('generic.cancel') + '</button>';
            html += '</div>';
        }

    } else {
        // MAP GRID MODE — grouped by category
        var maps = dim.maps || [];
        var categories = {};
        var uncategorized = [];
        for (var gi = 0; gi < maps.length; gi++) {
            var gm = maps[gi];
            var cat = gm.category || '';
            if (cat) {
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(gm);
            } else {
                uncategorized.push(gm);
            }
        }
        var catNames = Object.keys(categories).sort();

        function renderMapCard(gm) {
            var cardHtml = '<div class="map-card" data-action="open-map" data-map-id="' + gm.id + '">';
            if (gm.image) {
                cardHtml += '<img class="map-card-img" src="' + gm.image + '" alt="">';
            } else {
                cardHtml += '<div class="map-card-placeholder">&#128506;</div>';
            }
            cardHtml += '<div class="map-card-info">';
            cardHtml += '<span class="map-card-name">' + escapeHtml(gm.name) + '</span>';
            if (gm.isRoot) cardHtml += '<span class="map-card-badge">' + t('maps.mainmap') + '</span>';
            cardHtml += '<span class="map-card-pins">' + (gm.pins ? gm.pins.length : 0) + ' pins</span>';
            cardHtml += '</div>';
            if (isDM()) {
                cardHtml += '<button class="map-card-delete" data-action="delete-map" data-map-id="' + gm.id + '">&times;</button>';
                cardHtml += '<button class="map-card-cat-btn" data-action="set-map-category" data-map-id="' + gm.id + '" title="Category">&#128193;</button>';
            }
            cardHtml += '</div>';
            return cardHtml;
        }

        // Render categorized maps
        for (var ci = 0; ci < catNames.length; ci++) {
            html += '<div class="maps-category">';
            html += '<h3 class="maps-category-title">' + escapeHtml(catNames[ci]) + '</h3>';
            html += '<div class="maps-grid">';
            var catMaps = categories[catNames[ci]];
            for (var mi = 0; mi < catMaps.length; mi++) {
                html += renderMapCard(catMaps[mi]);
            }
            html += '</div></div>';
        }

        // Uncategorized maps
        if (uncategorized.length > 0 || catNames.length === 0) {
            if (catNames.length > 0) {
                html += '<div class="maps-category">';
                html += '<h3 class="maps-category-title">Other</h3>';
            }
            html += '<div class="maps-grid">';
            for (var ui = 0; ui < uncategorized.length; ui++) {
                html += renderMapCard(uncategorized[ui]);
            }
        }

        if (isDM()) {
            html += '<div class="map-card map-card-add" data-action="add-map">';
            html += '<span class="map-card-add-icon">+</span>';
            html += '<span class="map-card-name">' + t('maps.newmap') + '</span>';
            html += '</div>';
        }

        html += '</div>'; // maps-grid
    }

    html += '</div>'; // maps-page
    return html;
}

// ============================================================
// Section 21: Timeline Page
// ============================================================

function getTimelineData() {
    var saved = localStorage.getItem('dw_timeline');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {
        chapters: [
            {
                id: 'ch1',
                name: 'New Beginnings',
                events: [
                    { id: 'ev1', title: 'Sign At The Crossroads', desc: 'De avonturiers ontmoeten elkaar bij een kruispunt. Een verweerd bord wijst in vier richtingen \u2014 maar iets trekt hen allemaal dezelfde kant op.', type: 'quest', session: '1' }
                ]
            }
        ]
    };
}

function saveTimelineData(data) {
    localStorage.setItem('dw_timeline', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_timeline');
}

var EVENT_LAYOUTS = [
    { id: 'text', icon: '\ud83d\udcdd', label: 'Text' },
    { id: 'image-top', icon: '\ud83d\uddbc\ufe0f\u2b07', label: 'Image Top' },
    { id: 'image-left', icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: 'Image Left' },
    { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: 'Image Right' },
    { id: 'full-image', icon: '\ud83c\udf05', label: 'Full Image' },
    { id: 'banner', icon: '\ud83c\udff4', label: 'Banner' }
];

function renderEventForm(evIdx, ev) {
    var isNew = evIdx < 0;
    var prefix = isNew ? '' : 'edit-';
    var html = '';
    html += '<input type="text" class="edit-input" id="' + prefix + 'ev-title" placeholder="' + t('timeline.eventtitle') + '" value="' + escapeAttr(ev.title || '') + '">';
    html += '<textarea class="edit-textarea auto-grow" id="' + prefix + 'ev-desc" placeholder="' + t('timeline.eventdesc') + '" style="min-height:60px;" oninput="if(typeof autoGrowTextarea===\'function\')autoGrowTextarea(this)">' + escapeHtml(ev.desc || '') + '</textarea>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
    html += '<input type="text" class="edit-input" id="' + prefix + 'ev-session" placeholder="' + t('timeline.eventsession') + '" style="width:80px;" value="' + escapeAttr(ev.session || '') + '">';
    html += '<select class="edit-input" id="' + prefix + 'ev-type" style="flex:1;">';
    var types = ['quest', 'danger', 'magic', 'discovery', 'social', 'combat'];
    for (var ti = 0; ti < types.length; ti++) {
        html += '<option value="' + types[ti] + '"' + (ev.type === types[ti] ? ' selected' : '') + '>' + t('timeline.eventtype.' + types[ti]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Layout picker
    html += '<div class="event-layout-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">Layout</label>';
    html += '<div class="event-layout-options">';
    for (var li = 0; li < EVENT_LAYOUTS.length; li++) {
        var lo = EVENT_LAYOUTS[li];
        html += '<button type="button" class="event-layout-option' + ((ev.layout || 'text') === lo.id ? ' active' : '') + '" data-action="pick-event-layout" data-layout="' + lo.id + '" data-event-idx="' + evIdx + '">' + lo.icon + '<br><span>' + lo.label + '</span></button>';
    }
    html += '</div>';
    html += '</div>';

    // Image upload (for image layouts)
    var needsImage = (ev.layout || 'text') !== 'text';
    html += '<div class="event-image-section" style="display:' + (needsImage ? 'block' : 'none') + '">';
    if (ev.image) {
        html += '<div class="event-image-preview"><img src="' + ev.image + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-event-image" data-event-idx="' + evIdx + '">' + t('generic.delete') + '</button></div>';
    } else {
        html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-event-image" data-event-idx="' + evIdx + '" style="display:none"></label>';
    }
    html += '</div>';

    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-event"' + (isNew ? '' : ' data-edit-idx="' + evIdx + '"') + '>' + t('generic.save') + '</button>';
    html += '<button class="edit-cancel" data-action="cancel-event">' + t('generic.cancel') + '</button>';
    html += '</div>';
    return html;
}

function renderTimeline() {
    var data = getTimelineData();
    var chapters = data.chapters || [];

    if (activeChapter >= chapters.length) activeChapter = Math.max(0, chapters.length - 1);

    var html = '<div class="timeline-page">';
    html += '<h1>' + t('timeline.title') + '</h1>';

    html += '<div class="timeline-layout">';

    // Left sidebar: chapter tabs
    html += '<div class="timeline-sidebar">';
    html += '<div class="timeline-chapters">';
    for (var i = 0; i < chapters.length; i++) {
        var ch = chapters[i];
        var activeClass = i === activeChapter ? ' active' : '';
        html += '<button class="chapter-tab' + activeClass + '" data-action="select-chapter" data-chapter="' + i + '">';
        html += '<span class="chapter-num">' + t('timeline.chapter') + ' ' + (i + 1) + '</span>';
        html += '<span class="chapter-name">' + escapeHtml(ch.name) + '</span>';
        if (isDM()) {
            html += '<span class="chapter-edit" data-action="edit-chapter" data-chapter="' + i + '" title="' + t('generic.edit') + '">&#9998;</span>';
        }
        html += '</button>';
    }
    html += '</div>';

    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-chapter" style="margin-top:0.75rem;width:100%;">' + t('timeline.addchapter') + '</button>';
    }
    html += '</div>';

    // Right: events for active chapter
    html += '<div class="timeline-main">';

    if (chapters.length === 0) {
        html += '<div class="timeline-empty">';
        html += '<p class="text-dim">' + t('timeline.nochapters') + '</p>';
        html += '</div>';
    } else {
        var ch = chapters[activeChapter];
        html += '<div class="timeline-chapter-header">';
        html += '<h2>' + t('timeline.chapter') + ' ' + (activeChapter + 1) + ': ' + escapeHtml(ch.name) + '</h2>';
        if (isDM()) {
            html += '<button class="btn btn-primary btn-sm" data-action="add-event">' + t('timeline.addevent') + '</button>';
        }
        html += '</div>';

        // Add event form (hidden by default)
        if (isDM()) {
            html += '<div class="timeline-add-form" id="event-add-form" style="display:none;">';
            html += renderEventForm(-1, { title: '', desc: '', session: '', type: 'quest', layout: 'text', image: null });
            html += '</div>';
        }

        // Events
        var events = ch.events || [];
        if (events.length === 0) {
            html += '<p class="text-dim" style="padding:2rem 0;">' + t('timeline.noevents') + '</p>';
        } else {
            html += '<div class="timeline">';
            for (var j = 0; j < events.length; j++) {
                var ev = events[j];
                var evLayout = ev.layout || 'text';
                html += '<div class="timeline-event timeline-' + (ev.type || 'quest') + ' event-layout-' + evLayout + '" data-event-idx="' + j + '">';
                html += '<div class="timeline-marker"></div>';
                html += '<div class="timeline-content">';

                // Layout-based rendering
                if (evLayout === 'full-image' && ev.image) {
                    html += '<div class="event-full-image" style="background-image:url(' + ev.image + ')">';
                    html += '<div class="event-full-image-overlay">';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                    html += '</div></div>';
                } else if (evLayout === 'image-top' && ev.image) {
                    html += '<div class="event-image-top"><img src="' + ev.image + '" alt=""></div>';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                } else if ((evLayout === 'image-left' || evLayout === 'image-right') && ev.image) {
                    html += '<div class="event-split event-split-' + evLayout + '">';
                    html += '<div class="event-split-img"><img src="' + ev.image + '" alt=""></div>';
                    html += '<div class="event-split-text">';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                    html += '</div></div>';
                } else if (evLayout === 'banner' && ev.image) {
                    html += '<div class="event-banner" style="background-image:url(' + ev.image + ')"></div>';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                } else {
                    // Default text layout
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                }

                if (isDM()) {
                    html += '<div class="event-actions">';
                    html += '<button class="btn btn-ghost btn-sm" data-action="edit-event" data-event="' + j + '">' + t('generic.edit') + '</button>';
                    html += '<button class="btn btn-ghost btn-sm" data-action="delete-event" data-event="' + j + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }
    }

    html += '</div>'; // timeline-main
    html += '</div>'; // timeline-layout
    html += '</div>'; // timeline-page
    return html;
}

// ============================================================
// Section 22: Lore Pages
// ============================================================

function getLoreData() {
    var saved = localStorage.getItem('dw_lore');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return { articles: [] };
}

function saveLoreData(data) {
    localStorage.setItem('dw_lore', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_lore');
}

function renderLore(subpage) {
    if (subpage === 'party') return renderLoreParty();
    if (subpage === 'npcs') return renderNPCTracker();

    // Check if viewing a specific article
    if (subpage && subpage !== 'new') {
        return renderLoreArticle(subpage);
    }

    // New article form (DM only)
    if (subpage === 'new' && isDM()) {
        return renderLoreEditor();
    }

    // Index page
    var data = getLoreData();
    var html = '<div class="lore-page">';
    html += '<div class="lore-header">';
    html += '<h1>' + t('lore.title') + '</h1>';
    if (isDM()) {
        html += '<a class="btn btn-primary" href="#/lore/new">' + t('lore.addarticle') + '</a>';
    }
    html += '</div>';

    // Always show party + NPC links
    html += '<div class="lore-grid">';
    html += '<a class="lore-card" href="#/lore/party">';
    html += '<h3>' + t('lore.theparty') + '</h3>';
    html += '<p>' + t('lore.theparty.desc') + '</p>';
    html += '</a>';
    html += '<a class="lore-card" href="#/dm/npcs">';
    html += '<h3>NPCs</h3>';
    html += '<p>Known characters and contacts</p>';
    html += '</a>';

    // DM-created articles
    for (var i = 0; i < data.articles.length; i++) {
        var art = data.articles[i];
        html += '<a class="lore-card" href="#/lore/' + art.id + '">';
        html += '<h3>' + escapeHtml(art.title) + '</h3>';
        html += '<p>' + escapeHtml((art.content || '').substring(0, 100)) + '...</p>';
        html += '</a>';
    }

    html += '</div>';
    html += '</div>';
    return html;
}

function renderLoreArticle(articleId) {
    var data = getLoreData();
    var article = null;
    for (var i = 0; i < data.articles.length; i++) {
        if (data.articles[i].id === articleId) { article = data.articles[i]; break; }
    }

    if (!article) return '<div class="page-placeholder"><h2>' + t('lore.notfound') + '</h2><a class="btn btn-ghost" href="#/lore">' + t('lore.backtolore') + '</a></div>';

    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + escapeHtml(article.title) + '</h1>';

    // Render content — split by double newlines for paragraphs
    var paragraphs = article.content.split('\n\n');
    for (var p = 0; p < paragraphs.length; p++) {
        var text = paragraphs[p].trim();
        if (!text) continue;
        if (text.indexOf('## ') === 0) {
            html += '<h2>' + escapeHtml(text.substring(3)) + '</h2>';
        } else if (text.indexOf('# ') === 0) {
            html += '<h2>' + escapeHtml(text.substring(2)) + '</h2>';
        } else {
            html += '<p>' + escapeHtml(text) + '</p>';
        }
    }

    if (isDM()) {
        html += '<div style="margin-top:2rem;display:flex;gap:0.5rem;">';
        html += '<a class="btn btn-ghost btn-sm" href="#/lore/edit-' + article.id + '">' + t('generic.edit') + '</a>';
        html += '<button class="btn btn-ghost btn-sm" data-action="delete-lore" data-article-id="' + article.id + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderLoreEditor(editId) {
    var title = '';
    var content = '';
    var isEdit = false;

    if (editId) {
        var data = getLoreData();
        for (var i = 0; i < data.articles.length; i++) {
            if (data.articles[i].id === editId) {
                title = data.articles[i].title;
                content = data.articles[i].content;
                isEdit = true;
                break;
            }
        }
    }

    var html = '<div class="lore-page">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + (isEdit ? t('lore.editarticle') : t('lore.newarticle')) + '</h1>';
    html += '<div class="lore-editor">';
    html += '<input type="text" class="edit-input" id="lore-title" placeholder="' + t('lore.articletitle') + '" value="' + escapeAttr(title) + '">';
    html += '<textarea class="edit-textarea lore-content-editor" id="lore-content" placeholder="' + t('lore.articlecontent') + '">' + escapeHtml(content) + '</textarea>';
    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-lore"' + (isEdit ? ' data-edit-id="' + editId + '"' : '') + '>' + t('generic.save') + '</button>';
    html += '<a class="edit-cancel" href="#/lore">' + t('generic.cancel') + '</a>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function getNPCData() {
    var saved = localStorage.getItem('dw_npcs');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return { npcs: [] };
}
function saveNPCData(data) {
    localStorage.setItem('dw_npcs', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_npcs');
}

function renderNPCTracker() {
    var data = getNPCData();
    var npcs = data.npcs || [];
    var html = '<div class="lore-page">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; Back to Lore</a>';
    html += '<div class="lore-header" style="margin-top:0.5rem;">';
    html += '<h1>NPCs</h1>';
    if (isDM()) {
        html += '<button class="btn btn-primary" data-action="add-npc">+ Add NPC</button>';
    }
    html += '</div>';

    if (npcs.length === 0) {
        html += '<p class="text-dim">No NPCs yet.</p>';
    } else {
        html += '<div class="npc-grid">';
        for (var ni = 0; ni < npcs.length; ni++) {
            var npc = npcs[ni];
            var dispColor = npc.disposition === 'friendly' ? 'var(--success)' : npc.disposition === 'hostile' ? 'var(--danger)' : npc.disposition === 'neutral' ? 'var(--warning)' : 'var(--text-dim)';
            html += '<div class="npc-card" style="border-left-color:' + dispColor + '" data-npc-idx="' + ni + '">';
            html += '<div class="npc-header" data-action="toggle-npc-card">';
            html += '<div class="npc-header-info">';
            html += '<strong>' + escapeHtml(npc.name) + '</strong>';
            if (npc.disposition) html += '<span class="npc-disposition" style="color:' + dispColor + '">' + escapeHtml(npc.disposition) + '</span>';
            if (npc.location) html += '<span class="npc-location-inline">&#128205; ' + escapeHtml(npc.location) + '</span>';
            html += '</div>';
            html += '<span class="npc-expand-icon">&#9660;</span>';
            html += '</div>';
            html += '<div class="npc-details">';
            if (npc.notes) html += '<p class="npc-notes">' + escapeHtml(npc.notes) + '</p>';
            if (isDM()) {
                html += '<div class="npc-actions">';
                html += '<button class="btn btn-ghost btn-sm" data-action="edit-npc" data-npc-idx="' + ni + '">Edit</button>';
                html += '<button class="btn btn-ghost btn-sm" data-action="delete-npc" data-npc-idx="' + ni + '" style="color:var(--danger);">Delete</button>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderLoreParty() {
    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + t('lore.theparty') + '</h1>';
    html += '<p class="section-intro">' + t('lore.theparty.intro') + '</p>';

    var ids = getCharacterIds();
    for (var i = 0; i < ids.length; i++) {
        var cfg = loadCharConfig(ids[i]);
        if (!cfg) continue;
        var state = loadCharState(ids[i]);
        html += '<div class="lore-party-member" style="border-left-color:' + cfg.accentColor + '">';
        html += '<h3 style="color:' + cfg.accentColor + '">' + escapeHtml(cfg.name) + '</h3>';
        html += '<p class="text-dim">' + raceDisplayName(cfg.race) + ' ' + classDisplayName(cfg.className) + ' \u2014 Level ' + state.level + '</p>';
        if (cfg.backstory) html += '<p>' + escapeHtml(cfg.backstory) + '</p>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 23: Notes Page
// ============================================================

var TAG_CATEGORIES = [
    { id: 'players', name: 'Spelers', icon: '\ud83d\udc64', color: '#22d3ee' },
    { id: 'npcs', name: 'NPCs', icon: '\ud83c\udfad', color: '#f472b6' },
    { id: 'places', name: 'Plaatsen', icon: '\ud83d\udccd', color: '#4ade80' },
    { id: 'events', name: 'Events', icon: '\u26a1', color: '#fbbf24' },
    { id: 'lore', name: 'Lore', icon: '\ud83d\udcdc', color: '#a78bfa' },
    { id: 'other', name: 'Overig', icon: '\ud83d\udccc', color: '#8a8a9a' }
];

function getNotesData() {
    var userId = currentUserId();
    var saved = localStorage.getItem('dw_notes_' + userId);
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.notes)) return parsed;
        } catch(e) {}
    }
    return { notes: [], customTags: [] };
}

function saveNotesData(data) {
    var userId = currentUserId();
    var key = 'dw_notes_' + userId;
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function formatNoteDate(ts) {
    if (!ts) return '';
    var now = Date.now();
    var diff = now - ts;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return t('date.justnow');
    if (mins < 60) return mins + ' ' + t('date.minago');
    if (hours < 24) return hours + ' ' + t('date.hoursago');
    if (days === 1) return t('date.yesterday');
    if (days < 7) return days + ' ' + t('date.daysago');
    var d = new Date(ts);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear();
}

function renderNotes() {
    var data = getNotesData();
    var notes = data.notes || [];

    // Filter and search
    var filtered = notes;
    if (notesFilter !== 'all') {
        var nf = notesFilter.toLowerCase();
        filtered = filtered.filter(function(n) {
            if (n.tagCategory === notesFilter) return true;
            if (n.tags && n.tags.some(function(t){ return t.toLowerCase() === nf; })) return true;
            return false;
        });
    }
    if (notesSearch) {
        var q = notesSearch.toLowerCase();
        filtered = filtered.filter(function(n) {
            return (n.title && n.title.toLowerCase().indexOf(q) >= 0) ||
                   (n.content && n.content.toLowerCase().indexOf(q) >= 0) ||
                   (n.tags && n.tags.some(function(t) { return t.toLowerCase().indexOf(q) >= 0; }));
        });
    }

    // Sort: pinned first, then by updated (newest first)
    filtered.sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updated || 0) - (a.updated || 0);
    });

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<h1>' + t('notes.title') + '</h1>';
    html += '<button class="btn btn-primary" data-action="new-note">' + t('notes.new') + '</button>';
    html += '</div>';

    // Search bar
    html += '<div class="notes-search">';
    html += '<input type="text" class="notes-search-input" data-action="search-notes" placeholder="' + t('notes.search') + '" value="' + escapeAttr(notesSearch) + '">';
    html += '</div>';

    // Category filter tabs
    html += '<div class="notes-categories">';
    html += '<button class="notes-cat-btn' + (notesFilter === 'all' ? ' active' : '') + '" data-action="filter-notes" data-cat="all">' + t('notes.all') + '</button>';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var cat = TAG_CATEGORIES[ci];
        var count = notes.filter(function(n) { return n.tagCategory === cat.id; }).length;
        html += '<button class="notes-cat-btn' + (notesFilter === cat.id ? ' active' : '') + '" data-action="filter-notes" data-cat="' + cat.id + '" style="--cat-color:' + cat.color + '">';
        html += cat.icon + ' ' + t('notecat.' + cat.id);
        if (count > 0) html += ' <span class="notes-cat-count">' + count + '</span>';
        html += '</button>';
    }
    html += '</div>';

    // Notes grid
    if (filtered.length === 0) {
        html += '<div class="notes-empty">';
        if (notes.length === 0) {
            html += '<p>' + t('notes.empty') + '</p>';
            html += '<p class="text-dim">' + t('notes.empty.hint') + '</p>';
        } else {
            html += '<p>' + t('notes.nofilter') + '</p>';
        }
        html += '</div>';
    } else {
        html += '<div class="notes-grid">';
        for (var ni = 0; ni < filtered.length; ni++) {
            var note = filtered[ni];
            var cat = null;
            for (var fi = 0; fi < TAG_CATEGORIES.length; fi++) {
                if (TAG_CATEGORIES[fi].id === note.tagCategory) { cat = TAG_CATEGORIES[fi]; break; }
            }
            if (!cat) cat = TAG_CATEGORIES[5];

            html += '<div class="note-card' + (note.pinned ? ' note-card-pinned' : '') + '" data-action="view-note" data-note-id="' + note.id + '" style="--cat-color:' + cat.color + '">';

            // Pin badge
            if (note.pinned) {
                html += '<div class="note-pin-badge" title="' + t('notes.pinned') + '">&#128204;</div>';
            }

            // Gallery preview: show image grid
            if (note.layout === 'gallery' && note.images && note.images.length > 0) {
                html += '<div class="note-card-gallery">';
                var showCount = Math.min(note.images.length, 4);
                for (var gi = 0; gi < showCount; gi++) {
                    html += '<div class="note-card-gallery-img"><img src="' + note.images[gi] + '" alt=""></div>';
                }
                if (note.images.length > 4) {
                    html += '<div class="note-card-gallery-more">+' + (note.images.length - 4) + '</div>';
                }
                html += '</div>';
            } else if (note.image && note.layout !== 'text-only' && note.layout !== 'checklist') {
                html += '<div class="note-card-img"><img src="' + note.image + '" alt=""></div>';
            }

            html += '<div class="note-card-body">';
            html += '<div class="note-card-meta"><span class="note-card-cat">' + cat.icon + ' ' + t('notecat.' + cat.id) + '</span><span class="note-card-date">' + formatNoteDate(note.updated) + '</span></div>';
            html += '<h3 class="note-card-title">' + escapeHtml(note.title || t('generic.unnamed')) + '</h3>';

            // Checklist preview
            if (note.layout === 'checklist' && note.checklist && note.checklist.length > 0) {
                var done = note.checklist.filter(function(c) { return c.done; }).length;
                html += '<div class="note-card-checklist-preview">';
                html += '<div class="note-card-progress"><div class="note-card-progress-bar" style="width:' + (note.checklist.length > 0 ? Math.round(done / note.checklist.length * 100) : 0) + '%"></div></div>';
                html += '<span class="note-card-progress-text">' + done + '/' + note.checklist.length + '</span>';
                var previewItems = note.checklist.slice(0, 3);
                for (var pi = 0; pi < previewItems.length; pi++) {
                    html += '<div class="note-card-check-item' + (previewItems[pi].done ? ' done' : '') + '">' + (previewItems[pi].done ? '&#9745; ' : '&#9744; ') + escapeHtml(previewItems[pi].text) + '</div>';
                }
                if (note.checklist.length > 3) html += '<div class="note-card-check-more">+' + (note.checklist.length - 3) + ' ' + t('notes.more') + '</div>';
                html += '</div>';
            } else {
                html += '<p class="note-card-preview">' + escapeHtml((note.content || '').substring(0, 120)) + (note.content && note.content.length > 120 ? '...' : '') + '</p>';
            }

            if (note.tags && note.tags.length > 0) {
                html += '<div class="note-card-tags">';
                for (var ti = 0; ti < Math.min(note.tags.length, 4); ti++) {
                    var tagText = typeof note.tags[ti] === 'object' ? note.tags[ti].text : note.tags[ti];
                    html += '<span class="note-tag">' + escapeHtml(tagText) + '</span>';
                }
                if (note.tags.length > 4) html += '<span class="note-tag">+' + (note.tags.length - 4) + '</span>';
                html += '</div>';
            }

            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderNoteEditor(noteId) {
    var data = getNotesData();
    var note = null;
    if (noteId) {
        for (var i = 0; i < data.notes.length; i++) {
            if (data.notes[i].id === noteId) { note = data.notes[i]; break; }
        }
    }

    // Initialize tag state for this editor session
    window._noteTags = note ? (note.tags || []).slice() : [];

    var title = note ? note.title : '';
    var content = note ? note.content : '';
    var tags = note ? (note.tags || []).join(', ') : '';
    var category = note ? note.tagCategory : 'other';
    var layout = note ? note.layout : 'text-only';
    var image = note ? note.image : null;
    var images = note ? (note.images || []) : [];
    var checklist = note ? (note.checklist || []) : [];
    var pinned = note ? !!note.pinned : false;

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; ' + t('generic.back') + '</button>';
    html += '<h1>' + (note ? t('notes.editnote') : t('notes.newnote')) + '</h1>';
    if (note) {
        html += '<button class="btn btn-ghost btn-sm note-pin-toggle' + (pinned ? ' active' : '') + '" data-action="toggle-note-pin" data-note-id="' + note.id + '" title="' + (pinned ? t('notes.unpin') : t('notes.pin')) + '">&#128204; ' + (pinned ? t('notes.pinned') : t('notes.pin')) + '</button>';
    }
    html += '</div>';

    html += '<div class="note-editor">';

    // Title
    html += '<input type="text" class="edit-input note-title-input" id="note-title" placeholder="' + t('lore.articletitle') + '" value="' + escapeAttr(title) + '">';

    // Category selector
    html += '<div class="note-category-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.category') + '</label>';
    html += '<div class="note-cat-options">';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var ecat = TAG_CATEGORIES[ci];
        html += '<button class="note-cat-option' + (category === ecat.id ? ' active' : '') + '" data-action="pick-note-cat" data-cat="' + ecat.id + '" style="--cat-color:' + ecat.color + '">' + ecat.icon + ' ' + t('notecat.' + ecat.id) + '</button>';
    }
    html += '</div>';
    html += '</div>';

    // Layout selector
    html += '<div class="note-layout-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.layout') + '</label>';
    html += '<div class="note-layout-options">';
    var layouts = [
        { id: 'text-only', icon: '\ud83d\udcdd', label: t('notelayout.text') },
        { id: 'image-top', icon: '\ud83d\uddbc\ufe0f', label: t('notelayout.image') },
        { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: t('notelayout.right') },
        { id: 'image-left', icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: t('notelayout.left') },
        { id: 'gallery', icon: '\ud83d\uddbc\ufe0f\ud83d\uddbc\ufe0f', label: t('notelayout.gallery') },
        { id: 'checklist', icon: '\u2611\ufe0f', label: t('notelayout.checklist') }
    ];
    for (var li = 0; li < layouts.length; li++) {
        var lo = layouts[li];
        html += '<button class="note-layout-option' + (layout === lo.id ? ' active' : '') + '" data-action="pick-note-layout" data-layout="' + lo.id + '">' + lo.icon + '<br><span>' + lo.label + '</span></button>';
    }
    html += '</div>';
    html += '</div>';

    // Image upload (single image layouts)
    var singleImageLayouts = ['image-top', 'image-right', 'image-left'];
    html += '<div class="note-image-section" style="display:' + (singleImageLayouts.indexOf(layout) >= 0 ? 'block' : 'none') + '">';
    if (image) {
        html += '<div class="note-image-preview"><img src="' + image + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">' + t('generic.delete') + '</button></div>';
    } else {
        html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
    }
    html += '</div>';

    // Gallery upload (multi-image)
    html += '<div class="note-gallery-section" style="display:' + (layout === 'gallery' ? 'block' : 'none') + '">';
    html += '<div class="note-gallery-grid" id="note-gallery-grid">';
    for (var gi = 0; gi < images.length; gi++) {
        html += '<div class="note-gallery-thumb" data-gallery-idx="' + gi + '"><img src="' + images[gi] + '" alt=""><button class="note-gallery-remove" data-action="remove-gallery-image" data-idx="' + gi + '">&times;</button></div>';
    }
    html += '<label class="note-gallery-add"><span>+</span><input type="file" accept="image/*" data-action="upload-gallery-image" style="display:none" multiple></label>';
    html += '</div>';
    html += '</div>';

    // Checklist editor
    html += '<div class="note-checklist-section" style="display:' + (layout === 'checklist' ? 'block' : 'none') + '">';
    html += '<div class="note-checklist" id="note-checklist">';
    for (var cli = 0; cli < checklist.length; cli++) {
        html += '<div class="note-checklist-item" data-check-idx="' + cli + '">';
        html += '<input type="checkbox" class="note-check-box" data-action="toggle-check" data-idx="' + cli + '"' + (checklist[cli].done ? ' checked' : '') + '>';
        html += '<input type="text" class="note-check-text" data-action="edit-check-text" data-idx="' + cli + '" value="' + escapeAttr(checklist[cli].text) + '" placeholder="' + t('notes.checkitem') + '">';
        html += '<button class="note-check-remove" data-action="remove-check-item" data-idx="' + cli + '">&times;</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" data-action="add-check-item">' + t('notes.addcheckitem') + '</button>';
    html += '</div>';

    // Content (hidden for checklist layout)
    html += '<textarea class="edit-textarea note-content-input" id="note-content" placeholder="' + t('notes.notecontent') + '" style="display:' + (layout === 'checklist' ? 'none' : 'block') + '">' + escapeHtml(content) + '</textarea>';

    // Tags with category
    html += '<div class="note-tags-section">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.tags') + '</label>';
    html += '<div class="note-tags-list" id="note-tags-list">';
    var parsedTags = note ? (note.tags || []) : [];
    for (var nti = 0; nti < parsedTags.length; nti++) {
        var tagObj = typeof parsedTags[nti] === 'object' ? parsedTags[nti] : { text: parsedTags[nti], category: 'other' };
        var tagCat = null;
        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
            if (TAG_CATEGORIES[tci].id === tagObj.category) { tagCat = TAG_CATEGORIES[tci]; break; }
        }
        if (!tagCat) tagCat = TAG_CATEGORIES[5];
        html += '<span class="note-tag" style="border-color:' + tagCat.color + '">' + tagCat.icon + ' ' + escapeHtml(typeof tagObj === 'string' ? tagObj : tagObj.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + nti + '">&times;</button></span>';
    }
    html += '</div>';
    html += '<div class="note-tag-add">';
    html += '<select class="edit-input" id="tag-category" style="width:auto;">';
    for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
        html += '<option value="' + TAG_CATEGORIES[tci].id + '">' + TAG_CATEGORIES[tci].icon + ' ' + t('notecat.' + TAG_CATEGORIES[tci].id) + '</option>';
    }
    html += '</select>';
    html += '<input type="text" class="edit-input" id="tag-text" placeholder="Tag name..." style="flex:1;">';
    html += '<button class="btn btn-ghost btn-sm" data-action="add-tag">+</button>';
    html += '</div>';
    html += '</div>';

    // Save/Delete
    html += '<div class="note-editor-actions">';
    html += '<button class="btn btn-primary" data-action="save-note"' + (note ? ' data-note-id="' + note.id + '"' : '') + '>' + t('generic.save') + '</button>';
    if (note) {
        html += '<button class="btn btn-ghost" data-action="delete-note" data-note-id="' + note.id + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
    }
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
}

function renderNoteView(noteId) {
    var data = getNotesData();
    var note = null;
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].id === noteId) { note = data.notes[i]; break; }
    }
    if (!note) return '<div class="page-placeholder"><h2>' + t('notes.notfound') + '</h2></div>';

    var cat = null;
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        if (TAG_CATEGORIES[ci].id === note.tagCategory) { cat = TAG_CATEGORIES[ci]; break; }
    }
    if (!cat) cat = TAG_CATEGORIES[5];

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; ' + t('generic.back') + '</button>';
    html += '<div class="notes-header-right">';
    if (note.pinned) html += '<span class="note-view-pin">&#128204; ' + t('notes.pinned') + '</span>';
    html += '<button class="btn btn-ghost btn-sm" data-action="toggle-note-pin" data-note-id="' + note.id + '">' + (note.pinned ? t('notes.unpin') : '&#128204; ' + t('notes.pin')) + '</button>';
    html += '<button class="btn btn-ghost btn-sm" data-action="edit-note" data-note-id="' + note.id + '">' + t('generic.edit') + '</button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="note-view note-layout-' + (note.layout || 'text-only') + '">';

    // Gallery layout
    if (note.layout === 'gallery' && note.images && note.images.length > 0) {
        html += '<div class="note-view-gallery">';
        for (var gi = 0; gi < note.images.length; gi++) {
            html += '<div class="note-view-gallery-img"><img src="' + note.images[gi] + '" alt=""></div>';
        }
        html += '</div>';
    }

    if (note.image && note.layout === 'image-top') {
        html += '<div class="note-view-img"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-content">';
    if (note.image && note.layout === 'image-left') {
        html += '<div class="note-view-img-side"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-text">';
    html += '<div class="note-view-meta"><span class="note-view-cat" style="color:' + cat.color + '">' + cat.icon + ' ' + t('notecat.' + cat.id) + '</span><span class="note-view-date">' + formatNoteDate(note.updated) + '</span></div>';
    html += '<h1>' + escapeHtml(note.title || t('generic.unnamed')) + '</h1>';

    // Checklist view
    if (note.layout === 'checklist' && note.checklist && note.checklist.length > 0) {
        var done = note.checklist.filter(function(c) { return c.done; }).length;
        html += '<div class="note-view-checklist">';
        html += '<div class="note-view-progress"><div class="note-view-progress-fill" style="width:' + Math.round(done / note.checklist.length * 100) + '%"></div></div>';
        html += '<p class="note-view-progress-label">' + done + ' ' + t('notes.completed') + ' ' + note.checklist.length + '</p>';
        for (var vci = 0; vci < note.checklist.length; vci++) {
            html += '<div class="note-view-check-item' + (note.checklist[vci].done ? ' done' : '') + '" data-action="toggle-view-check" data-note-id="' + note.id + '" data-idx="' + vci + '">';
            html += (note.checklist[vci].done ? '&#9745; ' : '&#9744; ') + escapeHtml(note.checklist[vci].text);
            html += '</div>';
        }
        html += '</div>';
    }

    // Text content with preserved newlines
    if (note.layout !== 'checklist') {
        var paragraphs = (note.content || '').split('\n\n');
        for (var p = 0; p < paragraphs.length; p++) {
            if (paragraphs[p].trim()) {
                var lines = escapeHtml(paragraphs[p].trim()).replace(/\n/g, '<br>');
                html += '<p>' + lines + '</p>';
            }
        }
    }

    if (note.tags && note.tags.length > 0) {
        html += '<div class="note-view-tags">';
        for (var ti = 0; ti < note.tags.length; ti++) {
            var tagItem = note.tags[ti];
            var tagText = typeof tagItem === 'object' ? tagItem.text : tagItem;
            var tagCatId = typeof tagItem === 'object' ? tagItem.category : 'other';
            var tagCatObj = null;
            for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                if (TAG_CATEGORIES[tci].id === tagCatId) { tagCatObj = TAG_CATEGORIES[tci]; break; }
            }
            if (!tagCatObj) tagCatObj = TAG_CATEGORIES[5];
            html += '<span class="note-tag" style="border-left:3px solid ' + tagCatObj.color + ';padding-left:0.4rem;">' + tagCatObj.icon + ' ' + escapeHtml(tagText) + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    if (note.image && note.layout === 'image-right') {
        html += '<div class="note-view-img-side"><img src="' + note.image + '" alt=""></div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
}

// ============================================================
// Section 24: Tooltip System
// ============================================================

var activeTooltip = null;

function showTooltipPopup(html, anchorEl) {
    removeTooltipPopup();
    var popup = document.createElement('div');
    popup.className = 'tooltip-popup';
    popup.innerHTML = html;
    document.body.appendChild(popup);

    var rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    var popupRect = popup.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left + (rect.width / 2) - (popupRect.width / 2);

    if (top + popupRect.height > window.innerHeight) {
        top = rect.top - popupRect.height - 8;
    }
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    activeTooltip = popup;
}

function removeTooltipPopup() {
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
    var lingering = document.querySelectorAll('.tooltip-popup');
    for (var i = 0; i < lingering.length; i++) {
        lingering[i].remove();
    }
}

function showSpellTooltip(spellName, anchorEl) {
    var spellData = lookupSpell(spellName);
    if (!spellData) return;

    var tooltipHtml = '<div>';
    tooltipHtml += '<h4>' + escapeHtml(spellData.name) + '</h4>';
    if (spellData.time) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.time') + ':</strong> ' + escapeHtml(spellData.time) + '</p>';
    if (spellData.range) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.range') + ':</strong> ' + escapeHtml(spellData.range) + '</p>';
    if (spellData.dur) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.duration') + ':</strong> ' + escapeHtml(spellData.dur) + '</p>';
    tooltipHtml += '<p class="spell-desc">' + escapeHtml(spellData.desc) + '</p>';
    tooltipHtml += '</div>';

    removeTooltipPopup();
    var popup = document.createElement('div');
    popup.className = 'tooltip-popup';
    popup.innerHTML = tooltipHtml;
    document.body.appendChild(popup);

    var rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    var popupRect = popup.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left + (rect.width / 2) - (popupRect.width / 2);

    if (top + popupRect.height > window.innerHeight) {
        top = rect.top - popupRect.height - 8;
    }
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    activeTooltip = popup;
}

function showAbilityTooltip(ability, config, state, anchorEl) {
    var breakdown = getAbilityBreakdown(config, state, ability);
    var abLabel = ability.toUpperCase();

    var lines = '<strong>' + abLabel + ' ' + t('tooltip.breakdown') + '</strong><br>';
    lines += t('tooltip.base') + ': ' + breakdown.baseArray + '<br>';
    if (breakdown.racialBonus > 0) {
        lines += t('tooltip.racial') + ': +' + breakdown.racialBonus + '<br>';
    }
    if (breakdown.asiDetails.length > 0) {
        for (var i = 0; i < breakdown.asiDetails.length; i++) {
            lines += breakdown.asiDetails[i] + '<br>';
        }
    }
    lines += '<strong>' + t('tooltip.total') + ': ' + breakdown.total + '</strong>';

    if (state.customAbilities && state.customAbilities[ability] !== undefined && state.customAbilities[ability] !== null) {
        lines += '<br><em>(' + t('tooltip.overridden') + ' ' + state.customAbilities[ability] + ')</em>';
    }

    showTooltipPopup(lines, anchorEl);
}

function showInfoTooltip(value, anchorEl) {
    var langTips = TOOLTIPS[getLang()] || TOOLTIPS['nl'];
    var tip = langTips[value];
    if (!tip) return;
    showTooltipPopup('<strong>' + escapeHtml(value) + '</strong><br>' + escapeHtml(tip), anchorEl);
}

