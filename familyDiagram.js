// ============================================================
// D&D Within — Family Diagram Renderer
// ============================================================
//
// Public:
//   renderFamilyDiagram(familyId, editable)  → HTML string
//   postRenderFamilyDiagram(familyId)        → draws SVG lines after DOM mount
// ============================================================

function renderFamilyDiagram(familyId, editable) {
    var view = (typeof getFamilyView === 'function') ? getFamilyView(familyId) : null;
    if (!view) return '<p class="text-dim">Family niet gevonden.</p>';

    var fam = view.family;
    var layout = layoutFamilyDiagram(view);

    var html = '<div class="famdiag-wrap" data-family-id="' + escapeAttr(familyId) + '">';
    html += '<div class="famdiag-header">';
    html += '<h3 class="famdiag-title">' + escapeHtml(fam.surname || '(geen achternaam)') + '</h3>';
    if (editable) {
        html += '<div class="famdiag-header-actions">';
        html += '<div class="famdiag-zoom" data-family-id="' + escapeAttr(familyId) + '">';
        html += '<button data-action="famdiag-zoom-fit" data-family-id="' + escapeAttr(familyId) + '" title="Fit to screen">Fit</button>';
        html += '<input type="range" min="0.4" max="1.5" step="0.05" value="1" data-action="famdiag-zoom-slider" data-family-id="' + escapeAttr(familyId) + '">';
        html += '<span class="famdiag-zoom-pct" id="famdiag-zoom-pct-' + escapeAttr(familyId) + '">100%</span>';
        html += '</div>';
        html += '<button class="btn btn-ghost btn-sm" data-action="famdiag-rename" data-family-id="' + escapeAttr(familyId) + '">Rename</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="famdiag-add-root" data-family-id="' + escapeAttr(familyId) + '">+ Member</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="famdiag-delete-family" data-family-id="' + escapeAttr(familyId) + '" style="color:var(--danger);">Delete</button>';
        html += '</div>';
    }
    html += '</div>';

    if (Object.keys(layout.nodes).length === 0) {
        html += '<p class="text-dim" style="padding:1rem;">Nog geen leden in deze familie.</p>';
        if (editable) {
            html += '<div class="famdiag-empty-add">';
            html += '<button class="btn btn-primary btn-sm" data-action="famdiag-add-root" data-family-id="' + escapeAttr(familyId) + '">+ Eerste lid toevoegen</button>';
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    html += '<div class="famdiag-canvas-scroll">';
    html += '<div class="famdiag-canvas" id="famdiag-canvas-' + escapeAttr(familyId) + '" style="width:' + layout.width + 'px;height:' + layout.height + 'px;">';
    html += '<svg class="famdiag-svg" id="famdiag-svg-' + escapeAttr(familyId) + '" width="' + layout.width + '" height="' + layout.height + '"></svg>';

    // Cards
    var nodeKeys = Object.keys(layout.nodes);
    for (var i = 0; i < nodeKeys.length; i++) {
        var memberId = nodeKeys[i];
        var pos = layout.nodes[memberId];
        var member = view.members[memberId];
        if (!member) continue;
        html += renderMemberCard(member, pos, editable, view, layout);
    }

    // Union dots (child-add) — only for editable, on partner-line midpoint
    if (editable) {
        var unionKeys = Object.keys(layout.unions);
        for (var u = 0; u < unionKeys.length; u++) {
            var uid = unionKeys[u];
            var upos = layout.unions[uid];
            html += '<button class="famdiag-dot famdiag-dot-childadd" ';
            html += 'style="left:' + (upos.x - 9) + 'px;top:' + (upos.y - 9) + 'px;" ';
            html += 'data-action="famdiag-add-child" data-union-id="' + escapeAttr(uid) + '" data-family-id="' + escapeAttr(familyId) + '" ';
            html += 'title="Voeg kind toe">+</button>';
        }
    }

    html += '</div>'; // canvas
    html += '</div>'; // canvas-scroll
    html += '</div>'; // wrap
    return html;
}

function renderMemberCard(member, pos, editable, view, layout) {
    var familyId = view.family.id;
    var isGuest = pos.isGuest;
    var classes = ['famdiag-card'];
    if (isGuest) classes.push('famdiag-card-guest');
    if (member.death) classes.push('famdiag-card-deceased');

    var link = (typeof resolveMemberLink === 'function') ? resolveMemberLink(member) : null;
    var clickable = !!link;

    var html = '<div class="' + classes.join(' ') + '" ';
    html += 'style="left:' + pos.x + 'px;top:' + pos.y + 'px;width:' + pos.w + 'px;height:' + pos.h + 'px;" ';
    html += 'data-member-id="' + escapeAttr(member.id) + '" data-family-id="' + escapeAttr(familyId) + '">';

    // Card content
    var fullName = (member.firstName || '') + (member.lastName ? ' ' + member.lastName : '');
    html += '<div class="famdiag-card-name"';
    if (clickable) html += ' data-action="famdiag-open-link" data-link-type="' + link.type + '" data-link-id="' + escapeAttr(String(link.id)) + '" style="cursor:pointer;"';
    html += '>' + escapeHtml(fullName.trim() || '(naamloos)') + '</div>';

    // Years line
    var years = '';
    if (member.birth || member.death) {
        years = (member.birth ? '★ ' + escapeHtml(member.birth) : '') + (member.death ? ' † ' + escapeHtml(member.death) : '');
    }
    if (years) html += '<div class="famdiag-card-years">' + years + '</div>';

    // Race + gender
    var meta = [];
    if (member.race) meta.push(escapeHtml(member.race));
    if (member.gender) meta.push(escapeHtml(member.gender));
    if (meta.length) html += '<div class="famdiag-card-meta">' + meta.join(' · ') + '</div>';

    // Edit/remove buttons (small, top-right)
    if (editable) {
        html += '<button class="famdiag-card-edit" data-action="famdiag-edit-member" data-member-id="' + escapeAttr(member.id) + '" title="Bewerk">&#9998;</button>';
        if (!isGuest) {
            html += '<button class="famdiag-card-remove" data-action="famdiag-remove-member" data-member-id="' + escapeAttr(member.id) + '" title="Verwijder">&times;</button>';
        }
    }

    // Add-dots (only when editable)
    if (editable) {
        // Partner add (left + right) — only if not guest, not currently in 2-partner union (skip if already partnered on that side)
        if (!isGuest) {
            html += '<button class="famdiag-dot famdiag-dot-partner-l" data-action="famdiag-add-partner" data-member-id="' + escapeAttr(member.id) + '" data-side="left" title="Partner links">+</button>';
            html += '<button class="famdiag-dot famdiag-dot-partner-r" data-action="famdiag-add-partner" data-member-id="' + escapeAttr(member.id) + '" data-side="right" title="Partner rechts">+</button>';
        }
        // Parent-add (top center)
        if (!isGuest) {
            html += '<button class="famdiag-dot famdiag-dot-parent" data-action="famdiag-add-parent" data-member-id="' + escapeAttr(member.id) + '" title="Ouder toevoegen">+</button>';
        }
    }

    html += '</div>';
    return html;
}

// ============================================================
// SVG line drawing (90° polylines)
// ============================================================

function postRenderFamilyDiagram(familyId) {
    var svg = document.getElementById('famdiag-svg-' + familyId);
    if (!svg) return;
    var view = (typeof getFamilyView === 'function') ? getFamilyView(familyId) : null;
    if (!view) return;
    var layout = layoutFamilyDiagram(view);

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // For each union: draw partner-line + child-tree
    var unionKeys = Object.keys(layout.unions);
    for (var u = 0; u < unionKeys.length; u++) {
        var uid = unionKeys[u];
        var upos = layout.unions[uid];
        var union = view.unions[uid];
        if (!union) continue;

        // Partner line
        if (upos.hasPartnerLine) {
            _famdrawLine(svg, upos.ax, upos.partnerY, upos.bx, upos.partnerY, 'famdiag-line-partner');
        }

        // Children
        var visibleChildren = [];
        for (var c = 0; c < union.childIds.length; c++) {
            var cid = union.childIds[c];
            if (layout.nodes[cid]) visibleChildren.push(cid);
        }
        if (visibleChildren.length === 0) continue;

        // Determine drop-down start point
        var startX, startY;
        if (upos.hasPartnerLine) {
            startX = upos.x;
            startY = upos.partnerY;
        } else {
            // single parent: start from bottom-center of partner card
            startX = upos.x;
            startY = upos.partnerY; // already at bottom of card
        }

        // Mid Y = halfway between startY and top of child cards
        var firstChild = layout.nodes[visibleChildren[0]];
        var childTopY = firstChild.y;
        var midY = (startY + childTopY) / 2;

        // Drop from union to midY
        _famdrawLine(svg, startX, startY, startX, midY, 'famdiag-line-child');

        // Horizontal bar across all children center-x's
        var childCenters = visibleChildren.map(function(cid) {
            var n = layout.nodes[cid];
            return { x: n.x + n.w / 2, y: n.y };
        });
        if (childCenters.length > 1) {
            var minX = Math.min.apply(null, childCenters.map(function(p) { return p.x; }));
            var maxX = Math.max.apply(null, childCenters.map(function(p) { return p.x; }));
            // Make sure horizontal bar covers startX too
            minX = Math.min(minX, startX);
            maxX = Math.max(maxX, startX);
            _famdrawLine(svg, minX, midY, maxX, midY, 'famdiag-line-child');
        } else {
            // single child: connect startX→childCenter horizontally if offset
            if (childCenters[0].x !== startX) {
                _famdrawLine(svg, startX, midY, childCenters[0].x, midY, 'famdiag-line-child');
            }
        }
        // Drops to each child top
        for (var cc = 0; cc < childCenters.length; cc++) {
            _famdrawLine(svg, childCenters[cc].x, midY, childCenters[cc].x, childCenters[cc].y, 'famdiag-line-child');
        }
    }
}

function _famdrawLine(svg, x1, y1, x2, y2, cls) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', cls || 'famdiag-line');
    svg.appendChild(line);
}
