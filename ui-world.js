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
var editingPins = false;
var _mapResizeObserver = null;

// Pin shape helpers: every pin has an area shape (circle default, polygon when 3+ nodes).
// Coordinates are stored as % of map-canvas (0-100). Legacy pins {x,y,w,h} are migrated
// lazily by normalizePin() on first read.
function normalizePin(pin) {
    if (!pin) return pin;
    if (pin.shape && typeof pin.shape === 'object' && pin.shape.kind) {
        if (!Array.isArray(pin.shape.nodes)) pin.shape.nodes = [];
        return pin;
    }
    var cx = (typeof pin.x === 'number') ? pin.x : 50;
    var cy = (typeof pin.y === 'number') ? pin.y : 50;
    var r;
    if (typeof pin.w === 'number' && typeof pin.h === 'number' && (pin.w > 0 || pin.h > 0)) {
        r = (pin.w + pin.h) / 4;
    } else {
        r = 5;
    }
    pin.shape = { kind: 'circle', cx: cx, cy: cy, r: r, nodes: [] };
    return pin;
}

// Catmull-Rom → Bezier closed-loop path string for organic polygons. Input: array of {x,y}.
function smoothClosedPath(pts) {
    var n = pts.length;
    if (n < 3) return '';
    var d = 'M' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2);
    for (var i = 0; i < n; i++) {
        var p0 = pts[(i - 1 + n) % n];
        var p1 = pts[i];
        var p2 = pts[(i + 1) % n];
        var p3 = pts[(i + 2) % n];
        var c1x = p1.x + (p2.x - p0.x) / 6;
        var c1y = p1.y + (p2.y - p0.y) / 6;
        var c2x = p2.x - (p3.x - p1.x) / 6;
        var c2y = p2.y - (p3.y - p1.y) / 6;
        d += ' C' + c1x.toFixed(2) + ',' + c1y.toFixed(2) +
             ' ' + c2x.toFixed(2) + ',' + c2y.toFixed(2) +
             ' ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2);
    }
    d += ' Z';
    return d;
}

// Build a stable centroid for the polygon nodes (used for label positioning).
function pinCentroid(pin) {
    var s = pin.shape;
    if (!s || s.kind !== 'polygon' || !s.nodes || s.nodes.length < 3) {
        return { x: s ? s.cx : 50, y: s ? s.cy : 50 };
    }
    var sx = 0, sy = 0;
    for (var i = 0; i < s.nodes.length; i++) { sx += s.nodes[i].x; sy += s.nodes[i].y; }
    return { x: sx / s.nodes.length, y: sy / s.nodes.length };
}

// Return the pixel rect of the letterboxed image inside its container.
// object-fit:contain centres the image with bars on the short axis.
function _imageRenderedRect(container) {
    var img = container.querySelector('.map-image');
    if (!img || !img.naturalWidth || !img.naturalHeight) return container.getBoundingClientRect();
    var cRect = container.getBoundingClientRect();
    var cW = cRect.width, cH = cRect.height;
    var iW = img.naturalWidth, iH = img.naturalHeight;
    var scale = Math.min(cW / iW, cH / iH);
    var rW = iW * scale, rH = iH * scale;
    return {
        left:   cRect.left   + (cW - rW) / 2,
        top:    cRect.top    + (cH - rH) / 2,
        width:  rW,
        height: rH
    };
}

// Convert pointer event coords → 0-100 % relative to the letterboxed image area.
function _svgEvToPct(svg, evt) {
    var canvas = document.getElementById('map-canvas');
    var iRect = canvas ? _imageRenderedRect(canvas) : svg.getBoundingClientRect();
    return {
        x: Math.max(0, Math.min(100, ((evt.clientX - iRect.left) / iRect.width) * 100)),
        y: Math.max(0, Math.min(100, ((evt.clientY - iRect.top) / iRect.height) * 100))
    };
}

function _getActiveMapPins() {
    var mData = getMapsData();
    var mDim = mData.dimensions[activeDimension];
    if (!mDim) return null;
    for (var i = 0; i < mDim.maps.length; i++) {
        if (mDim.maps[i].id === activeMapId) {
            if (!Array.isArray(mDim.maps[i].pins)) mDim.maps[i].pins = [];
            return { data: mData, map: mDim.maps[i] };
        }
    }
    return null;
}

// Find the edge (index pair) closest to point p in a closed polygon.
// Returns index AFTER which to insert (i.e. between i and i+1).
function _closestEdgeIdx(nodes, p) {
    var best = 0, bestD = Infinity;
    for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i], b = nodes[(i + 1) % nodes.length];
        var dx = b.x - a.x, dy = b.y - a.y;
        var len2 = dx * dx + dy * dy;
        var t = len2 > 0 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        var px = a.x + t * dx, py = a.y + t * dy;
        var d = (px - p.x) * (px - p.x) + (py - p.y) * (py - p.y);
        if (d < bestD) { bestD = d; best = i; }
    }
    return best;
}

// Position the SVG overlay to exactly cover the letterboxed image area.
// Called after every render + after image load (handles cold-cache first load).
// Also installs a ResizeObserver so the overlay stays glued to the image
// across window resizes / responsive layout shifts (canvas-width changes).
function mapSvgAlignPostRender() {
    var canvas = document.getElementById('map-canvas');
    var svg    = canvas && canvas.querySelector('.map-shapes');
    if (!canvas || !svg) {
        if (_mapResizeObserver) { _mapResizeObserver.disconnect(); _mapResizeObserver = null; }
        return;
    }

    function doAlign() {
        var img = canvas.querySelector('.map-image');
        if (!img || !img.naturalWidth || !img.naturalHeight) return;
        var cW = canvas.offsetWidth, cH = canvas.offsetHeight;
        var iW = img.naturalWidth,   iH = img.naturalHeight;
        var scale = Math.min(cW / iW, cH / iH);
        var rW = iW * scale, rH = iH * scale;
        var left = (cW - rW) / 2, top = (cH - rH) / 2;
        svg.style.left   = left + 'px';
        svg.style.top    = top  + 'px';
        svg.style.width  = rW   + 'px';
        svg.style.height = rH   + 'px';
        svg.style.right  = '';
        svg.style.bottom = '';

        // Pin labels (edit-mode HTML overlay) are stored in image-% but live
        // inside the canvas — reposition them to canvas-% on every align.
        _alignPinLabels(canvas, { left: left, top: top, width: rW, height: rH }, cW, cH);
    }

    var img = canvas.querySelector('.map-image');
    if (img && !img.naturalWidth) {
        img.addEventListener('load', doAlign, { once: true });
    } else {
        doAlign();
    }

    if (_mapResizeObserver) _mapResizeObserver.disconnect();
    if (typeof ResizeObserver !== 'undefined') {
        _mapResizeObserver = new ResizeObserver(doAlign);
        _mapResizeObserver.observe(canvas);
    }
}

// Reposition pin-label divs from their stored image-% to live canvas-%
// so they sit on top of the letterboxed image, not the bare canvas.
// Labels remember their image-% in data-img-x/y after the first conversion.
function _alignPinLabels(canvas, iRectLocal, cW, cH) {
    var labels = canvas.querySelectorAll('.pin-label');
    if (!labels.length) return;
    for (var i = 0; i < labels.length; i++) {
        var lbl = labels[i];
        var ix = lbl.dataset.imgX, iy = lbl.dataset.imgY;
        if (ix == null || iy == null || ix === '') {
            ix = parseFloat(lbl.style.left);  // first run: raw % from render
            iy = parseFloat(lbl.style.top);
            lbl.dataset.imgX = ix;
            lbl.dataset.imgY = iy;
        } else {
            ix = parseFloat(ix); iy = parseFloat(iy);
        }
        var cLeft = ((iRectLocal.left + (ix / 100) * iRectLocal.width) / cW) * 100;
        var cTop  = ((iRectLocal.top  + (iy / 100) * iRectLocal.height) / cH) * 100;
        lbl.style.left = cLeft + '%';
        lbl.style.top  = cTop  + '%';
    }
}

function mapEditPostRender() {
    if (!editingPins) return;
    var svg = document.querySelector('.map-shapes');
    if (!svg) return;
    // Pin-label repositioning is handled by mapSvgAlignPostRender → _alignPinLabels
    // (idempotent + survives resize). Keep this function focused on edit handlers.

    // Drag a single node
    svg.querySelectorAll('.shape-node').forEach(function(el) {
        el.addEventListener('pointerdown', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var pinIdx = parseInt(el.dataset.pinIdx, 10);
            var nodeIdx = parseInt(el.dataset.nodeIdx, 10);
            var info = _getActiveMapPins();
            if (!info) return;
            var pin = normalizePin(info.map.pins[pinIdx]);
            var startX = ev.clientX, startY = ev.clientY;
            var startedDrag = false;
            el.setPointerCapture(ev.pointerId);

            function onMove(mv) {
                if (!startedDrag) {
                    var dx = mv.clientX - startX, dy = mv.clientY - startY;
                    if (dx * dx + dy * dy < 16) return; // <4px = still a tap
                    startedDrag = true;
                }
                var p = _svgEvToPct(svg, mv);
                pin.shape.nodes[nodeIdx].x = p.x;
                pin.shape.nodes[nodeIdx].y = p.y;
                el.setAttribute('cx', p.x);
                el.setAttribute('cy', p.y);
                var g = el.parentNode;
                var shapeEl = g.querySelector('.map-shape');
                if (shapeEl && pin.shape.nodes.length >= 3) {
                    shapeEl.setAttribute('d', smoothClosedPath(pin.shape.nodes));
                }
            }
            function onUp() {
                el.releasePointerCapture(ev.pointerId);
                el.removeEventListener('pointermove', onMove);
                el.removeEventListener('pointerup', onUp);
                el.removeEventListener('pointercancel', onUp);
                if (startedDrag) {
                    saveMapsData(info.data);
                    renderApp();
                } else {
                    if (confirm('Node verwijderen?')) {
                        pin.shape.nodes.splice(nodeIdx, 1);
                        if (pin.shape.nodes.length < 3) pin.shape.kind = 'circle';
                        saveMapsData(info.data);
                        renderApp();
                    }
                }
            }
            el.addEventListener('pointermove', onMove);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointercancel', onUp);
        });
    });

    // Drag the circle center (whole-shape move) when no nodes yet
    svg.querySelectorAll('.shape-center').forEach(function(el) {
        el.addEventListener('pointerdown', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var pinIdx = parseInt(el.dataset.pinIdx, 10);
            var info = _getActiveMapPins();
            if (!info) return;
            var pin = normalizePin(info.map.pins[pinIdx]);
            el.setPointerCapture(ev.pointerId);
            var startX = ev.clientX, startY = ev.clientY;
            var startedDrag = false;
            function onMove(mv) {
                if (!startedDrag) {
                    var dx = mv.clientX - startX, dy = mv.clientY - startY;
                    if (dx * dx + dy * dy < 16) return;
                    startedDrag = true;
                }
                var p = _svgEvToPct(svg, mv);
                pin.shape.cx = p.x;
                pin.shape.cy = p.y;
                el.setAttribute('cx', p.x);
                el.setAttribute('cy', p.y);
                var g = el.parentNode;
                var shapeEl = g.querySelector('.map-shape');
                if (shapeEl && shapeEl.tagName === 'circle') {
                    shapeEl.setAttribute('cx', p.x);
                    shapeEl.setAttribute('cy', p.y);
                }
            }
            function onUp() {
                el.releasePointerCapture(ev.pointerId);
                el.removeEventListener('pointermove', onMove);
                el.removeEventListener('pointerup', onUp);
                el.removeEventListener('pointercancel', onUp);
                if (startedDrag) {
                    saveMapsData(info.data);
                    renderApp();
                }
            }
            el.addEventListener('pointermove', onMove);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointercancel', onUp);
        });
    });

    // Click on shape → add a node (max 10)
    svg.querySelectorAll('.map-shape').forEach(function(el) {
        el.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var pinIdx = parseInt(el.dataset.pinIdx, 10);
            var info = _getActiveMapPins();
            if (!info) return;
            var pin = normalizePin(info.map.pins[pinIdx]);
            if (pin.shape.nodes.length >= 10) {
                alert('Maximum 10 nodes per pin.');
                return;
            }
            var p = _svgEvToPct(svg, ev);
            if (pin.shape.nodes.length < 3) {
                pin.shape.nodes.push({ x: p.x, y: p.y });
                if (pin.shape.nodes.length >= 3) pin.shape.kind = 'polygon';
            } else {
                var insertAfter = _closestEdgeIdx(pin.shape.nodes, p);
                pin.shape.nodes.splice(insertAfter + 1, 0, { x: p.x, y: p.y });
            }
            saveMapsData(info.data);
            renderApp();
        });
    });
}

function getMapsData() {
    var saved = localStorage.getItem('dw_maps');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            // Migration 1: 'Valoria' was de dimensie-naam, hoort wereld-naam te zijn. Dim → Material Plane.
            // Migration 2: De root-map heet nu Valoria (was 'World Map' / 'Wereldkaart').
            if (parsed && Array.isArray(parsed.dimensions)) {
                for (var i = 0; i < parsed.dimensions.length; i++) {
                    var pdim = parsed.dimensions[i];
                    if (!pdim) continue;
                    if (pdim.name === 'Valoria') {
                        pdim.name = 'Material Plane';
                        if (pdim.id === 'valoria') pdim.id = 'material-plane';
                    }
                    if (Array.isArray(pdim.maps)) {
                        for (var j = 0; j < pdim.maps.length; j++) {
                            var pm = pdim.maps[j];
                            if (pm && pm.isRoot && (pm.name === 'World Map' || pm.name === 'Wereldkaart')) {
                                pm.name = 'Valoria';
                            }
                        }
                    }
                }
            }
            return parsed;
        } catch(e) {}
    }
    return {
        dimensions: [
            {
                id: 'material-plane',
                name: 'Material Plane',
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

// ============================================================
// Maps: Dimensions manager + Add-map windows (vervangen prompt/confirm)
// ============================================================
function closeMapsModal() {
    var el = document.querySelector('.maps-modal-active');
    if (el) el.remove();
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}
function _openMapsModal(innerHtml) {
    closeMapsModal();
    var div = document.createElement('div');
    div.className = 'maps-modal-active';
    div.innerHTML = innerHtml;
    document.body.appendChild(div);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
    var first = div.querySelector('input,select,textarea');
    if (first) first.focus();
}

// ----- Dimensions manager (add + remove in één window) -----
function renderDimensionsModal() {
    var data = getMapsData();
    var dims = data.dimensions || [];
    var html = '<div class="modal-overlay maps-modal-overlay">';
    html += '<div class="modal-card modal-sm">';
    html += '<div class="modal-header">';
    html += '<h2>' + escapeHtml(t('maps.dimensions')) + '</h2>';
    html += '<button class="modal-close" data-action="close-maps-modal">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<ul class="dim-manage-list">';
    for (var i = 0; i < dims.length; i++) {
        html += '<li class="dim-manage-item">';
        html += '<span class="dim-manage-name">' + escapeHtml(dims[i].name) + '</span>';
        if (dims.length > 1) {
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-dimension" data-dim="' + i + '" style="color:var(--danger);" title="' + escapeAttr(t('generic.delete')) + '">&times;</button>';
        }
        html += '</li>';
    }
    html += '</ul>';
    html += '<div class="dim-manage-add">';
    html += '<input type="text" class="edit-input" id="dim-new-name" placeholder="' + escapeAttr(t('maps.dimension.namenew')) + '">';
    html += '<button class="btn btn-primary btn-sm" data-action="submit-add-dimension">+ ' + escapeHtml(t('maps.dimension.add')) + '</button>';
    html += '</div>';
    html += '</div></div></div>';
    return html;
}
function openDimensionsModal() { _openMapsModal(renderDimensionsModal()); }
function refreshDimensionsModal() {
    var el = document.querySelector('.maps-modal-active');
    if (el) el.innerHTML = renderDimensionsModal();
}

// ----- Add-map window (naam + plaatsing + afbeelding uit Places of upload) -----
function renderAddMapModal() {
    var data = getMapsData();
    var dim = (data.dimensions || [])[activeDimension] || { maps: [] };
    var mainMaps = (dim.maps || []).filter(function (m) { return !m.parentMapId; });
    var places = (typeof getLoreCatEntries === 'function' ? getLoreCatEntries('places') : [])
        .filter(function (p) { return p && p.image; });

    var html = '<div class="modal-overlay maps-modal-overlay">';
    html += '<div class="modal-card modal-sm">';
    html += '<div class="modal-header">';
    html += '<h2>' + escapeHtml(t('maps.addmap.title')) + '</h2>';
    html += '<button class="modal-close" data-action="close-maps-modal">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body npc-form add-map-form">';

    html += '<div class="npc-form-field"><label class="login-label" for="map-f-name">' + escapeHtml(t('maps.map.name')) + '</label>';
    html += '<input type="text" class="edit-input" id="map-f-name"></div>';

    // Placement: main of subkaart van bestaande main
    html += '<div class="npc-form-field"><label class="login-label" for="map-f-parent">' + escapeHtml(t('maps.map.placement')) + '</label>';
    html += '<select class="edit-input" id="map-f-parent">';
    html += '<option value="">' + escapeHtml(t('maps.map.asmain')) + '</option>';
    for (var i = 0; i < mainMaps.length; i++) {
        html += '<option value="' + escapeAttr(mainMaps[i].id) + '">' + escapeHtml(t('maps.map.subof')) + ' ' + escapeHtml(mainMaps[i].name) + '</option>';
    }
    html += '</select></div>';

    // Afbeelding: kies uit Places óf upload nieuw
    html += '<div class="npc-form-field"><label class="login-label">' + escapeHtml(t('maps.map.image')) + '</label>';
    html += '<div class="npc-form-image-preview add-map-preview" id="map-f-image-preview"><span class="npc-portrait-empty">&#128506;</span></div>';
    html += '<input type="hidden" id="map-f-image" value="">';
    html += '<input type="hidden" id="map-f-image-source" value="">';

    html += '<select class="edit-input" id="map-f-place" style="margin-top:.5rem;">';
    html += '<option value="">' + escapeHtml(t('maps.map.fromplaces')) + '…</option>';
    if (!places.length) {
        html += '<option value="" disabled>' + escapeHtml(t('maps.map.fromplaces.none')) + '</option>';
    }
    for (var p = 0; p < places.length; p++) {
        html += '<option value="' + escapeAttr(places[p].id) + '">' + escapeHtml(places[p].name || '(naamloos)') + '</option>';
    }
    html += '</select>';

    html += '<label class="note-image-upload" style="margin-top:.5rem;"><span>' + escapeHtml(t('maps.map.uploadnew')) + '</span><input type="file" accept="image/*" data-action="upload-add-map-image" style="display:none"></label>';
    html += '<p class="text-dim" style="font-size:.78rem;margin-top:.35rem;">' + escapeHtml(t('maps.map.uploadhint')) + '</p>';
    html += '</div>';

    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="submit-add-map">' + escapeHtml(t('generic.save')) + '</button>';
    html += '<button class="edit-cancel" data-action="close-maps-modal">' + escapeHtml(t('generic.cancel')) + '</button>';
    html += '</div>';

    html += '</div></div></div>';
    return html;
}
function openAddMapModal() { _openMapsModal(renderAddMapModal()); }

// Place-image gekozen in de add-map window → preview + hidden velden vullen.
function addMapPickPlace(placeId) {
    var places = (typeof getLoreCatEntries === 'function' ? getLoreCatEntries('places') : []);
    var place = null;
    for (var i = 0; i < places.length; i++) if (places[i].id === placeId) { place = places[i]; break; }
    var imgEl = document.getElementById('map-f-image');
    var srcEl = document.getElementById('map-f-image-source');
    var prev = document.getElementById('map-f-image-preview');
    if (!place || !place.image) {
        if (imgEl) imgEl.value = '';
        if (srcEl) srcEl.value = '';
        if (prev) prev.innerHTML = '<span class="npc-portrait-empty">&#128506;</span>';
        return;
    }
    if (imgEl) imgEl.value = place.image;
    if (srcEl) srcEl.value = 'place';
    if (prev) prev.innerHTML = '<img src="' + escapeAttr(place.image) + '" alt="">';
}

// Opslaan vanuit de add-map window.
async function submitAddMap() {
    var nameEl = document.getElementById('map-f-name');
    var name = nameEl ? nameEl.value.trim() : '';
    if (!name) { if (nameEl) nameEl.focus(); if (typeof showToast === 'function') showToast(t('maps.map.namerequired'), 'error'); return; }
    var parentEl = document.getElementById('map-f-parent');
    var parentMapId = (parentEl && parentEl.value) ? parentEl.value : null;
    var imgEl = document.getElementById('map-f-image');
    var srcEl = document.getElementById('map-f-image-source');
    if (imgEl && imgEl._uploadPromise) { try { await imgEl._uploadPromise; } catch (e) {} }
    var image = (imgEl && imgEl.value) ? imgEl.value : null;
    var source = srcEl ? srcEl.value : '';

    var data = getMapsData();
    var dim = data.dimensions[activeDimension];
    if (!dim) { closeMapsModal(); return; }
    if (!Array.isArray(dim.maps)) dim.maps = [];
    var mapId = 'map' + Date.now();
    dim.maps.push({ id: mapId, name: name, image: image, isRoot: false, parentMapId: parentMapId, pins: [] });
    saveMapsData(data);

    // Een NIEUW geüploade kaartafbeelding wordt ook als Place opgeslagen.
    if (source === 'upload' && image) {
        var lore = getLoreCatsData();
        if (!Array.isArray(lore.places)) lore.places = [];
        lore.places.push({ id: 'le' + Date.now(), name: name, image: image, description: '', notes: '' });
        saveLoreCatsData(lore);
    }

    closeMapsModal();
    renderApp();
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
    html += '<div class="dimension-section">';
    html += '<span class="dimension-label">' + t('maps.dimension') + '</span>';
    html += '<div class="dimension-tabs">';
    for (var d = 0; d < dims.length; d++) {
        var activeClass = d === activeDimension ? ' active' : '';
        html += '<button class="dimension-tab' + activeClass + '" data-action="select-dimension" data-dim="' + d + '">' + escapeHtml(dims[d].name) + '</button>';
    }
    if (isDM()) {
        html += '<button class="dimension-tab dimension-add" data-action="manage-dimensions" title="' + escapeAttr(t('maps.dimensions')) + '">+</button>';
    }
    html += '</div>';
    html += '</div>'; // end dimension-section
    html += '</div>'; // end maps-header

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
            html += '<button class="btn btn-ghost btn-sm' + (editingPins ? ' is-active' : '') + '" data-action="toggle-edit-pins">&#9998; ' + (editingPins ? 'Klaar met editen' : 'Edit pin') + '</button>';
            html += '<label class="btn btn-ghost btn-sm">' + t('maps.changeimage') + '<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
            html += '<button class="btn btn-ghost btn-sm" data-action="rename-map" data-map-id="' + map.id + '">&#9998; Rename</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-map" data-map-id="' + map.id + '" style="color:var(--danger);">&#128465; Delete map</button>';
        }
        html += '</div>';

        // Map viewer
        html += '<div class="map-viewer" id="map-viewer">';
        var canvasClass = 'map-canvas';
        if (isDM()) canvasClass += ' is-dm';
        if (editingPins) canvasClass += ' is-editing-pins';
        html += '<div class="' + canvasClass + '" id="map-canvas" style="transform: scale(' + mapZoom + ') translate(' + mapPanX + 'px, ' + mapPanY + 'px);">';

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

        // Pins as SVG overlay (viewBox 0..100 = % coords)
        var pins = map.pins || [];
        var allMapsLookup = {};
        for (var dli = 0; dli < dims.length; dli++) {
            var dlMaps = dims[dli].maps || [];
            for (var dlmi = 0; dlmi < dlMaps.length; dlmi++) {
                allMapsLookup[dlMaps[dlmi].id] = { name: dlMaps[dlmi].name, dimName: dims[dli].name, dimIdx: dli };
            }
        }

        html += '<svg class="map-shapes" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">';
        for (var pi = 0; pi < pins.length; pi++) {
            var pin = normalizePin(pins[pi]);
            var s = pin.shape;
            var isLink = pin.targetMap && allMapsLookup[pin.targetMap];
            var usePolygon = s.kind === 'polygon' || (s.nodes && s.nodes.length >= 3);
            var shapeClass = 'map-shape';
            if (isLink) shapeClass += ' has-link';

            var clickAttrs = '';
            if (isLink && !editingPins && !addingPin) {
                var targetInfo = allMapsLookup[pin.targetMap];
                clickAttrs = ' data-action="goto-map" data-target="' + pin.targetMap + '" data-target-dim="' + targetInfo.dimIdx + '"';
            }

            html += '<g class="map-pin-g" data-pin-idx="' + pi + '">';
            var titleStr = '';
            if (pin.label || (isLink && allMapsLookup[pin.targetMap])) {
                var titleParts = [];
                if (pin.label) titleParts.push(pin.label);
                if (isLink) titleParts.push('→ ' + allMapsLookup[pin.targetMap].name);
                titleStr = '<title>' + escapeHtml(titleParts.join('  ')) + '</title>';
            }
            if (usePolygon) {
                var d = smoothClosedPath(s.nodes);
                html += '<path class="' + shapeClass + '" d="' + d + '" data-pin-idx="' + pi + '"' + clickAttrs + '>' + titleStr + '</path>';
            } else {
                html += '<circle class="' + shapeClass + '" cx="' + s.cx + '" cy="' + s.cy + '" r="' + s.r + '" data-pin-idx="' + pi + '"' + clickAttrs + '>' + titleStr + '</circle>';
            }

            // Edit handles: nodes als drag-bare circles
            if (editingPins && isDM()) {
                // Always-visible centroid handle (move whole shape) — show only for circle without nodes
                if (!usePolygon && (!s.nodes || s.nodes.length === 0)) {
                    html += '<circle class="shape-center" cx="' + s.cx + '" cy="' + s.cy + '" r="1.2" data-pin-idx="' + pi + '" data-handle="center"></circle>';
                }
                if (s.nodes && s.nodes.length) {
                    for (var ni = 0; ni < s.nodes.length; ni++) {
                        var nd = s.nodes[ni];
                        html += '<circle class="shape-node" cx="' + nd.x + '" cy="' + nd.y + '" r="1.1" data-pin-idx="' + pi + '" data-node-idx="' + ni + '"></circle>';
                    }
                }
            }
            html += '</g>';
        }
        html += '</svg>';

        // Pin labels (HTML overlay) — alleen in edit-mode zichtbaar met edit/delete buttons
        if (editingPins && isDM()) {
            for (var pli = 0; pli < pins.length; pli++) {
                var plPin = normalizePin(pins[pli]);
                var c = pinCentroid(plPin);
                var labelClass = 'pin-label';
                if (plPin.targetMap && allMapsLookup[plPin.targetMap]) labelClass += ' has-link';
                html += '<div class="' + labelClass + '" style="left:' + c.x + '%;top:' + c.y + '%;" data-pin-idx="' + pli + '">';
                if (plPin.label) html += escapeHtml(plPin.label);
                html += '<button class="pin-edit-btn" data-action="edit-pin-meta" data-pin-idx="' + pli + '" title="Label/link">&#9998;</button>';
                html += '<button class="pin-edit-btn pin-edit-delete" data-action="delete-pin" data-pin-idx="' + pli + '" title="Verwijder pin">&times;</button>';
                html += '</div>';
            }
        }

        html += '</div>'; // map-canvas
        html += '</div>'; // map-viewer

        // Pin adding mode indicator
        if (addingPin) {
            html += '<div class="pin-add-overlay">';
            html += '<p>' + t('maps.clicktoplace') + '</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="cancel-add-pin">' + t('generic.cancel') + '</button>';
            html += '</div>';
        }

        if (editingPins && !addingPin) {
            html += '<div class="pin-add-overlay pin-edit-overlay">';
            html += '<p>Klik op een vorm om een node toe te voegen (max 10). Sleep nodes om te verplaatsen.</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="toggle-edit-pins">Klaar</button>';
            html += '</div>';
        }

    } else {
        // MAP GRID MODE — gegroepeerd in rijen: per main map een rij met sub-maps half-size
        var maps = dim.maps || [];

        // Bepaal main maps (geen parentMapId, of die de oude isRoot-flag hebben).
        // Sub maps zitten in dezelfde rij als hun parent.
        var byParent = {};
        var mainMaps = [];
        for (var gi = 0; gi < maps.length; gi++) {
            var gm = maps[gi];
            if (gm.parentMapId) {
                if (!byParent[gm.parentMapId]) byParent[gm.parentMapId] = [];
                byParent[gm.parentMapId].push(gm);
            } else {
                mainMaps.push(gm);
            }
        }
        // Orphaned subs (parent niet gevonden) → toon als main onder een 'Andere' rij
        var orphans = [];
        for (var pid in byParent) {
            var found = mainMaps.some(function(m) { return m.id === pid; });
            if (!found) orphans = orphans.concat(byParent[pid]);
        }

        function renderMapCard(gm, isSub) {
            var cardHtml = '<div class="map-card' + (isSub ? ' map-card-sub' : '') + '" data-action="open-map" data-map-id="' + gm.id + '">';
            if (gm.image) {
                cardHtml += '<img class="map-card-img" src="' + gm.image + '" alt="">';
            } else {
                cardHtml += '<div class="map-card-placeholder">&#128506;</div>';
            }
            cardHtml += '<div class="map-card-info">';
            cardHtml += '<span class="map-card-name">' + escapeHtml(gm.name) + '</span>';
            if (gm.isRoot) cardHtml += '<span class="map-card-badge">' + t('maps.mainmap') + '</span>';
            cardHtml += '</div>';
            if (isDM()) {
                cardHtml += '<button class="map-card-delete" data-action="delete-map" data-map-id="' + gm.id + '">&times;</button>';
            }
            cardHtml += '</div>';
            return cardHtml;
        }

        // Render: één rij per main map (main + zijn subs)
        for (var mi = 0; mi < mainMaps.length; mi++) {
            var main = mainMaps[mi];
            var subs = byParent[main.id] || [];
            html += '<div class="maps-row">';
            html += renderMapCard(main, false);
            if (subs.length) {
                html += '<div class="maps-row-subs">';
                for (var si = 0; si < subs.length; si++) {
                    html += renderMapCard(subs[si], true);
                }
                html += '</div>';
            }
            html += '</div>';
        }

        // Orphans rij
        if (orphans.length) {
            html += '<div class="maps-row maps-row-orphans">';
            html += '<div class="maps-row-subs">';
            for (var oi = 0; oi < orphans.length; oi++) {
                html += renderMapCard(orphans[oi], true);
            }
            html += '</div>';
            html += '</div>';
        }

        if (isDM()) {
            html += '<div class="maps-row maps-row-add">';
            html += '<div class="map-card map-card-add" data-action="add-map">';
            html += '<span class="map-card-add-icon">+</span>';
            html += '<span class="map-card-name">' + t('maps.newmap') + '</span>';
            html += '</div>';
            html += '</div>';
        }
    }

    html += '</div>'; // maps-page
    return html;
}

// ============================================================
// Section 21: Timeline Page
// ============================================================

// ===== Timeline storage (split per scene, 2026-05-30) =====
// To avoid hitting localStorage size limits and Firebase write-size issues
// when many scenes have base64 images, the timeline is split:
//   dw_chapters       : [{id, name, sessions:[{id, title, session, sceneIds:[]}]}]
//   dw_scene_<id>     : {layout, text, image}
// Old monolithic dw_timeline (with embedded scenes+images) is migrated on
// first read.

function _genId(prefix) {
    return prefix + Date.now() + Math.random().toString(36).slice(2, 7);
}

// Attempt to free localStorage room before a retry. Drops the legacy timeline
// backup first (it's a 1:1 duplicate of the migrated data) and any other
// known-stale blobs we can spare. Returns true if anything was freed.
function _freeUpStorage() {
    var freed = false;
    try {
        if (localStorage.getItem('dw_timeline_legacy_backup')) {
            localStorage.removeItem('dw_timeline_legacy_backup');
            freed = true;
        }
    } catch (e) {}
    try {
        if (localStorage.getItem('dw_timeline')) {
            localStorage.removeItem('dw_timeline');
            freed = true;
        }
    } catch (e) {}
    return freed;
}

// Aggressively re-compress a base64 dataURL in-place. Used as a last-resort
// when the original scene image still won't fit after we've freed space.
function _shrinkDataUrl(dataUrl, maxW, quality) {
    return new Promise(function(resolve) {
        if (!dataUrl || dataUrl.indexOf('data:image') !== 0) { resolve(dataUrl); return; }
        var img = new Image();
        img.onload = function() {
            var cvs = document.createElement('canvas');
            var scale = Math.min(1, maxW / img.width);
            cvs.width = img.width * scale;
            cvs.height = img.height * scale;
            cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
            resolve(cvs.toDataURL('image/jpeg', quality));
        };
        img.onerror = function() { resolve(dataUrl); };
        img.src = dataUrl;
    });
}

function _saveSceneBlob(sceneId, scene) {
    if (!sceneId) return;
    var payload = JSON.stringify(scene || {});
    var key = 'dw_scene_' + sceneId;
    try {
        localStorage.setItem(key, payload);
        if (typeof syncUpload === 'function') syncUpload(key);
        return;
    } catch (e) {
        // QuotaExceededError \u2014 try freeing space and retry once.
        var freed = _freeUpStorage();
        if (freed) {
            try {
                localStorage.setItem(key, payload);
                if (typeof syncUpload === 'function') syncUpload(key);
                if (typeof showToast === 'function') showToast('Scene opgeslagen (oude backup verwijderd)', 'success');
                return;
            } catch (e2) {
                // Fall through to image-shrink retry below.
            }
        }
        // Last-ditch: if the payload has an image, shrink it hard and retry.
        if (scene && scene.image) {
            _shrinkDataUrl(scene.image, 700, 0.6).then(function(smaller) {
                var smallScene = { layout: scene.layout, text: scene.text, image: smaller };
                try {
                    localStorage.setItem(key, JSON.stringify(smallScene));
                    if (typeof syncUpload === 'function') syncUpload(key);
                    if (typeof showToast === 'function') showToast('Scene opgeslagen met sterkere image-compressie', 'success');
                } catch (e3) {
                    console.error('[timeline] scene save still failing after shrink', e3);
                    if (typeof showToast === 'function') showToast('Scene niet opgeslagen \u2014 storage vol. Verwijder oude scenes/sessies of upload een kleinere afbeelding.', 'error');
                }
            });
            return;
        }
        console.error('[timeline] scene save failed (storage full?)', e);
        if (typeof showToast === 'function') showToast('Scene niet opgeslagen \u2014 storage vol: ' + (e.message || ''), 'error');
    }
}

function _removeSceneBlob(sceneId) {
    if (!sceneId) return;
    try {
        // Clean up the scene's Cloudinary image(s) before dropping the blob.
        if (window.DWImages) {
            var blob = _loadSceneBlob(sceneId);
            if (blob) {
                if (blob.image) DWImages.del(blob.image);
                if (Array.isArray(blob.scenes)) {
                    blob.scenes.forEach(function (sc) { if (sc && sc.image) DWImages.del(sc.image); });
                }
            }
        }
        localStorage.removeItem('dw_scene_' + sceneId);
        if (typeof syncRemove === 'function') syncRemove('dw_scene_' + sceneId);
    } catch (e) {}
}

function _loadSceneBlob(sceneId) {
    if (!sceneId) return null;
    try {
        var raw = localStorage.getItem('dw_scene_' + sceneId);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function _saveChaptersIndex(chapters) {
    try {
        localStorage.setItem('dw_chapters', JSON.stringify(chapters));
        if (typeof syncUpload === 'function') syncUpload('dw_chapters');
    } catch (e) {
        console.error('[timeline] chapters index save failed', e);
    }
}

// Migrate from old monolithic dw_timeline to new split layout. Idempotent.
function _migrateMonolithicTimeline() {
    // Drop a leftover legacy backup eagerly — it's a 1:1 duplicate of the
    // migrated scenes and was the direct cause of QuotaExceededError once
    // the per-scene blobs were also written.
    try {
        if (localStorage.getItem('dw_chapters') && localStorage.getItem('dw_timeline_legacy_backup')) {
            localStorage.removeItem('dw_timeline_legacy_backup');
        }
    } catch (e) {}

    var legacy = localStorage.getItem('dw_timeline');
    if (!legacy) return;
    // If a split index already exists, the legacy monolithic blob is obsolete.
    // Never regenerate over it: a stale dw_timeline (e.g. re-synced from Firebase)
    // would otherwise wipe freshly-saved sessions on every getTimelineData() call,
    // because migration rebuilds dw_chapters from the (empty) legacy events.
    // Purge it locally and from sync so it can't keep coming back.
    if (localStorage.getItem('dw_chapters')) {
        try { localStorage.removeItem('dw_timeline'); } catch (e) {}
        if (typeof syncRemove === 'function') syncRemove('dw_timeline');
        return;
    }
    try {
        var parsed = JSON.parse(legacy);
        if (!parsed || !Array.isArray(parsed.chapters)) return;
        var newChapters = [];
        for (var ci = 0; ci < parsed.chapters.length; ci++) {
            var ch = parsed.chapters[ci];
            var sessions = [];
            var evs = ch.events || [];
            for (var ei = 0; ei < evs.length; ei++) {
                var ev = evs[ei];
                var migrated = (Array.isArray(ev.scenes))
                    ? ev
                    : _legacyEventToSession(ev);
                var sceneIds = [];
                for (var sci = 0; sci < migrated.scenes.length; sci++) {
                    var scene = migrated.scenes[sci];
                    var sId = scene.id || _genId('sc');
                    sceneIds.push(sId);
                    _saveSceneBlob(sId, {
                        layout: scene.layout || 'text',
                        text: scene.text || '',
                        image: scene.image || null
                    });
                }
                sessions.push({
                    id: migrated.id || _genId('sess'),
                    title: migrated.title || '',
                    session: migrated.session || '',
                    sceneIds: sceneIds
                });
            }
            newChapters.push({
                id: ch.id || _genId('ch'),
                name: ch.name || ('Chapter ' + (ci + 1)),
                sessions: sessions
            });
        }
        _saveChaptersIndex(newChapters);
        // Drop legacy directly — keeping a backup of identical data is what
        // caused the quota to blow up. The new split storage is the source
        // of truth from this point.
        localStorage.removeItem('dw_timeline');
    } catch (e) {
        console.warn('[timeline] migration failed; keeping legacy blob intact', e);
    }
}

// Older { title, desc, image, layout, type, session } \u2192 session shape.
function _legacyEventToSession(ev) {
    var legacyLayout = ev.layout || 'text';
    var sceneLayout = 'text';
    if (legacyLayout === 'image-left') sceneLayout = 'image-left';
    else if (legacyLayout === 'image-right') sceneLayout = 'image-right';
    else if (legacyLayout === 'full-image' || legacyLayout === 'image-top' || legacyLayout === 'banner') sceneLayout = 'image-only';
    var hasImage = !!ev.image;
    if (sceneLayout === 'text' && hasImage) sceneLayout = 'image-left';
    if (sceneLayout === 'image-only' && !hasImage) sceneLayout = 'text';
    return {
        id: ev.id || _genId('sess'),
        title: ev.title || '',
        session: ev.session || '',
        scenes: [{
            layout: sceneLayout,
            text: ev.desc || '',
            image: ev.image || null
        }]
    };
}

// Backwards-compat shim \u2014 kept so any leftover call site still resolves.
function migrateTimelineEvent(ev) {
    if (ev && Array.isArray(ev.scenes)) return ev;
    return _legacyEventToSession(ev || {});
}

function _loadChaptersIndex() {
    var raw = localStorage.getItem('dw_chapters');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

// Hydrate full timeline (chapters \u2192 sessions \u2192 scenes) for render-paths that
// still expect the old monolithic shape. Scenes are loaded from per-scene
// blobs lazily \u2014 image data is fetched only here, so the chapter index stays
// small and fast.
function getTimelineData() {
    _migrateMonolithicTimeline();
    var chapters = _loadChaptersIndex();
    if (!chapters) {
        // No persisted timeline yet. Return a TRANSIENT default for display
        // only \u2014 do NOT write or upload it. Persisting/uploading a seed here
        // races with the async Firebase download: an early render (e.g. the
        // homepage "Recent" block) would seed an empty timeline and clobber
        // the real cloud data before it finishes downloading. The real save
        // paths (add/edit session/chapter) persist properly when the user acts.
        return {
            chapters: [{
                id: 'ch1',
                name: 'New Beginnings',
                events: [{
                    id: 'sess1',
                    title: 'Sign At The Crossroads',
                    session: '1',
                    scenes: [{
                        id: 'seed',
                        layout: 'text',
                        text: 'De avonturiers ontmoeten elkaar bij een kruispunt. Een verweerd bord wijst in vier richtingen \u2014 maar iets trekt hen allemaal dezelfde kant op.',
                        image: null
                    }]
                }]
            }]
        };
    }
    // Build the hydrated shape that the rest of the renderer expects:
    // { chapters: [{id, name, events: [{id, title, session, scenes: [...]}]}] }
    var hydratedChapters = [];
    for (var ci = 0; ci < chapters.length; ci++) {
        var ch = chapters[ci];
        var events = [];
        var sessions = ch.sessions || [];
        for (var si = 0; si < sessions.length; si++) {
            var sess = sessions[si];
            var sceneIds = sess.sceneIds || [];
            var scenes = [];
            for (var sci2 = 0; sci2 < sceneIds.length; sci2++) {
                var scd = _loadSceneBlob(sceneIds[sci2]) || { layout: 'text', text: '', image: null };
                scd.id = sceneIds[sci2];
                scenes.push(scd);
            }
            events.push({
                id: sess.id,
                title: sess.title || '',
                session: sess.session || '',
                scenes: scenes
            });
        }
        hydratedChapters.push({
            id: ch.id,
            name: ch.name || ('Chapter ' + (ci + 1)),
            events: events
        });
    }
    return { chapters: hydratedChapters };
}

// Save **only the chapters/sessions index** (no scene data). Scenes are
// persisted individually via saveScene().
function saveTimelineData(data) {
    if (!data || !Array.isArray(data.chapters)) return;
    var chapters = [];
    for (var ci = 0; ci < data.chapters.length; ci++) {
        var ch = data.chapters[ci];
        var sessions = [];
        var evs = ch.events || [];
        for (var ei = 0; ei < evs.length; ei++) {
            var ev = evs[ei];
            var sceneIds = [];
            var scs = ev.scenes || [];
            for (var sci = 0; sci < scs.length; sci++) {
                if (scs[sci] && scs[sci].id) sceneIds.push(scs[sci].id);
            }
            sessions.push({
                id: ev.id || _genId('sess'),
                title: ev.title || '',
                session: ev.session || '',
                sceneIds: sceneIds
            });
        }
        chapters.push({
            id: ch.id || _genId('ch'),
            name: ch.name || '',
            sessions: sessions
        });
    }
    _saveChaptersIndex(chapters);
}

// Persist a single scene independently. Call this from the UI whenever the
// user switches scenes, adds a new one, or finalizes an edit \u2014 so each scene
// becomes its own Firebase write (small payload, no full-timeline upload).
function saveScene(sceneId, sceneData) {
    if (!sceneId) sceneId = _genId('sc');
    _saveSceneBlob(sceneId, sceneData || { layout: 'text', text: '', image: null });
    return sceneId;
}

// Remove a scene's blob (and its Firebase entry). The chapters index needs
// to be updated separately by the caller (splice sceneIds + saveTimelineData).
function deleteScene(sceneId) {
    _removeSceneBlob(sceneId);
}

// Scene layouts \u2014 4 opties per scene block.
var SCENE_LAYOUTS = [
    { id: 'text',        icon: '\ud83d\udcdd',                 label: 'Just Text' },
    { id: 'image-left',  icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: 'Image Left' },
    { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: 'Image Right' },
    { id: 'image-only',  icon: '\ud83c\udf05',                 label: 'Just Image' }
];

// Plain-text preview from the first scene with text content (for the homepage
// Recent block + smart wraps). Returns '' when no scenes have text.
function sessionPreviewText(sess) {
    if (!sess || !Array.isArray(sess.scenes)) return '';
    for (var i = 0; i < sess.scenes.length; i++) {
        var s = sess.scenes[i];
        if (s && s.text) return s.text;
    }
    return '';
}

// Render a scene-block in either expanded (editor) or collapsed (preview)
// mode. Only one scene per session-form is expanded at a time so that
// switching automatically commits the previous scene's content to its own
// localStorage/Firebase blob — keeps individual writes small.
function renderSceneBlock(sceneIdx, scene, sessIdx, expanded) {
    var s = scene || {};
    var sceneId = s.id || '';
    var layout = s.layout || 'text';
    var needsImage = layout !== 'text';
    var needsText = layout !== 'image-only';
    var imgRefAttr = isImageRef(s.image) ? (' data-image-ref="' + escapeAttr(s.image) + '"') : '';
    var html = '<div class="scene-block' + (expanded ? ' scene-block-expanded' : ' scene-block-collapsed') + '" data-scene-idx="' + sceneIdx + '" data-scene-id="' + escapeAttr(sceneId) + '" data-layout="' + layout + '"' + imgRefAttr + '>';
    html += '<div class="scene-block-header">';
    html += '<span class="scene-block-title">Scene ' + (sceneIdx + 1) + '</span>';
    if (!expanded) {
        html += '<button type="button" class="btn btn-ghost btn-sm scene-edit" data-action="edit-scene" data-scene-idx="' + sceneIdx + '">' + t('generic.edit') + '</button>';
    }
    html += '<button type="button" class="scene-remove" data-action="remove-scene" data-scene-idx="' + sceneIdx + '" title="Remove scene">&times;</button>';
    html += '</div>';

    if (expanded) {
        html += '<div class="scene-layout-picker">';
        for (var li = 0; li < SCENE_LAYOUTS.length; li++) {
            var lo = SCENE_LAYOUTS[li];
            html += '<button type="button" class="scene-layout-option' + (layout === lo.id ? ' active' : '') + '" data-action="pick-scene-layout" data-layout="' + lo.id + '" data-scene-idx="' + sceneIdx + '">';
            html += '<span class="scene-layout-icon">' + lo.icon + '</span>';
            html += '<span class="scene-layout-label">' + lo.label + '</span>';
            html += '</button>';
        }
        html += '</div>';
        html += '<div class="scene-image-section" style="display:' + (needsImage ? 'block' : 'none') + '">';
        if (s.image) {
            html += '<div class="scene-image-preview"><img src="' + escapeAttr(resolveImageSrc(s.image)) + '" alt=""><button type="button" class="btn btn-ghost btn-sm" data-action="remove-scene-image" data-scene-idx="' + sceneIdx + '">' + t('generic.delete') + '</button></div>';
        } else {
            html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-scene-image" data-scene-idx="' + sceneIdx + '" style="display:none"></label>';
        }
        html += '<button type="button" class="btn btn-ghost btn-sm scene-pick-existing" data-action="pick-scene-image" data-scene-idx="' + sceneIdx + '">Kies bestaande</button>';
        html += '</div>';
        html += '<div class="scene-text-section" style="display:' + (needsText ? 'block' : 'none') + '">';
        var sText = s.text || '';
        var sDisplay = (typeof mentionsToDisplay === 'function') ? mentionsToDisplay(sText) : sText;
        var sMap = (typeof mentionsExtract === 'function') ? JSON.stringify(mentionsExtract(sText)) : '[]';
        html += '<textarea class="edit-textarea auto-grow scene-text-input" data-scene-idx="' + sceneIdx + '" data-mentions="' + escapeAttr(sMap) + '" placeholder="Scene text…" oninput="if(typeof autoGrowTextarea===\'function\')autoGrowTextarea(this)">' + escapeHtml(sDisplay) + '</textarea>';
        html += '</div>';
    } else {
        // Collapsed preview: render the scene the same way the timeline does
        // (full image, full text, real layout) so the DM can see all content
        // at a glance without expanding every block. Only the editor chrome
        // (layout-picker, file-input, textarea) is hidden.
        html += '<div class="scene scene-layout-' + layout + ' scene-block-readonly">';
        if (layout === 'image-only' && s.image) {
            html += '<div class="scene-image-only"><img src="' + escapeAttr(resolveImageSrc(s.image)) + '" alt=""></div>';
        } else if ((layout === 'image-left' || layout === 'image-right') && s.image) {
            html += '<div class="scene-split scene-split-' + layout + '">';
            html += '<div class="scene-split-img"><img src="' + escapeAttr(resolveImageSrc(s.image)) + '" alt=""></div>';
            html += '<div class="scene-split-text">';
            if (s.text) html += '<p>' + renderRichText(s.text) + '</p>';
            html += '</div></div>';
        } else {
            if (s.text) html += '<p>' + renderRichText(s.text) + '</p>';
            else html += '<p class="text-dim" style="font-style:italic;">(leeg)</p>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderSessionForm(sessIdx, sess) {
    var isNew = sessIdx < 0;
    var prefix = isNew ? '' : 'edit-';
    var data = getTimelineData();
    var chapters = data.chapters || [];

    var html = '<div class="session-form" data-sess-idx="' + sessIdx + '">';

    html += '<div class="session-form-row">';
    html += '<div class="session-form-field"><label class="login-label">Chapter</label>';
    html += '<select class="edit-input" id="' + prefix + 'sess-chapter">';
    for (var chi = 0; chi < chapters.length; chi++) {
        var selChap = chi === activeChapter ? ' selected' : '';
        html += '<option value="' + chi + '"' + selChap + '>Ch. ' + (chi + 1) + ' — ' + escapeHtml(chapters[chi].name || '') + '</option>';
    }
    html += '</select></div>';
    html += '<div class="session-form-field"><label class="login-label">Session #</label>';
    html += '<input type="number" min="0" step="1" class="edit-input" id="' + prefix + 'sess-number" value="' + escapeAttr(sess.session || '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<label class="login-label" style="display:block;margin-block:0.75rem 0.25rem;">Title</label>';
    html += '<input type="text" class="edit-input" id="' + prefix + 'sess-title" placeholder="Session title" value="' + escapeAttr(sess.title || '') + '">';

    var scenes = (sess && Array.isArray(sess.scenes) && sess.scenes.length) ? sess.scenes : [{ id: _genId('sc'), layout: 'text', text: '', image: null }];
    // Default open scene: last one (gives user a fresh editor at the bottom).
    var openIdx = scenes.length - 1;
    html += '<div class="scene-list" data-scene-list data-active-scene-idx="' + openIdx + '">';
    for (var sci = 0; sci < scenes.length; sci++) {
        if (!scenes[sci].id) scenes[sci].id = _genId('sc');
        html += renderSceneBlock(sci, scenes[sci], sessIdx, sci === openIdx);
    }
    html += '</div>';

    html += '<button type="button" class="btn btn-ghost btn-sm scene-add" data-action="add-scene">+ Add Scene</button>';

    html += '<div class="edit-actions session-form-actions">';
    html += '<button type="button" class="edit-save" data-action="save-session"' + (isNew ? '' : ' data-edit-idx="' + sessIdx + '"') + '>' + t('generic.save') + '</button>';
    html += '<button type="button" class="edit-cancel" data-action="cancel-session">' + t('generic.cancel') + '</button>';
    if (!isNew) {
        html += '<button type="button" class="btn btn-ghost btn-sm" data-action="delete-session" data-edit-idx="' + sessIdx + '" style="color:var(--danger);margin-left:auto;">' + t('generic.delete') + '</button>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}

// Legacy alias for any leftover call sites — delegates to session-form.
function renderEventForm(evIdx, ev) {
    return renderSessionForm(evIdx, migrateTimelineEvent(ev || {}));
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

    // Right: sessions for active chapter
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
            html += '<button class="btn btn-primary btn-sm" data-action="add-session">Add Session</button>';
        }
        html += '</div>';

        if (isDM()) {
            html += '<div class="timeline-add-form" id="session-add-form" style="display:none;">';
            html += renderSessionForm(-1, { title: '', session: '', scenes: [{ layout: 'text', text: '', image: null }] });
            html += '</div>';
        }

        // Sessions — sorteer op sessie-nummer ascending: laag bovenaan → hoog
        // onderaan, zodat de timeline van boven naar beneden chronologisch
        // leest. Sessies zonder session-# zakken naar onder. Originele index
        // bewaard voor edit/delete handlers.
        var sessions = ch.events || [];
        var sortedSess = sessions.map(function(s, idx) { return { s: migrateTimelineEvent(s), idx: idx }; });
        sortedSess.sort(function(a, b) {
            var na = parseInt(a.s.session, 10);
            var nb = parseInt(b.s.session, 10);
            var aValid = !isNaN(na);
            var bValid = !isNaN(nb);
            if (aValid && bValid) return na - nb;
            if (aValid) return -1;
            if (bValid) return 1;
            return 0;
        });
        if (sortedSess.length === 0) {
            html += '<p class="text-dim" style="padding:2rem 0;">' + t('timeline.noevents') + '</p>';
        } else {
            html += '<div class="timeline">';
            for (var j = 0; j < sortedSess.length; j++) {
                var sess = sortedSess[j].s;
                var sessOrigIdx = sortedSess[j].idx;
                html += '<div class="timeline-event timeline-session-block" data-event-idx="' + sessOrigIdx + '" data-session-id="' + escapeAttr(sess.id || '') + '" id="session-' + escapeAttr(sess.id || ('idx-' + sessOrigIdx)) + '">';
                html += '<div class="timeline-marker"></div>';
                html += '<div class="timeline-content">';
                if (sess.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(sess.session) + '</span>';
                html += '<h3>' + escapeHtml(sess.title || '') + '</h3>';
                var scenes = Array.isArray(sess.scenes) ? sess.scenes : [];
                for (var sci = 0; sci < scenes.length; sci++) {
                    var sc = scenes[sci];
                    var scLayout = sc.layout || 'text';
                    html += '<div class="scene scene-layout-' + scLayout + '">';
                    if (scLayout === 'image-only' && sc.image) {
                        html += '<div class="scene-image-only"><img src="' + escapeAttr(resolveImageSrc(sc.image)) + '" alt=""></div>';
                    } else if ((scLayout === 'image-left' || scLayout === 'image-right') && sc.image) {
                        html += '<div class="scene-split scene-split-' + scLayout + '">';
                        html += '<div class="scene-split-img"><img src="' + escapeAttr(resolveImageSrc(sc.image)) + '" alt=""></div>';
                        html += '<div class="scene-split-text">';
                        if (sc.text) html += '<p>' + renderRichText(sc.text) + '</p>';
                        html += '</div></div>';
                    } else {
                        if (sc.text) html += '<p>' + renderRichText(sc.text) + '</p>';
                    }
                    html += '</div>';
                }

                if (isDM()) {
                    html += '<div class="event-actions">';
                    html += '<button class="btn btn-ghost btn-sm" data-action="edit-session" data-event="' + sessOrigIdx + '">' + t('generic.edit') + '</button>';
                    html += '<button class="btn btn-ghost btn-sm" data-action="delete-session" data-event="' + sessOrigIdx + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
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

// Lore-tabbladen. `articles` = de bestaande vrije DM-teksten; `npcs` heeft een
// eigen rijke implementatie; de overige zijn generieke entry-collecties
// (naam + afbeelding + omschrijving + notities) via renderLoreCategory().
var LORE_TABS = [
    { id: 'npcs',      label: 'NPCs' },
    { id: 'families',  label: 'Families' },
    { id: 'items',     label: 'Items' },
    { id: 'religions', label: 'Religions' },
    { id: 'factions',  label: 'Factions' },
    { id: 'places',    label: 'Places' },
    { id: 'monsters',  label: 'Monsters' },
    { id: 'events',    label: 'Events' },
    { id: 'articles',  label: 'Articles' }
];
// De generieke categorie-tabs (alles behalve party/npcs/articles).
var LORE_CATEGORY_TABS = ['items', 'religions', 'factions', 'places', 'monsters', 'events'];

function isLoreTab(id) {
    for (var i = 0; i < LORE_TABS.length; i++) if (LORE_TABS[i].id === id) return true;
    return false;
}

function renderLoreTabBar(activeTab) {
    var html = '<div class="lore-tabs" role="tablist">';
    for (var i = 0; i < LORE_TABS.length; i++) {
        var tab = LORE_TABS[i];
        var active = tab.id === activeTab ? ' active' : '';
        html += '<a class="lore-tab' + active + '" href="/lore/' + tab.id + '" role="tab">' + escapeHtml(tab.label) + '</a>';
    }
    html += '</div>';
    return html;
}

function renderLore(subpage) {
    // New article form (DM only)
    if (subpage === 'new' && isDM()) {
        return renderLoreEditor();
    }

    // A non-tab subpage that isn't 'new' is treated as an article id.
    if (subpage && subpage !== 'new' && !isLoreTab(subpage)) {
        return renderLoreArticle(subpage);
    }

    var activeTab = isLoreTab(subpage) ? subpage : 'npcs';

    var html = '<div class="lore-page lore-tabbed">';
    html += '<div class="lore-header">';
    html += '<h1>' + t('lore.title') + '</h1>';
    html += '</div>';
    html += renderLoreTabBar(activeTab);

    html += '<div class="lore-tab-content">';
    if (activeTab === 'npcs') {
        html += renderNPCTracker();
    } else if (activeTab === 'families') {
        html += (typeof renderDMFamilies === 'function') ? renderDMFamilies() : '<p class="text-dim">Families niet beschikbaar.</p>';
    } else if (activeTab === 'articles') {
        html += renderLoreArticlesInner();
    } else {
        html += renderLoreCategory(activeTab);
    }
    html += '</div>';

    html += '</div>';
    return html;
}

// Articles-tab: de bestaande vrije DM-teksten als kaartgrid.
function renderLoreArticlesInner() {
    var data = getLoreData();
    var html = '<div class="lore-cat-toolbar">';
    if (isDM()) {
        html += '<a class="btn btn-primary btn-sm" href="/lore/new">' + t('lore.addarticle') + '</a>';
    }
    html += '</div>';

    if (!data.articles.length) {
        html += '<p class="text-dim">' + (isDM() ? 'Nog geen artikelen. Klik "' + t('lore.addarticle') + '".' : 'Nog geen artikelen.') + '</p>';
        return html;
    }
    html += '<div class="lore-grid">';
    for (var i = 0; i < data.articles.length; i++) {
        var art = data.articles[i];
        html += '<a class="lore-card" href="/lore/' + art.id + '">';
        html += '<h3>' + escapeHtml(art.title) + '</h3>';
        html += '<p>' + escapeHtml((art.content || '').substring(0, 120)) + '…</p>';
        html += '</a>';
    }
    html += '</div>';
    return html;
}

function renderLoreArticle(articleId) {
    var data = getLoreData();
    var article = null;
    for (var i = 0; i < data.articles.length; i++) {
        if (data.articles[i].id === articleId) { article = data.articles[i]; break; }
    }

    if (!article) return '<div class="page-placeholder"><h2>' + t('lore.notfound') + '</h2><a class="btn btn-ghost" href="/lore">' + t('lore.backtolore') + '</a></div>';

    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="/lore">&larr; ' + t('lore.backtolore') + '</a>';
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
            html += '<p>' + renderRichText(text) + '</p>';
        }
    }

    if (isDM()) {
        html += '<div style="margin-top:2rem;display:flex;gap:0.5rem;">';
        html += '<a class="btn btn-ghost btn-sm" href="/lore/edit-' + article.id + '">' + t('generic.edit') + '</a>';
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
    html += '<a class="btn btn-ghost btn-sm" href="/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + (isEdit ? t('lore.editarticle') : t('lore.newarticle')) + '</h1>';
    html += '<div class="lore-editor">';
    html += '<input type="text" class="edit-input" id="lore-title" placeholder="' + t('lore.articletitle') + '" value="' + escapeAttr(title) + '">';
    html += '<textarea class="edit-textarea lore-content-editor" id="lore-content" placeholder="' + t('lore.articlecontent') + '">' + escapeHtml(content) + '</textarea>';
    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-lore"' + (isEdit ? ' data-edit-id="' + editId + '"' : '') + '>' + t('generic.save') + '</button>';
    html += '<a class="edit-cancel" href="/lore">' + t('generic.cancel') + '</a>';
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

// Splits een volledige naam: laatste woord = achternaam (familienaam),
// de rest = voornaam. Eén woord → alleen voornaam.
function splitNpcName(full) {
    var parts = (full || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
    return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

// Voornaam/achternaam van een NPC, met fallback-split voor ongemigreerde data.
function npcFirstLast(n) {
    if (n && (n.firstName != null || n.lastName != null)) {
        return { firstName: n.firstName || '', lastName: n.lastName || '' };
    }
    var fl = splitNpcName(n && n.name);
    if (n && typeof n.family === 'string' && n.family.trim()) fl.lastName = n.family.trim();
    return fl;
}

// Backfill stable ids on NPCs + lore-cat entries. Foundation for @-mention
// links and image-reuse (entities must be addressable by a rename-proof id,
// not their array position). Idempotent: only assigns ids where missing and
// only persists when something actually changed. Triggered AFTER the first
// Firebase download (see sync.js) so it never runs against pre-download data.
var _entityIdsEnsured = false;
function ensureEntityIds(force) {
    if (_entityIdsEnsured && !force) return;
    _entityIdsEnsured = true;
    // NPCs
    try {
        var nd = getNPCData();
        var nChanged = false;
        (nd.npcs || []).forEach(function (n, i) {
            if (!n) return;
            if (!n.id) { n.id = 'npc_' + i + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); nChanged = true; }
            // Name-split migratie: één 'name'-veld → firstName + lastName.
            // Laatste woord = achternaam (familienaam), rest = voornaam. Een
            // bestaand vrij-tekst 'family'-veld overschrijft de achternaam.
            if (n.firstName == null && n.lastName == null) {
                var fl = splitNpcName(n.name);
                if (typeof n.family === 'string' && n.family.trim()) fl.lastName = n.family.trim();
                n.firstName = fl.firstName;
                n.lastName = fl.lastName;
                n.name = (fl.firstName + ' ' + fl.lastName).trim();
                if (typeof n.family === 'string') delete n.family; // gevouwen in lastName
                nChanged = true;
            }
        });
        if (nChanged) saveNPCData(nd);
    } catch (e) { /* ignore */ }
    // Lore-cat entries
    try {
        var ld = getLoreCatsData();
        var lChanged = false;
        Object.keys(ld).forEach(function (cat) {
            if (!Array.isArray(ld[cat])) return;
            ld[cat].forEach(function (e2, j) {
                if (e2 && !e2.id) { e2.id = 'le_' + cat + '_' + j + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); lChanged = true; }
            });
        });
        if (lChanged) saveLoreCatsData(ld);
    } catch (e) { /* ignore */ }
}
function saveNPCData(data) {
    localStorage.setItem('dw_npcs', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_npcs');
}

// NPC-tab filter-state (module-level, zoals npcSearchQuery in ui-pages.js).
var npcFilterDisp = 'all';
var npcFilterFaction = 'all';

// onerror fallback: replace a broken portrait <img> with its initial so a dead
// URL degrades gracefully instead of showing the browser's broken-image icon.
function dwImgFallback(img) {
    try {
        var letter = (img.getAttribute('data-fb') || '?');
        var span = document.createElement('span');
        span.className = 'npc-portrait-empty';
        span.textContent = letter;
        if (img.parentNode) img.parentNode.replaceChild(span, img);
    } catch (e) { if (img) img.style.visibility = 'hidden'; }
}

function npcDispColor(disp) {
    return disp === 'friendly' ? 'var(--success)' :
           disp === 'hostile'  ? 'var(--danger)'  :
           disp === 'neutral'  ? 'var(--warning)' : 'var(--text-dim)';
}

// Age uit geboortejaar + campagne-jaar (data.currentYear). Geeft '' als
// een van beide ontbreekt.
function npcAge(npc, currentYear) {
    var by = parseInt(npc.birthYear, 10);
    var cy = parseInt(currentYear, 10);
    if (isNaN(by) || isNaN(cy)) return '';
    var age = cy - by;
    return (age >= 0 && age < 100000) ? String(age) : '';
}

function renderNPCDetailRows(npc, currentYear) {
    var rows = [];
    var age = npcAge(npc, currentYear);
    if (npc.birthYear) rows.push(['Born', escapeHtml(String(npc.birthYear)) + (age ? ' (age ' + age + ')' : '')]);
    if (npc.race) rows.push(['Race', escapeHtml(npc.race)]);
    if (npc.npcClass) rows.push(['Class', escapeHtml(npc.npcClass)]);
    if (npc.profession) rows.push(['Profession', escapeHtml(npc.profession)]);
    if (npc.relation) rows.push(['Relation', escapeHtml(npc.relation)]);
    var npcFam = npcFirstLast(npc).lastName;
    if (npcFam) rows.push(['Family', escapeHtml(npcFam)]);
    if (npc.faction) rows.push(['Faction', escapeHtml(npc.faction)]);
    if (npc.religion) rows.push(['Religion', escapeHtml(npc.religion)]);
    if (npc.location) rows.push(['Location', escapeHtml(npc.location)]);
    if (npc.preferences) rows.push(['Likes', escapeHtml(npc.preferences)]);
    if (npc.dislikes) rows.push(['Dislikes', escapeHtml(npc.dislikes)]);
    if (npc.pets) rows.push(['Pets', escapeHtml(npc.pets)]);
    var html = '';
    if (rows.length) {
        html += '<dl class="npc-detail-grid">';
        for (var i = 0; i < rows.length; i++) {
            html += '<dt>' + rows[i][0] + '</dt><dd>' + rows[i][1] + '</dd>';
        }
        html += '</dl>';
    }
    if (npc.notes) html += '<div class="npc-detail-notes"><strong>Notes</strong><p>' + renderRichText(npc.notes) + '</p></div>';
    return html;
}

function renderNPCTracker() {
    // Offline fallback: when Firebase isn't active the post-download id-backfill
    // never fires, so ensure ids here (guarded → runs at most once).
    if (typeof syncReady === 'undefined' || !syncReady) ensureEntityIds();
    var data = getNPCData();
    var npcs = data.npcs || [];
    var currentYear = data.currentYear || '';

    // Verzamel beschikbare facties voor de filter-dropdown.
    var factions = [];
    for (var fi = 0; fi < npcs.length; fi++) {
        var fac = npcs[fi].faction;
        if (fac && factions.indexOf(fac) === -1) factions.push(fac);
    }
    factions.sort();

    var html = '<div class="npc-toolbar">';
    html += '<input type="text" class="edit-input npc-search" id="npc-search" placeholder="Zoek NPCs…" value="' + escapeAttr(npcSearchQuery) + '">';
    // Disposition-filter chips.
    html += '<div class="npc-filter-chips">';
    var disps = [['all', 'Alle'], ['friendly', 'Friendly'], ['neutral', 'Neutral'], ['hostile', 'Hostile'], ['unknown', 'Unknown']];
    for (var di = 0; di < disps.length; di++) {
        var act = npcFilterDisp === disps[di][0] ? ' active' : '';
        html += '<button class="npc-chip' + act + '" data-action="npc-filter-disp" data-disp="' + disps[di][0] + '">' + disps[di][1] + '</button>';
    }
    html += '</div>';
    if (factions.length) {
        html += '<select class="edit-input npc-faction-filter" data-action="npc-filter-faction">';
        html += '<option value="all"' + (npcFilterFaction === 'all' ? ' selected' : '') + '>Alle facties</option>';
        for (var fj = 0; fj < factions.length; fj++) {
            html += '<option value="' + escapeAttr(factions[fj]) + '"' + (npcFilterFaction === factions[fj] ? ' selected' : '') + '>' + escapeHtml(factions[fj]) + '</option>';
        }
        html += '</select>';
    }
    if (isDM()) {
        html += '<div class="npc-toolbar-dm">';
        html += '<label class="npc-year-label">Huidig jaar <input type="number" class="edit-input npc-year-input" id="npc-current-year" value="' + escapeAttr(String(currentYear)) + '" placeholder="—"></label>';
        html += '<button class="btn btn-primary btn-sm" data-action="add-npc">+ Add NPC</button>';
        html += '</div>';
    }
    html += '</div>';

    // Filteren: zoekterm + disposition + faction.
    var q = npcSearchQuery.toLowerCase();
    var list = [];
    for (var ni = 0; ni < npcs.length; ni++) {
        var npc = npcs[ni];
        if (npcFilterDisp !== 'all' && (npc.disposition || 'unknown') !== npcFilterDisp) continue;
        if (npcFilterFaction !== 'all' && (npc.faction || '') !== npcFilterFaction) continue;
        if (q) {
            var hay = [npc.name, npc.race, npc.npcClass, npc.profession, npc.faction, npc.religion, npc.location, npc.notes].join(' ').toLowerCase();
            if (hay.indexOf(q) < 0) continue;
        }
        list.push({ npc: npc, idx: ni });
    }

    if (list.length === 0) {
        html += '<p class="text-dim">' + (npcs.length ? 'Geen NPCs matchen de filters.' : 'Nog geen NPCs.') + '</p>';
        return html;
    }

    html += '<div class="npc-grid">';
    for (var li = 0; li < list.length; li++) {
        var n = list[li].npc;
        var realIdx = list[li].idx;
        var dispColor = npcDispColor(n.disposition);
        html += '<div class="npc-card" data-npc-idx="' + realIdx + '" data-npc-id="' + escapeAttr(n.id || '') + '" style="--npc-disp:' + dispColor + '">';

        // Compacte kaart-face: portret + naam.
        html += '<div class="npc-card-face" data-action="toggle-npc-card">';
        html += '<div class="npc-portrait">';
        if (n.image) html += '<img src="' + escapeAttr(resolveImageSrc(n.image)) + '" alt="" data-fb="' + escapeAttr((n.name || '?').charAt(0).toUpperCase()) + '" onerror="dwImgFallback(this)">';
        else html += '<div class="npc-portrait-empty">' + escapeHtml((n.name || '?').charAt(0).toUpperCase()) + '</div>';
        if (n.disposition) html += '<span class="npc-disp-dot" title="' + escapeAttr(n.disposition) + '"></span>';
        html += '</div>';
        html += '<div class="npc-card-name">' + escapeHtml(n.name || '(naamloos)') + '</div>';
        html += '</div>';

        // Inline-expanded detail (zichtbaar via .expanded; spant volle breedte).
        html += '<div class="npc-expanded">';
        html += '<button class="npc-expanded-close" data-action="toggle-npc-card" title="Sluiten">&times;</button>';
        html += '<div class="npc-expanded-grid">';
        html += '<div class="npc-expanded-portrait">';
        if (n.image) html += '<img src="' + escapeAttr(resolveImageSrc(n.image)) + '" alt="" data-fb="' + escapeAttr((n.name || '?').charAt(0).toUpperCase()) + '" onerror="dwImgFallback(this)">';
        else html += '<div class="npc-portrait-empty">' + escapeHtml((n.name || '?').charAt(0).toUpperCase()) + '</div>';
        html += '</div>';
        html += '<div class="npc-expanded-info">';
        html += '<h3>' + escapeHtml(n.name || '(naamloos)');
        if (n.disposition) html += ' <span class="npc-disposition" style="color:' + dispColor + '">' + escapeHtml(n.disposition) + '</span>';
        html += '</h3>';
        html += renderNPCDetailRows(n, currentYear);
        var npcPrimaryFam = (typeof findPrimaryFamilyByLink === 'function') ? findPrimaryFamilyByLink(null, String(realIdx)) : null;
        if (npcPrimaryFam && npcPrimaryFam.family && typeof renderFamilyDiagram === 'function') {
            html += '<div class="npc-family-section">' + renderFamilyDiagram(npcPrimaryFam.family.id, false) + '</div>';
        }
        if (isDM()) {
            html += '<div class="npc-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="edit-npc" data-npc-idx="' + realIdx + '">' + t('generic.edit') + '</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-npc" data-npc-idx="' + realIdx + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
            html += '</div>';
        }
        html += '</div>'; // npc-expanded-info
        html += '</div>'; // npc-expanded-grid
        html += '</div>'; // npc-expanded
        html += '</div>'; // npc-card
    }
    html += '</div>';
    return html;
}

// ===== Gedeelde entiteit-registry (voedt @-mention links + afbeelding-picker) =====
// Geeft een platte lijst {type, cat, id, name, image, route} over alle stores
// met een stabiele id. `image` is null als de entiteit geen afbeelding heeft.
function collectEntities() {
    var list = [];
    // Characters — eigen route.
    try {
        var ids = (typeof getCharacterIds === 'function') ? getCharacterIds() : [];
        for (var i = 0; i < ids.length; i++) {
            var cfg = (typeof loadCharConfig === 'function') ? loadCharConfig(ids[i]) : null;
            if (!cfg) continue;
            var cimg = (typeof loadImage === 'function') ? (loadImage(ids[i], 'portrait') || '') : '';
            var cdesc = '';
            try { cdesc = (typeof raceDisplayName === 'function' ? raceDisplayName(cfg.race) : (cfg.race || '')) + (cfg.className ? ' ' + (typeof classDisplayName === 'function' ? classDisplayName(cfg.className) : cfg.className) : ''); } catch (e3) {}
            list.push({ type: 'character', cat: 'Characters', id: ids[i], name: cfg.name || ids[i], image: cimg || null, desc: cdesc.trim(), route: '#/characters/' + ids[i] });
        }
    } catch (e) { /* ignore */ }
    // NPCs — Lore-tab, inline-focus.
    try {
        var npcs = (getNPCData().npcs) || [];
        for (var ni = 0; ni < npcs.length; ni++) {
            var n = npcs[ni];
            if (!n || !n.id) continue;
            var ndesc = [n.race, n.npcClass, n.faction].filter(Boolean).join(' · ') || (n.notes || '');
            list.push({ type: 'npc', cat: 'NPCs', id: n.id, name: n.name || '(naamloos)', image: n.image || null, desc: ndesc, route: '#/lore/npcs' });
        }
    } catch (e) { /* ignore */ }
    // Lore-cat entries.
    try {
        var ld = getLoreCatsData();
        Object.keys(ld).forEach(function (c) {
            if (!Array.isArray(ld[c])) return;
            var label = c;
            for (var li = 0; li < LORE_TABS.length; li++) if (LORE_TABS[li].id === c) label = LORE_TABS[li].label;
            ld[c].forEach(function (e2) {
                if (!e2 || !e2.id) return;
                list.push({ type: 'lore', cat: label, loreCat: c, id: e2.id, name: e2.name || '(naamloos)', image: e2.image || null, desc: e2.description || '', route: '#/lore/' + c });
            });
        });
    } catch (e) { /* ignore */ }
    return list;
}

// Singular, uppercase type-label for an entity (used in @-mention suggestions
// and the global Search): CHARACTER / NPC / LOCATION / ITEM / MONSTER / …
var LORE_SINGULAR = {
    items: 'ITEM', places: 'PLACE', monsters: 'MONSTER',
    factions: 'FACTION', religions: 'RELIGION', events: 'EVENT',
    // legacy ids (pre cities+locations → places merge), kept for old mentions
    locations: 'PLACE', cities: 'PLACE'
};
function entityTypeLabel(e) {
    if (!e) return '';
    if (e.type === 'character') return 'CHARACTER';
    if (e.type === 'npc') return 'NPC';
    if (e.type === 'lore') return LORE_SINGULAR[e.loreCat] || String(e.cat || 'LORE').toUpperCase();
    return String(e.type || '').toUpperCase();
}

// Look up a single entity by type+id (used by renderRichText to resolve the
// LIVE name of a mention link, so renaming an entity updates every reference).
function entityById(type, id) {
    var ents = collectEntities();
    for (var i = 0; i < ents.length; i++) {
        if (ents[i].type === type && ents[i].id === id) return ents[i];
    }
    return null;
}

// Render plain user text to safe HTML, turning @-mention tokens
// `[[type:id|naam]]` into clickable entity-links. ORDER MATTERS: escape the
// whole string first (keeps it XSS-safe like before), THEN swap the tokens —
// the id is validated to [a-z0-9_], the href is built by us, and the shown
// name is the entity's CURRENT name (falls back to the snapshot, or plain text
// if the entity no longer exists).
function renderRichText(str) {
    var escaped = escapeHtml(str == null ? '' : String(str));
    return escaped.replace(/\[\[(character|npc|lore):([a-z0-9_]+)(?:\|([^\]]*))?\]\]/gi, function (m, type, id, fallback) {
        type = type.toLowerCase();
        var ent = entityById(type, id);
        if (!ent) {
            // Entity gone — show the snapshot name as plain text (already escaped).
            return (fallback || escapeHtml(id));
        }
        var safeName = escapeHtml(ent.name);
        return '<a href="' + escapeAttr(ent.route) + '" class="entity-link entity-link-' + type + '" ' +
               'data-action="goto-entity" data-etype="' + type + '" data-eid="' + escapeAttr(id) + '">' + safeName + '</a>';
    });
}

// Resolve an image value to a real <img src>. A LIVE reference is stored as
// "@ref:<type>:<id>" (set by the image-picker on Timeline/Notes) — it points
// at an entity's ORIGINAL image and is resolved to that entity's CURRENT image
// at display time, so updating the source updates every reference. Plain URLs
// and base64 pass through unchanged. Returns '' when a ref can't be resolved.
function resolveImageSrc(value) {
    if (typeof value !== 'string' || !value) return value || '';
    if (value.indexOf('@ref:') === 0) {
        var rest = value.slice(5);
        var ci = rest.indexOf(':');
        if (ci < 0) return '';
        var ent = entityById(rest.slice(0, ci), rest.slice(ci + 1));
        return (ent && ent.image) ? ent.image : '';
    }
    return value;
}
function isImageRef(value) {
    return typeof value === 'string' && value.indexOf('@ref:') === 0;
}

// Helpers to render a mention-enabled textarea: the value shows "@Name" while
// a data-mentions attribute carries the name→id map so save can expand it back.
function mentionFieldAttr(text) {
    var map = (typeof mentionsExtract === 'function') ? JSON.stringify(mentionsExtract(text || '')) : '[]';
    return ' data-mentions="' + escapeAttr(map) + '"';
}
function mentionFieldVal(text) {
    return escapeHtml((typeof mentionsToDisplay === 'function') ? mentionsToDisplay(text || '') : (text || ''));
}

// ===== Afbeelding-picker — kies een bestaande afbeelding (slaat een LIVE ref op) =====
// target: { hiddenId, previewId }  of  { onPick: function(refValue, resolvedUrl) }
var _imgPickerTarget = null;
var imgPickerSearch = '';

function openImagePicker(target) {
    _imgPickerTarget = target || null;
    imgPickerSearch = '';
    closeImagePicker();
    var div = document.createElement('div');
    div.className = 'img-picker-active';
    div.innerHTML = renderImagePicker();
    document.body.appendChild(div);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
}
function closeImagePicker() {
    var el = document.querySelector('.img-picker-active');
    if (el) el.remove();
    // Laat de onderliggende modal de body-scroll-lock houden; alleen unlocken
    // als er geen andere modal meer open is.
    if (typeof unlockBodyScroll === 'function' && !document.querySelector('.npc-modal-active, .lore-entry-modal-active, .profile-modal-active')) {
        unlockBodyScroll();
    }
}
function rerenderImagePicker() {
    var el = document.querySelector('.img-picker-active');
    if (el) el.innerHTML = renderImagePicker();
}
function renderImagePicker() {
    var ents = collectEntities().filter(function (e) { return e.image; });
    var q = imgPickerSearch.toLowerCase();
    if (q) ents = ents.filter(function (e) { return (e.name + ' ' + e.cat).toLowerCase().indexOf(q) >= 0; });

    var html = '<div class="modal-overlay img-picker-overlay">';
    html += '<div class="modal-card modal-img-picker">';
    html += '<div class="modal-header"><h2>Kies bestaande afbeelding</h2>';
    html += '<button class="modal-close" data-action="close-img-picker">&times;</button></div>';
    html += '<div class="modal-body">';
    html += '<input type="text" class="edit-input" id="img-picker-search" placeholder="Zoek op naam…" value="' + escapeAttr(imgPickerSearch) + '">';

    if (!ents.length) {
        html += '<p class="text-dim" style="margin-top:1rem;">' + (q ? 'Geen resultaten.' : 'Nog geen afbeeldingen beschikbaar.') + '</p>';
    } else {
        // Groepeer per categorie.
        var groups = {};
        ents.forEach(function (e) { (groups[e.cat] = groups[e.cat] || []).push(e); });
        Object.keys(groups).forEach(function (cat) {
            html += '<div class="img-picker-group"><h3>' + escapeHtml(cat) + '</h3><div class="img-picker-grid">';
            groups[cat].forEach(function (e) {
                html += '<button type="button" class="img-picker-thumb" data-action="select-picker-image" data-ref="' + escapeAttr(e.type + ':' + e.id) + '" data-url="' + escapeAttr(resolveImageSrc(e.image)) + '" title="' + escapeAttr(e.name) + '">';
                html += '<img src="' + escapeAttr(resolveImageSrc(e.image)) + '" alt=""><span>' + escapeHtml(e.name) + '</span>';
                html += '</button>';
            });
            html += '</div></div>';
        });
    }
    html += '</div></div></div>';
    return html;
}
// ref = "type:id" (from the thumb); we store it as a LIVE reference value
// "@ref:type:id". url = the resolved preview src.
function pickExistingImage(ref, url) {
    if (!_imgPickerTarget) { closeImagePicker(); return; }
    var refValue = '@ref:' + ref;
    if (typeof _imgPickerTarget.onPick === 'function') {
        _imgPickerTarget.onPick(refValue, url);
    } else {
        var hid = document.getElementById(_imgPickerTarget.hiddenId);
        if (hid) hid.value = refValue;
        var prev = document.getElementById(_imgPickerTarget.previewId);
        if (prev) prev.innerHTML = '<img src="' + escapeAttr(url) + '" alt="">';
    }
    closeImagePicker();
}

// ===== Globale Search — zoek referenties (zoals @-mentions) overal =====
var searchQuery = '';
var searchShowAll = false;

function openSearch() {
    searchQuery = '';
    searchShowAll = false;
    closeSearch();
    var div = document.createElement('div');
    div.className = 'search-active';
    div.innerHTML = renderSearchOverlay();
    document.body.appendChild(div);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
    setTimeout(function () { var i = document.getElementById('global-search-input'); if (i) i.focus(); }, 30);
}
function closeSearch() {
    var el = document.querySelector('.search-active');
    if (el) el.remove();
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}
function rerenderSearch() {
    var el = document.querySelector('.search-active');
    if (el) el.innerHTML = renderSearchOverlay();
}
function searchResults() {
    var q = searchQuery.trim().toLowerCase();
    var all = collectEntities();
    if (!q) return [];
    return all.filter(function (e) {
        return (e.name || '').toLowerCase().indexOf(q) >= 0 ||
               (entityTypeLabel(e).toLowerCase().indexOf(q) >= 0) ||
               ((e.desc || '').toLowerCase().indexOf(q) >= 0);
    });
}
function renderSearchOverlay() {
    var html = '<div class="modal-overlay search-overlay">';
    html += '<div class="search-panel">';
    html += '<div class="search-bar"><input type="text" id="global-search-input" class="edit-input" placeholder="Zoek characters, NPCs, places, items…" value="' + escapeAttr(searchQuery) + '">';
    html += '<button class="modal-close" data-action="close-search">&times;</button></div>';

    var res = searchResults();
    if (!searchQuery.trim()) {
        html += '<div class="search-hint text-dim">Typ om te zoeken. Klik een resultaat om er naartoe te gaan.</div>';
    } else if (!res.length) {
        html += '<div class="search-hint text-dim">Geen resultaten voor "' + escapeHtml(searchQuery.trim()) + '".</div>';
    } else if (!searchShowAll) {
        // Compacte referentielijst (zoals de @-popup): top 8, klikbaar.
        var top = res.slice(0, 8);
        html += '<div class="search-list">';
        top.forEach(function (e) { html += searchRow(e, false); });
        html += '</div>';
        if (res.length > 8) {
            html += '<button class="btn btn-ghost btn-sm search-showall" data-action="search-show-all">Toon alle ' + res.length + ' resultaten</button>';
        }
    } else {
        // Volledig overzicht: alle resultaten met meer info.
        html += '<div class="search-grid">';
        res.forEach(function (e) { html += searchRow(e, true); });
        html += '</div>';
    }
    html += '</div></div>';
    return html;
}
function searchRow(e, full) {
    var img = resolveImageSrc(e.image);
    var html = '<a class="search-row' + (full ? ' search-row-full' : '') + '" href="' + escapeAttr(e.route) + '" data-action="goto-entity" data-etype="' + e.type + '" data-eid="' + escapeAttr(e.id) + '">';
    html += '<span class="search-thumb">' + (img ? '<img src="' + escapeAttr(img) + '" alt="">' : '<span class="search-thumb-empty">' + escapeHtml((e.name || '?').charAt(0).toUpperCase()) + '</span>') + '</span>';
    html += '<span class="search-row-main"><span class="search-row-name">' + escapeHtml(e.name || '') + '</span>';
    if (full && e.desc) html += '<span class="search-row-desc">' + escapeHtml(e.desc) + '</span>';
    html += '</span>';
    html += '<span class="search-badge">' + escapeHtml(entityTypeLabel(e)) + '</span>';
    html += '</a>';
    return html;
}

// ===== NPC editor-modal (vervangt de oude prompt()-keten) =====
function npcModalField(id, label, value, type) {
    var html = '<div class="npc-form-field">';
    html += '<label class="login-label" for="' + id + '">' + label + '</label>';
    html += '<input type="' + (type || 'text') + '" class="edit-input" id="' + id + '" value="' + escapeAttr(value == null ? '' : String(value)) + '">';
    html += '</div>';
    return html;
}

function renderNPCModal(idx) {
    var data = getNPCData();
    var isNew = (idx === -1 || idx == null);
    var n = isNew ? {} : (data.npcs[idx] || {});

    var html = '<div class="modal-overlay npc-modal-overlay">';
    html += '<div class="modal-card modal-npc">';
    html += '<div class="modal-header">';
    html += '<h2>' + (isNew ? 'Nieuwe NPC' : 'NPC bewerken') + '</h2>';
    html += '<button class="modal-close" data-action="close-npc-modal">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body npc-form" data-npc-idx="' + (isNew ? -1 : idx) + '">';

    // Image upload + preview.
    html += '<div class="npc-form-image">';
    html += '<div class="npc-form-image-preview" id="npc-image-preview">';
    if (n.image) html += '<img src="' + escapeAttr(n.image) + '" alt="">';
    else html += '<span class="npc-portrait-empty">' + escapeHtml((n.name || '?').charAt(0).toUpperCase()) + '</span>';
    html += '</div>';
    html += '<input type="hidden" id="npc-f-image" value="' + escapeAttr(n.image || '') + '">';
    html += '<label class="note-image-upload"><span>' + (n.image ? 'Afbeelding wijzigen' : 'Afbeelding toevoegen') + '</span><input type="file" accept="image/*" data-action="upload-npc-image" style="display:none"></label>';
    if (n.image) html += '<button type="button" class="btn btn-ghost btn-sm" data-action="remove-npc-image">' + t('generic.delete') + '</button>';
    html += '</div>';

    var nfl = npcFirstLast(n);
    html += '<div class="npc-form-grid">';
    html += npcModalField('npc-f-firstName', 'Voornaam', nfl.firstName);
    html += npcModalField('npc-f-lastName', 'Achternaam (familienaam)', nfl.lastName);
    html += npcModalField('npc-f-birthYear', 'Geboortejaar', n.birthYear, 'number');
    html += npcModalField('npc-f-race', 'Race', n.race);
    html += npcModalField('npc-f-class', 'Class', n.npcClass);
    html += npcModalField('npc-f-profession', 'Profession', n.profession);
    html += npcModalField('npc-f-relation', 'Relation', n.relation);
    html += npcModalField('npc-f-faction', 'Faction', n.faction);
    html += npcModalField('npc-f-religion', 'Religion', n.religion);
    html += npcModalField('npc-f-location', 'Location', n.location);
    // Disposition select.
    html += '<div class="npc-form-field"><label class="login-label" for="npc-f-disposition">Disposition</label>';
    html += '<select class="edit-input" id="npc-f-disposition">';
    var dops = ['unknown', 'friendly', 'neutral', 'hostile'];
    for (var i = 0; i < dops.length; i++) {
        html += '<option value="' + dops[i] + '"' + ((n.disposition || 'unknown') === dops[i] ? ' selected' : '') + '>' + dops[i] + '</option>';
    }
    html += '</select></div>';
    html += npcModalField('npc-f-preferences', 'Likes / Preferences', n.preferences);
    html += npcModalField('npc-f-dislikes', 'Dislikes', n.dislikes);
    html += npcModalField('npc-f-pets', 'Pets', n.pets);
    html += '</div>';

    html += '<div class="npc-form-field npc-form-notes"><label class="login-label" for="npc-f-notes">Notes</label>';
    html += '<textarea class="edit-textarea" id="npc-f-notes" rows="4"' + mentionFieldAttr(n.notes) + '>' + mentionFieldVal(n.notes) + '</textarea></div>';

    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-npc-modal">' + t('generic.save') + '</button>';
    html += '<button class="edit-cancel" data-action="close-npc-modal">' + t('generic.cancel') + '</button>';
    html += '</div>';

    html += '</div>'; // modal-body
    html += '</div>'; // modal-card
    html += '</div>'; // modal-overlay
    return html;
}

function openNPCModal(idx) {
    closeNPCModal();
    var div = document.createElement('div');
    div.className = 'npc-modal-active';
    div.innerHTML = renderNPCModal(idx == null ? -1 : idx);
    document.body.appendChild(div);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
    if (typeof autoGrowAll === 'function') autoGrowAll(div);
}
function closeNPCModal() {
    var el = document.querySelector('.npc-modal-active');
    if (el) el.remove();
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}

async function saveNPCModal() {
    var form = document.querySelector('.npc-modal-active .npc-form');
    if (!form) return;
    var idx = parseInt(form.dataset.npcIdx, 10);
    var isNew = isNaN(idx) || idx === -1;
    function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    var firstName = v('npc-f-firstName');
    var lastName = v('npc-f-lastName');
    var name = (firstName + ' ' + lastName).trim();
    if (!name) { var ne = document.getElementById('npc-f-firstName'); if (ne) ne.focus(); return; }
    // Wait for any in-flight Cloudinary upload so we store the URL, not base64.
    var imgEl = document.getElementById('npc-f-image');
    if (imgEl && imgEl._uploadPromise) { try { await imgEl._uploadPromise; } catch (e) {} }

    var data = getNPCData();
    var npc = isNew ? { id: 'npc' + Date.now() } : (data.npcs[idx] || { id: 'npc' + Date.now() });
    var oldImage = npc.image || '';                 // for cleanup-on-replace
    npc.firstName = firstName;
    npc.lastName = lastName;                         // achternaam = familienaam
    npc.name = name;                                 // afgeleide weergavenaam
    npc.image = v('npc-f-image') || null;
    npc.birthYear = v('npc-f-birthYear');
    npc.race = v('npc-f-race');
    npc.npcClass = v('npc-f-class');
    npc.profession = v('npc-f-profession');
    npc.relation = v('npc-f-relation');
    if (typeof npc.family === 'string') delete npc.family; // achternaam vervangt het oude family-veld
    npc.faction = v('npc-f-faction');
    npc.religion = v('npc-f-religion');
    npc.location = v('npc-f-location');
    npc.disposition = v('npc-f-disposition') || 'unknown';
    npc.preferences = v('npc-f-preferences');
    npc.dislikes = v('npc-f-dislikes');
    npc.pets = v('npc-f-pets');
    npc.notes = (typeof mentionsFieldToTokens === 'function') ? mentionsFieldToTokens(document.getElementById('npc-f-notes')) : v('npc-f-notes');

    if (isNew) {
        if (!Array.isArray(data.npcs)) data.npcs = [];
        data.npcs.push(npc);
    } else {
        data.npcs[idx] = npc;
    }
    saveNPCData(data);
    // Clean up the replaced original (safe: refs resolve to the entity). Skip
    // refs/base64; no-op until the delete-worker is configured.
    if (window.DWImages && oldImage && oldImage !== npc.image && DWImages.isHttpUrl(oldImage)) {
        try { DWImages.del(oldImage); } catch (e) {}
    }
    closeNPCModal();
    renderApp();
}

// ===== Lore-entry editor-modal (generieke categorieën) =====
// ===== Per-categorie veld-schema's =====
// Monsters krijgen een 5.5e (2024) stat-block-achtige set velden (NPC-stijl,
// zonder family tree); Items krijgen Beschrijving + Effect. De overige
// categorieën (religions/factions/places/events) houden Omschrijving + Notities.
// type: 'text' | 'number' | 'textarea' (mentions) | 'abilities' (6-cel STR..CHA grid)
var LORE_ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
var LORE_CAT_FIELDS = {
    items: [
        { key: 'description', label: 'Beschrijving', type: 'textarea' },
        { key: 'effect',      label: 'Effect',       type: 'textarea' }
    ],
    monsters: [
        { key: 'size',          label: 'Size',                type: 'text' },
        { key: 'mtype',         label: 'Type',                type: 'text' },
        { key: 'alignment',     label: 'Alignment',           type: 'text' },
        { key: 'cr',            label: 'CR',                  type: 'text' },
        { key: 'profBonus',     label: 'Prof. Bonus',         type: 'number' },
        { key: 'initiative',    label: 'Initiative',          type: 'number' },
        { key: 'ac',            label: 'AC',                  type: 'text' },
        { key: 'hp',            label: 'HP',                  type: 'text' },
        { key: 'speed',         label: 'Speed',               type: 'text' },
        { key: 'abilities',     label: 'Ability Scores',      type: 'abilities' },
        { key: 'saves',         label: 'Saving Throws',       type: 'text' },
        { key: 'skills',        label: 'Skills',              type: 'text' },
        { key: 'resistances',   label: 'Damage Resistances',  type: 'text' },
        { key: 'immunities',    label: 'Damage Immunities',   type: 'text' },
        { key: 'condImmunities',label: 'Condition Immunities',type: 'text' },
        { key: 'vulnerabilities',label:'Vulnerabilities',     type: 'text' },
        { key: 'senses',        label: 'Senses',              type: 'text' },
        { key: 'languages',     label: 'Languages',           type: 'text' },
        { key: 'traits',        label: 'Traits',              type: 'textarea' },
        { key: 'actions',       label: 'Actions',             type: 'textarea' },
        { key: 'legendary',     label: 'Legendary Actions',   type: 'textarea' },
        { key: 'spellcasting',  label: 'Spellcasting',        type: 'textarea' },
        { key: 'description',   label: 'Beschrijving',        type: 'textarea' }
    ]
};
var LORE_CAT_FIELDS_DEFAULT = [
    { key: 'description', label: 'Omschrijving', type: 'textarea' },
    { key: 'notes',       label: 'Notities',     type: 'textarea' }
];
function loreFieldsFor(cat) { return LORE_CAT_FIELDS[cat] || LORE_CAT_FIELDS_DEFAULT; }

function abilityMod(score) {
    var n = parseInt(score, 10);
    if (isNaN(n)) return '';
    var m = Math.floor((n - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
}

function renderLoreEntryModal(cat, idx) {
    var entries = getLoreCatEntries(cat);
    var isNew = (idx === -1 || idx == null);
    var e = isNew ? {} : (entries[idx] || {});
    var label = cat;
    for (var t2 = 0; t2 < LORE_TABS.length; t2++) if (LORE_TABS[t2].id === cat) label = LORE_TABS[t2].label.replace(/s$/, '');

    var html = '<div class="modal-overlay lore-entry-modal-overlay">';
    html += '<div class="modal-card modal-npc">';
    html += '<div class="modal-header">';
    html += '<h2>' + (isNew ? 'Nieuw: ' + escapeHtml(label) : escapeHtml(label) + ' bewerken') + '</h2>';
    html += '<button class="modal-close" data-action="close-lore-entry-modal">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body npc-form lore-entry-form" data-cat="' + cat + '" data-entry-idx="' + (isNew ? -1 : idx) + '">';

    html += '<div class="npc-form-image">';
    html += '<div class="npc-form-image-preview" id="lore-entry-image-preview">';
    if (e.image) html += '<img src="' + escapeAttr(e.image) + '" alt="">';
    else html += '<span class="npc-portrait-empty">' + escapeHtml((e.name || '?').charAt(0).toUpperCase()) + '</span>';
    html += '</div>';
    html += '<input type="hidden" id="lore-entry-f-image" value="' + escapeAttr(e.image || '') + '">';
    html += '<label class="note-image-upload"><span>' + (e.image ? 'Afbeelding wijzigen' : 'Afbeelding toevoegen') + '</span><input type="file" accept="image/*" data-action="upload-lore-entry-image" style="display:none"></label>';
    if (e.image) html += '<button type="button" class="btn btn-ghost btn-sm" data-action="remove-lore-entry-image">' + t('generic.delete') + '</button>';
    html += '</div>';

    html += '<div class="npc-form-field"><label class="login-label" for="lore-entry-f-name">Naam</label>';
    html += '<input type="text" class="edit-input" id="lore-entry-f-name" value="' + escapeAttr(e.name || '') + '"></div>';

    var fields = loreFieldsFor(cat);
    for (var fi = 0; fi < fields.length; fi++) {
        var f = fields[fi];
        if (f.type === 'abilities') {
            var ab = e.abilities || {};
            html += '<div class="npc-form-field"><label class="login-label">' + escapeHtml(f.label) + '</label>';
            html += '<div class="lore-ab-edit">';
            for (var ai = 0; ai < LORE_ABILITY_KEYS.length; ai++) {
                var ak = LORE_ABILITY_KEYS[ai];
                html += '<div class="lore-ab-edit-cell"><span class="lore-ab-edit-label">' + ak.toUpperCase() + '</span>';
                html += '<input type="number" class="edit-input" id="lore-entry-f-ab-' + ak + '" value="' + escapeAttr(ab[ak] != null ? ab[ak] : '') + '"></div>';
            }
            html += '</div></div>';
        } else if (f.type === 'textarea') {
            html += '<div class="npc-form-field"><label class="login-label" for="lore-entry-f-' + f.key + '">' + escapeHtml(f.label) + '</label>';
            html += '<textarea class="edit-textarea" id="lore-entry-f-' + f.key + '" rows="3"' + mentionFieldAttr(e[f.key]) + '>' + mentionFieldVal(e[f.key]) + '</textarea></div>';
        } else {
            html += '<div class="npc-form-field"><label class="login-label" for="lore-entry-f-' + f.key + '">' + escapeHtml(f.label) + '</label>';
            html += '<input type="' + (f.type === 'number' ? 'number' : 'text') + '" class="edit-input" id="lore-entry-f-' + f.key + '" value="' + escapeAttr(e[f.key] != null ? e[f.key] : '') + '"></div>';
        }
    }

    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-lore-entry-modal">' + t('generic.save') + '</button>';
    html += '<button class="edit-cancel" data-action="close-lore-entry-modal">' + t('generic.cancel') + '</button>';
    html += '</div>';

    html += '</div></div></div>';
    return html;
}

function openLoreEntryModal(cat, idx) {
    closeLoreEntryModal();
    var div = document.createElement('div');
    div.className = 'lore-entry-modal-active';
    div.innerHTML = renderLoreEntryModal(cat, idx == null ? -1 : idx);
    document.body.appendChild(div);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();
    if (typeof autoGrowAll === 'function') autoGrowAll(div);
}
function closeLoreEntryModal() {
    var el = document.querySelector('.lore-entry-modal-active');
    if (el) el.remove();
    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
}
async function saveLoreEntryModal() {
    var form = document.querySelector('.lore-entry-modal-active .lore-entry-form');
    if (!form) return;
    var cat = form.dataset.cat;
    var idx = parseInt(form.dataset.entryIdx, 10);
    var isNew = isNaN(idx) || idx === -1;
    function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    var name = v('lore-entry-f-name');
    if (!name) { var ne = document.getElementById('lore-entry-f-name'); if (ne) ne.focus(); return; }
    var imgEl2 = document.getElementById('lore-entry-f-image');
    if (imgEl2 && imgEl2._uploadPromise) { try { await imgEl2._uploadPromise; } catch (e) {} }

    var data = getLoreCatsData();
    if (!Array.isArray(data[cat])) data[cat] = [];
    var entry = isNew ? { id: 'le' + Date.now() } : (data[cat][idx] || { id: 'le' + Date.now() });
    var oldImage = entry.image || '';               // for cleanup-on-replace
    entry.name = name;
    entry.image = v('lore-entry-f-image') || null;

    var fields = loreFieldsFor(cat);
    for (var fi = 0; fi < fields.length; fi++) {
        var f = fields[fi];
        if (f.type === 'abilities') {
            var ab = {};
            var any = false;
            for (var ai = 0; ai < LORE_ABILITY_KEYS.length; ai++) {
                var ak = LORE_ABILITY_KEYS[ai];
                var av = v('lore-entry-f-ab-' + ak);
                if (av !== '') { ab[ak] = parseInt(av, 10); any = true; }
            }
            entry.abilities = any ? ab : null;
        } else if (f.type === 'textarea') {
            var taEl = document.getElementById('lore-entry-f-' + f.key);
            entry[f.key] = (typeof mentionsFieldToTokens === 'function') ? mentionsFieldToTokens(taEl) : (taEl ? taEl.value.trim() : '');
        } else if (f.type === 'number') {
            var nv = v('lore-entry-f-' + f.key);
            entry[f.key] = nv === '' ? null : (isNaN(parseFloat(nv)) ? nv : parseFloat(nv));
        } else {
            entry[f.key] = v('lore-entry-f-' + f.key);
        }
    }
    if (isNew) data[cat].push(entry);
    else data[cat][idx] = entry;
    saveLoreCatsData(data);
    if (window.DWImages && oldImage && oldImage !== entry.image && DWImages.isHttpUrl(oldImage)) {
        try { DWImages.del(oldImage); } catch (e) {}
    }
    closeLoreEntryModal();
    renderApp();
}

// Party-tab inner content (geen page-wrapper; zit in de lore-tab-shell).
function renderLorePartyInner() {
    var html = '<p class="section-intro">' + t('lore.theparty.intro') + '</p>';
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
    return html;
}

// Legacy standalone route (#/lore/party rendert nu via de tab-shell, maar
// houd deze voor eventuele directe call-sites).
function renderLoreParty() {
    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="/lore/party">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + t('lore.theparty') + '</h1>';
    html += renderLorePartyInner();
    html += '</div>';
    return html;
}

// ===== Generieke lore-categorie entries (items/religions/factions/places/
// monsters/events). E\u00e9n store, gefilterd per categorie. =====
function getLoreCatsData() {
    var saved = localStorage.getItem('dw_lore_cats');
    if (saved) {
        try {
            var p = JSON.parse(saved);
            if (p && typeof p === 'object') return _migrateLoreCatsToPlaces(p);
        } catch (e) {}
    }
    return {};
}
// One-time merge: the old 'cities' + 'locations' categories collapse into a
// single 'places'. Runs once (the legacy keys are removed + persisted, so it
// is idempotent on the next read).
function _migrateLoreCatsToPlaces(data) {
    var hadLegacy = Array.isArray(data.cities) || Array.isArray(data.locations);
    if (!hadLegacy) return data;
    var places = Array.isArray(data.places) ? data.places : [];
    if (Array.isArray(data.locations)) places = places.concat(data.locations);
    if (Array.isArray(data.cities))    places = places.concat(data.cities);
    data.places = places;
    delete data.locations;
    delete data.cities;
    try {
        localStorage.setItem('dw_lore_cats', JSON.stringify(data));
        if (typeof syncUpload === 'function') syncUpload('dw_lore_cats');
    } catch (e) {}
    return data;
}
function saveLoreCatsData(data) {
    localStorage.setItem('dw_lore_cats', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_lore_cats');
}
function getLoreCatEntries(cat) {
    var data = getLoreCatsData();
    return Array.isArray(data[cat]) ? data[cat] : [];
}

// Per-categorie zoekterm (module-level, zoals notesSearch).
var loreCatSearch = '';

// Render the type-specific info for a lore entry (shown in the expanded card
// and on hover). Iterates the category's field-schema, skipping empties.
function renderLoreEntryInfo(cat, e) {
    var fields = loreFieldsFor(cat);
    var html = '';
    for (var fi = 0; fi < fields.length; fi++) {
        var f = fields[fi];
        if (f.type === 'abilities') {
            var ab = e.abilities;
            if (!ab) continue;
            var hasAny = LORE_ABILITY_KEYS.some(function (k) { return ab[k] != null; });
            if (!hasAny) continue;
            html += '<div class="lore-ab-grid">';
            for (var ai = 0; ai < LORE_ABILITY_KEYS.length; ai++) {
                var ak = LORE_ABILITY_KEYS[ai];
                var sc = ab[ak];
                html += '<div class="lore-ab-cell"><span class="lore-ab-name">' + ak.toUpperCase() + '</span>';
                html += '<span class="lore-ab-score">' + (sc != null ? escapeHtml(String(sc)) : '—') + '</span>';
                html += '<span class="lore-ab-mod">' + (sc != null ? escapeHtml(abilityMod(sc)) : '') + '</span></div>';
            }
            html += '</div>';
            continue;
        }
        var val = e[f.key];
        if (val == null || val === '') continue;
        if (f.type === 'textarea') {
            html += '<div class="lore-info-block"><span class="lore-info-label">' + escapeHtml(f.label) + '</span>';
            html += '<div class="lore-info-text">' + renderRichText(val) + '</div></div>';
        } else {
            html += '<div class="lore-info-row"><span class="lore-info-label">' + escapeHtml(f.label) + '</span>';
            html += '<span class="lore-info-val">' + escapeHtml(String(val)) + '</span></div>';
        }
    }
    return html;
}

function renderLoreCategory(cat) {
    if (typeof syncReady === 'undefined' || !syncReady) ensureEntityIds();
    var entries = getLoreCatEntries(cat);
    var label = cat;
    for (var t2 = 0; t2 < LORE_TABS.length; t2++) if (LORE_TABS[t2].id === cat) label = LORE_TABS[t2].label;

    var html = '<div class="lore-cat-toolbar">';
    html += '<input type="text" class="edit-input lore-cat-search" id="lore-cat-search" placeholder="Zoek in ' + escapeAttr(label) + '\u2026" value="' + escapeAttr(loreCatSearch) + '">';
    if (isDM()) {
        html += '<button class="btn btn-primary btn-sm" data-action="add-lore-entry" data-cat="' + cat + '">+ ' + escapeHtml(label.replace(/s$/, '')) + '</button>';
    }
    html += '</div>';

    var q = loreCatSearch.toLowerCase();
    var filtered = entries.filter(function (e) {
        if (!q) return true;
        return (e.name && e.name.toLowerCase().indexOf(q) >= 0) ||
               (e.description && e.description.toLowerCase().indexOf(q) >= 0) ||
               (e.notes && e.notes.toLowerCase().indexOf(q) >= 0);
    });

    if (!filtered.length) {
        html += '<p class="text-dim">' + (q ? 'Geen resultaten voor "' + escapeHtml(loreCatSearch) + '".' : 'Nog niets in ' + escapeHtml(label) + '.') + '</p>';
        return html;
    }

    html += '<div class="lore-entry-grid lore-grid-' + cat + '">';
    for (var i = 0; i < filtered.length; i++) {
        var e = filtered[i];
        var realIdx = entries.indexOf(e);
        var infoHtml = renderLoreEntryInfo(cat, e);
        html += '<div class="lore-entry-card" data-cat="' + cat + '" data-entry-idx="' + realIdx + '" data-entry-id="' + escapeAttr(e.id || '') + '" data-action="toggle-lore-entry">';
        // Image (2:3 portrait) or initial-placeholder — always visible.
        if (e.image) {
            html += '<div class="lore-entry-img"><img src="' + escapeAttr(e.image) + '" alt=""></div>';
        } else {
            html += '<div class="lore-entry-img lore-entry-img-empty"><span>' + escapeHtml((e.name || '?').charAt(0).toUpperCase()) + '</span></div>';
        }
        html += '<div class="lore-entry-body">';
        html += '<h3 class="lore-entry-name">' + escapeHtml(e.name || '(naamloos)') + '</h3>';
        if (infoHtml) html += '<div class="lore-entry-info">' + infoHtml + '</div>';
        if (isDM()) {
            html += '<div class="lore-entry-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="edit-lore-entry" data-cat="' + cat + '" data-entry-idx="' + realIdx + '">' + t('generic.edit') + '</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-lore-entry" data-cat="' + cat + '" data-entry-idx="' + realIdx + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
            html += '</div>';
        }
        html += '</div>';
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
    { id: 'items', name: 'Items', icon: '\ud83c\udf92', color: '#fb923c' },
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
            if (!cat) cat = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];

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
                html += '<div class="note-card-img"><img src="' + escapeAttr(resolveImageSrc(note.image)) + '" alt=""></div>';
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
    var noteImgRefAttr = isImageRef(image) ? (' data-image-ref="' + escapeAttr(image) + '"') : '';
    html += '<div class="note-image-section" style="display:' + (singleImageLayouts.indexOf(layout) >= 0 ? 'block' : 'none') + '"' + noteImgRefAttr + '>';
    if (image) {
        html += '<div class="note-image-preview"><img src="' + escapeAttr(resolveImageSrc(image)) + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">' + t('generic.delete') + '</button></div>';
    } else {
        html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
    }
    html += '<button type="button" class="btn btn-ghost btn-sm" data-action="pick-note-image">Kies bestaande</button>';
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
    html += '<textarea class="edit-textarea note-content-input" id="note-content" placeholder="' + t('notes.notecontent') + '"' + mentionFieldAttr(content) + ' style="display:' + (layout === 'checklist' ? 'none' : 'block') + '">' + mentionFieldVal(content) + '</textarea>';

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
        if (!tagCat) tagCat = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];
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
    if (!cat) cat = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];

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
        html += '<div class="note-view-img"><img src="' + escapeAttr(resolveImageSrc(note.image)) + '" alt=""></div>';
    }

    html += '<div class="note-view-content">';
    if (note.image && note.layout === 'image-left') {
        html += '<div class="note-view-img-side"><img src="' + escapeAttr(resolveImageSrc(note.image)) + '" alt=""></div>';
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
                var lines = renderRichText(paragraphs[p].trim()).replace(/\n/g, '<br>');
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
            if (!tagCatObj) tagCatObj = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];
            html += '<span class="note-tag" style="border-left:3px solid ' + tagCatObj.color + ';padding-left:0.4rem;">' + tagCatObj.icon + ' ' + escapeHtml(tagText) + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    if (note.image && note.layout === 'image-right') {
        html += '<div class="note-view-img-side"><img src="' + escapeAttr(resolveImageSrc(note.image)) + '" alt=""></div>';
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

// Character-page tooltips (spell/ability/info) removed with the dashboard nuke.
// Generic tooltip popup (showTooltipPopup/removeTooltipPopup) stays for maps + future use.

