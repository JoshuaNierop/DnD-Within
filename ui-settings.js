// D&D Within — Settings & Bug Reporter
// Requires: core.js

// ============================================================
// Section 33: Settings Page
// ============================================================

var settingsTab = 'account';

function renderSettings() {
    var uid = currentUserId();
    var u = getUserData(uid);
    if (!u) return '';

    var html = '<div class="settings-page">';
    html += '<h1 class="page-title">' + (t('nav.settings') || 'Settings') + '</h1>';

    // Tabs
    var tabs = [
        { id: 'account', label: t('settings.tab.account'), icon: '&#128100;' },
        { id: 'appearance', label: t('nav.theme') || 'Thema', icon: '&#127912;' },
        // Language-tab verwijderd (bug -Oud-_izpLBetwa): site is Engels-only.
        { id: 'developer', label: t('settings.tab.developer'), icon: '&#128736;' }
    ];
    html += '<div class="settings-tabs">';
    for (var sti = 0; sti < tabs.length; sti++) {
        var stab = tabs[sti];
        html += '<button class="settings-tab' + (settingsTab === stab.id ? ' active' : '') + '" data-action="settings-switch-tab" data-tab="' + stab.id + '">' + stab.icon + ' ' + stab.label + '</button>';
    }
    html += '</div>';

    // === Account tab ===
    if (settingsTab === 'account') {
        html += '<section class="settings-section">';
        html += '<div class="settings-card">';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.username') + '</label>';
        html += '<input type="text" class="settings-input" value="' + escapeAttr(uid) + '" disabled>';
        html += '</div>';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.displayname') + '</label>';
        html += '<input type="text" class="settings-input" id="settings-display-name" value="' + escapeAttr(u.name) + '" placeholder="' + t('settings.displayname.plh') + '">';
        html += '</div>';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.currentpass') + '</label>';
        html += '<input type="password" class="settings-input" id="settings-current-password" placeholder="' + t('settings.currentpass.plh') + '">';
        html += '</div>';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.newpass') + '</label>';
        html += '<input type="password" class="settings-input" id="settings-new-password" placeholder="' + t('settings.newpass.plh') + '">';
        html += '</div>';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.confirmpass') + '</label>';
        html += '<input type="password" class="settings-input" id="settings-confirm-password" placeholder="' + t('settings.confirmpass.plh') + '">';
        html += '</div>';
        html += '</div></section>';
    }

    // === Appearance tab ===
    if (settingsTab === 'appearance') {
        html += '<section class="settings-section">';
        html += '<div class="settings-card">';
        html += '<div class="settings-field">';
        html += '<label class="settings-label">' + t('settings.colorscheme') + '</label>';
        html += '<div class="settings-theme-grid">';
        for (var ti = 0; ti < COLOR_THEMES.length; ti++) {
            var theme = COLOR_THEMES[ti];
            var themeActive = getUserTheme() === theme.id;
            html += '<button class="settings-theme-option' + (themeActive ? ' active' : '') + '" data-action="settings-select-theme" data-theme="' + theme.id + '">';
            html += '<span class="settings-theme-swatch" style="background:linear-gradient(135deg, ' + theme.accent + ' 40%, ' + theme.secondary + ' 70%, ' + theme.tertiary + ');"></span>';
            html += '<span class="settings-theme-name">' + theme.name + '</span>';
            html += '</button>';
        }
        html += '</div></div>';
        html += '</div></section>';
    }

    // Language-tab verwijderd (bug -Oud-_izpLBetwa): site is Engels-only.

    // === Developer tab ===
    if (settingsTab === 'developer') {
        html += '<section class="settings-section">';
        html += '<div class="settings-card">';
        html += '<div class="settings-field settings-toggle-field">';
        html += '<div><label class="settings-label">' + t('settings.debug') + '</label>';
        html += '<p class="settings-hint">' + t('settings.debug.hint') + '</p></div>';
        html += '<label class="toggle-switch"><input type="checkbox" id="settings-debug-mode"' + (isDebugMode() ? ' checked' : '') + ' data-action="settings-toggle-debug"><span class="toggle-slider"></span></label>';
        html += '</div>';
        html += '</div></section>';
    }

    // === Save & messages (only on account tab) ===
    if (settingsTab === 'account') {
        html += '<p class="settings-error" id="settings-error" style="display:none;"></p>';
        html += '<p class="settings-success" id="settings-success" style="display:none;"></p>';
        html += '<button class="btn btn-primary settings-save" data-action="save-settings">' + t('generic.save') + '</button>';
    }

    html += '</div>';
    return html;
}

function handleSaveSettings() {
    var uid = currentUserId();
    var u = getUserData(uid);
    if (!u) return;

    var nameEl = document.getElementById('settings-display-name');
    var currentPassEl = document.getElementById('settings-current-password');
    var passEl = document.getElementById('settings-new-password');
    var confirmEl = document.getElementById('settings-confirm-password');
    var errorEl = document.getElementById('settings-error');
    var successEl = document.getElementById('settings-success');

    var newName = nameEl ? nameEl.value.trim() : u.name;
    var currentPass = currentPassEl ? currentPassEl.value : '';
    var newPass = passEl ? passEl.value : '';
    var confirmPass = confirmEl ? confirmEl.value : '';

    if (errorEl) { errorEl.style.display = 'none'; }
    if (successEl) { successEl.style.display = 'none'; }

    if (nameEl && !newName) {
        if (errorEl) { errorEl.textContent = t('settings.error.emptyname'); errorEl.style.display = 'block'; }
        return;
    }

    if (newPass) {
        if (!currentPass) {
            if (errorEl) { errorEl.textContent = t('settings.error.needcurrentpass'); errorEl.style.display = 'block'; }
            return;
        }
        if (u.password !== currentPass) {
            if (errorEl) { errorEl.textContent = t('settings.error.wrongpass'); errorEl.style.display = 'block'; }
            return;
        }
        if (newPass !== confirmPass) {
            if (errorEl) { errorEl.textContent = t('settings.error.passmismatch'); errorEl.style.display = 'block'; }
            return;
        }
    }

    // Update user data
    if (!usersCache) usersCache = {};
    if (!usersCache[uid]) usersCache[uid] = JSON.parse(JSON.stringify(u));
    usersCache[uid].name = newName;
    if (newPass) usersCache[uid].password = newPass;

    // Save debug mode
    var debugEl = document.getElementById('settings-debug-mode');
    if (debugEl) setDebugMode(debugEl.checked);

    // Save to Firebase
    if (typeof syncSaveUser === 'function') syncSaveUser(uid, usersCache[uid]);
    localStorage.setItem('dw_users', JSON.stringify(usersCache));

    showToast(t('settings.saved'), 'success');
    if (successEl) { successEl.textContent = t('generic.saved'); successEl.style.display = 'block'; }
    setTimeout(function() { renderApp(); }, 600);
}

// ============================================================
// Section 33b: Bug Reporter
// ============================================================

var bugReporterActive = false;
var bugSelectedElement = null;
var bugHighlightOverlay = null;

function isDebugMode() {
    // Default on: only disabled when explicitly set to 'false'.
    return localStorage.getItem('dw_debug') !== 'false';
}

function setDebugMode(enabled) {
    localStorage.setItem('dw_debug', enabled ? 'true' : 'false');
    renderApp();
}

function getElementDescriptor(el) {
    if (!el || el === document.body || el === document.documentElement) return 'Page';

    // Check for data-action (most specific for JS-rendered elements)
    if (el.dataset && el.dataset.action) return el.dataset.action;

    // Check closest meaningful section
    var section = el.closest('[data-action]');
    var tag = el.tagName.toLowerCase();

    // Named components
    if (el.id) return tag + '#' + el.id;

    // Meaningful class names
    var knownComponents = ['sheet-block', 'char-banner', 'char-portrait', 'tab-btn', 'spell-card',
        'feature-card', 'ability-card', 'combat-stat', 'item-row', 'char-card', 'campaign-home-card',
        'dash-stat-card', 'quest-card', 'timeline-event', 'note-card', 'navbar', 'dice-fab',
        'settings-card', 'settings-tab', 'nav-link', 'modal', 'wizard', 'lore-page'];
    for (var i = 0; i < knownComponents.length; i++) {
        var comp = el.closest('.' + knownComponents[i]);
        if (comp) {
            var text = (el.textContent || '').trim().substring(0, 30);
            return knownComponents[i] + (text ? ' "' + text + '"' : '');
        }
    }

    // Fallback: class + text
    var parts = [];
    if (el.className && typeof el.className === 'string') {
        var cls = el.className.split(/\s+/).filter(function(c) {
            return c && c.indexOf('bug-') !== 0;
        }).slice(0, 3).join('.');
        if (cls) parts.push(tag + '.' + cls);
        else parts.push(tag);
    } else {
        parts.push(tag);
    }
    var text2 = (el.textContent || '').trim().substring(0, 40);
    if (text2) parts.push('"' + text2 + (el.textContent.trim().length > 40 ? '...' : '') + '"');
    return parts.join(' ') || (section ? section.dataset.action : tag);
}

function getElementPath(el) {
    var path = [];
    var cur = el;
    while (cur && cur !== document.body && path.length < 4) {
        var tag = cur.tagName.toLowerCase();
        if (cur.className && typeof cur.className === 'string') {
            var cls = cur.className.split(/\s+/).filter(function(c) {
                return c && c.indexOf('bug-') !== 0 && c.indexOf('page-') !== 0;
            }).slice(0, 2).join('.');
            path.unshift(cls ? tag + '.' + cls : tag);
        } else {
            path.unshift(tag);
        }
        cur = cur.parentElement;
    }
    return path.join(' > ');
}

function startBugSelector() {
    if (bugReporterActive) { stopBugSelector(); return; }
    bugReporterActive = true;
    document.body.classList.add('bug-selecting');

    // Create highlight overlay
    bugHighlightOverlay = document.createElement('div');
    bugHighlightOverlay.className = 'bug-highlight-overlay';
    document.body.appendChild(bugHighlightOverlay);

    document.addEventListener('mousemove', bugSelectorMove, true);
    document.addEventListener('click', bugSelectorClick, true);
    document.addEventListener('keydown', bugSelectorEsc, true);
    showToast(t('bug.start.toast'), 'info');
}

function stopBugSelector() {
    bugReporterActive = false;
    document.body.classList.remove('bug-selecting');
    if (bugHighlightOverlay) { bugHighlightOverlay.remove(); bugHighlightOverlay = null; }
    document.removeEventListener('mousemove', bugSelectorMove, true);
    document.removeEventListener('click', bugSelectorClick, true);
    document.removeEventListener('keydown', bugSelectorEsc, true);
}

function bugSelectorMove(e) {
    var el = e.target;
    if (!el || el.classList.contains('bug-highlight-overlay') || el.classList.contains('bug-fab') ||
        el.closest('.bug-report-modal') || el.closest('.bug-fab')) return;
    var rect = el.getBoundingClientRect();
    if (bugHighlightOverlay) {
        bugHighlightOverlay.style.top = rect.top + 'px';
        bugHighlightOverlay.style.left = rect.left + 'px';
        bugHighlightOverlay.style.width = rect.width + 'px';
        bugHighlightOverlay.style.height = rect.height + 'px';
        bugHighlightOverlay.style.display = 'block';
    }
}

function bugSelectorClick(e) {
    var el = e.target;
    if (el.classList.contains('bug-fab') || el.closest('.bug-fab') ||
        el.classList.contains('bug-highlight-overlay')) return;
    e.preventDefault();
    e.stopPropagation();
    bugSelectedElement = {
        descriptor: getElementDescriptor(el),
        path: getElementPath(el),
        route: window.location.pathname || '/'
    };
    stopBugSelector();
    openBugReportModal();
}

function bugSelectorEsc(e) {
    if (e.key === 'Escape') { stopBugSelector(); }
}

function openBugReportModal() {
    var existing = document.querySelector('.bug-report-modal-wrap');
    if (existing) existing.remove();

    var info = bugSelectedElement || { descriptor: 'Algemeen', path: '', route: window.location.pathname || '/' };
    var html = '<div class="bug-report-modal-wrap">';
    html += '<div class="modal-overlay" data-action="close-bug-modal">';
    html += '<div class="bug-report-modal">';
    html += '<div class="modal-header"><h2>🪲 ' + t('bug.title') + '</h2><button class="modal-close" data-action="close-bug-modal">&times;</button></div>';
    html += '<div class="modal-body">';
    html += '<div class="bug-field"><label class="bug-label">' + t('bug.element') + '</label>';
    html += '<div class="bug-element-info"><code>' + escapeHtml(info.descriptor) + '</code></div>';
    html += '<div class="bug-element-path"><small>' + escapeHtml(info.path) + '</small></div></div>';
    html += '<div class="bug-field"><label class="bug-label">' + t('bug.page') + '</label>';
    html += '<div class="bug-element-info"><code>' + escapeHtml(info.route) + '</code></div></div>';
    html += '<div class="bug-field"><label class="bug-label">' + t('bug.type') + '</label>';
    html += '<div class="bug-type-toggle">';
    html += '<label class="bug-type-option"><input type="radio" name="bug-type" value="bug" checked><span class="bug-type-chip bug-type-bug">&#x1FAB2; ' + t('bug.type.bug') + '</span></label>';
    html += '<label class="bug-type-option"><input type="radio" name="bug-type" value="feature"><span class="bug-type-chip bug-type-feature">&#x2728; ' + t('bug.type.feature') + '</span></label>';
    html += '<label class="bug-type-option"><input type="radio" name="bug-type" value="design"><span class="bug-type-chip bug-type-design">&#x1F3A8; ' + (t('bug.type.design') === 'bug.type.design' ? 'Design' : t('bug.type.design')) + '</span></label>';
    html += '</div></div>';
    html += '<div class="bug-field"><label class="bug-label">' + t('bug.description') + '</label>';
    html += '<textarea class="bug-textarea" id="bug-description" rows="4" placeholder="' + t('bug.plh') + '"></textarea></div>';
    html += '<button class="login-submit" data-action="submit-bug">' + t('bug.submit') + '</button>';
    html += '</div></div></div></div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);
    lockBodyScroll();

    // Direct event listeners (modal is outside #app, delegation unreliable)
    var modalWrap = document.querySelector('.bug-report-modal-wrap');
    if (modalWrap) {
        var submitBtn = modalWrap.querySelector('[data-action="submit-bug"]');
        if (submitBtn) submitBtn.addEventListener('click', function(e) { e.stopPropagation(); submitBugReport(); });
        var closeBtns = modalWrap.querySelectorAll('[data-action="close-bug-modal"]');
        for (var i = 0; i < closeBtns.length; i++) {
            closeBtns[i].addEventListener('click', function(e) { if (e.target === this) closeBugReportModal(); });
        }
    }

    var ta = document.getElementById('bug-description');
    if (ta) ta.focus();
}

function closeBugReportModal() {
    var el = document.querySelector('.bug-report-modal-wrap');
    if (el) el.remove();
    unlockBodyScroll();
    bugSelectedElement = null;
}

function submitBugReport() {
    var desc = document.getElementById('bug-description');
    if (!desc || !desc.value.trim()) {
        showToast(t('bug.error.nodesc'), 'error');
        return;
    }

    var info = bugSelectedElement || { descriptor: 'Algemeen', path: '', route: window.location.pathname || '/' };
    var typeEl = document.querySelector('input[name="bug-type"]:checked');
    var reportType = typeEl ? typeEl.value : 'bug';

    var bug = {
        type: reportType,
        element: info.descriptor,
        elementPath: info.path,
        route: info.route,
        description: desc.value.trim(),
        reporter: currentUserId() || 'anonymous',
        timestamp: Date.now(),
        status: 'open'
    };

    var typeLabel = reportType === 'feature' ? 'Feature' : reportType === 'design' ? 'Design' : 'Bug';
    submitBugToHub(bug).then(function(res) {
        closeBugReportModal();
        showToast(typeLabel + ' ' + t('bug.reported'), 'success');
    }).catch(function(err) {
        console.error('[Bug] submit failed', err);
        showToast('Verzenden mislukt: ' + err.message, 'error');
    });
}

function renderBugFab() {
    if (!isDebugMode()) return '';
    return '<div class="bug-fab" data-action="start-bug-selector" title="Developer">' +
        '<svg class="bug-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M8 2l1.5 3M16 2l-1.5 3"/>' +
        '<path d="M3 10h2M19 10h2M3 14h2M19 14h2"/>' +
        '<ellipse cx="12" cy="13" rx="5" ry="7"/>' +
        '<circle cx="12" cy="7" r="3"/>' +
        '<line x1="12" y1="10" x2="12" y2="20"/>' +
        '<line x1="7" y1="13" x2="17" y2="13"/>' +
        '</svg></div>';
}

// ============================================================
