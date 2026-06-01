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

    // ========================================================
    // Mention HIGHLIGHT overlay — show inserted [[type:id|Name]] tokens as
    // styled links INSIDE the edit field. A backdrop div renders the text with
    // the name in link-colour and the [[type:id|…]] syntax transparent (still
    // occupies width → caret stays aligned); the textarea text is made
    // transparent so only the backdrop shows. The textarea keeps editing.
    // ========================================================
    var MH_SELECTOR = '.scene-text-input, #note-content, #npc-f-notes, #lore-entry-f-description, #lore-entry-f-notes';

    function mhEscape(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function mhHighlight(text) {
        var esc = mhEscape(text);
        esc = esc.replace(/\[\[(character|npc|lore):([a-z0-9_]+)(?:\|([^\]]*))?\]\]/gi, function (m, type, id, name) {
            return '<span class="mh-syn">[[' + type + ':' + id + '|</span>' +
                   '<span class="mh-name">' + (name || '') + '</span>' +
                   '<span class="mh-syn">]]</span>';
        });
        // Trailing newline keeps the backdrop's last line height in step with
        // the textarea (which reserves space after a final newline).
        return esc + '\n';
    }
    function mhSync(ta) {
        var bd = ta._mhBackdrop;
        if (!bd) return;
        bd.innerHTML = mhHighlight(ta.value);
        bd.scrollTop = ta.scrollTop;
    }
    function mhAttachOne(ta) {
        if (!ta || ta._mhAttached) return;
        ta._mhAttached = true;
        var field = document.createElement('div');
        field.className = 'mention-field';
        var bd = document.createElement('div');
        bd.className = 'mention-backdrop';
        // Copy the metrics that drive text layout so backdrop + textarea align.
        var cs = window.getComputedStyle(ta);
        ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
         'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
         'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
         'textAlign', 'textIndent', 'tabSize'].forEach(function (p) { bd.style[p] = cs[p]; });
        bd.style.borderStyle = 'solid';
        bd.style.borderColor = 'transparent';
        ta.parentNode.insertBefore(field, ta);
        field.appendChild(bd);
        field.appendChild(ta);
        ta.classList.add('mention-textarea-transparent');
        ta._mhBackdrop = bd;
        ta.addEventListener('input', function () { mhSync(ta); });
        ta.addEventListener('scroll', function () { bd.scrollTop = ta.scrollTop; });
        mhSync(ta);
    }
    // Public: wrap any mention fields under `root` (idempotent).
    window.attachMentionOverlays = function (root) {
        var scope = root || document;
        if (!scope.querySelectorAll) return;
        var tas = scope.querySelectorAll(MH_SELECTOR);
        for (var i = 0; i < tas.length; i++) mhAttachOne(tas[i]);
    };
    // Keep backdrops in step when other code changes a textarea programmatically
    // (e.g. the autocomplete inserting a token, or auto-grow resizing).
    window.refreshMentionOverlay = function (ta) { if (ta && ta._mhBackdrop) mhSync(ta); };
})();
