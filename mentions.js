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

    function badgeFor(e) {
        return (typeof entityTypeLabel === 'function') ? entityTypeLabel(e) : String(e.type || '').toUpperCase();
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
            html += '<span class="mention-badge">' + escapeHtml(badgeFor(e)) + '</span>';
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
        var safeName = String(e.name || '').replace(/[\]|@]/g, '').trim();
        // Insert the clean "@Name" the user sees; remember the id→name mapping on
        // the field so save can expand it back to the [[type:id|Name]] token.
        ta.value = before + '@' + safeName + ' ' + after;
        var caret = (before + '@' + safeName + ' ').length;
        try {
            var list = JSON.parse(ta.dataset.mentions || '[]');
            list.push({ name: safeName, type: e.type, id: e.id });
            ta.dataset.mentions = JSON.stringify(list);
        } catch (_) { ta.dataset.mentions = JSON.stringify([{ name: safeName, type: e.type, id: e.id }]); }
        closePopup();
        ta.focus();
        try { ta.setSelectionRange(caret, caret); } catch (_) {}
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

    // ========================================================
    // Display ↔ storage conversion. The DB always stores the canonical token
    // [[type:id|Name]] (rename-proof, renders as a real link everywhere). The
    // EDIT field shows a clean "@Name" instead. These helpers convert between
    // the two; the field carries a data-mentions JSON map (name→type:id) so the
    // save path can expand "@Name" back to the token.
    // ========================================================
    var TOKEN_RE = /\[\[(character|npc|lore):([a-z0-9_]+)(?:\|([^\]]*))?\]\]/gi;

    // Tokens → "@Name" for display in a textarea.
    window.mentionsToDisplay = function (text) {
        if (text == null) return '';
        return String(text).replace(TOKEN_RE, function (m, type, id, name) {
            return '@' + (name || id);
        });
    };
    // Extract the mention map [{name,type,id}] from token-text (for data-mentions).
    window.mentionsExtract = function (text) {
        var list = [];
        if (text == null) return list;
        String(text).replace(TOKEN_RE, function (m, type, id, name) {
            list.push({ name: name || id, type: type, id: id });
            return m;
        });
        return list;
    };
    // "@Name" → tokens, using a [{name,type,id}] map (longest names first so a
    // multi-word name wins over a shorter prefix). Names not in the map stay as
    // literal "@text".
    window.mentionsToTokens = function (displayText, map) {
        if (displayText == null) return '';
        var text = String(displayText);
        if (!Array.isArray(map) || !map.length) return text;
        var sorted = map.slice().sort(function (a, b) { return (b.name || '').length - (a.name || '').length; });
        sorted.forEach(function (e) {
            if (!e || !e.name || !e.id) return;
            var safe = e.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            var re = new RegExp('@' + safe + '(?![\\p{L}\\p{N}_])', 'gu');
            var token = '[[' + e.type + ':' + e.id + '|' + e.name + ']]';
            text = text.replace(re, token);
        });
        return text;
    };
    // Convenience: read a field's display value back into token-text using the
    // data-mentions map stashed on the element.
    window.mentionsFieldToTokens = function (el) {
        if (!el) return '';
        var map = [];
        try { map = JSON.parse(el.dataset.mentions || '[]'); } catch (_) { map = []; }
        return window.mentionsToTokens(el.value, map);
    };
})();
