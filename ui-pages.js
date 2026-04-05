// D&D Within — Page Renders (login, navbar, home, dashboard, DM, character list)
// Requires: core.js

// ============================================================
// Section 9: Login Page
// ============================================================

function renderLogin() {
    var html = '<div class="login-page">';
    html += '<div class="login-card">';
    html += '<div class="login-logo">&#9876;</div>';
    html += '<h1 class="login-title">D&D Within</h1>';
    html += '<p class="login-subtitle">Valoria Campaign Platform</p>';
    html += '<div class="login-form">';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.username') + '</label>';
    html += '<input type="text" class="login-input" id="login-username" placeholder="' + t('login.username') + '" autocomplete="username">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.password') + '</label>';
    html += '<input type="password" class="login-input" id="login-password" placeholder="' + t('login.password') + '" autocomplete="current-password">';
    html += '</div>';
    html += '<button class="login-submit" data-action="login-submit">' + t('login.submit') + '</button>';
    html += '<p class="login-error" id="login-error" style="display:none;"></p>';
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
    var inCampaignView = hasCampaign && ['dashboard', 'party', 'maps', 'timeline', 'lore', 'notes', 'dm'].indexOf(route.parts[0] || 'dashboard') !== -1;

    // Campaign navigation links
    var campLinks = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: svgI('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>') },
        { path: '/party', label: t('nav.party'), icon: svgI('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
        { path: '/maps', label: t('nav.maps'), icon: svgI('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>') },
        { path: '/timeline', label: t('nav.timeline'), icon: svgI('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
        { path: '/lore', label: t('nav.lore'), icon: svgI('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
        { path: '/notes', label: t('nav.notes'), icon: svgI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') }
    ];
    if (isDM()) {
        campLinks.push({ path: '/dm', label: t('dm.tools'), icon: svgI('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') });
    }

    // Personal links (main menu)
    var personalLinks = [
        { path: '/home', label: 'Campaigns', icon: svgI('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>') },
        { path: '/characters', label: t('nav.characters'), icon: svgI('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>') },
        { path: '/settings', label: t('nav.settings') || 'Settings', icon: svgI('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') }
    ];

    var html = '<nav class="navbar">';
    html += '<a class="nav-logo" href="#/home">D&D <span class="logo-accent">Within</span></a>';
    html += '<div class="nav-links">';

    if (inCampaignView) {
        // Back to main menu
        html += '<a class="nav-link nav-back" href="#/home"><span class="nav-icon">' + svgI('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>') + '</span>' + t('nav.menu') + '</a>';
        html += '<span class="nav-separator">|</span>';
        // Campaign links
        for (var i = 0; i < campLinks.length; i++) {
            var link = campLinks[i];
            var isActive = route.path === link.path;
            if (link.path === '/dashboard' && route.path === '/dashboard') isActive = true;
            if (link.path === '/party' && route.parts[0] === 'party') isActive = true;
            if (link.path === '/lore' && route.parts[0] === 'lore') isActive = true;
            if (link.path === '/notes' && route.parts[0] === 'notes') isActive = true;
            if (link.path === '/dm' && route.parts[0] === 'dm') isActive = true;
            html += '<a class="nav-link' + (isActive ? ' active' : '') + '" href="#' + link.path + '"><span class="nav-icon">' + link.icon + '</span>' + link.label + '</a>';
        }
    } else {
        // Main menu links
        for (var pi = 0; pi < personalLinks.length; pi++) {
            var plink = personalLinks[pi];
            var pActive = route.path === plink.path || (plink.path === '/home' && route.path === '/');
            if (plink.path === '/characters' && route.parts[0] === 'characters') pActive = true;
            if (plink.path === '/settings' && route.path === '/settings') pActive = true;
            html += '<a class="nav-link' + (pActive ? ' active' : '') + '" href="#' + plink.path + '"><span class="nav-icon">' + plink.icon + '</span>' + plink.label + '</a>';
        }
    }

    html += '</div>';
    html += '<div class="nav-right">';

    // DM mode toggle
    html += '<button class="dm-toggle' + (isDMMode() ? ' active' : '') + '" data-action="toggle-dm-mode" title="DM Mode">';
    html += svgI('<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>');
    html += '<span class="dm-toggle-label">' + (isDMMode() ? 'DM' : 'Player') + '</span>';
    html += '</button>';

    html += '<div class="theme-picker-wrap">';
    html += '<button class="theme-picker-btn" data-action="toggle-theme-picker" title="' + t('nav.theme') + '">&#127912;</button>';
    html += '<div class="theme-picker-popup" id="theme-picker" style="display:none;">';
    html += '<div class="theme-picker-grid">';
    for (var ti = 0; ti < COLOR_THEMES.length; ti++) {
        var theme = COLOR_THEMES[ti];
        var themeActive = getUserTheme() === theme.id;
        html += '<button class="theme-option' + (themeActive ? ' active' : '') + '" data-action="select-theme" data-theme="' + theme.id + '" style="background:' + theme.accent + ';" title="' + theme.name + '"></button>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // Sync status
    var syncStatus = typeof getSyncStatus === 'function' ? getSyncStatus() : 'not-configured';
    if (syncStatus === 'online') {
        html += '<span class="sync-indicator sync-online" title="' + t('nav.sync.online') + '">&#9729;</span>';
    } else if (syncStatus === 'offline') {
        html += '<span class="sync-indicator sync-offline" title="' + t('nav.sync.offline') + '">&#9729;</span>';
    }
    // Campaign selector (only show when in campaign view)
    var userCampaigns = getUserCampaigns();
    if (inCampaignView) {
        if (userCampaigns.length > 1) {
            html += '<select class="campaign-selector" data-action="switch-campaign">';
            for (var ci = 0; ci < userCampaigns.length; ci++) {
                var cId = userCampaigns[ci];
                var cName = campaigns[cId] ? campaigns[cId].name : cId;
                html += '<option value="' + escapeAttr(cId) + '"' + (cId === activeCamp ? ' selected' : '') + '>' + escapeHtml(cName) + '</option>';
            }
            html += '</select>';
        } else if (userCampaigns.length === 1 && campaigns[userCampaigns[0]]) {
            html += '<span class="campaign-label">' + escapeHtml(campaigns[userCampaigns[0]].name) + '</span>';
        }
    }
    html += '<button class="nav-lang-btn" data-action="toggle-lang" title="' + t('nav.language') + '">' + (getLang() === 'nl' ? 'NL' : 'EN') + '</button>';
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
        try { return JSON.parse(saved); } catch(e) {}
    }
    return { campaignName: 'The Serpent March', bannerImage: null };
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
        html += '<div class="campaign-home-stats">';
        html += '<span>' + memberCount + t('home.players') + '</span>';
        html += '<span>' + partyCount + t('home.inparty') + '</span>';
        html += '</div>';
        if (isActive) html += '<span class="campaign-active-badge">' + t('home.active') + '</span>';

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
    html += '<a class="btn btn-ghost btn-sm" href="#/characters">' + t('home.viewall') + ' &rarr;</a>';
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
        return '<div class="page-placeholder"><h2>' + t('join.invalid') + '</h2><p>' + t('join.invalid.hint') + '</p><a class="btn btn-primary" href="#/home">' + t('join.backhome') + '</a></div>';
    }
    var camp = campaigns[found];
    if (!camp.members) camp.members = [];
    if (camp.members.indexOf(uid) === -1) {
        camp.members.push(uid);
        saveCampaigns(campaigns);
    }
    setActiveCampaign(found);
    return '<div class="page-placeholder"><h2>' + t('join.welcome') + escapeHtml(camp.name) + '!</h2><p>' + t('join.added') + '</p><a class="btn btn-primary" href="#/party">' + t('join.toparty') + '</a></div>';
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

    // Character assignment prompt
    if (isMember && !myPartyChar) {
        var myChars = getMyCharacterIds();
        html += '<div class="party-assign-prompt">';
        html += '<h3>' + t('party.choosechar') + '</h3>';
        html += '<p class="text-dim">' + t('party.choosechar.hint') + escapeHtml(camp.name) + '.</p>';
        if (myChars.length === 0) {
            html += '<p>' + t('party.nocharacters') + ' <a href="#/characters">' + t('party.nocharacters.link') + '</a>.</p>';
        } else {
            html += '<div class="party-assign-grid">';
            for (var ai = 0; ai < myChars.length; ai++) {
                var acfg = loadCharConfig(myChars[ai]);
                var astate = loadCharState(myChars[ai]);
                if (!acfg) continue;
                html += '<div class="party-assign-card" data-action="assign-to-party" data-char-id="' + myChars[ai] + '">';
                var aPortrait = loadImage(myChars[ai], 'portrait');
                html += '<div class="char-card-img">';
                if (aPortrait) html += '<img src="' + aPortrait + '" alt="">';
                else html += '<div class="char-card-placeholder">&#128100;</div>';
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

    // Welcome banner with optional background image
    html += '<div class="welcome-banner' + (dashData.bannerImage ? ' has-banner' : '') + '"';
    if (dashData.bannerImage) {
        html += ' style="background-image:url(' + dashData.bannerImage + ')"';
    }
    html += '>';
    if (isDM()) {
        html += '<label class="banner-upload-btn" title="Upload banner"><span>&#128247;</span><input type="file" accept="image/*" data-action="upload-dash-banner" style="display:none"></label>';
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

    html += '<div class="dash-stats">';
    html += '<div class="dash-stat-card session-card">';
    html += '<span class="dash-stat-value">' + escapeHtml(sessionNum) + '</span>';
    html += '<span class="dash-stat-label">' + t('dash.session') + '</span>';
    if (isDM()) {
        html += '<div class="session-controls">';
        html += '<button class="session-btn" data-action="session-minus">&minus;</button>';
        html += '<button class="session-btn" data-action="session-plus">+</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + partySize + '</span><span class="dash-stat-label">' + t('dash.party') + '</span></div>';

    // Party gold (sum of all character gold)
    html += '<div class="dash-stat-card party-gold-card">';
    html += '<span class="dash-stat-value" style="color:var(--gold);">' + partyGold + '</span>';
    html += '<span class="dash-stat-label">' + t('dash.partygold') + '</span>';
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + groupLevel + '</span><span class="dash-stat-label">' + t('dash.level') + '</span></div>';
    html += '</div>';

    // Quick navigation cards
    html += '<div class="dash-nav-cards">';
    html += '<a class="dash-nav-card" href="#/party"><span class="dash-nav-icon">&#9876;</span><span class="dash-nav-title">Party</span><span class="dash-nav-desc">' + t('dash.characters.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/timeline"><span class="dash-nav-icon">&#128337;</span><span class="dash-nav-title">' + t('nav.timeline') + '</span><span class="dash-nav-desc">' + t('dash.timeline.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/maps"><span class="dash-nav-icon">&#128506;</span><span class="dash-nav-title">' + t('nav.maps') + '</span><span class="dash-nav-desc">' + t('dash.maps.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/lore"><span class="dash-nav-icon">&#128214;</span><span class="dash-nav-title">' + t('nav.lore') + '</span><span class="dash-nav-desc">' + t('dash.lore.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/notes"><span class="dash-nav-icon">&#128221;</span><span class="dash-nav-title">' + t('nav.notes') + '</span><span class="dash-nav-desc">' + t('dash.notes.desc') + '</span></a>';
    html += '</div>';

    // Recent timeline events (pull from ALL chapters)
    var tlData = getTimelineData();
    var allEvents = [];
    for (var ci = 0; ci < (tlData.chapters || []).length; ci++) {
        var chEvents = tlData.chapters[ci].events || [];
        for (var ei = 0; ei < chEvents.length; ei++) {
            allEvents.push(chEvents[ei]);
        }
    }
    var recentEvents = allEvents.slice(-3).reverse();
    if (recentEvents.length > 0) {
        html += '<div class="dash-recent-section">';
        html += '<h2 class="section-title">' + t('dash.recent') + '</h2>';
        html += '<div class="dash-recent-events">';
        for (var ri = 0; ri < recentEvents.length; ri++) {
            var rev = recentEvents[ri];
            html += '<div class="dash-recent-event timeline-' + (rev.type || 'quest') + '">';
            if (rev.session) html += '<span class="timeline-date">' + t('dash.session') + ' ' + escapeHtml(rev.session) + '</span>';
            html += '<strong>' + escapeHtml(rev.title) + '</strong>';
            html += '<p class="text-dim" style="margin:0;font-size:0.8rem;">' + escapeHtml(rev.desc) + '</p>';
            html += '</div>';
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

    // Quest tracker
    var questData = getQuestData();
    html += '<div class="dash-quests">';
    html += '<div class="dash-quests-header">';
    html += '<h2 class="section-title">' + t('dash.quests') + '</h2>';
    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-quest">' + t('dash.addquest') + '</button>';
    }
    html += '</div>';

    // Quest add form (hidden by default)
    if (isDM()) {
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
    }

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
        if (isDM()) {
            html += '<div class="quest-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="edit-quest" data-quest-idx="' + qi + '" title="Edit">&#9998;</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="complete-quest" data-quest-idx="' + qi + '" title="Complete">&#10003;</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-quest" data-quest-idx="' + qi + '" style="color:var(--danger);" title="Delete">&times;</button>';
            html += '</div>';
        }
        html += '</div>';
    }
    if (questData.completed.length > 0) {
        html += '<details class="quest-completed-section"><summary class="text-dim" style="cursor:pointer;font-size:0.85rem;">' + t('quest.completed') + ' (' + questData.completed.length + ')</summary>';
        for (var qc = 0; qc < questData.completed.length; qc++) {
            html += '<div class="quest-item quest-done"><span class="quest-icon">&#10003;</span><span style="text-decoration:line-through;color:var(--text-dim);">' + escapeHtml(questData.completed[qc].title) + '</span></div>';
        }
        html += '</details>';
    }
    html += '</div>';

    // Party overview
    html += '<div class="party-section">';
    html += '<h2 class="section-title">' + t('dash.partyoverview') + '</h2>';
    html += '<div class="character-cards">';

    for (var i = 0; i < charIds.length; i++) {
        var cid = charIds[i];
        var ccfg = loadCharConfig(cid);
        var cstate = loadCharState(cid);
        if (!ccfg) continue;

        var isOwn = userOwnsCharacter(currentUserId(), cid);
        html += renderCharCard(cid, ccfg, cstate, isOwn);
    }

    html += '</div>';
    html += '</div>';

    // DM quick link
    if (isDM()) {
        html += '<div style="text-align:center;margin-top:1rem;">';
        html += '<a class="btn btn-ghost" href="#/dm">' + t('dm.tools') + ' &rarr;</a>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 11b: DM Page
// ============================================================

var dmTab = 'initiative';

function renderDMPage(subpage) {
    if (!isDM()) return '<p>Access denied.</p>';
    var html = '<div class="dm-page">';
    html += '<h1 class="page-title">' + t('dm.tools') + '</h1>';

    // Tab bar
    var tabs = [
        { id: 'initiative', label: t('dm.initiative'), icon: '&#9876;' },
        { id: 'npcs', label: t('dm.npcs'), icon: '&#127917;' },
        { id: 'families', label: t('dm.families'), icon: '&#128106;' },
        { id: 'campaigns', label: t('dm.campaigns'), icon: '&#127760;' }
    ];
    html += '<div class="dm-tabs">';
    for (var ti = 0; ti < tabs.length; ti++) {
        var tab = tabs[ti];
        var isActive = (subpage || 'initiative') === tab.id;
        html += '<a class="dm-tab' + (isActive ? ' active' : '') + '" href="#/dm/' + tab.id + '">' + tab.icon + ' ' + tab.label + '</a>';
    }
    html += '</div>';

    var activeSection = subpage || 'initiative';

    if (activeSection === 'initiative') {
        html += renderDMInitiative();
    } else if (activeSection === 'npcs') {
        html += renderDMNPCs();
    } else if (activeSection === 'families') {
        html += renderDMFamilies();
    } else if (activeSection === 'campaigns') {
        html += renderDMCampaigns();
    }

    html += '</div>';
    return html;
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
        var insertIdx = getInsertIdx(y);

        if (_initDrag.type === 'player') {
            var cfg = loadCharConfig(_initDrag.charId);
            if (!cfg) { cleanup(); return; }
            initData.entries.splice(insertIdx, 0, { name: cfg.name, charId: _initDrag.charId });
        } else if (_initDrag.type === 'npc') {
            var nIdx = parseInt(_initDrag.npcIdx);
            var npc = initData.npcs[nIdx];
            if (!npc) { cleanup(); return; }
            initData.entries.splice(insertIdx, 0, { name: npc.name, npcIdx: nIdx, disposition: npc.disposition });
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
        e.preventDefault();
        _initDrag = {
            el: el,
            type: el.dataset.dragType,
            charId: el.dataset.charId,
            npcIdx: el.dataset.npcIdx,
            initIdx: el.dataset.initIdx,
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

    document.addEventListener('pointerup', function(e) {
        if (!_initDrag || _initDrag.pointerId !== e.pointerId) return;
        if (!_initDrag.started) { cleanup(); return; }

        if (isOverDropZone(e.clientX, e.clientY)) {
            doDrop(e.clientY);
        } else {
            cleanup();
        }
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
            var npcFamily = npc.family || [];
            if (npcFamily.length > 0 || isDM()) {
                html += '<div class="npc-family-section">';
                html += renderFamilyTree(npcFamily, 'npc:' + realIdx, npc.name, isDM());
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

var familiesExpandedId = null;

function renderDMFamilies() {
    var html = '<div class="dm-tool-card">';
    html += '<h3>Family Trees</h3>';

    // Collect all people: characters + NPCs with families
    var people = [];
    var charIds = getCharacterIds();
    for (var ci = 0; ci < charIds.length; ci++) {
        var cfg = loadCharConfig(charIds[ci]);
        if (!cfg) continue;
        var family = cfg.family || [];
        people.push({ id: charIds[ci], name: cfg.name, color: cfg.accentColor || 'var(--accent)', family: family, type: 'character', contextId: charIds[ci] });
    }
    var npcData = getNPCData();
    var npcs = npcData.npcs || [];
    for (var ni = 0; ni < npcs.length; ni++) {
        var npc = npcs[ni];
        if ((npc.family || []).length > 0) {
            people.push({ id: 'npc:' + ni, name: npc.name, color: 'var(--text-dim)', family: npc.family, type: 'npc', contextId: 'npc:' + ni });
        }
    }

    if (people.length === 0) {
        html += '<p class="text-dim">Nog geen family trees aangemaakt.</p>';
    }

    // Person grid
    html += '<div class="families-person-grid">';
    for (var pi = 0; pi < people.length; pi++) {
        var p = people[pi];
        var memberCount = p.family.length;
        var isExpanded = familiesExpandedId === p.id;
        html += '<div class="families-person-card' + (isExpanded ? ' expanded' : '') + '" data-action="toggle-family-person" data-person-id="' + escapeAttr(p.id) + '" style="--person-color:' + p.color + '">';
        html += '<div class="families-person-header">';
        html += '<span class="families-person-name">' + escapeHtml(p.name) + '</span>';
        if (p.type === 'npc') html += '<span class="families-person-badge">NPC</span>';
        html += '<span class="families-person-count">' + memberCount + ' ' + (memberCount === 1 ? 'member' : 'members') + '</span>';
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';

    // Show expanded family tree below the grid
    if (familiesExpandedId) {
        var expanded = null;
        for (var ei = 0; ei < people.length; ei++) {
            if (people[ei].id === familiesExpandedId) { expanded = people[ei]; break; }
        }
        if (expanded) {
            html += '<div class="families-tree-panel" style="border-left: 3px solid ' + expanded.color + ';">';
            html += '<h4 style="color:' + expanded.color + ';margin-bottom:0.75rem;">' + escapeHtml(expanded.name) + '\'s Family</h4>';
            html += renderFamilyTree(expanded.family, expanded.contextId, expanded.name, true);
            html += '</div>';
        }
    }

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
    var html = '<a class="char-card" href="#/characters/' + cid + '" style="--card-accent:' + cfg.accentColor + '">';
    html += '<div class="presence-dot' + (isOnline ? ' online' : '') + '" data-user-id="' + (cfg.player || cid) + '"></div>';
    html += '<div class="char-card-img">';
    if (imgSrc) {
        html += '<img src="' + imgSrc + '" alt="">';
    } else {
        html += '<div class="char-card-placeholder">&#128100;</div>';
    }
    html += '</div>';
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">' + escapeHtml(cfg.name) + '</span>';
    html += '<span class="char-card-detail">' + raceDisplayName(cfg.race) + ' ' + classDisplayName(cfg.className) + '</span>';
    html += '<span class="char-card-detail">Level ' + state.level + '</span>';
    // HP mini bar
    var maxHP = getHP(cfg, state);
    var curHP = state.currentHP !== null ? state.currentHP : maxHP;
    var hpPct = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((curHP / maxHP) * 100))) : 100;
    var hpCol = hpPct > 50 ? 'var(--success)' : (hpPct > 25 ? 'var(--warning)' : 'var(--danger)');
    html += '<div class="char-card-hp"><div class="char-card-hp-fill" style="width:' + hpPct + '%;background:' + hpCol + '"></div><span class="char-card-hp-text">' + curHP + '/' + maxHP + '</span></div>';
    if (isOwn) html += '<span class="char-card-badge">' + t('char.yours') + '</span>';
    html += '</div>';
    html += '</a>';
    return html;
}

function renderCharacterList() {
    var uid = currentUserId();
    var myChars = getMyCharacterIds();

    var html = '<div class="dashboard">';
    html += '<h2 class="section-title">' + t('home.mycharacters') + '</h2>';
    html += '<p class="text-dim">Je persoonlijke characters. Wijs ze toe aan een campaign via de Party pagina.</p>';
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

    html += '</div>';
    html += '</div>';
    return html;
}

