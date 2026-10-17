// D&D Within — Mobile shell: phone breakpoint flag, bottom tab bar, "More" sheet.
// Requires: core.js (getRoute/currentUser/isDM/getCampaigns/escapeHtml/t),
// app.js (dashboardTarget/renderApp), ui-settings.js (isDebugMode).
// The tab bar HTML is produced by DWMobile.tabbarHtml() from renderNavbar();
// the sheet is appended inside #app so the existing click delegation
// (events.js app.onclick: toggle-dice-panel, open-search, logout, …) handles
// its buttons without any new wiring.

var DWMobile = (function () {
    var QUERY = '(max-width: 699.98px)';
    var mql = window.matchMedia ? window.matchMedia(QUERY) : null;
    var sheetEl = null;

    function isMobile() { return !!(mql && mql.matches); }
    function syncFlag() { document.documentElement.classList.toggle('is-mobile', isMobile()); }
    syncFlag();

    // ---- Icons: 24×24 stroke set, same style as the navbar ----
    var ICONS = {
        home:     '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        party:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        user:     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        map:      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
        clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        book:     '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
        note:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
        star:     '<path d="M12 2l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4z"/>',
        gear:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        dash:     '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/>',
        more:     '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
        dice:     '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>',
        search:   '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
        chat:     '<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A8 8 0 1 1 21 12z"/>',
        bug:      '<path d="M8 2l1.5 3M16 2l-1.5 3"/><path d="M3 10h2M19 10h2M3 14h2M19 14h2"/><ellipse cx="12" cy="13" rx="5" ry="7"/><circle cx="12" cy="7" r="3"/><line x1="12" y1="10" x2="12" y2="20"/><line x1="7" y1="13" x2="17" y2="13"/>',
        edit:     '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
        logout:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
        profile:  '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
        layout:   '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="12" x2="12" y2="21"/>'
    };
    function icon(name) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
    }

    // ---- Bottom tab bar (called from renderNavbar) ----
    function tabbarHtml(route, inCampaignView) {
        var p0 = route.parts[0] || 'home';
        var tabs = [];
        var tgt = (typeof dashboardTarget === 'function') ? dashboardTarget() : null;
        if (inCampaignView) {
            tabs.push({ href: '/home', label: t('nav.home') || 'Home', icon: 'home',
                        active: p0 === 'home' || p0 === 'dashboard' || route.path === '/' });
            tabs.push({ href: '/party', label: t('nav.party') || 'Party', icon: 'party', active: p0 === 'party' });
            if (tgt) {
                tabs.push({ href: tgt.href, label: tgt.kind === 'dm' ? 'DM' : 'Character',
                            icon: tgt.kind === 'dm' ? 'dash' : 'user',
                            active: tgt.kind === 'dm' ? p0 === 'dm' : p0 === 'characters' });
            }
            tabs.push({ href: '/lore', label: t('nav.lore') || 'Lore', icon: 'book', active: p0 === 'lore' });
        } else {
            tabs.push({ href: '/welcome', label: 'Welcome', icon: 'star',
                        active: route.path === '/welcome' || route.path === '/' });
            tabs.push({ href: '/characters', label: 'Characters', icon: 'user', active: p0 === 'characters' });
            tabs.push({ href: '/settings', label: 'Settings', icon: 'gear', active: route.path === '/settings' });
        }
        var html = '<nav class="mobile-tabbar" aria-label="Main navigation">';
        for (var i = 0; i < tabs.length; i++) {
            var tb = tabs[i];
            html += '<a class="mtab' + (tb.active ? ' active' : '') + '" href="' + tb.href + '"' +
                (tb.active ? ' aria-current="page"' : '') + '>' + icon(tb.icon) + '<span>' + escapeHtml(tb.label) + '</span></a>';
        }
        html += '<button type="button" class="mtab mtab-more" data-action="open-more-sheet" aria-haspopup="dialog">' +
            icon('more') + '<span>More</span></button>';
        html += '</nav>';
        return html;
    }

    // ---- "More" sheet ----
    function tile(o) {
        var cls = 'dw-tile' + (o.cls ? ' ' + o.cls : '');
        var inner = icon(o.icon) + '<span>' + escapeHtml(o.label) + '</span>';
        if (o.href) return '<a class="' + cls + '" href="' + o.href + '">' + inner + '</a>';
        var attrs = ' data-action="' + o.action + '"';
        if (o.extra) attrs += ' ' + o.extra;
        if (o.pressed != null) attrs += ' aria-pressed="' + (o.pressed ? 'true' : 'false') + '"';
        return '<button type="button" class="' + cls + '"' + attrs + '>' + inner + '</button>';
    }
    function row(o) {
        var cls = 'dw-row' + (o.cls ? ' ' + o.cls : '');
        var inner = icon(o.icon) + '<span>' + escapeHtml(o.label) + '</span>';
        if (o.href) return '<a class="' + cls + '" href="' + o.href + '">' + inner + '</a>';
        return '<button type="button" class="' + cls + '" data-action="' + o.action + '">' + inner + '</button>';
    }

    function sheetHtml() {
        var route = getRoute();
        var p0 = route.parts[0] || 'home';
        var user = currentUser();
        var campaigns = getCampaigns();
        var camp = campaigns[getActiveCampaign()];
        var onDash = (p0 === 'characters' && !!route.parts[1]) || p0 === 'dm';
        var tgt = (typeof dashboardTarget === 'function') ? dashboardTarget() : null;
        var debug = (typeof isDebugMode === 'function') && isDebugMode();
        var h = '<div class="dw-sheet-overlay">' +
            '<div class="dw-sheet" role="dialog" aria-modal="true" aria-label="More">' +
            '<div class="dw-sheet-handle" aria-hidden="true"></div>' +
            '<div class="dw-sheet-head"><div class="dw-sheet-who">' +
            '<span class="dw-sheet-avatar">' + escapeHtml(user ? user.name.charAt(0) : '') + '</span>' +
            '<div><div class="dw-sheet-name">' + escapeHtml(user ? user.name : '') + '</div>' +
            (camp ? '<div class="dw-sheet-sub">' + escapeHtml(camp.name) + '</div>' : '') + '</div></div>' +
            '<button type="button" class="dw-sheet-close" data-action="close-sheet" aria-label="Close">&times;</button></div>';

        if (onDash && window.WidgetGrid) {
            var st = window.WidgetGrid.state;
            var editOn = !!(st && st.config && st.config.editValuesMode);
            h += '<div class="dw-sheet-title">This dashboard</div><div class="dw-sheet-grid">' +
                tile({ action: 'wgm-toggle-edit', label: 'Edit values', icon: 'edit', cls: 'dw-tile-edit', pressed: editOn }) +
                tile({ action: 'wgm-layout-info', label: 'Layout', icon: 'layout' }) +
                '</div>';
        }

        var go = [];
        if (!(p0 === 'home' || p0 === 'party' || p0 === 'lore') && camp) {
            // Main-menu context or a dashboard: offer the campaign pages too.
            if (p0 !== 'home') go.push({ href: '/home', label: 'Home', icon: 'home' });
        }
        go.push({ href: '/maps', label: 'Maps', icon: 'map' });
        go.push({ href: '/timeline', label: 'Timeline', icon: 'clock' });
        go.push({ href: '/notes', label: 'Notes', icon: 'note' });
        if (tgt && !onDash) go.push({ href: tgt.href, label: tgt.kind === 'dm' ? 'DM Dashboard' : 'My character', icon: 'dash', cls: 'dw-tile-dash' });
        if (camp && p0 !== 'party') go.push({ href: '/party', label: 'Party', icon: 'party' });
        if (camp && p0 !== 'lore') go.push({ href: '/lore', label: 'Lore', icon: 'book' });
        go.push({ href: '/characters', label: 'Characters', icon: 'user' });
        go.push({ href: '/settings', label: 'Settings', icon: 'gear' });
        go.push({ href: '/welcome', label: 'Welcome', icon: 'star' });
        h += '<div class="dw-sheet-title">Go to</div><div class="dw-sheet-grid">' + go.map(tile).join('') + '</div>';

        h += '<div class="dw-sheet-title">Tools</div><div class="dw-sheet-grid">' +
            tile({ action: 'toggle-dice-panel', label: 'Dice', icon: 'dice', cls: 'dw-tile-dice' }) +
            tile({ action: 'toggle-notes-panel', label: 'Quick notes', icon: 'note', cls: 'dw-tile-notes' }) +
            tile({ action: 'open-search', label: 'Search', icon: 'search', cls: 'dw-tile-search' }) +
            tile({ action: 'open-chat-widget', label: 'Chat', icon: 'chat', cls: 'dw-tile-chat' }) +
            (debug ? tile({ action: 'start-bug-selector', label: 'Report bug', icon: 'bug', cls: 'dw-tile-bug', extra: 'data-br-trigger' }) : '') +
            '</div>';

        h += '<div class="dw-sheet-list">' +
            row({ action: 'open-profile', label: 'Profile', icon: 'profile' }) +
            row({ action: 'logout', label: 'Log out', icon: 'logout', cls: 'danger' }) +
            '</div>';
        h += '</div></div>';
        return h;
    }

    function openMore() {
        closeSheet();
        var app = document.getElementById('app');
        if (!app) return;
        var wrap = document.createElement('div');
        wrap.innerHTML = sheetHtml();
        sheetEl = wrap.firstChild;
        app.appendChild(sheetEl);
        bindSheetDrag(sheetEl.querySelector('.dw-sheet'));
        var closeBtn = sheetEl.querySelector('.dw-sheet-close');
        if (closeBtn) setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 0);
    }
    function closeSheet() {
        if (sheetEl && sheetEl.parentNode) sheetEl.parentNode.removeChild(sheetEl);
        sheetEl = null;
    }
    function isOpen() { return !!(sheetEl && sheetEl.isConnected); }

    // Drag the sheet down (from the handle/header) to dismiss it.
    function bindSheetDrag(sheet) {
        if (!sheet) return;
        var startY = null, dy = 0, pid = null;
        function onDown(e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (!e.target.closest('.dw-sheet-handle, .dw-sheet-head')) return;
            if (e.target.closest('button, a')) return;
            startY = e.clientY; dy = 0; pid = e.pointerId;
            sheet.classList.add('is-dragging');
            try { sheet.setPointerCapture(pid); } catch (err) {}
        }
        function onMove(e) {
            if (startY == null || e.pointerId !== pid) return;
            dy = Math.max(0, e.clientY - startY);
            sheet.style.transform = 'translateY(' + dy + 'px)';
        }
        function onUp(e) {
            if (startY == null || e.pointerId !== pid) return;
            try { sheet.releasePointerCapture(pid); } catch (err) {}
            sheet.classList.remove('is-dragging');
            if (dy > 90) { closeSheet(); return; }
            sheet.classList.add('is-settling');
            sheet.style.transform = '';
            setTimeout(function () { sheet.classList.remove('is-settling'); }, 220);
            startY = null;
        }
        sheet.addEventListener('pointerdown', onDown);
        sheet.addEventListener('pointermove', onMove);
        sheet.addEventListener('pointerup', onUp);
        sheet.addEventListener('pointercancel', onUp);
    }

    function layoutInfo() {
        var msg = 'Your phone shows the same widgets as your desktop dashboard, stacked in one column per tab. ' +
            'Swipe left or right to move between tabs. To add, remove or rearrange widgets, open this character on a desktop or laptop.';
        if (typeof showAlertModal === 'function') showAlertModal({ title: 'Phone layout', message: msg, confirmLabel: 'Got it' });
    }

    // ---- Wiring ----
    document.addEventListener('click', function (e) {
        var target = e.target;
        if (!target || !target.closest) return;
        if (target.closest('[data-action="open-more-sheet"]')) { e.preventDefault(); openMore(); return; }
        if (!isOpen()) return;
        if (target === sheetEl || target.closest('.dw-sheet-close')) { e.preventDefault(); closeSheet(); return; }
        var editTile = target.closest('[data-action="wgm-toggle-edit"]');
        if (editTile) {
            e.preventDefault();
            var btn = document.getElementById('rs-edit-values');
            if (btn) btn.click();
            var st = window.WidgetGrid && window.WidgetGrid.state;
            editTile.setAttribute('aria-pressed', (st && st.config && st.config.editValuesMode) ? 'true' : 'false');
            return;
        }
        if (target.closest('[data-action="wgm-layout-info"]')) { e.preventDefault(); closeSheet(); layoutInfo(); return; }
        // Any other tile/row: let the normal handlers run (events.js delegation,
        // router link interception), then close the sheet.
        if (target.closest('.dw-sheet .dw-tile, .dw-sheet .dw-row')) setTimeout(closeSheet, 0);
    }, true);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); closeSheet(); }
    }, true);

    if (mql) {
        var onChange = function () {
            syncFlag();
            closeSheet();
            // Re-render so the navbar/tab bar and the dashboard switch mode.
            if (typeof renderApp === 'function' && typeof currentUser === 'function' && currentUser() &&
                document.getElementById('app') && document.getElementById('app').children.length) {
                try { renderApp(); } catch (err) { console.warn('[mobile] re-render after breakpoint change failed', err); }
            }
        };
        if (mql.addEventListener) mql.addEventListener('change', onChange);
        else if (mql.addListener) mql.addListener(onChange);
    }

    return { isMobile: isMobile, tabbarHtml: tabbarHtml, openMore: openMore, closeSheet: closeSheet, icon: icon };
})();
