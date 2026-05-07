// ============================================================
// D&D Within — Families
// ============================================================
//
// Datamodel:
//   family = { id, surname, notes, members:[memberId], unions:[unionId] }
//   member = { id, familyId, firstName, lastName, birth, death, race, gender,
//              linkedCharId, linkedNpcKey, notes }
//   union  = { id, familyId, partnerIds:[memberId,memberId?], childIds:[memberId] }
//
// Een member behoort tot één primary family (zijn surname-family).
// Een union kan partners uit verschillende families bevatten — bij render
// van family X is een member uit family Y dan een "guest" partner.
//
// Storage:
//   localStorage 'dw_families' = { families:{}, members:{}, unions:{} }
//   Firebase   world/families
// ============================================================

function _famUid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function getFamiliesData() {
    var saved = localStorage.getItem('dw_families');
    if (saved) {
        try {
            var p = JSON.parse(saved);
            if (!p.families) p.families = {};
            if (!p.members) p.members = {};
            if (!p.unions) p.unions = {};
            return p;
        } catch (e) {}
    }
    return { families: {}, members: {}, unions: {} };
}

function saveFamiliesData(data) {
    localStorage.setItem('dw_families', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_families');
}

function getFamily(familyId) {
    return getFamiliesData().families[familyId] || null;
}

function getMember(memberId) {
    return getFamiliesData().members[memberId] || null;
}

function getUnion(unionId) {
    return getFamiliesData().unions[unionId] || null;
}

function listFamilies() {
    var data = getFamiliesData();
    var out = [];
    var ids = Object.keys(data.families);
    for (var i = 0; i < ids.length; i++) out.push(data.families[ids[i]]);
    out.sort(function(a, b) { return (a.surname || '').localeCompare(b.surname || ''); });
    return out;
}

function findFamilyBySurname(surname) {
    if (!surname) return null;
    var data = getFamiliesData();
    var ids = Object.keys(data.families);
    var sn = surname.trim().toLowerCase();
    for (var i = 0; i < ids.length; i++) {
        var f = data.families[ids[i]];
        if ((f.surname || '').trim().toLowerCase() === sn) return f;
    }
    return null;
}

function findOrCreateFamilyBySurname(surname) {
    var existing = findFamilyBySurname(surname);
    if (existing) return existing;
    return createFamily(surname);
}

function createFamily(surname, notes) {
    var data = getFamiliesData();
    var id = _famUid('fam');
    data.families[id] = { id: id, surname: surname || '', notes: notes || '', members: [], unions: [] };
    saveFamiliesData(data);
    return data.families[id];
}

function deleteFamily(familyId) {
    var data = getFamiliesData();
    var fam = data.families[familyId];
    if (!fam) return;
    // Remove members of this family
    for (var i = 0; i < fam.members.length; i++) {
        delete data.members[fam.members[i]];
    }
    // Remove unions where ALL partners belong to this family (delete) — otherwise unlink
    var unionIds = Object.keys(data.unions);
    for (var u = 0; u < unionIds.length; u++) {
        var un = data.unions[unionIds[u]];
        var anyOther = false;
        for (var p = 0; p < un.partnerIds.length; p++) {
            var m = data.members[un.partnerIds[p]];
            if (m && m.familyId !== familyId) { anyOther = true; break; }
        }
        if (un.familyId === familyId && !anyOther) {
            delete data.unions[unionIds[u]];
        }
    }
    delete data.families[familyId];
    saveFamiliesData(data);
}

function renameFamily(familyId, newSurname) {
    var data = getFamiliesData();
    var fam = data.families[familyId];
    if (!fam) return;
    fam.surname = newSurname || '';
    // Apply new surname to all members of this family that match the OLD surname
    // (members may have custom lastNames; only auto-update those that matched)
    saveFamiliesData(data);
}

// ===== Members =====

function createMember(familyId, props) {
    var data = getFamiliesData();
    if (!data.families[familyId]) return null;
    var id = _famUid('mem');
    var m = {
        id: id,
        familyId: familyId,
        firstName: props.firstName || '',
        lastName: props.lastName || (data.families[familyId].surname || ''),
        birth: props.birth || '',
        death: props.death || '',
        race: props.race || '',
        gender: props.gender || '',
        linkedCharId: props.linkedCharId || '',
        linkedNpcKey: props.linkedNpcKey || '',
        notes: props.notes || ''
    };
    data.members[id] = m;
    data.families[familyId].members.push(id);
    saveFamiliesData(data);
    return m;
}

function updateMember(memberId, props) {
    var data = getFamiliesData();
    var m = data.members[memberId];
    if (!m) return null;
    var keys = ['firstName', 'lastName', 'birth', 'death', 'race', 'gender', 'linkedCharId', 'linkedNpcKey', 'notes'];
    for (var i = 0; i < keys.length; i++) {
        if (Object.prototype.hasOwnProperty.call(props, keys[i])) m[keys[i]] = props[keys[i]];
    }
    // Surname-change auto-switch family
    if (Object.prototype.hasOwnProperty.call(props, 'lastName')) {
        var newSurname = (props.lastName || '').trim();
        var curFam = data.families[m.familyId];
        var curSurname = curFam ? (curFam.surname || '').trim() : '';
        if (newSurname && newSurname.toLowerCase() !== curSurname.toLowerCase()) {
            // Move to family with that surname (create if needed)
            var target = findFamilyBySurname(newSurname);
            if (!target) {
                var newId = _famUid('fam');
                data.families[newId] = { id: newId, surname: newSurname, notes: '', members: [], unions: [] };
                target = data.families[newId];
            }
            // Detach from current family member-list
            if (curFam) {
                var idx = curFam.members.indexOf(memberId);
                if (idx >= 0) curFam.members.splice(idx, 1);
            }
            target.members.push(memberId);
            m.familyId = target.id;
            // If old family becomes empty, delete it (no leftover unions to worry — they may be cross-family)
            if (curFam && curFam.members.length === 0) {
                // Only delete if no unions reference it
                var hasUnion = false;
                var uids = Object.keys(data.unions);
                for (var u = 0; u < uids.length; u++) {
                    if (data.unions[uids[u]].familyId === curFam.id) { hasUnion = true; break; }
                }
                if (!hasUnion) delete data.families[curFam.id];
            }
        }
    }
    saveFamiliesData(data);
    return m;
}

function deleteMember(memberId) {
    var data = getFamiliesData();
    var m = data.members[memberId];
    if (!m) return;
    var fam = data.families[m.familyId];
    if (fam) {
        var idx = fam.members.indexOf(memberId);
        if (idx >= 0) fam.members.splice(idx, 1);
    }
    // Remove from any union (partner or child)
    var uids = Object.keys(data.unions);
    for (var i = 0; i < uids.length; i++) {
        var un = data.unions[uids[i]];
        var pi = un.partnerIds.indexOf(memberId);
        if (pi >= 0) un.partnerIds.splice(pi, 1);
        var ci = un.childIds.indexOf(memberId);
        if (ci >= 0) un.childIds.splice(ci, 1);
        if (un.partnerIds.length === 0 && un.childIds.length === 0) {
            // Empty union, drop it
            if (fam) {
                var ux = fam.unions.indexOf(un.id);
                if (ux >= 0) fam.unions.splice(ux, 1);
            }
            delete data.unions[un.id];
        }
    }
    delete data.members[memberId];
    saveFamiliesData(data);
}

// ===== Unions =====
//
// Een union "behoort" tot een family voor weergave-doeleinden, maar partners
// kunnen uit verschillende families komen. Default: union.familyId = familie
// van de eerste partner.
function createUnion(memberIdA, memberIdB) {
    var data = getFamiliesData();
    var a = data.members[memberIdA];
    if (!a) return null;
    var id = _famUid('uni');
    var partners = [memberIdA];
    if (memberIdB && data.members[memberIdB]) partners.push(memberIdB);
    var fam = data.families[a.familyId];
    var u = {
        id: id,
        familyId: a.familyId,
        partnerIds: partners,
        childIds: []
    };
    data.unions[id] = u;
    if (fam && fam.unions.indexOf(id) < 0) fam.unions.push(id);
    saveFamiliesData(data);
    return u;
}

function addPartnerToUnion(unionId, memberId) {
    var data = getFamiliesData();
    var u = data.unions[unionId];
    if (!u || !data.members[memberId]) return null;
    if (u.partnerIds.indexOf(memberId) < 0) u.partnerIds.push(memberId);
    saveFamiliesData(data);
    return u;
}

function addChildToUnion(unionId, memberId) {
    var data = getFamiliesData();
    var u = data.unions[unionId];
    if (!u || !data.members[memberId]) return null;
    if (u.childIds.indexOf(memberId) < 0) u.childIds.push(memberId);
    saveFamiliesData(data);
    return u;
}

function removeChildFromUnion(unionId, memberId) {
    var data = getFamiliesData();
    var u = data.unions[unionId];
    if (!u) return;
    var idx = u.childIds.indexOf(memberId);
    if (idx >= 0) u.childIds.splice(idx, 1);
    saveFamiliesData(data);
}

function deleteUnion(unionId) {
    var data = getFamiliesData();
    var u = data.unions[unionId];
    if (!u) return;
    var fam = data.families[u.familyId];
    if (fam) {
        var ux = fam.unions.indexOf(unionId);
        if (ux >= 0) fam.unions.splice(ux, 1);
    }
    delete data.unions[unionId];
    saveFamiliesData(data);
}

// Find union(s) where member is a partner
function findUnionsAsPartner(memberId) {
    var data = getFamiliesData();
    var out = [];
    var ids = Object.keys(data.unions);
    for (var i = 0; i < ids.length; i++) {
        if (data.unions[ids[i]].partnerIds.indexOf(memberId) >= 0) out.push(data.unions[ids[i]]);
    }
    return out;
}

// Find union where member is a child
function findUnionAsChild(memberId) {
    var data = getFamiliesData();
    var ids = Object.keys(data.unions);
    for (var i = 0; i < ids.length; i++) {
        if (data.unions[ids[i]].childIds.indexOf(memberId) >= 0) return data.unions[ids[i]];
    }
    return null;
}

// ===== Helpers for view =====

// Returns ALL members visible in a given family tree:
// - all members with primaryFamilyId === familyId
// - all guest partners (members from other families that are partner of someone in this family)
function getFamilyView(familyId) {
    var data = getFamiliesData();
    var fam = data.families[familyId];
    if (!fam) return null;
    var memberSet = {};
    for (var i = 0; i < fam.members.length; i++) memberSet[fam.members[i]] = data.members[fam.members[i]];
    // Unions visible: any union where ≥1 partner is in this family
    var unionSet = {};
    var uids = Object.keys(data.unions);
    for (var u = 0; u < uids.length; u++) {
        var un = data.unions[uids[u]];
        var hasInFam = false;
        for (var p = 0; p < un.partnerIds.length; p++) {
            var m = data.members[un.partnerIds[p]];
            if (m && m.familyId === familyId) { hasInFam = true; break; }
        }
        if (hasInFam) {
            unionSet[un.id] = un;
            // Add guest partners
            for (var pp = 0; pp < un.partnerIds.length; pp++) {
                if (!memberSet[un.partnerIds[pp]]) memberSet[un.partnerIds[pp]] = data.members[un.partnerIds[pp]];
            }
            // Add children that belong to this family (only)
            for (var c = 0; c < un.childIds.length; c++) {
                var ch = data.members[un.childIds[c]];
                if (ch && ch.familyId === familyId && !memberSet[ch.id]) memberSet[ch.id] = ch;
            }
        }
    }
    return { family: fam, members: memberSet, unions: unionSet };
}

// Resolve a linked character/NPC display info (race, color, etc.)
function resolveMemberLink(member) {
    if (!member) return null;
    if (member.linkedCharId) {
        var cfg = (typeof loadCharConfig === 'function') ? loadCharConfig(member.linkedCharId) : null;
        if (cfg) return { type: 'character', id: member.linkedCharId, name: cfg.name, race: cfg.race, color: cfg.accentColor };
    }
    if (member.linkedNpcKey) {
        var idx = parseInt(member.linkedNpcKey, 10);
        var npcs = (typeof getNPCData === 'function') ? (getNPCData().npcs || []) : [];
        if (!isNaN(idx) && npcs[idx]) return { type: 'npc', id: 'npc:' + idx, name: npcs[idx].name, race: npcs[idx].race, color: 'var(--text-dim)' };
    }
    return null;
}

// ============================================================
// Migration — best-effort from old per-character family[] arrays
// ============================================================

function _splitName(fullName) {
    var parts = (fullName || '').trim().split(/\s+/);
    if (parts.length === 0) return { firstName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

function _guessTier(fm) {
    if (fm.tier) return fm.tier;
    var r = (fm.relation || '').toLowerCase();
    if (r.indexOf('grootvader') >= 0 || r.indexOf('grootmoeder') >= 0 || r.indexOf('grandfather') >= 0 || r.indexOf('grandmother') >= 0 || r.indexOf('grandparent') >= 0 || r.indexOf('opa') >= 0 || r.indexOf('oma') >= 0) return 'grandparent';
    if (r.indexOf('vader') >= 0 || r.indexOf('moeder') >= 0 || r.indexOf('father') >= 0 || r.indexOf('mother') >= 0 || r.indexOf('parent') >= 0) return 'parent';
    if (r.indexOf('partner') >= 0 || r.indexOf('spouse') >= 0 || r.indexOf('husband') >= 0 || r.indexOf('wife') >= 0 || r.indexOf('echtgeno') >= 0) return 'partner';
    if (r.indexOf('zoon') >= 0 || r.indexOf('dochter') >= 0 || r.indexOf('son') >= 0 || r.indexOf('daughter') >= 0 || r.indexOf('child') >= 0 || r.indexOf('kind') >= 0) return 'child';
    return 'sibling';
}

function _findMemberIn(data, familyId, firstName, lastName, linkedCharId, linkedNpcKey) {
    var ids = Object.keys(data.members);
    for (var i = 0; i < ids.length; i++) {
        var m = data.members[ids[i]];
        if (linkedCharId && m.linkedCharId === linkedCharId) return m;
        if (linkedNpcKey && m.linkedNpcKey === linkedNpcKey) return m;
    }
    var fam = data.families[familyId];
    if (!fam) return null;
    var fn = (firstName || '').toLowerCase().trim();
    var ln = (lastName || '').toLowerCase().trim();
    if (!fn) return null;
    for (var j = 0; j < fam.members.length; j++) {
        var mm = data.members[fam.members[j]];
        if (!mm) continue;
        if ((mm.firstName || '').toLowerCase().trim() === fn && (mm.lastName || '').toLowerCase().trim() === ln) return mm;
    }
    return null;
}

function _findUnionAsChildIn(data, memberId) {
    var ids = Object.keys(data.unions);
    for (var i = 0; i < ids.length; i++) {
        if (data.unions[ids[i]].childIds.indexOf(memberId) >= 0) return data.unions[ids[i]];
    }
    return null;
}

function _findUnionWithPartners(data, partnerIds) {
    var sorted = partnerIds.slice().sort();
    var ids = Object.keys(data.unions);
    for (var i = 0; i < ids.length; i++) {
        var u = data.unions[ids[i]];
        if (u.partnerIds.length !== sorted.length) continue;
        var s = u.partnerIds.slice().sort();
        var match = true;
        for (var k = 0; k < s.length; k++) if (s[k] !== sorted[k]) { match = false; break; }
        if (match) return u;
    }
    return null;
}

// Run migration once. Idempotent: returns existing data if families already populated.
function migrateFamilies(force) {
    var data = getFamiliesData();
    if (!force && (Object.keys(data.families).length > 0 || Object.keys(data.members).length > 0)) {
        return { skipped: true, reason: 'already populated' };
    }

    var stats = { egos: 0, members: 0, unions: 0, families: 0 };

    function ensureFamily(surname) {
        var sn = (surname || '').trim();
        if (sn) {
            var ids = Object.keys(data.families);
            for (var i = 0; i < ids.length; i++) {
                if ((data.families[ids[i]].surname || '').trim().toLowerCase() === sn.toLowerCase()) return data.families[ids[i]];
            }
        }
        var id = _famUid('fam');
        data.families[id] = { id: id, surname: sn, notes: '', members: [], unions: [] };
        stats.families++;
        return data.families[id];
    }

    function ensureMember(familyId, firstName, lastName, extras) {
        extras = extras || {};
        var existing = _findMemberIn(data, familyId, firstName, lastName, extras.linkedCharId, extras.linkedNpcKey);
        if (existing) {
            // If existing is in different family but linked, leave it. If primaryFamily mismatches and we have a stronger surname signal, ignore (be conservative).
            return existing;
        }
        var id = _famUid('mem');
        var m = {
            id: id,
            familyId: familyId,
            firstName: firstName || '',
            lastName: lastName || '',
            birth: extras.birth || '',
            death: extras.death || '',
            race: extras.race || '',
            gender: extras.gender || '',
            linkedCharId: extras.linkedCharId || '',
            linkedNpcKey: extras.linkedNpcKey || '',
            notes: extras.notes || ''
        };
        data.members[id] = m;
        if (data.families[familyId]) data.families[familyId].members.push(id);
        stats.members++;
        return m;
    }

    function ensureUnion(partnerIds) {
        if (!partnerIds.length) return null;
        var existing = _findUnionWithPartners(data, partnerIds);
        if (existing) return existing;
        var firstPartner = data.members[partnerIds[0]];
        var famId = firstPartner ? firstPartner.familyId : null;
        if (!famId) return null;
        var id = _famUid('uni');
        var u = { id: id, familyId: famId, partnerIds: partnerIds.slice(), childIds: [] };
        data.unions[id] = u;
        if (data.families[famId] && data.families[famId].unions.indexOf(id) < 0) data.families[famId].unions.push(id);
        stats.unions++;
        return u;
    }

    // Build ego list
    var egos = [];
    if (typeof getCharacterIds === 'function') {
        var charIds = getCharacterIds();
        for (var ci = 0; ci < charIds.length; ci++) {
            var cfg = (typeof loadCharConfig === 'function') ? loadCharConfig(charIds[ci]) : null;
            if (!cfg) continue;
            egos.push({ kind: 'char', id: charIds[ci], cfg: cfg, name: cfg.name || '', race: cfg.race || '', family: cfg.family || [] });
        }
    }
    if (typeof getNPCData === 'function') {
        var npcs = (getNPCData().npcs || []);
        for (var ni = 0; ni < npcs.length; ni++) {
            egos.push({ kind: 'npc', id: ni, cfg: npcs[ni], name: npcs[ni].name || '', race: npcs[ni].race || '', family: npcs[ni].family || [] });
        }
    }

    // First pass — create ego members
    var egoMembers = {};
    for (var e = 0; e < egos.length; e++) {
        stats.egos++;
        var ego = egos[e];
        var split = _splitName(ego.name);
        var fam = ensureFamily(split.lastName);
        var extras = { race: ego.race };
        if (ego.kind === 'char') extras.linkedCharId = ego.id;
        else extras.linkedNpcKey = String(ego.id);
        var m = ensureMember(fam.id, split.firstName, split.lastName, extras);
        egoMembers[ego.kind + ':' + ego.id] = m;
    }

    // Second pass — process family[] entries per ego
    for (var ee = 0; ee < egos.length; ee++) {
        var ego2 = egos[ee];
        var egoMem = egoMembers[ego2.kind + ':' + ego2.id];
        if (!egoMem) continue;
        var egoFam = data.families[egoMem.familyId];
        var fmList = ego2.family || [];

        // Group by tier so we can build unions correctly
        var parents = [], partners = [], children = [], siblings = [], grandparents = [];
        for (var f = 0; f < fmList.length; f++) {
            var fm = fmList[f];
            var t = _guessTier(fm);
            (t === 'grandparent' ? grandparents : t === 'parent' ? parents : t === 'partner' ? partners : t === 'child' ? children : siblings).push(fm);
        }

        function fmToMember(fm, defaultFamilyId) {
            var ns = _splitName(fm.name);
            // If lastName matches ego's surname → same family. Else → own family.
            var targetFam;
            if (ns.lastName && ns.lastName.toLowerCase() === (egoFam.surname || '').toLowerCase()) {
                targetFam = egoFam;
            } else if (ns.lastName) {
                targetFam = ensureFamily(ns.lastName);
            } else {
                targetFam = data.families[defaultFamilyId] || egoFam;
            }
            var ex = {};
            if (fm.linkedChar) ex.linkedCharId = fm.linkedChar;
            if (fm.status === 'Deceased' || fm.status === 'Overleden') ex.death = '?';
            if (fm.notes) ex.notes = fm.notes;
            return ensureMember(targetFam.id, ns.firstName, ns.lastName, ex);
        }

        // Parents → union, ego is child
        var parentMembers = [];
        for (var p = 0; p < parents.length; p++) parentMembers.push(fmToMember(parents[p], egoFam.id));
        var parentUnion = null;
        if (parentMembers.length) {
            // Use existing union as child if any
            parentUnion = _findUnionAsChildIn(data, egoMem.id);
            if (!parentUnion) {
                parentUnion = ensureUnion(parentMembers.map(function(x){return x.id;}));
                if (parentUnion && parentUnion.childIds.indexOf(egoMem.id) < 0) parentUnion.childIds.push(egoMem.id);
            } else {
                // Existing union — add any parents not yet in it
                for (var pp = 0; pp < parentMembers.length; pp++) {
                    if (parentUnion.partnerIds.indexOf(parentMembers[pp].id) < 0) parentUnion.partnerIds.push(parentMembers[pp].id);
                }
            }
        }

        // Siblings → share parent union (create placeholder parents if none)
        if (siblings.length) {
            if (!parentUnion) {
                // Create placeholder parent
                var phMember = ensureMember(egoFam.id, '?', egoFam.surname || '', {});
                parentUnion = ensureUnion([phMember.id]);
                if (parentUnion && parentUnion.childIds.indexOf(egoMem.id) < 0) parentUnion.childIds.push(egoMem.id);
            }
            for (var s = 0; s < siblings.length; s++) {
                var sib = fmToMember(siblings[s], egoFam.id);
                if (parentUnion.childIds.indexOf(sib.id) < 0) parentUnion.childIds.push(sib.id);
            }
        }

        // Partners → union(ego, partner)
        var partnerUnions = [];
        for (var pa = 0; pa < partners.length; pa++) {
            var pm = fmToMember(partners[pa], egoFam.id);
            var pu = ensureUnion([egoMem.id, pm.id]);
            if (pu) partnerUnions.push(pu);
        }

        // Children → in partnerUnion if any, else singleton ego-union
        if (children.length) {
            var targetUnion = partnerUnions[0] || null;
            if (!targetUnion) {
                targetUnion = ensureUnion([egoMem.id]);
            }
            for (var ch = 0; ch < children.length; ch++) {
                var cm = fmToMember(children[ch], egoFam.id);
                if (targetUnion && targetUnion.childIds.indexOf(cm.id) < 0) targetUnion.childIds.push(cm.id);
            }
        }

        // Grandparents → as parents of one parent (best-effort: pick first parent)
        if (grandparents.length && parentMembers.length) {
            var grandparentMembers = [];
            for (var g = 0; g < grandparents.length; g++) grandparentMembers.push(fmToMember(grandparents[g], parentMembers[0].familyId));
            // Ensure first parent has a parent-union
            var pmRef = parentMembers[0];
            var existingPar = _findUnionAsChildIn(data, pmRef.id);
            if (!existingPar) {
                existingPar = ensureUnion(grandparentMembers.map(function(x){return x.id;}));
                if (existingPar) existingPar.childIds.push(pmRef.id);
            } else {
                for (var gg = 0; gg < grandparentMembers.length; gg++) {
                    if (existingPar.partnerIds.indexOf(grandparentMembers[gg].id) < 0) existingPar.partnerIds.push(grandparentMembers[gg].id);
                }
            }
        }
    }

    // Save
    saveFamiliesData(data);
    return { skipped: false, stats: stats };
}

// Find which family a character/npc is primary member of (by linked id)
function findPrimaryFamilyByLink(linkedCharId, linkedNpcKey) {
    var data = getFamiliesData();
    var ids = Object.keys(data.members);
    for (var i = 0; i < ids.length; i++) {
        var m = data.members[ids[i]];
        if (linkedCharId && m.linkedCharId === linkedCharId) return { member: m, family: data.families[m.familyId] };
        if (linkedNpcKey && m.linkedNpcKey === linkedNpcKey) return { member: m, family: data.families[m.familyId] };
    }
    return null;
}
