// D&D Within — Page Renders (login, navbar, home, dashboard, DM, character list)
// Requires: core.js

// Character page — empty canvas die Widget Grid V8/V11 inline mount via
// app.js postRenderEffects. WGI-M4 verbergt de hoofdnavbar op deze route;
// de `.char-back-btn` overlay biedt de enige nav terug naar campaign view.
function renderCharacterSheet(charId) {
    var config = loadCharConfig(charId);
    if (!config) {
        return '<div class="page-placeholder"><h2>' + t('char.notfound') + '</h2></div>';
    }
    var accent = config.accentColor || 'var(--accent)';
    return '<a class="char-back-btn" href="/home" aria-label="Terug naar campaign" title="Terug naar campaign">'
         +   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         +     '<path d="M19 12H5M12 19l-7-7 7-7"/>'
         +   '</svg>'
         + '</a>'
         + '<div class="character-page" data-char-id="' + charId + '" style="--char-accent:' + accent + '"></div>';
}

// ============================================================
// Helpers
// ============================================================

// Format an ISO datetime string ("2026-04-18T19:00" or "2026-04-18") for display.
// Uses the active i18n language as Intl locale so dates render naturally (NL/EN).
function formatNextSession(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    var locale = (typeof getLang === 'function' && getLang() === 'en') ? 'en-US' : 'nl-NL';
    var hasTime = /T\d/.test(iso);
    var opts = { month: 'short', day: 'numeric' };
    if (hasTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return new Intl.DateTimeFormat(locale, opts).format(d);
}

// ============================================================
// Section 9: Login Page
// ============================================================

function renderLogin() {
    var html = '<div class="login-page">';
    html += '<div class="login-card">';
    html += '<div class="login-logo">&#9876;</div>';
    html += '<h1 class="login-title">D&D Within</h1>';
    html += '<p class="login-subtitle">Valoria Campaign Platform</p>';

    // --- Inlog-formulier (e-mail of legacy username) ---
    html += '<div class="login-form" id="login-form-main">';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.identifier') + '</label>';
    html += '<input type="text" class="login-input" id="login-username" placeholder="' + t('login.email') + '" autocomplete="username">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.password') + '</label>';
    html += '<input type="password" class="login-input" id="login-password" placeholder="' + t('login.password') + '" autocomplete="current-password">';
    html += '</div>';
    html += '<button class="login-submit" data-action="login-submit">' + t('login.submit') + '</button>';
    html += '<p class="login-error" id="login-error" style="display:none;"></p>';
    html += '<p class="login-hint">' + t('login.firsttime') + '</p>';
    html += '<button type="button" class="login-link" data-action="login-show-reset">' + t('login.forgot') + '</button>';
    html += '</div>';

    // --- Reset-paneel (verborgen tot "wachtwoord vergeten") ---
    html += '<div class="login-form" id="login-form-reset" style="display:none;">';
    html += '<p class="login-hint">' + t('login.reset.hint') + '</p>';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.email') + '</label>';
    html += '<input type="email" class="login-input" id="login-reset-email" placeholder="' + t('login.email') + '" autocomplete="email">';
    html += '</div>';
    html += '<button class="login-submit" data-action="login-send-reset">' + t('login.reset.send') + '</button>';
    html += '<p class="login-error" id="login-reset-msg" style="display:none;"></p>';
    html += '<button type="button" class="login-link" data-action="login-hide-reset">&#8592; ' + t('login.submit') + '</button>';
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
}

// ============================================================
// Section 10: Navbar
// ============================================================

function renderNavbar(route) {
    var user = currentUser();
    var svgI = function(d) { return '<svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };

    var activeCamp = getActiveCampaign();
    var campaigns = getCampaigns();
    var hasCampaign = campaigns[activeCamp] != null;
    var routePart = route.parts[0] || 'home';
    var inCampaignView = hasCampaign && ['home', 'dashboard', 'party', 'maps', 'timeline', 'lore', 'notes', 'dm'].indexOf(routePart) !== -1;
    // Character pages: show the campaign navbar if the character belongs to the
    // active campaign's party (Ren in The Serpent of Valoria → campaign tab).
    // Standalone characters keep the main-menu navbar.
    if (!inCampaignView && hasCampaign && routePart === 'characters' && route.parts[1]) {
        var _partyIds = typeof getPartyCharIds === 'function' ? getPartyCharIds(activeCamp) : [];
        if (_partyIds.indexOf(route.parts[1]) !== -1) inCampaignView = true;
    }

    // Campaign navigation links
    var campLinks = [
        { path: '/home', label: t('nav.home') || 'Home', icon: svgI('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>') },
        { path: '/party', label: t('nav.party'), icon: svgI('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') }
    ];
    // Dynamic "Character" tab: appears when viewing a party-character, or when
    // the current user has their own character in the active campaign. Target
    // is the current character if we're already on one, else the user's own.
    var _navUid = currentUserId();
    var _myPartyChar = hasCampaign && campaigns[activeCamp].party && campaigns[activeCamp].party[_navUid];
    var _charTabTarget = null;
    if (routePart === 'characters' && route.parts[1] && hasCampaign) {
        var _partyIdsNav = typeof getPartyCharIds === 'function' ? getPartyCharIds(activeCamp) : [];
        if (_partyIdsNav.indexOf(route.parts[1]) !== -1) _charTabTarget = route.parts[1];
    }
    if (!_charTabTarget && _myPartyChar) _charTabTarget = _myPartyChar;
    if (_charTabTarget) {
        campLinks.push({
            path: '/characters/' + _charTabTarget,
            label: 'Character',
            icon: svgI('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>')
        });
    }
    campLinks = campLinks.concat([
        { path: '/maps', label: t('nav.maps'), icon: svgI('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>') },
        { path: '/timeline', label: t('nav.timeline'), icon: svgI('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
        { path: '/lore', label: t('nav.lore'), icon: svgI('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
        { path: '/notes', label: t('nav.notes'), icon: svgI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') }
    ]);
    // DM Tools navbar-link verwijderd (2026-06-07): het DM Dashboard is
    // bereikbaar via de party-pagina (grote knop), net als spelers hun
    // character-dashboard bereiken. "DM Tools" als los concept bestaat niet meer.

    // Personal links (main menu)
    var personalLinks = [
        { path: '/welcome', label: t('nav.welcome') || 'Welcome', icon: svgI('<path d="M12 2l2 4h4l-3 3 1 5-4-2-4 2 1-5-3-3h4z"/>') },
        { path: '/characters', label: t('nav.characters'), icon: svgI('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
        { path: '/settings', label: t('nav.settings') || 'Settings', icon: svgI('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') }
    ];

    var html = '<nav class="navbar">';
    html += '<div class="nav-brand">';
    html += '<a class="nav-logo" href="/welcome">D&D <span class="logo-accent">Within</span></a>';
    var brandCampaigns = getUserCampaigns();
    if (inCampaignView && brandCampaigns.length === 1 && campaigns[brandCampaigns[0]]) {
        html += '<span class="campaign-subtitle">' + escapeHtml(campaigns[brandCampaigns[0]].name) + '</span>';
    }
    html += '</div>';
    html += '<div class="nav-links">';

    if (inCampaignView) {
        // (Back-to-menu link weggehaald — D&D Within logo links nu naar #/welcome)
        // Campaign links
        for (var i = 0; i < campLinks.length; i++) {
            var link = campLinks[i];
            var isActive = route.path === link.path;
            if (link.path === '/home' && (route.path === '/home' || route.path === '/' || route.path === '/dashboard')) isActive = true;
            if (link.path === '/party' && route.parts[0] === 'party') isActive = true;
            // Character tab: active whenever we're on a character page
            if (link.path.indexOf('/characters/') === 0 && route.parts[0] === 'characters') isActive = true;
            if (link.path === '/lore' && route.parts[0] === 'lore') isActive = true;
            if (link.path === '/notes' && route.parts[0] === 'notes') isActive = true;
            if (link.path === '/dm' && route.parts[0] === 'dm') isActive = true;
            html += '<a class="nav-link' + (isActive ? ' active' : '') + '" href="' + link.path + '"><span class="nav-icon">' + link.icon + '</span><span class="nav-text">' + link.label + '</span></a>';
        }
    } else {
        // Main menu links
        for (var pi = 0; pi < personalLinks.length; pi++) {
            var plink = personalLinks[pi];
            var pActive = route.path === plink.path || (plink.path === '/welcome' && (route.path === '/' || route.path === '/home'));
            if (plink.path === '/characters' && route.parts[0] === 'characters') pActive = true;
            if (plink.path === '/settings' && route.path === '/settings') pActive = true;
            html += '<a class="nav-link' + (pActive ? ' active' : '') + '" href="' + plink.path + '"><span class="nav-icon">' + plink.icon + '</span><span class="nav-text">' + plink.label + '</span></a>';
        }
    }

    html += '</div>';
    html += '<div class="nav-right">';

    // (DM mode toggle verplaatst naar DM Tools page)

    // Sync status
    var syncStatus = typeof getSyncStatus === 'function' ? getSyncStatus() : 'not-configured';
    if (syncStatus === 'online') {
        html += '<span class="sync-indicator sync-online" title="' + t('nav.sync.online') + '">&#9729;</span>';
    } else if (syncStatus === 'offline') {
        html += '<span class="sync-indicator sync-offline" title="' + t('nav.sync.offline') + '">&#9729;</span>';
    }
    // Campaign selector (only show when in campaign view, multi-campaign users only —
    // single-campaign label is rendered as subtitle under the D&D Within logo above)
    var userCampaigns = getUserCampaigns();
    if (inCampaignView && userCampaigns.length > 1) {
        html += '<select class="campaign-selector" data-action="switch-campaign">';
        for (var ci = 0; ci < userCampaigns.length; ci++) {
            var cId = userCampaigns[ci];
            var cName = campaigns[cId] ? campaigns[cId].name : cId;
            html += '<option value="' + escapeAttr(cId) + '"' + (cId === activeCamp ? ' selected' : '') + '>' + escapeHtml(cName) + '</option>';
        }
        html += '</select>';
    }
    html += '<span class="nav-avatar" data-action="open-profile" title="' + t('nav.profile') + '" style="cursor:pointer;">' + escapeHtml(user ? user.name.charAt(0) : '') + '</span>';
    html += '<button class="nav-logout" data-action="logout">' + t('nav.logout') + '</button>';
    html += '</div>';
    html += '<button class="nav-toggle" data-action="toggle-nav">&#9776;</button>';
    html += '</nav>';
    return html;
}

// ============================================================
// Section 11: Dashboard
// ============================================================

function getDashboardData() {
    var saved = localStorage.getItem('dw_dashboard');
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            if (!parsed.bannerImages) parsed.bannerImages = {};
            return parsed;
        } catch(e) {}
    }
    return { campaignName: 'The Serpent March', bannerImage: null, bannerImages: {} };
}

function saveDashboardData(data) {
    localStorage.setItem('dw_dashboard', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_dashboard');
}

// ============================================================
// Section 10b: Home Page (Campaign Select + Personal Overview)
// ============================================================

function renderHome() {
    var user = currentUser();
    var uid = currentUserId();
    var campaigns = getCampaigns();
    var userCampaigns = getUserCampaigns();
    var activeCamp = getActiveCampaign();

    var html = '<div class="dashboard">';

    // Welcome
    html += '<div class="welcome-banner">';
    html += '<h1>' + t('home.welcome') + escapeHtml(user.name) + '</h1>';
    html += '<p class="text-dim">' + t('home.subtitle') + '</p>';
    html += '</div>';

    // My Campaigns
    html += '<div class="home-section">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
    html += '<h2 class="section-title">' + t('home.mycampaigns') + '</h2>';
    if (isDM()) {
        html += '<button class="btn btn-primary btn-sm" data-action="create-campaign">' + t('home.newcampaign') + '</button>';
    }
    html += '</div>';

    if (userCampaigns.length === 0) {
        html += '<p class="text-dim">' + t('home.nocampaigns') + '</p>';
    }

    html += '<div class="campaign-grid">';
    for (var ci = 0; ci < userCampaigns.length; ci++) {
        var cId = userCampaigns[ci];
        var camp = campaigns[cId];
        if (!camp) continue;
        var isActive = cId === activeCamp;
        var memberCount = camp.members ? camp.members.length : 0;
        var partyCount = camp.party ? Object.keys(camp.party).length : 0;
        var isDMOfCamp = camp.dm === uid;

        html += '<div class="campaign-home-card' + (isActive ? ' active' : '') + '" data-action="enter-campaign" data-campaign-id="' + escapeAttr(cId) + '">';
        html += '<div class="campaign-home-header">';
        html += '<h3>' + escapeHtml(camp.name) + '</h3>';
        if (camp.dm) {
            var dmData = getUserData(camp.dm);
            var dmName = dmData ? dmData.name : camp.dm;
            html += '<span class="campaign-dm-badge">DM: ' + escapeHtml(dmName) + '</span>';
        }
        html += '</div>';

        // Session info — number + next-session date (DM-editable)
        // Session count: prefer per-campaign value, fall back to global dw_session_number
        // (same source the campaign-dashboard uses) so the two views stay consistent.
        var globalSessionNum = parseInt(localStorage.getItem('dw_session_number') || '0', 10);
        var displaySession = camp.sessionCount > 0 ? camp.sessionCount : globalSessionNum;
        html += '<dl class="campaign-session-info">';
        html += '<div class="campaign-session-row">';
        html += '<dt>' + t('home.session') + '</dt>';
        html += '<dd>#' + (displaySession > 0 ? displaySession : '—') + '</dd>';
        html += '</div>';
        html += '<div class="campaign-session-row">';
        html += '<dt>' + t('home.nextsession') + '</dt>';
        if (camp.nextSession) {
            html += '<dd>' + escapeHtml(formatNextSession(camp.nextSession)) + '</dd>';
        } else {
            html += '<dd class="text-dim">' + t('home.nosession') + '</dd>';
        }
        html += '</div>';
        html += '</dl>';

        // Agenda: toon de eerstvolgende geplande sessies (na de "Next session")
        // als beknopte read-only lijst. DM bewerkt via het potlood (edit-modal).
        if (typeof campaignUpcoming === 'function') {
            var upcoming = campaignUpcoming(camp);
            if (upcoming.length > 1) {
                html += '<div class="campaign-agenda-list">';
                html += '<span class="campaign-agenda-label">' + t('home.upcoming') + '</span>';
                for (var ai = 1; ai < Math.min(upcoming.length, 4); ai++) {
                    var s = upcoming[ai];
                    html += '<div class="campaign-agenda-item">' +
                        '<span class="campaign-agenda-dt">' + escapeHtml(formatNextSession(s.datetime)) + '</span>' +
                        (s.title ? '<span class="campaign-agenda-ttl">' + escapeHtml(s.title) + '</span>' : '') +
                    '</div>';
                }
                if (upcoming.length > 4) html += '<div class="campaign-agenda-more">+' + (upcoming.length - 4) + ' ' + t('home.more') + '</div>';
                html += '</div>';
            }
        }

        html += '<div class="campaign-home-stats">';
        html += '<span>' + memberCount + t('home.players') + '</span>';
        html += '<span>' + partyCount + t('home.inparty') + '</span>';
        html += '</div>';
        if (isActive) html += '<span class="campaign-active-badge">' + t('home.active') + '</span>';

        // DM controls: edit session info button (stops propagation so card-click doesn't fire)
        if (isDMOfCamp) {
            html += '<button type="button" class="campaign-session-edit" data-action="edit-campaign-session" data-campaign-id="' + escapeAttr(cId) + '" title="' + t('home.editsession') + '" aria-label="' + t('home.editsession') + '">✎</button>';
        }

        // Show invite code for DM
        if (isDMOfCamp && camp.inviteCode) {
            html += '<div class="campaign-invite-info">';
            html += '<span class="text-dim" style="font-size:0.7rem;">' + t('home.invitecode') + '<strong>' + escapeHtml(camp.inviteCode) + '</strong></span>';
            html += '</div>';
        }

        html += '</div>';
    }
    html += '</div>';

    // Join campaign
    html += '<div class="join-campaign-section" style="margin-top:1rem;">';
    html += '<div style="display:flex;gap:0.5rem;align-items:center;">';
    html += '<input type="text" class="edit-input" id="join-code-input" placeholder="' + t('home.invitecode.plh') + '" style="flex:1;max-width:200px;">';
    html += '<button class="btn btn-ghost btn-sm" data-action="join-campaign-code">' + t('home.join') + '</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // home-section

    // My Characters (quick overview)
    var myChars = getMyCharacterIds();
    html += '<div class="home-section">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
    html += '<h2 class="section-title">' + t('home.mycharacters') + ' (' + myChars.length + ')</h2>';
    html += '<a class="btn btn-ghost btn-sm" href="/characters">' + t('home.viewall') + ' &rarr;</a>';
    html += '</div>';
    html += '<div class="character-cards">';
    for (var mi = 0; mi < myChars.length; mi++) {
        var mcid = myChars[mi];
        var mcfg = loadCharConfig(mcid);
        var mstate = loadCharState(mcid);
        if (!mcfg) continue;
        html += renderCharCard(mcid, mcfg, mstate, true);
    }
    // Create new character card
    html += '<div class="char-card char-card-create" data-action="open-create-wizard">';
    html += '<div class="char-card-img"><div class="char-card-placeholder" style="font-size:2.5rem;">+</div></div>';
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">' + t('home.newcharacter') + '</span>';
    html += '<span class="char-card-detail">' + t('home.newcharacter.hint') + '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>'; // home-section

    html += '</div>';
    return html;
}

function handleJoinCampaign(inviteCode) {
    var uid = currentUserId();
    var campaigns = getCampaigns();
    var found = null;
    for (var cid in campaigns) {
        if (campaigns[cid].inviteCode && campaigns[cid].inviteCode.toUpperCase() === inviteCode.toUpperCase()) {
            found = cid;
            break;
        }
    }
    if (!found) {
        return '<div class="page-placeholder"><h2>' + t('join.invalid') + '</h2><p>' + t('join.invalid.hint') + '</p><a class="btn btn-primary" href="/welcome">' + t('join.backhome') + '</a></div>';
    }
    var camp = campaigns[found];
    if (!camp.members) camp.members = [];
    if (camp.members.indexOf(uid) === -1) {
        camp.members.push(uid);
        saveCampaigns(campaigns);
    }
    setActiveCampaign(found);
    return '<div class="page-placeholder"><h2>' + t('join.welcome') + escapeHtml(camp.name) + '!</h2><p>' + t('join.added') + '</p><a class="btn btn-primary" href="/party">' + t('join.toparty') + '</a></div>';
}

// ============================================================
// Section 10c: Party Page (Campaign Characters)
// ============================================================

function renderParty() {
    var activeCamp = getActiveCampaign();
    var campaigns = getCampaigns();
    var camp = campaigns[activeCamp];
    if (!camp) {
        return '<div class="page-placeholder"><h2>' + t('party.nocampaign') + '</h2><p>' + t('party.nocampaign.hint') + '</p></div>';
    }

    var uid = currentUserId();
    var html = '<div class="dashboard">';
    html += '<h2 class="section-title">Party — ' + escapeHtml(camp.name) + '</h2>';

    // Check if current user has a character in the party
    var myPartyChar = camp.party && camp.party[uid] ? camp.party[uid] : null;
    var isMember = camp.members && camp.members.indexOf(uid) !== -1;
    // DM Dashboard: grote knop bovenaan, alleen voor de campaign-DM én admin —
    // leidt naar het DM Dashboard (/dm). Net als een speler op z'n character
    // klikt om naar z'n dashboard te gaan (verzoek 2026-06-05).
    var isDmOrAdmin = isCampaignDM() || isAdmin();
    if (isDmOrAdmin) {
        html += '<div class="party-dm-prompt">';
        html += '<a class="btn btn-primary btn-lg" href="/dm">' + t('party.dmdashboard') + '</a>';
        html += '</div>';
    }

    // Character assignment prompt — niet tonen aan DM/admin (die hebben geen
    // party-character en gebruiken het DM Dashboard).
    if (isMember && !myPartyChar && !isDmOrAdmin) {
        var myChars = getMyCharacterIds();
        html += '<div class="party-assign-prompt">';
        html += '<h3>' + t('party.choosechar') + '</h3>';
        html += '<p class="text-dim">' + t('party.choosechar.hint') + escapeHtml(camp.name) + '.</p>';
        if (myChars.length === 0) {
            html += '<p>' + t('party.nocharacters') + ' <a href="/characters">' + t('party.nocharacters.link') + '</a>.</p>';
        } else {
            html += '<div class="party-assign-grid">';
            for (var ai = 0; ai < myChars.length; ai++) {
                var acfg = loadCharConfig(myChars[ai]);
                var astate = loadCharState(myChars[ai]);
                if (!acfg) continue;
                html += '<div class="party-assign-card" data-action="assign-to-party" data-char-id="' + myChars[ai] + '">';
                var aPortrait = loadImage(myChars[ai], 'portrait');
                html += '<div class="char-card-img">';
                if (aPortrait) {
                    var apStyle = (typeof portraitCropStyle === 'function')
                        ? portraitCropStyle(loadPortraitCrop(myChars[ai])) : '';
                    html += '<img src="' + aPortrait + '" alt=""' + (apStyle ? ' style="' + apStyle + '"' : '') + '>';
                } else html += '<div class="char-card-placeholder">&#128100;</div>';
                html += '</div>';
                html += '<strong>' + escapeHtml(acfg.name) + '</strong>';
                html += '<span class="text-dim">' + raceDisplayName(acfg.race) + ' ' + classDisplayName(acfg.className) + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
    } else if (isMember && myPartyChar) {
        // Show change option
        html += '<div class="party-your-char">';
        var myCfg = loadCharConfig(myPartyChar);
        html += '<span class="text-dim">' + t('party.yourchar') + '<strong>' + escapeHtml(myCfg ? myCfg.name : myPartyChar) + '</strong></span>';
        html += ' <button class="btn btn-ghost btn-sm" data-action="change-party-char">' + t('party.changechar') + '</button>';
        html += '</div>';
    }

    // Party members
    html += '<div class="character-cards">';
    var partyCharIds = getPartyCharIds();
    if (typeof sortCharIdsByName === 'function') partyCharIds = sortCharIdsByName(partyCharIds);
    for (var i = 0; i < partyCharIds.length; i++) {
        var cid = partyCharIds[i];
        var cfg = loadCharConfig(cid);
        var state = loadCharState(cid);
        if (!cfg) continue;
        var isOwn = userOwnsCharacter(uid, cid);
        html += renderCharCard(cid, cfg, state, isOwn);
    }

    if (partyCharIds.length === 0) {
        html += '<p class="text-dim" style="padding:2rem;">' + t('party.empty') + '</p>';
    }

    html += '</div>';

    // DM: manage members
    if (isDM() && isCampaignDM()) {
        html += '<div class="dm-party-manage" style="margin-top:2rem;">';
        html += '<h3>' + t('party.manage') + '</h3>';

        // Invite link
        if (camp.inviteCode) {
            var inviteUrl = window.location.origin + window.location.pathname + '#/join/' + camp.inviteCode;
            html += '<div style="margin-bottom:1rem;">';
            html += '<label class="login-label">' + t('party.invitelink') + '</label>';
            html += '<div style="display:flex;gap:0.5rem;">';
            html += '<input type="text" class="edit-input" value="' + escapeAttr(inviteUrl) + '" readonly style="flex:1;" id="invite-link-input">';
            html += '<button class="btn btn-ghost btn-sm" data-action="copy-invite-link">' + t('party.copy') + '</button>';
            html += '</div>';
            html += '<span class="text-dim" style="font-size:0.7rem;">' + t('party.code') + escapeHtml(camp.inviteCode) + '</span>';
            html += '</div>';
        }

        // Members list
        html += '<h4>' + t('party.members') + ' (' + (camp.members ? camp.members.length : 0) + ')</h4>';
        var members = camp.members || [];
        for (var mi = 0; mi < members.length; mi++) {
            var mUid = members[mi];
            var mUser = getUserData(mUid);
            var mCharId = camp.party && camp.party[mUid] ? camp.party[mUid] : null;
            var mCharCfg = mCharId ? loadCharConfig(mCharId) : null;
            html += '<div class="member-row">';
            html += '<span>' + escapeHtml(mUser ? mUser.name : mUid) + '</span>';
            if (mCharCfg) {
                html += '<span class="text-dim"> — ' + escapeHtml(mCharCfg.name) + ' (' + classDisplayName(mCharCfg.className) + ')</span>';
            } else {
                html += '<span class="text-dim">' + t('party.nochar') + '</span>';
            }
            if (mUid !== camp.dm) {
                html += '<button class="btn btn-ghost btn-sm" data-action="remove-member" data-user-id="' + escapeAttr(mUid) + '" style="color:var(--danger);">&times;</button>';
            }
            html += '</div>';
        }

        // Add member manually
        html += '<div style="margin-top:0.5rem;display:flex;gap:0.5rem;">';
        html += '<input type="text" class="edit-input" id="add-member-input" placeholder="' + t('party.username.plh') + '" style="flex:1;max-width:200px;">';
        html += '<button class="btn btn-ghost btn-sm" data-action="add-member">' + t('party.addmember') + '</button>';
        html += '</div>';

        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 11: Dashboard
// ============================================================

function renderDashboard() {
    var user = currentUser();
    var html = '<div class="dashboard">';

    // Session number (DM can set)
    var sessionNum = localStorage.getItem('dw_session_number') || '0';
    var dashData = getDashboardData();

    // Banner: 4 time-of-day slots — pick current slot, fall back to other slots
    // or legacy single-banner if slot is empty.
    var bannerSlots = dashData.bannerImages || {};
    var hour = new Date().getHours();
    var currentSlot;
    if (hour < 6) currentSlot = 'night';
    else if (hour < 12) currentSlot = 'morning';
    else if (hour < 18) currentSlot = 'afternoon';
    else currentSlot = 'evening';
    var slotOrder = ['night', 'morning', 'afternoon', 'evening'];
    var activeBanner = bannerSlots[currentSlot] || null;
    if (!activeBanner) {
        for (var bsi = 0; bsi < slotOrder.length && !activeBanner; bsi++) {
            if (bannerSlots[slotOrder[bsi]]) activeBanner = bannerSlots[slotOrder[bsi]];
        }
    }
    if (!activeBanner && dashData.bannerImage) activeBanner = dashData.bannerImage;

    var slotLabels = {
        night: 'Night',
        morning: 'Morning',
        afternoon: 'Afternoon',
        evening: 'Evening'
    };
    var slotTitles = {
        night: 'Night (00–06)',
        morning: 'Morning (06–12)',
        afternoon: 'Afternoon (12–18)',
        evening: 'Evening (18–24)'
    };

    // Welcome banner with optional background image
    html += '<div class="welcome-banner' + (activeBanner ? ' has-banner' : '') + '"';
    if (activeBanner) {
        html += ' style="background-image:url(' + activeBanner + ')"';
    }
    html += '>';
    if (isDM()) {
        html += '<div class="banner-upload-slots" title="Upload banner per dagdeel">';
        for (var bsj = 0; bsj < slotOrder.length; bsj++) {
            var slotKey = slotOrder[bsj];
            var hasImg = !!bannerSlots[slotKey];
            var isCur = slotKey === currentSlot;
            html += '<label class="banner-upload-slot' + (hasImg ? ' filled' : '') + (isCur ? ' current' : '') + '" title="' + slotTitles[slotKey] + (hasImg ? ' — click to replace' : '') + '">';
            html += '<span class="banner-slot-label">' + slotLabels[slotKey] + '</span>';
            html += '<input type="file" accept="image/*" data-action="upload-dash-banner" data-banner-slot="' + slotKey + '" style="display:none">';
            if (hasImg) {
                html += '<button type="button" class="banner-slot-clear" data-action="clear-dash-banner" data-banner-slot="' + slotKey + '" title="Remove">&times;</button>';
            }
            html += '</label>';
        }
        html += '</div>';
    }
    html += '<h1>' + t('dash.welcome') + '</h1>';
    html += '<p class="campaign-name">';
    html += escapeHtml(dashData.campaignName || 'The Serpent March');
    if (isDM()) {
        html += ' <button class="edit-trigger" data-action="edit-campaign-name" title="Edit">&#9998;</button>';
    }
    html += '</p>';
    html += '<p class="welcome-user">' + t('dash.loggedinas') + ' ' + escapeHtml(user ? user.name : '') + '</p>';
    html += '<p class="text-dim" style="font-size:0.85rem;">' + t('dash.session') + ' ' + escapeHtml(sessionNum) + '</p>';
    html += '</div>';

    // Quick stats
    var charIds = getCharacterIds();
    var partySize = 0;
    var groupLevel = 1;
    var partyGold = 0;
    for (var si = 0; si < charIds.length; si++) {
        var scfg = loadCharConfig(charIds[si]);
        if (!scfg) continue;
        var sstate = loadCharState(charIds[si]);
        partySize++;
        groupLevel = sstate.level; // group level (all same)
        partyGold += (sstate.gold || 0);
    }

    // Party level override (DM-controlled, like session number)
    var levelOverride = parseInt(localStorage.getItem('dw_party_level') || '0', 10);
    var displayLevel = levelOverride > 0 ? levelOverride : groupLevel;

    html += '<div class="dash-stats">';
    html += '<div class="dash-stat-card session-card">';
    if (isDM()) {
        html += '<div class="dash-stat-value-row">';
        html += '<button class="session-btn" data-action="session-minus" aria-label="-">&minus;</button>';
        html += '<span class="dash-stat-value">' + escapeHtml(sessionNum) + '</span>';
        html += '<button class="session-btn" data-action="session-plus" aria-label="+">+</button>';
        html += '</div>';
    } else {
        html += '<span class="dash-stat-value">' + escapeHtml(sessionNum) + '</span>';
    }
    html += '<span class="dash-stat-label">' + t('dash.session') + '</span>';
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + partySize + '</span><span class="dash-stat-label">' + t('dash.party') + '</span></div>';

    // Party gold (sum of all character gold)
    html += '<div class="dash-stat-card party-gold-card">';
    html += '<span class="dash-stat-value" style="color:var(--gold);">' + partyGold + '</span>';
    html += '<span class="dash-stat-label">' + t('dash.partygold') + '</span>';
    html += '</div>';
    html += '<div class="dash-stat-card level-card">';
    if (isDM()) {
        html += '<div class="dash-stat-value-row">';
        html += '<button class="session-btn" data-action="level-minus" aria-label="-">&minus;</button>';
        html += '<span class="dash-stat-value">' + displayLevel + '</span>';
        html += '<button class="session-btn" data-action="level-plus" aria-label="+">+</button>';
        html += '</div>';
    } else {
        html += '<span class="dash-stat-value">' + displayLevel + '</span>';
    }
    html += '<span class="dash-stat-label">' + t('dash.level') + '</span>';
    html += '</div>';
    html += '</div>';

    // Recent timeline events (pull from ALL chapters, sort by session # desc,
    // top 3). Events zonder session-nummer zakken naar onder.
    var tlData = getTimelineData();
    var allEvents = [];
    for (var ci = 0; ci < (tlData.chapters || []).length; ci++) {
        var chEvents = tlData.chapters[ci].events || [];
        for (var ei = 0; ei < chEvents.length; ei++) {
            allEvents.push(chEvents[ei]);
        }
    }
    allEvents.sort(function(a, b) {
        var na = parseInt(a.session, 10);
        var nb = parseInt(b.session, 10);
        var aValid = !isNaN(na);
        var bValid = !isNaN(nb);
        if (aValid && bValid) return nb - na;
        if (aValid) return -1;
        if (bValid) return 1;
        return 0;
    });
    var recentEvents = allEvents.slice(0, 3);
    if (recentEvents.length > 0) {
        html += '<div class="dash-recent-section">';
        html += '<h2 class="section-title">' + t('dash.recent') + '</h2>';
        html += '<div class="dash-recent-events">';
        for (var ri = 0; ri < recentEvents.length; ri++) {
            var rev = recentEvents[ri];
            var revPreview = (typeof sessionPreviewText === 'function') ? sessionPreviewText(rev) : (rev.desc || '');
            html += '<a class="dash-recent-event" href="/timeline" data-action="view-session" data-session-id="' + escapeAttr(rev.id || '') + '" title="' + escapeAttr(t('dash.recent.open') || 'Open session') + '">';
            if (rev.session) html += '<span class="timeline-date">' + t('dash.session') + ' ' + escapeHtml(rev.session) + '</span>';
            html += '<strong class="dash-recent-title">' + escapeHtml(rev.title || '') + '</strong>';
            html += '<p class="text-dim dash-recent-desc">' + escapeHtml(revPreview) + '</p>';
            html += '</a>';
        }
        html += '</div>';
        html += '</div>';
    }

    // DM Whispers (show to players on their dashboard)
    var myId = currentUserId();
    var whisperKey = 'dw_whisper_' + myId;
    var myWhispers = JSON.parse(localStorage.getItem(whisperKey) || '[]');
    if (myWhispers.length > 0 && !isDM()) {
        html += '<div class="dash-whispers">';
        html += '<h2 class="section-title">&#128172; ' + t('dash.dmwhispers') + '</h2>';
        for (var wi = 0; wi < myWhispers.length; wi++) {
            html += '<div class="whisper-card">';
            html += '<p>' + escapeHtml(myWhispers[wi].text) + '</p>';
            html += '<span class="whisper-time text-dim" style="font-size:0.7rem;">' + new Date(myWhispers[wi].time).toLocaleString() + '</span>';
            html += '<button class="btn btn-ghost btn-sm" data-action="dismiss-whisper" data-whisper-idx="' + wi + '" style="margin-left:auto;">&#10003;</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    // Quest tracker (DM only)
    if (isDM()) {
    var questData = getQuestData();
    html += '<div class="dash-quests">';
    html += '<div class="dash-quests-header">';
    html += '<h2 class="section-title">' + t('dash.quests') + '</h2>';
    html += '<button class="btn btn-ghost btn-sm" data-action="add-quest">' + t('dash.addquest') + '</button>';
    html += '</div>';

    // Quest add form (hidden by default)
    html += '<div class="quest-add-form" id="quest-add-form" style="display:none;">';
    html += '<input type="text" class="edit-input" id="quest-title" placeholder="' + t('quest.title.plh') + '">';
    html += '<textarea class="edit-textarea auto-grow" id="quest-desc" placeholder="' + t('quest.desc.plh') + '" style="min-height:40px;" oninput="if(typeof autoGrowTextarea===\'function\')autoGrowTextarea(this)"></textarea>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
    html += '<input type="text" class="edit-input" id="quest-giver" placeholder="' + t('quest.giver.plh') + '" style="flex:1;">';
    html += '<input type="text" class="edit-input" id="quest-reward" placeholder="' + t('quest.reward.plh') + '" style="flex:1;">';
    html += '<input type="text" class="edit-input" id="quest-tags" placeholder="' + t('quest.tags.plh') + '" style="flex:1;">';
    html += '</div>';
    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-quest">' + t('quest.save') + '</button>';
    html += '<button class="edit-cancel" data-action="cancel-quest">' + t('generic.cancel') + '</button>';
    html += '</div>';
    html += '<input type="hidden" id="quest-edit-idx" value="">';
    html += '</div>';

    if (questData.active.length === 0 && questData.completed.length === 0) {
        html += '<p class="text-dim">' + t('quest.empty') + '</p>';
    }
    for (var qi = 0; qi < questData.active.length; qi++) {
        var quest = questData.active[qi];
        html += '<div class="quest-item quest-active">';
        html += '<span class="quest-icon">&#9876;</span>';
        html += '<div class="quest-info">';
        html += '<strong>' + escapeHtml(quest.title) + '</strong>';
        if (quest.desc) html += '<p class="text-dim" style="margin:0;font-size:0.8rem;">' + escapeHtml(quest.desc) + '</p>';
        if (quest.giver) html += '<span class="quest-meta">' + t('quest.from') + escapeHtml(quest.giver) + '</span>';
        if (quest.reward) html += '<span class="quest-meta">' + t('quest.reward.label') + escapeHtml(quest.reward) + '</span>';
        if (quest.tags) {
            var tagArr = quest.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
            if (tagArr.length > 0) {
                html += '<div class="quest-tags">';
                for (var ti = 0; ti < tagArr.length; ti++) {
                    html += '<span class="quest-tag">' + escapeHtml(tagArr[ti]) + '</span>';
                }
                html += '</div>';
            }
        }
        html += '</div>';
        html += '<div class="quest-actions">';
        html += '<button class="btn btn-ghost btn-sm" data-action="edit-quest" data-quest-idx="' + qi + '" title="Edit">&#9998;</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="complete-quest" data-quest-idx="' + qi + '" title="Complete">&#10003;</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="delete-quest" data-quest-idx="' + qi + '" style="color:var(--danger);" title="Delete">&times;</button>';
        html += '</div>';
        html += '</div>';
    }
    if (questData.completed.length > 0) {
        html += '<details class="quest-completed-section"><summary class="text-dim" style="cursor:pointer;font-size:0.85rem;">' + t('quest.completed') + ' (' + questData.completed.length + ')</summary>';
        for (var qc = 0; qc < questData.completed.length; qc++) {
            html += '<div class="quest-item quest-done">';
            html += '<span class="quest-icon">&#10003;</span>';
            html += '<span style="text-decoration:line-through;color:var(--text-dim);flex:1;">' + escapeHtml(questData.completed[qc].title) + '</span>';
            html += '<div class="quest-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="uncomplete-quest" data-quest-idx="' + qc + '" title="Terug naar actief">&#8634;</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-quest" data-completed="1" data-quest-idx="' + qc + '" style="color:var(--danger);" title="Verwijder">&times;</button>';
            html += '</div>';
            html += '</div>';
        }
        html += '</details>';
    }
    html += '</div>';
    } // end isDM() quest section

    // Party overview
    html += '<div class="party-section">';
    html += '<h2 class="section-title">' + t('dash.partyoverview') + '</h2>';
    html += '<div class="character-cards">';

    var sortedCharIds = (typeof sortCharIdsByName === 'function') ? sortCharIdsByName(charIds) : charIds;
    for (var i = 0; i < sortedCharIds.length; i++) {
        var cid = sortedCharIds[i];
        var ccfg = loadCharConfig(cid);
        var cstate = loadCharState(cid);
        if (!ccfg) continue;

        var isOwn = userOwnsCharacter(currentUserId(), cid);
        html += renderCharCard(cid, ccfg, cstate, isOwn);
    }

    html += '</div>';
    html += '</div>';

    // (DM quick link "DM Tools →" verwijderd 2026-06-07 — DM Dashboard is
    //  bereikbaar via de grote knop op de party-pagina.)

    html += '</div>';
    return html;
}

// ============================================================
// Section 11b: DM Page
// ============================================================

var dmTab = 'initiative';

function renderDMPage(subpage) {
    if (!isDM()) return '<p>Access denied.</p>';
    // DM Dashboard (2026-06-05): de oude tools-tabs (initiative=kapot,
    // families=staat al onder Lore, campaigns=overbodig) zijn vervangen door
    // een volwaardig DM Dashboard dat de WidgetGrid in DM-modus draait. De
    // WidgetGrid-template levert zelf de topbar + situatie-tabs (Social /
    // Exploring / Combat / Ambient). Mount gebeurt in app.js (postRender) op
    // deze lege host. `.character-page` is vereist: wg-style.css is @scope
    // (.character-page). Widgets komen later — zie memory dnd_within_dm_dashboard.
    return '<a class="char-back-btn" href="/party" aria-label="Terug naar party" title="Terug naar party">'
         +   '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         +     '<path d="M19 12H5M12 19l-7-7 7-7"/>'
         +   '</svg>'
         + '</a>'
         + '<div class="character-page dm-page"></div>';
}

function renderDMInitiative() {
    var html = '<div class="dm-tool-card init-tracker-card">';

    var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
    var entries = initData.entries || [];
    var currentTurn = initData.currentTurn || 0;
    var initRound = initData.round || 1;
    var initNpcs = initData.npcs || [];

    html += '<div class="init-header">';
    html += '<span class="init-round">' + t('dm.round') + ' ' + initRound + '</span>';
    if (entries.length > 0) {
        html += '<button class="btn btn-sm btn-primary" data-action="next-turn">' + t('dm.nextturn') + ' &rarr;</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="reset-init">Reset</button>';
    }
    html += '</div>';

    html += '<div class="init-columns">';

    // LEFT: Available players
    html += '<div class="init-col init-col-players">';
    html += '<div class="init-col-title">Players</div>';
    var iCharIds = getCharacterIds();
    for (var ici = 0; ici < iCharIds.length; ici++) {
        var iccfg = loadCharConfig(iCharIds[ici]);
        if (!iccfg) continue;
        var inInit = false;
        for (var ei = 0; ei < entries.length; ei++) {
            if (entries[ei].charId === iCharIds[ici]) { inInit = true; break; }
        }
        if (!inInit) {
            html += '<div class="init-available init-draggable" data-drag-type="player" data-char-id="' + iCharIds[ici] + '">';
            html += '<span class="init-drag-handle">&#9776;</span>';
            html += '<span style="color:' + iccfg.accentColor + '">' + escapeHtml(iccfg.name) + '</span>';
            html += '</div>';
        }
    }
    html += '</div>';

    // CENTER: Ordered initiative (drop zone)
    html += '<div class="init-col init-col-order" id="init-drop-zone">';
    html += '<div class="init-col-title">Initiative Order</div>';
    for (var ii = 0; ii < entries.length; ii++) {
        var entry = entries[ii];
        var isCurrent = ii === currentTurn;
        var entryColor = entry.disposition === 'hostile' ? 'var(--danger)' : entry.disposition === 'friendly' ? 'var(--success)' : entry.disposition === 'neutral' ? 'var(--warning)' : 'var(--accent)';
        if (entry.charId) {
            var ecfg = loadCharConfig(entry.charId);
            if (ecfg) entryColor = ecfg.accentColor;
        }
        html += '<div class="init-entry init-draggable" data-drag-type="reorder" data-init-idx="' + ii + '" data-init-current="' + (isCurrent ? '1' : '0') + '" style="border-left-color:' + entryColor + '">';
        html += '<span class="init-drag-handle">&#9776;</span>';
        html += '<span class="init-name">' + escapeHtml(entry.name) + '</span>';
        html += '<button class="init-remove" data-action="remove-init" data-init-idx="' + ii + '">&times;</button>';
        html += '</div>';
    }
    if (entries.length === 0) html += '<p class="text-dim init-drop-hint" style="text-align:center;padding:1rem 0;">Drag players or NPCs here</p>';
    html += '</div>';

    // RIGHT: NPCs/Monsters
    html += '<div class="init-col init-col-npcs">';
    html += '<div class="init-col-title">NPCs / Monsters</div>';
    for (var ni = 0; ni < initNpcs.length; ni++) {
        var inpc = initNpcs[ni];
        var inInit = false;
        for (var ei = 0; ei < entries.length; ei++) {
            if (entries[ei].npcIdx === ni) { inInit = true; break; }
        }
        if (!inInit) {
            var npcColor = inpc.disposition === 'hostile' ? 'var(--danger)' : inpc.disposition === 'friendly' ? 'var(--success)' : 'var(--warning)';
            html += '<div class="init-available init-npc init-draggable" data-drag-type="npc" data-npc-idx="' + ni + '" style="border-left-color:' + npcColor + '">';
            html += '<span class="init-drag-handle">&#9776;</span>';
            html += '<span>' + escapeHtml(inpc.name) + '</span>';
            html += '<button class="init-npc-del" data-action="init-delete-npc" data-npc-idx="' + ni + '">&times;</button>';
            html += '</div>';
        }
    }
    html += '<div class="init-add-npc-form">';
    html += '<input type="text" class="edit-input" id="init-npc-name" placeholder="Name..." style="flex:1;">';
    html += '<select class="edit-input" id="init-npc-disp" style="width:auto;">';
    html += '<option value="hostile">Hostile</option>';
    html += '<option value="neutral">Neutral</option>';
    html += '<option value="friendly">Friendly</option>';
    html += '</select>';
    html += '<button class="btn btn-ghost btn-sm" data-action="init-create-npc">+</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // init-columns
    html += '</div>'; // dm-tool-card
    return html;
}

// Initiative drag-drop: uses global state + document-level delegation to survive re-renders
var _initDrag = null;
var _initGhost = null;
var _initDragBound = false;

function initInitiativeDragDrop() {
    var dropZone = document.getElementById('init-drop-zone');
    if (!dropZone) return;

    if (_initDragBound) return;
    _initDragBound = true;

    function getDropZone() { return document.getElementById('init-drop-zone'); }

    function getInsertIdx(y) {
        var dz = getDropZone();
        if (!dz) return 0;
        var entries = dz.querySelectorAll('.init-entry:not(.dragging)');
        var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[]}');
        var idx = initData.entries.length;
        for (var i = 0; i < entries.length; i++) {
            var rect = entries[i].getBoundingClientRect();
            if (y < rect.top + rect.height / 2) {
                idx = parseInt(entries[i].dataset.initIdx);
                break;
            }
        }
        return idx;
    }

    function showIndicator(y) {
        document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        var dz = getDropZone();
        if (!dz) return;
        var entries = dz.querySelectorAll('.init-entry:not(.dragging)');
        var insertBefore = null;
        for (var i = 0; i < entries.length; i++) {
            var rect = entries[i].getBoundingClientRect();
            if (y < rect.top + rect.height / 2) { insertBefore = entries[i]; break; }
        }
        var indicator = document.createElement('div');
        indicator.className = 'init-drop-indicator';
        if (insertBefore) dz.insertBefore(indicator, insertBefore);
        else {
            // Insert before the hint text if it exists, otherwise append
            var hint = dz.querySelector('.init-drop-hint');
            if (hint) dz.insertBefore(indicator, hint);
            else dz.appendChild(indicator);
        }
    }

    function isOverDropZone(x, y) {
        var dz = getDropZone();
        if (!dz) return false;
        var r = dz.getBoundingClientRect();
        return x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20;
    }

    function cleanup() {
        if (_initDrag && _initDrag.el) {
            try { _initDrag.el.releasePointerCapture(_initDrag.pointerId); } catch (ex) {}
        }
        if (_initGhost) { _initGhost.remove(); _initGhost = null; }
        document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        document.querySelectorAll('.init-draggable.dragging').forEach(function(el) { el.classList.remove('dragging'); });
        var dz = getDropZone();
        if (dz) dz.classList.remove('drag-over');
        _initDrag = null;
    }

    function doDrop(y) {
        if (!_initDrag) return;
        var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
        if (!Array.isArray(initData.entries)) initData.entries = initData.entries ? Object.values(initData.entries) : [];
        if (!Array.isArray(initData.npcs)) initData.npcs = initData.npcs ? Object.values(initData.npcs) : [];
        var insertIdx = getInsertIdx(y);

        if (_initDrag.type === 'player') {
            if (!_initDrag.charId) { cleanup(); return; }
            var cfg = (typeof loadCharConfig === 'function') ? loadCharConfig(_initDrag.charId) : null;
            var playerName = (cfg && cfg.name) ? cfg.name : (_initDrag.snapshotName || _initDrag.charId);
            initData.entries.splice(insertIdx, 0, { name: playerName, charId: _initDrag.charId });
        } else if (_initDrag.type === 'npc') {
            var nIdx = parseInt(_initDrag.npcIdx);
            var npc = initData.npcs[nIdx];
            var npcName = (npc && npc.name) ? npc.name : (_initDrag.snapshotName || ('NPC ' + (isFinite(nIdx) ? nIdx : '')));
            var npcDisp = npc ? npc.disposition : 'unknown';
            initData.entries.splice(insertIdx, 0, { name: npcName, npcIdx: isFinite(nIdx) ? nIdx : null, disposition: npcDisp });
        } else if (_initDrag.type === 'reorder') {
            var oldIdx = parseInt(_initDrag.initIdx);
            var moved = initData.entries.splice(oldIdx, 1)[0];
            if (insertIdx > oldIdx) insertIdx--;
            initData.entries.splice(insertIdx, 0, moved);
            if (initData.currentTurn === oldIdx) initData.currentTurn = insertIdx;
            else if (oldIdx < initData.currentTurn && insertIdx >= initData.currentTurn) initData.currentTurn--;
            else if (oldIdx > initData.currentTurn && insertIdx <= initData.currentTurn) initData.currentTurn++;
        }

        localStorage.setItem('dw_initiative', JSON.stringify(initData));
        if (typeof syncUpload === 'function') syncUpload('dw_initiative');
        cleanup();
        renderApp();
    }

    // Document-level delegation: works even after DOM re-renders
    document.addEventListener('pointerdown', function(e) {
        // Don't start drag on remove/delete buttons
        if (e.target.closest('.init-remove') || e.target.closest('.init-npc-del')) return;
        var el = e.target.closest('.init-draggable');
        if (!el) return;
        if (e.button && e.button !== 0) return;
        // Snapshot the visible name from the row so doDrop has a fallback when
        // loadCharConfig isn't available (e.g., after a sync purge).
        var nameNode = el.querySelector('.init-name') || el.querySelector('span:not(.init-drag-handle)');
        var snapshotName = nameNode ? (nameNode.textContent || '').trim() : '';
        e.preventDefault();
        _initDrag = {
            el: el,
            type: el.dataset.dragType,
            charId: el.dataset.charId,
            npcIdx: el.dataset.npcIdx,
            initIdx: el.dataset.initIdx,
            snapshotName: snapshotName,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            started: false
        };
    });

    document.addEventListener('pointermove', function(e) {
        if (!_initDrag || _initDrag.pointerId !== e.pointerId) return;
        var dx = e.clientX - _initDrag.startX;
        var dy = e.clientY - _initDrag.startY;
        if (!_initDrag.started && Math.abs(dx) + Math.abs(dy) < 8) return;

        if (!_initDrag.started) {
            _initDrag.started = true;
            _initDrag.el.classList.add('dragging');
            try { _initDrag.el.setPointerCapture(e.pointerId); } catch (ex) {}
            _initGhost = document.createElement('div');
            _initGhost.className = 'init-drag-ghost';
            // Use only the name text, not button text
            var nameEl = _initDrag.el.querySelector('.init-name') || _initDrag.el.querySelector('span:nth-child(2)');
            _initGhost.textContent = nameEl ? nameEl.textContent.trim() : _initDrag.el.textContent.trim();
            document.body.appendChild(_initGhost);
        }

        _initDrag.lastX = e.clientX;
        _initDrag.lastY = e.clientY;
        _initGhost.style.left = e.clientX + 'px';
        _initGhost.style.top = e.clientY + 'px';

        var dz = getDropZone();
        if (dz && isOverDropZone(e.clientX, e.clientY)) {
            dz.classList.add('drag-over');
            showIndicator(e.clientY);
        } else {
            if (dz) dz.classList.remove('drag-over');
            document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        }
    });

    function finishDrag(e) {
        if (!_initDrag) return;
        if (!_initDrag.started) { cleanup(); return; }

        if (_initDrag.el) {
            try { _initDrag.el.releasePointerCapture(_initDrag.pointerId); } catch (ex) {}
        }

        var x = (e && typeof e.clientX === 'number' && e.clientX) ? e.clientX : _initDrag.lastX;
        var y = (e && typeof e.clientY === 'number' && e.clientY) ? e.clientY : _initDrag.lastY;
        if (typeof x !== 'number') x = _initDrag.lastX;
        if (typeof y !== 'number') y = _initDrag.lastY;

        try {
            if (typeof x === 'number' && typeof y === 'number' && isOverDropZone(x, y)) {
                doDrop(y);
            } else {
                cleanup();
            }
        } catch (ex) {
            cleanup();
        }
    }

    document.addEventListener('pointerup', function(e) {
        // Accept any pointerup while a drag is active — pointerId mismatch should
        // not strand the ghost on the cursor.
        if (!_initDrag) return;
        if (_initDrag.pointerId !== undefined && e.pointerId !== undefined &&
            _initDrag.pointerId !== e.pointerId) {
            // Different pointer (e.g., second touch); ignore but only if main drag still active.
            return;
        }
        finishDrag(e);
    });

    // Failsafes: if the browser cancels the gesture or capture is lost, drop the ghost.
    document.addEventListener('pointercancel', function(e) {
        if (!_initDrag) return;
        cleanup();
    });
    document.addEventListener('lostpointercapture', function(e) {
        if (!_initDrag || !_initDrag.started) return;
        finishDrag(e);
    });
    // Esc cancels an in-flight drag.
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && _initDrag) cleanup();
    });
}

var npcSearchQuery = '';

function renderDMNPCs() {
    var data = getNPCData();
    var npcs = data.npcs || [];
    var html = '<div class="dm-tool-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;gap:0.5rem;flex-wrap:wrap;">';
    html += '<h3>NPCs (' + npcs.length + ')</h3>';
    html += '<div style="display:flex;gap:0.5rem;align-items:center;flex:1;min-width:150px;max-width:300px;">';
    html += '<input type="text" class="edit-input npc-search" id="npc-search" placeholder="Search NPCs..." value="' + escapeAttr(npcSearchQuery) + '" style="flex:1;font-size:0.8rem;">';
    html += '</div>';
    html += '<button class="btn btn-primary btn-sm" data-action="add-npc">+ Add NPC</button>';
    html += '</div>';

    // Filter NPCs by search query
    var query = npcSearchQuery.toLowerCase();
    var filteredNpcs = [];
    for (var fi = 0; fi < npcs.length; fi++) {
        if (!query || (npcs[fi].name && npcs[fi].name.toLowerCase().indexOf(query) >= 0) ||
            (npcs[fi].location && npcs[fi].location.toLowerCase().indexOf(query) >= 0) ||
            (npcs[fi].disposition && npcs[fi].disposition.toLowerCase().indexOf(query) >= 0) ||
            (npcs[fi].notes && npcs[fi].notes.toLowerCase().indexOf(query) >= 0)) {
            filteredNpcs.push({ npc: npcs[fi], idx: fi });
        }
    }

    if (filteredNpcs.length === 0) {
        html += '<p class="text-dim">' + (query ? 'No NPCs matching "' + escapeHtml(query) + '".' : 'No NPCs yet.') + '</p>';
    } else {
        html += '<div class="npc-grid">';
        for (var ni = 0; ni < filteredNpcs.length; ni++) {
            var npc = filteredNpcs[ni].npc;
            var realIdx = filteredNpcs[ni].idx;
            var dispColor = npc.disposition === 'friendly' ? 'var(--success)' : npc.disposition === 'hostile' ? 'var(--danger)' : npc.disposition === 'neutral' ? 'var(--warning)' : 'var(--text-dim)';
            html += '<div class="npc-card" style="border-left-color:' + dispColor + '" data-npc-idx="' + realIdx + '">';
            html += '<div class="npc-header" data-action="toggle-npc-card">';
            html += '<div class="npc-header-info">';
            html += '<strong>' + escapeHtml(npc.name) + '</strong>';
            if (npc.disposition) html += '<span class="npc-disposition" style="color:' + dispColor + '">' + escapeHtml(npc.disposition) + '</span>';
            if (npc.location) html += '<span class="npc-location-inline">&#128205; ' + escapeHtml(npc.location) + '</span>';
            html += '</div>';
            html += '<span class="npc-expand-icon">&#9660;</span>';
            html += '</div>';
            html += '<div class="npc-details">';
            if (npc.notes) html += '<p class="npc-notes">' + escapeHtml(npc.notes) + '</p>';
            var npcPrimaryFam = (typeof findPrimaryFamilyByLink === 'function') ? findPrimaryFamilyByLink(null, String(realIdx)) : null;
            if (npcPrimaryFam && npcPrimaryFam.family) {
                html += '<div class="npc-family-section">';
                html += renderFamilyDiagram(npcPrimaryFam.family.id, false);
                html += '</div>';
            }
            html += '<div class="npc-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="edit-npc" data-npc-idx="' + realIdx + '">Edit</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-npc" data-npc-idx="' + realIdx + '" style="color:var(--danger);">Delete</button>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

var familiesExpandedId = null;       // family ID being viewed
var familiesSearchQuery = '';

function renderDMFamilies() {
    // Auto-migrate once
    if (typeof migrateFamilies === 'function') {
        var data = (typeof getFamiliesData === 'function') ? getFamiliesData() : null;
        if (data && Object.keys(data.families).length === 0 && Object.keys(data.members).length === 0) {
            try { migrateFamilies(); } catch (e) { console.warn('[families] migration failed', e); }
        }
    }

    var html = '<div class="dm-tool-card">';
    html += '<h3>Family Trees</h3>';

    var families = (typeof listFamilies === 'function') ? listFamilies() : [];
    var query = (familiesSearchQuery || '').trim().toLowerCase();
    var filtered = query ? families.filter(function(f) { return (f.surname || '').toLowerCase().indexOf(query) >= 0; }) : families;

    // Search + add new
    html += '<div class="famdiag-toolbar">';
    html += '<input type="text" class="edit-input famdiag-search" id="famdiag-search-input" placeholder="Zoek op familienaam..." value="' + escapeAttr(familiesSearchQuery) + '" />';
    html += '<button class="btn btn-primary btn-sm" data-action="famdiag-create-family">+ Nieuwe familie</button>';
    html += '</div>';

    if (families.length === 0) {
        html += '<p class="text-dim">Nog geen families. Klik "+ Nieuwe familie" of voeg leden toe via de characters/NPCs.</p>';
        html += '</div>';
        return html;
    }

    // Two-column layout on wide screens: pills column + panel column
    var splitClass = familiesExpandedId ? 'famdiag-split has-panel' : 'famdiag-split';
    html += '<div class="' + splitClass + '">';

    // Family pills (one per surname) — left column
    html += '<div class="famdiag-pills">';
    for (var fi = 0; fi < filtered.length; fi++) {
        var f = filtered[fi];
        var memberCount = (f.members || []).length;
        var isActive = familiesExpandedId === f.id;
        html += '<button class="famdiag-pill' + (isActive ? ' active' : '') + '" data-action="famdiag-select-family" data-family-id="' + escapeAttr(f.id) + '">';
        html += '<span class="famdiag-pill-name">' + escapeHtml(f.surname || '(naamloos)') + '</span>';
        html += '<span class="famdiag-pill-count">' + memberCount + ' ' + (memberCount === 1 ? 'lid' : 'leden') + '</span>';
        html += '</button>';
    }
    if (filtered.length === 0) {
        html += '<span class="text-dim">Geen families gevonden voor "' + escapeHtml(query) + '"</span>';
    }
    html += '</div>';

    // Show selected family — right column
    if (familiesExpandedId) {
        html += '<div class="famdiag-panel">';
        html += renderFamilyDiagram(familiesExpandedId, true);
        html += '</div>';
    }

    html += '</div>'; // famdiag-split

    html += '</div>';
    return html;
}

function renderDMCampaigns() {
    var campaigns = getCampaigns();
    var campIds = Object.keys(campaigns);
    var activeCamp = getActiveCampaign();

    var html = '<div class="dm-tool-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
    html += '<h3>Campaigns (' + campIds.length + ')</h3>';
    html += '<button class="btn btn-primary btn-sm" data-action="create-campaign">' + t('home.newcampaign') + '</button>';
    html += '</div>';

    for (var ci = 0; ci < campIds.length; ci++) {
        var cId = campIds[ci];
        var camp = campaigns[cId];
        var isActive = cId === activeCamp;
        var memberCount = camp.members ? camp.members.length : 0;
        var partyCount = camp.party ? Object.keys(camp.party).length : 0;

        html += '<div class="campaign-card' + (isActive ? ' active' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<div>';
        html += '<strong style="color:var(--text-bright);">' + escapeHtml(camp.name) + '</strong>';
        if (isActive) html += ' <span style="font-size:0.65rem;color:var(--accent);">' + t('home.active') + '</span>';
        if (camp.dm) {
            var dmData = getUserData(camp.dm);
            var dmName = dmData ? dmData.name : camp.dm;
            html += '<br><span class="campaign-dm-badge" style="font-size:0.7rem;">DM: ' + escapeHtml(dmName) + '</span>';
        }
        html += '<br><span style="font-size:0.75rem;color:var(--text-dim);">' + memberCount + t('dm.families.members') + partyCount + t('home.inparty') + '</span>';
        if (camp.inviteCode) html += '<br><span style="font-size:0.7rem;color:var(--text-dim);">' + t('home.invitecode') + '<strong>' + escapeHtml(camp.inviteCode) + '</strong></span>';
        html += '</div>';
        html += '<div style="display:flex;gap:0.4rem;">';
        if (!isActive) html += '<button class="btn btn-ghost btn-sm" data-action="activate-campaign" data-campaign-id="' + escapeAttr(cId) + '">' + t('dm.camp.activate') + '</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="rename-campaign" data-campaign-id="' + escapeAttr(cId) + '">' + t('dm.camp.rename') + '</button>';
        if (campIds.length > 1 && partyCount === 0) html += '<button class="btn btn-ghost btn-sm" data-action="delete-campaign" data-campaign-id="' + escapeAttr(cId) + '" style="color:var(--danger);">' + t('dm.camp.delete') + '</button>';
        html += '</div></div>';

        // Party members
        html += '<div style="margin-top:0.5rem;">';
        var party = camp.party || {};
        for (var pUid in party) {
            var pCfg = loadCharConfig(party[pUid]);
            if (pCfg) html += '<span class="campaign-char-tag">' + escapeHtml(pCfg.name) + '</span>';
        }
        html += '</div>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderDMWhispers() {
    var html = '<div class="dm-tool-card">';
    html += '<h3>Send Whisper</h3>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">';
    html += '<select class="edit-input" id="whisper-target" style="width:auto;">';
    var charIdsW = getCharacterIds();
    for (var wci = 0; wci < charIdsW.length; wci++) {
        var wcfg = loadCharConfig(charIdsW[wci]);
        if (wcfg) html += '<option value="' + charIdsW[wci] + '">' + escapeHtml(wcfg.name) + '</option>';
    }
    html += '</select>';
    html += '<input type="text" class="edit-input" id="whisper-text" placeholder="Secret message..." style="flex:1;">';
    html += '<button class="btn btn-primary btn-sm" data-action="send-whisper">Send</button>';
    html += '</div>';

    // Show sent whispers per player
    html += '<h3 style="margin-top:1.5rem;">Sent Whispers</h3>';
    for (var wi = 0; wi < charIdsW.length; wi++) {
        var wId = charIdsW[wi];
        var wCfg = loadCharConfig(wId);
        if (!wCfg) continue;
        var whispers = JSON.parse(localStorage.getItem('dw_whisper_' + wId) || '[]');
        if (whispers.length > 0) {
            html += '<div style="margin-bottom:0.75rem;">';
            html += '<strong style="color:' + wCfg.accentColor + ';font-size:0.85rem;">' + escapeHtml(wCfg.name) + '</strong>';
            for (var wj = 0; wj < whispers.length; wj++) {
                html += '<div class="whisper-card" style="margin:0.25rem 0;padding:0.4rem 0.6rem;">';
                html += '<span style="font-size:0.8rem;">' + escapeHtml(whispers[wj].text) + '</span>';
                html += '<span class="combat-log-time">' + new Date(whispers[wj].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }

    html += '</div>';
    return html;
}

function renderDMDiceRoller() {
    var html = '<div class="dm-tool-card">';
    html += '<h3>' + t('dm.diceroller') + '</h3>';
    html += '<div class="dice-buttons">';
    var dice = [4, 6, 8, 10, 12, 20, 100];
    for (var di = 0; di < dice.length; di++) {
        html += '<button class="dice-btn" data-action="roll-dice" data-die="' + dice[di] + '">d' + dice[di] + '</button>';
    }
    html += '</div>';
    html += '<div class="dice-result" id="dice-result"></div>';
    html += '</div>';
    return html;
}

// ============================================================
// Section 12: Character List
// ============================================================

function renderCharCard(cid, cfg, state, isOwn) {
    var portrait = loadImage(cid, 'portrait');
    var banner = loadImage(cid, 'banner');
    var imgSrc = portrait || banner || '';

    var isOnline = typeof isUserOnline === 'function' && isUserOnline(cfg.player || cid);
    var html = '<a class="char-card" href="/characters/' + cid + '" style="--card-accent:' + cfg.accentColor + '">';
    html += '<div class="presence-dot' + (isOnline ? ' online' : '') + '" data-user-id="' + (cfg.player || cid) + '"></div>';
    html += '<div class="char-card-img">';
    if (imgSrc) {
        // Profielfoto-uitsnede consistent met dashboard/wizard toepassen (#fATDUg).
        var ccStyle = (portrait && typeof portraitCropStyle === 'function')
            ? portraitCropStyle(loadPortraitCrop(cid)) : '';
        html += '<img src="' + imgSrc + '" alt=""' + (ccStyle ? ' style="' + ccStyle + '"' : '') + '>';
    } else {
        // No local image — e.g. localStorage quota skipped the base64 blob, or
        // the portrait was uploaded from another device/widget. Mark it for
        // async hydration straight from Firebase after render (see
        // hydrateCharCardPortraits) instead of showing a permanent placeholder.
        html += '<div class="char-card-placeholder" data-hydrate-portrait="' + cid + '">&#128100;</div>';
    }
    html += '</div>';
    var firstName = String(cfg.name || '').split(' ')[0];
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">' + escapeHtml(firstName) + '</span>';
    html += '</div>';
    // Eigen character: edit (#1) + delete (#4) acties. Knoppen zitten in de
    // anchor; hun handlers in events.js roepen preventDefault aan zodat de
    // kaart-navigatie niet afgaat.
    if (isOwn) {
        html += '<div class="char-card-actions">';
        html += '<button class="char-card-action-btn" data-action="edit-character" data-char-id="' + escapeAttr(cid) + '" title="' + t('char.edit') + '" aria-label="' + t('char.edit') + '">'
             +    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
             +  '</button>';
        html += '<button class="char-card-action-btn char-card-action-danger" data-action="delete-character" data-char-id="' + escapeAttr(cid) + '" title="' + t('char.delete') + '" aria-label="' + t('char.delete') + '">'
             +    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
             +  '</button>';
        html += '</div>';
    }
    html += '</a>';
    return html;
}

// Async-hydrate char-card portraits that weren't available in localStorage
// (quota skip, or uploaded elsewhere). Fetches the image directly from Firebase
// and swaps the placeholder for an <img>, WITHOUT writing the big blob back to
// localStorage (which is what overflowed the quota in the first place).
// Works for both base64 dataURLs and https Storage URLs.
function hydrateCharCardPortraits() {
    if (typeof document === 'undefined') return;
    var nodes = document.querySelectorAll('[data-hydrate-portrait]');
    if (!nodes.length) return;
    var base = (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.databaseURL)
        ? FIREBASE_CONFIG.databaseURL
        : 'https://dnd-within-firebase-default-rtdb.firebaseio.com';
    Array.prototype.forEach.call(nodes, function (node) {
        var cid = node.getAttribute('data-hydrate-portrait');
        if (!cid || node.dataset.hydrating) return;
        node.dataset.hydrating = '1';
        var charBase = base + '/dw/characters/' + encodeURIComponent(cid) + '/images/';
        fetch(charBase + 'portrait.json')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (val) {
                if (val) { node._fromPortrait = true; return val; }
                return fetch(charBase + 'banner.json')
                    .then(function (r) { return r.ok ? r.json() : null; });
            })
            .then(function (val) {
                if (!val || typeof val !== 'string') { delete node.dataset.hydrating; return; }
                var wrap = node.parentNode;
                if (!wrap) return;
                var img = document.createElement('img');
                img.alt = '';
                img.src = val;
                wrap.replaceChild(img, node);
                // Crop alleen op het portret (niet op de banner-fallback). Lokaal
                // gesyncte crop eerst; anders rechtstreeks uit Firebase ophalen
                // zodat de uitsnede ook op een ander device klopt (#fATDUg).
                if (!node._fromPortrait || typeof portraitCropStyle !== 'function') return;
                var local = loadPortraitCrop(cid);
                if (local) { img.style.cssText += portraitCropStyle(local); return; }
                fetch(charBase + 'portraitCrop.json')
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (cr) { if (cr) img.style.cssText += portraitCropStyle(cr); })
                    .catch(function () {});
            })
            .catch(function () { delete node.dataset.hydrating; });
    });
}

function renderCharacterList() {
    var uid = currentUserId();
    // #4: ruim verlopen prullenbak-items op (>7 dagen) bij elke bezoek.
    if (typeof purgeExpiredCharTrash === 'function') purgeExpiredCharTrash();
    var myChars = getMyCharacterIds();

    var html = '<div class="dashboard">';
    html += '<h2 class="section-title">' + t('home.mycharacters') + '</h2>';
    html += '<p class="text-dim">' + t('characters.subtitle') + '</p>';
    html += '<div class="character-cards">';

    for (var i = 0; i < myChars.length; i++) {
        var cid = myChars[i];
        var cfg = loadCharConfig(cid);
        var state = loadCharState(cid);
        if (!cfg) continue;

        // Show which campaign this character is in
        var inCampaigns = [];
        var camps = getCampaigns();
        for (var campId in camps) {
            var party = camps[campId].party || {};
            for (var pUid in party) {
                if (party[pUid] === cid) {
                    inCampaigns.push(camps[campId].name);
                    break;
                }
            }
        }

        html += renderCharCard(cid, cfg, state, true);
    }

    // Create character card
    html += '<div class="char-card char-card-create" data-action="open-create-wizard">';
    html += '<div class="char-card-img"><div class="char-card-placeholder" style="font-size:2.5rem;">+</div></div>';
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">' + t('home.newcharacter') + '</span>';
    html += '<span class="char-card-detail">' + t('home.newcharacter.hint') + '</span>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // .character-cards

    // #4: Prullenbak — door deze gebruiker verwijderde characters (herstelbaar).
    if (typeof getCharTrash === 'function') {
        var trash = getCharTrash();
        var trashIds = Object.keys(trash).filter(function (cid) {
            return (trash[cid].owner || uid) === uid;
        });
        if (trashIds.length) {
            var ttl = (typeof CHAR_TRASH_TTL_MS !== 'undefined') ? CHAR_TRASH_TTL_MS : (7 * 24 * 60 * 60 * 1000);
            html += '<div class="char-trash-section">';
            html += '<h3 class="section-title char-trash-title">🗑️ ' + t('char.trash.title') + '</h3>';
            html += '<div class="char-trash-list">';
            for (var ti = 0; ti < trashIds.length; ti++) {
                var tcid = trashIds[ti];
                var ent = trash[tcid];
                var daysLeft = Math.max(0, Math.ceil((ent.deletedAt + ttl - Date.now()) / (24 * 60 * 60 * 1000)));
                html += '<div class="char-trash-item">';
                html += '<span class="char-trash-name">' + escapeHtml(ent.name || tcid) + '</span>';
                html += '<span class="char-trash-meta">' + daysLeft + ' ' + t('char.trash.daysleft') + '</span>';
                html += '<button class="btn btn-ghost btn-sm" data-action="restore-character" data-char-id="' + escapeAttr(tcid) + '">' + t('char.trash.restore') + '</button>';
                html += '</div>';
            }
            html += '</div></div>';
        }
    }

    html += '</div>'; // .dashboard
    return html;
}

