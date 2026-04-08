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

    // Set accent color for current context
    if (route.parts[0] === 'characters' && route.parts[1]) {
        var cfg = loadCharConfig(route.parts[1]);
        if (cfg) document.documentElement.style.setProperty('--accent', cfg.accentColor);
    } else {
        applyUserTheme();
    }

    var app = document.getElementById('app');
    var html = '';

    if (route.path === '/login' || !user) {
        html = renderLogin();
    } else if (route.parts[0] === 'join' && route.parts[1]) {
        html = renderNavbar(route) + '<main class="main-content">';
        html += handleJoinCampaign(route.parts[1]);
        html += '</main>';
    } else {
        html = renderNavbar(route) + '<main class="main-content">';

        if (route.path === '/' || route.path === '/home') {
            html += renderHome();
        } else if (route.path === '/dashboard') {
            html += renderDashboard();
        } else if (route.path === '/party') {
            html += renderParty();
        } else if (route.path === '/characters') {
            html += renderCharacterList();
        } else if (route.path === '/settings') {
            html += renderSettings();
        } else if (route.parts[0] === 'characters' && route.parts[1]) {
            // Deep link: #/characters/ren/combat sets activeTab
            if (route.parts[2]) {
                var validTabs = ['overview', 'stats', 'combat', 'spells', 'story', 'inventory'];
                if (validTabs.indexOf(route.parts[2]) >= 0) activeTab = route.parts[2];
            }
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
        html += '<div class="dice-fab" data-action="toggle-dice-panel" title="Roll Dice">&#127922;</div>';
        html += '<div class="dice-panel" id="dice-panel" style="display:none;">';
        html += '<div class="dice-panel-header"><span>Dice Roller</span><button class="dice-panel-close" data-action="toggle-dice-panel">&times;</button></div>';
        html += '<div id="dice-panel-content"></div>';
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

function postRenderEffects(route) {
    if (route.parts[0] === 'characters' && route.parts[1]) {
        var effectCfg = loadCharConfig(route.parts[1]);
        var effectColor = effectCfg ? effectCfg.accentColor : '#22d3ee';
        var portraitWrap = document.querySelector('.char-portrait-wrap');
        if (typeof GlowRing !== 'undefined') {
            GlowRing.apply(portraitWrap, effectColor);
        }
    }
    // Initiative drag-and-drop
    initInitiativeDragDrop();
    // Family tree SVG lines
    postRenderFamilyTree();
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
