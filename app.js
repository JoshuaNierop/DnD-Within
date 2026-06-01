// D&D Within — Main Render & Initialization
// Requires: core.js, all ui-*.js, events.js

// ============================================================
// Section 8: Main Render Function (Router)
// ============================================================

function renderApp() {
    var user = currentUser();
    var route = getRoute();

    if (!user && route.path !== '/login') {
        navigate('/login');
        return;
    }

    // WGI-M4: signaleer huidige route aan CSS (verbergt navbar op character-pages).
    document.body.dataset.route = route.parts.join('/') || (route.path === '/login' ? 'login' : 'home');

    // WGI-M4: cleanup vorige Widget Grid mount voor de DOM hergebruikt wordt.
    if (window.WidgetGrid && typeof window.WidgetGrid.unmount === 'function') {
        window.WidgetGrid.unmount();
    }

    // Set accent color for current context
    if (route.parts[0] === 'characters' && route.parts[1]) {
        var cfg = loadCharConfig(route.parts[1]);
        if (cfg) document.documentElement.style.setProperty('--accent', cfg.accentColor);
    } else {
        applyUserTheme();
    }

    var app = document.getElementById('app');
    var html = '';

    // Auto-migrate families on first render after login (idempotent)
    if (user && typeof migrateFamilies === 'function' && typeof getFamiliesData === 'function') {
        var _famData = getFamiliesData();
        if (Object.keys(_famData.families).length === 0 && Object.keys(_famData.members).length === 0) {
            try { migrateFamilies(); } catch (e) { console.warn('[families] auto-migration failed', e); }
        }
    }

    if (route.path === '/login' || !user) {
        html = renderLogin();
    } else if (route.parts[0] === 'join' && route.parts[1]) {
        html = renderNavbar(route) + '<main class="main-content">';
        html += handleJoinCampaign(route.parts[1]);
        html += '</main>';
    } else {
        html = renderNavbar(route) + '<main class="main-content">';

        if (route.path === '/welcome') {
            html += renderHome();
        } else if (route.path === '/' || route.path === '/home' || route.path === '/dashboard') {
            html += renderDashboard();
        } else if (route.path === '/party') {
            html += renderParty();
        } else if (route.path === '/characters') {
            html += renderCharacterList();
        } else if (route.path === '/settings') {
            html += renderSettings();
        } else if (route.parts[0] === 'characters' && route.parts[1]) {
            html += renderCharacterSheet(route.parts[1]);
        } else if (route.parts[0] === 'dm' && isDM()) {
            html += renderDMPage(route.parts[1]);
        } else if (route.path === '/maps') {
            html += renderMaps();
        } else if (route.path === '/timeline') {
            html += renderTimeline();
        } else if (route.parts[0] === 'lore') {
            if (route.parts[1] && route.parts[1].indexOf('edit-') === 0) {
                html += renderLoreEditor(route.parts[1].substring(5));
            } else {
                html += renderLore(route.parts[1]);
            }
        } else if (route.parts[0] === 'notes') {
            if (route.parts[1] === 'new') {
                html += renderNoteEditor(null);
            } else if (route.parts[1] && route.parts[1].indexOf('edit-') === 0) {
                html += renderNoteEditor(route.parts[1].substring(5));
            } else if (route.parts[1] && route.parts[1].indexOf('view-') === 0) {
                html += renderNoteView(route.parts[1].substring(5));
            } else {
                html += renderNotes();
            }
        } else {
            html += '<div class="page-placeholder"><h2>' + t('page.notfound') + '</h2><p>' + t('page.notfound.desc') + '</p></div>';
        }

        html += '</main>';

        // Global dice roller (multi-dice hand system)
        html += '<div class="dice-fab" data-action="toggle-dice-panel" title="Roll Dice"><svg class="dice-fab-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"><polygon points="50,8 90,32 90,70 50,92 10,70 10,32"/><polygon points="50,30 72,44 64,66 36,66 28,44"/><line x1="50" y1="8" x2="50" y2="30"/><line x1="90" y1="32" x2="72" y2="44"/><line x1="90" y1="70" x2="64" y2="66"/><line x1="50" y1="92" x2="50" y2="66" opacity="0.7"/><line x1="10" y1="70" x2="36" y2="66"/><line x1="10" y1="32" x2="28" y2="44"/><text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="18" font-weight="700" fill="currentColor" stroke="none">20</text></svg></div>';
        html += '<div class="dice-panel" id="dice-panel" style="display:none;">';
        html += '<div class="dice-panel-header"><span>Dice Roller</span><button class="dice-panel-close" data-action="toggle-dice-panel">&times;</button></div>';
        html += '<div id="dice-panel-content"></div>';
        html += '</div>';

        // Notes quick-access FAB + panel (like dice panel — opens on current page)
        html += '<div class="notes-fab" data-action="toggle-notes-panel" title="Notities"><svg class="notes-fab-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><rect x="22" y="12" width="58" height="78" rx="4"/><line x1="32" y1="12" x2="32" y2="90"/><circle cx="32" cy="26" r="2.5" fill="currentColor" stroke="none"/><circle cx="32" cy="50" r="2.5" fill="currentColor" stroke="none"/><circle cx="32" cy="74" r="2.5" fill="currentColor" stroke="none"/><line x1="44" y1="32" x2="70" y2="32"/><line x1="44" y1="50" x2="70" y2="50"/><line x1="44" y1="68" x2="62" y2="68"/></svg></div>';
        html += '<div class="notes-panel" id="notes-panel" style="display:none;">';
        html += '<div class="notes-panel-header"><span>Quick Notes</span><button class="notes-panel-close" data-action="toggle-notes-panel">&times;</button></div>';
        html += '<div id="notes-panel-content"></div>';
        html += '</div>';

        // Bug reporter FAB (only in debug mode)
        html += renderBugFab();
    }

    // Clean up any stray drag ghosts/indicators from initiative tracker
    var strayGhost = document.querySelector('.init-drag-ghost');
    if (strayGhost) strayGhost.remove();
    document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });

    // Page transition — only on actual page change (not tab switches)
    var mainEl = app.querySelector('.main-content');
    var basePath = '/' + route.parts.slice(0, 2).join('/');
    var routeChanged = app._lastBasePath !== basePath;
    app._lastBasePath = basePath;
    if (mainEl && routeChanged && !app._firstRender) {
        window.scrollTo(0, 0);
        mainEl.classList.add('page-exit');
        setTimeout(function() {
            app.innerHTML = html;
            bindPageEvents(route);
            var newMain = app.querySelector('.main-content');
            if (newMain) {
                newMain.classList.add('page-enter');
                setTimeout(function() { newMain.classList.remove('page-enter'); }, 300);
            }
            postRenderEffects(route);
        }, 120);
        return;
    }
    app._firstRender = false;
    if (!routeChanged) app.classList.add('no-animate');
    app.innerHTML = html;
    bindPageEvents(route);
    postRenderEffects(route);
    if (!routeChanged) requestAnimationFrame(function() { app.classList.remove('no-animate'); });
}

// Open + highlight the NPC / lore-entry card that a clicked @-mention link
// targeted (window._dwEntityFocus = {type, id}). Mirrors the timeline
// session-focus flow. Safe no-op when nothing is pending or the card is absent.
function applyEntityFocus() {
    var ef = window._dwEntityFocus;
    if (!ef) return;
    window._dwEntityFocus = null;
    try {
        var sel = null;
        if (ef.type === 'npc') sel = '.npc-card[data-npc-id="' + ef.id + '"]';
        else if (ef.type === 'lore') sel = '.lore-entry-card[data-entry-id="' + ef.id + '"]';
        if (!sel) return;
        var card = document.querySelector(sel);
        if (!card) return;
        // Collapse siblings (accordion) then open the target.
        if (card.classList.contains('npc-card')) {
            var grid = card.closest('.npc-grid');
            if (grid) grid.querySelectorAll('.npc-card.expanded').forEach(function (c) { c.classList.remove('expanded'); });
        }
        card.classList.add('expanded');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('session-focus-flash');
        setTimeout(function () { card.classList.remove('session-focus-flash'); }, 2000);
    } catch (e) { /* ignore */ }
}

function postRenderEffects(route) {
    // Hydrate char-card portraits that localStorage couldn't hold (quota) or
    // that were uploaded from another device. No-op when no such cards exist.
    if (typeof hydrateCharCardPortraits === 'function') hydrateCharCardPortraits();

    if (route.parts[0] === 'characters' && route.parts[1]) {
        var effectCfg = loadCharConfig(route.parts[1]);
        var effectColor = effectCfg ? effectCfg.accentColor : '#22d3ee';
        var portraitWrap = document.querySelector('.char-portrait-wrap');
        if (typeof GlowRing !== 'undefined') {
            GlowRing.apply(portraitWrap, effectColor);
        }
        // WGI-M4: mount Widget Grid V8/V11 dashboard binnen de lege .character-page div.
        var charPageEl = document.querySelector('.character-page');
        if (charPageEl && window.WidgetGrid && typeof window.WidgetGrid.mount === 'function') {
            try {
                window.WidgetGrid.mount(charPageEl, {
                    characterId: route.parts[1],
                    canEdit: typeof canEditCharacter === 'function' ? canEditCharacter(route.parts[1]) : true
                });
            } catch (e) {
                console.error('[WGI-M4] WidgetGrid.mount failed', e);
            }
        }
    }
    // Timeline session-focus: if a recent-event card stashed a session id,
    // scroll the matching session into view (and clear the flag).
    if (route.parts[0] === 'timeline') {
        try {
            var focusSessId = localStorage.getItem('dw_timeline_focus_session');
            if (focusSessId) {
                localStorage.removeItem('dw_timeline_focus_session');
                var focusEl = document.getElementById('session-' + focusSessId);
                if (focusEl) {
                    focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    focusEl.classList.add('session-focus-flash');
                    setTimeout(function() { focusEl.classList.remove('session-focus-flash'); }, 2000);
                }
            }
        } catch (e) {}
    }

    // @-mention landing: open + flash the NPC/lore card a link pointed to.
    if (route.parts[0] === 'lore') applyEntityFocus();

    // Initiative drag-and-drop
    initInitiativeDragDrop();
    // Map pin-edit handlers (drag nodes, click shape to add node)
    if (typeof mapEditPostRender === 'function') mapEditPostRender();
    // Align SVG overlay to letterboxed image (runs regardless of edit mode)
    if (typeof mapSvgAlignPostRender === 'function') mapSvgAlignPostRender();
    // Family diagram SVG lines — find all rendered diagrams and draw lines
    var diags = document.querySelectorAll('.famdiag-wrap[data-family-id]');
    for (var di = 0; di < diags.length; di++) {
        var fid = diags[di].dataset.familyId;
        if (typeof postRenderFamilyDiagram === 'function') postRenderFamilyDiagram(fid);
    }
    // Social chat widget — safety net: re-mount if it disappeared (e.g. after a
    // body-level mutation by a third-party script or extension stripped the FAB).
    if (window.dndSocial && !document.getElementById('social-chat-widget')) {
        try { window.dndSocial.unmount(); } catch (e) {}
        try { window.dndSocial.mount(); } catch (e) {}
    }
}

// initInitiativeDragDrop is defined after renderDMInitiative


// Section 34: Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Load cached users from localStorage (available before Firebase connects)
    try {
        var cachedUsers = localStorage.getItem('dw_users');
        if (cachedUsers) usersCache = JSON.parse(cachedUsers);
    } catch (e) { usersCache = null; }

    initMobileSupport();
    if (typeof initFirebaseSync === 'function') initFirebaseSync();
    initRouter();
    patchTooltipEvents();
});
