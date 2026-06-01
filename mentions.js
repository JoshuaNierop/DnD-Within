// ============================================================
// D&D Within — @-mention autocomplete
// ============================================================
// Type "@" in any .edit-textarea to link an entity (Character / NPC / Lore).
// A popup shows matching entities (from collectEntities()); picking one inserts
// the token `[[type:id|Naam]]` into the text. renderRichText() (ui-world.js)
// turns that token into a clickable, rename-proof link on display.
//
// Delegated on document so it keeps working for textareas created on each
// render. Popup mounts on body and is positioned just below the textarea
// (simple MVP positioning — no caret-pixel math).
// ============================================================
(function () {
    var popup = null;
    var activeTA = null;
    var matches = [];
    var selIdx = 0;
    var queryAt = -1;   // index of the "@" in the textarea value

    function isMentionField(el) {
        return el && el.tagName === 'TEXTAREA' && el.classList.contains('edit-textarea');
    }

    function closePopup() {
        if (popup) { popup.remove(); popup = null; }
        activeTA = null; matches = []; selIdx = 0; queryAt = -1;
    }

    // Find a trailing "@query" immediately before the caret. Returns {at, q} or
    // null. The "@" must sit at the start or after whitespace/open-paren.
    function detectQuery(ta) {
        var pos = ta.selectionStart;
        if (pos == null) return null;
        var text = ta.value.slice(0, pos);
        var at = text.lastIndexOf('@');
        if (at < 0) return null;
        var before = at > 0 ? text.charAt(at - 1) : '';
        if (at > 0 && !/[\s(>\[]/.test(before)) return null;
        var q = text.slice(at + 1);
        if (/[\n\r]/.test(q) || q.length > 40) return null;
        return { at: at, q: q };
    }

    function buildMatches(q) {
        if (typeof collectEntities !== 'function') return [];
        var ql = q.toLowerCase();
        var all = collectEntities();
        var res = [];
        for (var i = 0; i < all.length; i++) {
            var e = all[i];
            if (!e.id) continue;
            var name = (e.name || '').toLowerCase();
            if (!ql || name.indexOf(ql) >= 0) res.push(e);
            if (res.length >= 30) break;
        }
        // Prefer names that START with the query, then alphabetical.
        res.sort(function (a, b) {
            var as = (a.name || '').toLowerCase().indexOf(ql) === 0 ? 0 : 1;
            var bs = (b.name || '').toLowerCase().indexOf(ql) === 0 ? 0 : 1;
            if (as !== bs) return as - bs;
            return (a.name || '').localeCompare(b.name || '');
        });
        return res.slice(0, 8);
    }

    function typeBadge(type) {
        if (type === 'character') return 'Character';
        if (type === 'npc') return 'NPC';
        return 'Lore';
    }

    function renderPopup() {
        if (!popup) {
            popup = document.createElement('div');
            popup.className = 'mention-popup';
            document.body.appendChild(popup);
        }
        var html = '';
        for (var i = 0; i < matches.length; i++) {
            var e = matches[i];
            html += '<div class="mention-item' + (i === selIdx ? ' active' : '') + '" data-midx="' + i + '">';
            html += '<span class="mention-thumb">' + (e.image ? '<img src="' + escapeAttr(e.image) + '" alt="">' : '<span class="mention-thumb-empty">' + escapeHtml((e.name || '?').charAt(0).toUpperCase()) + '</span>') + '</span>';
            html += '<span class="mention-name">' + escapeHtml(e.name || '') + '</span>';
            html += '<span class="mention-badge">' + escapeHtml((e.cat || typeBadge(e.type))) + '</span>';
            html += '</div>';
        }
        popup.innerHTML = html;
        positionPopup();
    }

    function positionPopup() {
        if (!popup || !activeTA) return;
        var r = activeTA.getBoundingClientRect();
        var top = r.bottom + window.scrollY + 2;
        var left = r.left + window.scrollX;
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.style.minWidth = Math.min(r.width, 320) + 'px';
    }

    function refresh(ta) {
        var d = detectQuery(ta);
        if (!d) { closePopup(); return; }
        activeTA = ta;
        queryAt = d.at;
        matches = buildMatches(d.q);
        if (!matches.length) { closePopup(); return; }
        if (selIdx >= matches.length) selIdx = 0;
        renderPopup();
    }

    function insertMention(e) {
        if (!activeTA || queryAt < 0) { closePopup(); return; }
        var ta = activeTA;
        var pos = ta.selectionStart;
        var before = ta.value.slice(0, queryAt);
        var after = ta.value.slice(pos);
        var safeName = String(e.name || '').replace(/[\]|]/g, '');
        var token = '[[' + e.type + ':' + e.id + '|' + safeName + ']]';
        ta.value = before + token + ' ' + after;
        var caret = (before + token + ' ').length;
        closePopup();
        ta.focus();
        try { ta.setSelectionRange(caret, caret); } catch (_) {}
        // Let any oninput logic (auto-grow, etc.) run.
        ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // ---- Listeners (delegated on document) ----
    document.addEventListener('input', function (e) {
        if (!isMentionField(e.target)) { if (activeTA && e.target !== activeTA) closePopup(); return; }
        refresh(e.target);
    });

    document.addEventListener('keydown', function (e) {
        if (!popup || !activeTA || e.target !== activeTA) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); selIdx = (selIdx + 1) % matches.length; renderPopup(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selIdx = (selIdx - 1 + matches.length) % matches.length; renderPopup(); }
        else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (matches[selIdx]) insertMention(matches[selIdx]); }
        else if (e.key === 'Escape') { e.preventDefault(); closePopup(); }
    }, true);

    // mousedown (not click) so the textarea doesn't blur-close before select.
    document.addEventListener('mousedown', function (e) {
        if (!popup) return;
        var item = e.target.closest && e.target.closest('.mention-item');
        if (item) {
            e.preventDefault();
            var idx = parseInt(item.dataset.midx, 10);
            if (matches[idx]) insertMention(matches[idx]);
            return;
        }
        if (!e.target.closest || (!e.target.closest('.mention-popup') && e.target !== activeTA)) closePopup();
    });

    document.addEventListener('scroll', function () { if (popup) positionPopup(); }, true);
    window.addEventListener('resize', function () { if (popup) positionPopup(); });
})();
