// ============================================================
// D&D Within — Family Diagram Layout
// ============================================================
//
// Input:  view from getFamilyView(familyId): { family, members, unions }
// Output: {
//   width, height,
//   nodes:  { memberId: { x, y, w, h, isGuest, depth } },     // top-left coords
//   unions: { unionId:  { x, y, ax, bx, partnerY, hasPartnerLine } }
// }
//
// Coordinates assume an outer container with absolute-positioned cards.
// SVG overlay gets the same width/height; the renderer draws lines using
// member/union coords (90° polylines).
// ============================================================

var FAMILY_LAYOUT_DEFAULTS = {
    cardW: 150,
    cardH: 80,
    hgap: 40,
    vgap: 84,
    pad: 30
};

function layoutFamilyDiagram(view, opts) {
    opts = opts || {};
    var cardW = opts.cardW || FAMILY_LAYOUT_DEFAULTS.cardW;
    var cardH = opts.cardH || FAMILY_LAYOUT_DEFAULTS.cardH;
    var hgap = opts.hgap || FAMILY_LAYOUT_DEFAULTS.hgap;
    var vgap = opts.vgap || FAMILY_LAYOUT_DEFAULTS.vgap;
    var pad = opts.pad || FAMILY_LAYOUT_DEFAULTS.pad;

    var familyId = view.family.id;
    var members = view.members;   // map id → member
    var unions = view.unions;      // map id → union (only those touching this family)

    // === Build adjacency ===
    var unionsAsPartner = {}; // memberId → [unionIds]
    var unionAsChildOf = {};  // memberId → unionId
    var unionIds = Object.keys(unions);
    for (var i = 0; i < unionIds.length; i++) {
        var u = unions[unionIds[i]];
        for (var p = 0; p < u.partnerIds.length; p++) {
            var pm = u.partnerIds[p];
            if (!members[pm]) continue;
            (unionsAsPartner[pm] = unionsAsPartner[pm] || []).push(u.id);
        }
        for (var c = 0; c < u.childIds.length; c++) {
            var cm = u.childIds[c];
            if (!members[cm]) continue;
            unionAsChildOf[cm] = u.id;
        }
    }

    // === Pick "primary" union per member: prefer one whose familyId === current family ===
    function primaryUnionOf(memberId) {
        var list = unionsAsPartner[memberId] || [];
        if (!list.length) return null;
        for (var k = 0; k < list.length; k++) if (unions[list[k]].familyId === familyId) return unions[list[k]];
        return unions[list[0]];
    }

    // === Determine roots ===
    // A member is a root if:
    //  - they have no parent-union in view, OR
    //  - their parent-union exists outside the view (already filtered out of `unions`)
    // To keep partners under the right group, only "primary" partners get to be group-roots.
    var visited = {}; // memberId → true once placed in a group as primary
    var roots = [];
    var memberIds = Object.keys(members);
    for (var m = 0; m < memberIds.length; m++) {
        var mm = members[memberIds[m]];
        if (!mm) continue;
        if (mm.familyId !== familyId) continue; // guests are placed via their union
        if (unionAsChildOf[mm.id]) continue; // has a parent in view → not a root
        roots.push(mm.id);
    }
    // Stable ordering by birth then firstName for determinism
    roots.sort(function(a, b) {
        var ma = members[a], mb = members[b];
        var ya = parseInt(ma.birth, 10), yb = parseInt(mb.birth, 10);
        if (!isNaN(ya) && !isNaN(yb)) return ya - yb;
        return (ma.firstName || '').localeCompare(mb.firstName || '');
    });

    var output = {
        nodes: {},
        unions: {},
        width: 0,
        height: 0
    };

    // Recursive layout: returns { width, members:{id:{x,y}}, unions:{id:{x,y,...}} }
    // x/y coordinates are RELATIVE to the group's top-left.
    function layoutGroup(memberId, depth, depthLimit) {
        if (visited[memberId]) {
            return { width: 0, height: 0, members: {}, unions: {} };
        }
        visited[memberId] = true;

        var primaryUnion = primaryUnionOf(memberId);
        var partnerY = depth * (cardH + vgap);

        // No partner → leaf-ish (may still have children via singleton union)
        if (!primaryUnion) {
            var nodes = {};
            nodes[memberId] = { x: 0, y: partnerY, w: cardW, h: cardH, isGuest: false, depth: depth };
            return { width: cardW, height: partnerY + cardH, members: nodes, unions: {} };
        }

        // Identify partner B (≠ self), if any
        var partnerB = null;
        for (var pp = 0; pp < primaryUnion.partnerIds.length; pp++) {
            if (primaryUnion.partnerIds[pp] !== memberId) { partnerB = primaryUnion.partnerIds[pp]; break; }
        }

        // Children of primary union (only those in view)
        var childIds = [];
        for (var cc = 0; cc < primaryUnion.childIds.length; cc++) {
            if (members[primaryUnion.childIds[cc]]) childIds.push(primaryUnion.childIds[cc]);
        }
        // Sort children by birth
        childIds.sort(function(a, b) {
            var ya = parseInt(members[a].birth, 10), yb = parseInt(members[b].birth, 10);
            if (!isNaN(ya) && !isNaN(yb)) return ya - yb;
            return (members[a].firstName || '').localeCompare(members[b].firstName || '');
        });

        // Layout child groups
        var childGroups = [];
        var childrenTotalW = 0;
        var maxChildHeight = 0;
        for (var ci = 0; ci < childIds.length; ci++) {
            var cg = layoutGroup(childIds[ci], depth + 1, depthLimit);
            if (cg.width === 0) continue;
            childGroups.push(cg);
            childrenTotalW += cg.width;
            if (cg.height > maxChildHeight) maxChildHeight = cg.height;
        }
        if (childGroups.length > 1) childrenTotalW += hgap * (childGroups.length - 1);

        // Partner row width
        var partnerRowW = partnerB ? (cardW * 2 + hgap) : cardW;
        var groupW = Math.max(partnerRowW, childrenTotalW);

        var nodesOut = {};
        var unionsOut = {};

        // Place partner cards centered within groupW
        var partnerRowStartX = (groupW - partnerRowW) / 2;
        var aX = partnerRowStartX;
        nodesOut[memberId] = { x: aX, y: partnerY, w: cardW, h: cardH, isGuest: false, depth: depth };

        var unionMidX, unionMidY = partnerY + cardH / 2;
        if (partnerB) {
            var bX = aX + cardW + hgap;
            var bMember = members[partnerB];
            var isGuest = bMember && bMember.familyId !== familyId;
            nodesOut[partnerB] = { x: bX, y: partnerY, w: cardW, h: cardH, isGuest: !!isGuest, depth: depth };
            unionMidX = aX + cardW + hgap / 2;
            unionsOut[primaryUnion.id] = {
                x: unionMidX,
                y: unionMidY,
                ax: aX + cardW,         // right edge of A
                bx: bX,                 // left edge of B
                partnerY: unionMidY,
                hasPartnerLine: true
            };
            // Mark partner as visited so they're not laid out again as another root
            visited[partnerB] = true;
        } else {
            unionMidX = aX + cardW / 2;
            unionsOut[primaryUnion.id] = {
                x: unionMidX,
                y: partnerY + cardH,
                ax: unionMidX,
                bx: unionMidX,
                partnerY: partnerY + cardH,
                hasPartnerLine: false
            };
        }

        // Place children
        var childRowStartX = (groupW - childrenTotalW) / 2;
        var cx = childRowStartX;
        for (var cgi = 0; cgi < childGroups.length; cgi++) {
            var cg2 = childGroups[cgi];
            // Shift cg2 nodes by (cx, 0) and add to nodesOut
            var ckeys = Object.keys(cg2.members);
            for (var ck = 0; ck < ckeys.length; ck++) {
                var n = cg2.members[ckeys[ck]];
                nodesOut[ckeys[ck]] = { x: n.x + cx, y: n.y, w: n.w, h: n.h, isGuest: n.isGuest, depth: n.depth };
            }
            var ukeys = Object.keys(cg2.unions);
            for (var uk = 0; uk < ukeys.length; uk++) {
                var uo = cg2.unions[ukeys[uk]];
                unionsOut[ukeys[uk]] = { x: uo.x + cx, y: uo.y, ax: uo.ax + cx, bx: uo.bx + cx, partnerY: uo.partnerY, hasPartnerLine: uo.hasPartnerLine };
            }
            cx += cg2.width + hgap;
        }

        var totalH = partnerY + cardH + (childGroups.length ? vgap + maxChildHeight - (depth + 1) * (cardH + vgap) : 0);
        // Simpler height: deepest child y+h
        var actualH = partnerY + cardH;
        if (childGroups.length) {
            actualH = Math.max.apply(null, childGroups.map(function(cg) { return cg.height; })) ;
        }
        return { width: groupW, height: actualH, members: nodesOut, unions: unionsOut };
    }

    // Layout each root and concatenate horizontally
    var cursorX = pad;
    var maxBottom = pad;
    for (var r = 0; r < roots.length; r++) {
        if (visited[roots[r]]) continue;
        var g = layoutGroup(roots[r], 0, 10);
        if (g.width === 0) continue;
        // Translate g into output by (cursorX, pad)
        var keys = Object.keys(g.members);
        for (var kk = 0; kk < keys.length; kk++) {
            var nn = g.members[keys[kk]];
            output.nodes[keys[kk]] = { x: nn.x + cursorX, y: nn.y + pad, w: nn.w, h: nn.h, isGuest: nn.isGuest, depth: nn.depth };
        }
        var ukeys2 = Object.keys(g.unions);
        for (var uu = 0; uu < ukeys2.length; uu++) {
            var oo = g.unions[ukeys2[uu]];
            output.unions[ukeys2[uu]] = { x: oo.x + cursorX, y: oo.y + pad, ax: oo.ax + cursorX, bx: oo.bx + cursorX, partnerY: oo.partnerY + pad, hasPartnerLine: oo.hasPartnerLine };
        }
        cursorX += g.width + hgap * 2;
        if (g.height + pad > maxBottom) maxBottom = g.height + pad;
    }

    // Catch any orphan members (e.g. guest partners whose primary partner wasn't placed)
    var allMids = Object.keys(members);
    for (var am = 0; am < allMids.length; am++) {
        if (!output.nodes[allMids[am]] && !visited[allMids[am]]) {
            output.nodes[allMids[am]] = { x: cursorX, y: pad, w: cardW, h: cardH, isGuest: members[allMids[am]].familyId !== familyId, depth: 0 };
            cursorX += cardW + hgap;
        }
    }

    output.width = cursorX + pad;
    output.height = maxBottom + cardH + pad;
    return output;
}
