// D&D Within — Event Handling (click delegation, mobile support)
// Requires: core.js, all ui-*.js files

// ============================================================
// Section 30: Event Handling
// ============================================================

function bindPageEvents(route) {
    var app = document.getElementById('app');
    if (!app) return;

    // Remove old listeners by re-cloning (simple approach for SPA)
    // Instead, we use event delegation on #app and document

    // Clean up any lingering tooltips
    removeTooltipPopup();

    // Determine context
    var charId = null;
    var config = null;
    var state = null;

    if (route.parts[0] === 'characters' && route.parts[1]) {
        charId = route.parts[1];
        config = loadCharConfig(charId);
        state = loadCharState(charId);
    }

    // ---- Click delegation on #app ----
    app.onclick = function(e) {
        var target = e.target;

        // (Character dashboard system removed — new dashboard TBD on an empty canvas.)

        // --- Login page ---
        if (route.path === '/login' || !currentUser()) {
            // Login submit
            if (target.matches('[data-action="login-submit"]') || target.closest('[data-action="login-submit"]')) {
                var usernameEl = document.getElementById('login-username');
                var passwordEl = document.getElementById('login-password');
                var errorEl = document.getElementById('login-error');
                if (!usernameEl || !passwordEl) return;

                var username = usernameEl.value.trim().toLowerCase();
                var password = passwordEl.value;

                // Find user by username — check usersCache first, then DEFAULT_USERS
                var matchedId = null;
                var lookupSources = [usersCache, DEFAULT_USERS];
                for (var si = 0; si < lookupSources.length; si++) {
                    var src = lookupSources[si];
                    if (!src) continue;
                    for (var uid in src) {
                        if (uid === username || (src[uid].name && src[uid].name.toLowerCase() === username)) {
                            matchedId = uid;
                            break;
                        }
                    }
                    if (matchedId) break;
                }

                if (!matchedId) {
                    if (errorEl) { errorEl.textContent = t('login.error.notfound'); errorEl.style.display = 'block'; }
                    return;
                }

                var userData = getUserData(matchedId);
                if (!userData || userData.password !== password) {
                    if (errorEl) { errorEl.textContent = t('login.error.password'); errorEl.style.display = 'block'; }
                    return;
                }

                setSession(matchedId);
                applyUserTheme();
                navigate('/home');
                return;
            }
            return;
        }

        // --- Navbar ---
        // DM mode toggle
        if (target.matches('[data-action="toggle-dm-mode"]') || target.closest('[data-action="toggle-dm-mode"]')) {
            setDMMode(!isDMMode());
            renderApp();
            return;
        }

        // Logout
        if (target.matches('[data-action="logout"]') || target.closest('[data-action="logout"]')) {
            clearSession();
            navigate('/login');
            return;
        }

        // Language toggle
        if (target.matches('[data-action="toggle-lang"]') || target.closest('[data-action="toggle-lang"]')) {
            setLang(getLang() === 'nl' ? 'en' : 'nl');
            renderApp();
            return;
        }

        // Mobile nav toggle
        if (target.matches('[data-action="toggle-nav"]') || target.closest('[data-action="toggle-nav"]')) {
            var navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.toggle('open');
            return;
        }

        // Toggle theme picker
        if (target.matches('[data-action="toggle-theme-picker"]') || target.closest('[data-action="toggle-theme-picker"]')) {
            var picker = document.getElementById('theme-picker');
            if (picker) picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
            return;
        }

        // Select theme
        if (target.matches('[data-action="select-theme"]') || target.closest('[data-action="select-theme"]')) {
            var themeBtn = target.matches('[data-action="select-theme"]') ? target : target.closest('[data-action="select-theme"]');
            setUserTheme(themeBtn.dataset.theme);
            var picker = document.getElementById('theme-picker');
            if (picker) picker.style.display = 'none';
            renderApp();
            return;
        }

        // --- Settings page events ---
        if (target.matches('[data-action="settings-switch-tab"]') || target.closest('[data-action="settings-switch-tab"]')) {
            var tabBtn = target.matches('[data-action="settings-switch-tab"]') ? target : target.closest('[data-action="settings-switch-tab"]');
            settingsTab = tabBtn.dataset.tab;
            renderApp();
            return;
        }
        if (target.matches('[data-action="settings-select-theme"]') || target.closest('[data-action="settings-select-theme"]')) {
            var stBtn = target.matches('[data-action="settings-select-theme"]') ? target : target.closest('[data-action="settings-select-theme"]');
            setUserTheme(stBtn.dataset.theme);
            renderApp();
            return;
        }
        if (target.matches('[data-action="settings-set-lang"]') || target.closest('[data-action="settings-set-lang"]')) {
            var langBtn = target.matches('[data-action="settings-set-lang"]') ? target : target.closest('[data-action="settings-set-lang"]');
            setLang(langBtn.dataset.lang);
            renderApp();
            return;
        }
        if (target.matches('[data-action="save-settings"]') || target.closest('[data-action="save-settings"]')) {
            handleSaveSettings();
            return;
        }
        if (target.matches('[data-action="settings-toggle-debug"]')) {
            setDebugMode(target.checked);
            showToast(target.checked ? t('settings.debug.enabled') : t('settings.debug.disabled'), 'success');
            return;
        }

        // --- Notes events ---
        // New note
        if (target.matches('[data-action="new-note"]')) { navigate('/notes/new'); return; }

        // Back to notes
        if (target.matches('[data-action="back-to-notes"]')) { navigate('/notes'); return; }

        // View note
        if (target.matches('[data-action="view-note"]') || target.closest('[data-action="view-note"]')) {
            var noteCard = target.closest('[data-action="view-note"]') || target;
            navigate('/notes/view-' + noteCard.dataset.noteId);
            return;
        }

        // Edit note
        if (target.matches('[data-action="edit-note"]')) { navigate('/notes/edit-' + target.dataset.noteId); return; }

        // Filter notes
        if (target.matches('[data-action="filter-notes"]')) {
            notesFilter = target.dataset.cat || 'all';
            renderApp();
            return;
        }

        // Pick category in editor
        if (target.matches('[data-action="pick-note-cat"]')) {
            document.querySelectorAll('.note-cat-option').forEach(function(b) { b.classList.remove('active'); });
            target.classList.add('active');
            return;
        }

        // Pick layout in editor
        if (target.matches('[data-action="pick-note-layout"]') || target.closest('[data-action="pick-note-layout"]')) {
            var layoutBtn = target.matches('[data-action="pick-note-layout"]') ? target : target.closest('[data-action="pick-note-layout"]');
            document.querySelectorAll('.note-layout-option').forEach(function(b) { b.classList.remove('active'); });
            layoutBtn.classList.add('active');
            var newLayout = layoutBtn.dataset.layout;
            var singleImgLayouts = ['image-top', 'image-right', 'image-left'];
            var imgSection = document.querySelector('.note-image-section');
            var gallerySection = document.querySelector('.note-gallery-section');
            var checkSection = document.querySelector('.note-checklist-section');
            var contentArea = document.getElementById('note-content');
            if (imgSection) imgSection.style.display = singleImgLayouts.indexOf(newLayout) >= 0 ? 'block' : 'none';
            if (gallerySection) gallerySection.style.display = newLayout === 'gallery' ? 'block' : 'none';
            if (checkSection) checkSection.style.display = newLayout === 'checklist' ? 'block' : 'none';
            if (contentArea) contentArea.style.display = newLayout === 'checklist' ? 'none' : 'block';
            return;
        }

        // Save note
        if (target.matches('[data-action="save-note"]')) {
            var noteTitleEl = document.getElementById('note-title');
            var noteContentEl = document.getElementById('note-content');
            var noteActiveCat = document.querySelector('.note-cat-option.active');
            var noteActiveLayout = document.querySelector('.note-layout-option.active');
            var noteImg = document.querySelector('.note-image-preview img');

            if (!noteTitleEl || !noteTitleEl.value.trim()) { alert(t('notes.filltitle')); return; }

            var noteData = getNotesData();
            var saveNoteId = target.dataset.noteId;

            // Collect tags from the tag list (new format: {text, category})
            var noteTags = [];
            if (window._noteTags) {
                noteTags = window._noteTags.slice();
            } else {
                // Fallback: read existing note tags
                var existingNote = null;
                if (saveNoteId) {
                    for (var fni = 0; fni < noteData.notes.length; fni++) {
                        if (noteData.notes[fni].id === saveNoteId) { existingNote = noteData.notes[fni]; break; }
                    }
                }
                if (existingNote) noteTags = existingNote.tags || [];
            }
            var noteCategory = noteActiveCat ? noteActiveCat.dataset.cat : 'other';
            var noteLayout = noteActiveLayout ? noteActiveLayout.dataset.layout : 'text-only';
            var noteImage = noteImg ? noteImg.src : null;

            // Collect gallery images
            var galleryImages = [];
            document.querySelectorAll('.note-gallery-thumb img').forEach(function(img) {
                if (img.src && img.src.indexOf('data:') === 0) galleryImages.push(img.src);
            });

            // Collect checklist items
            var checklistItems = [];
            document.querySelectorAll('.note-checklist-item').forEach(function(item) {
                var checkbox = item.querySelector('.note-check-box');
                var textInput = item.querySelector('.note-check-text');
                if (textInput && textInput.value.trim()) {
                    checklistItems.push({ text: textInput.value.trim(), done: checkbox ? checkbox.checked : false });
                }
            });

            var noteObj = {
                title: noteTitleEl.value.trim(),
                content: noteContentEl ? noteContentEl.value : '',
                tags: noteTags,
                tagCategory: noteCategory,
                layout: noteLayout,
                image: noteImage && noteImage.indexOf('data:') === 0 ? noteImage : null,
                images: galleryImages,
                checklist: checklistItems,
                updated: Date.now()
            };

            if (saveNoteId) {
                for (var sni = 0; sni < noteData.notes.length; sni++) {
                    if (noteData.notes[sni].id === saveNoteId) {
                        var existing = noteData.notes[sni];
                        existing.title = noteObj.title;
                        existing.content = noteObj.content;
                        existing.tags = noteObj.tags;
                        existing.tagCategory = noteObj.tagCategory;
                        existing.layout = noteObj.layout;
                        if (noteObj.image) existing.image = noteObj.image;
                        else if (noteLayout === 'text-only' || noteLayout === 'gallery' || noteLayout === 'checklist') existing.image = null;
                        existing.images = noteObj.images;
                        existing.checklist = noteObj.checklist;
                        existing.updated = noteObj.updated;
                        break;
                    }
                }
            } else {
                noteObj.id = 'n' + Date.now();
                noteObj.created = Date.now();
                noteObj.pinned = false;
                noteData.notes.push(noteObj);
            }

            saveNotesData(noteData);
            navigate('/notes');
            return;
        }

        // Delete note
        if (target.matches('[data-action="delete-note"]')) {
            if (confirm(t('notes.deletenote'))) {
                var delNoteData = getNotesData();
                delNoteData.notes = delNoteData.notes.filter(function(n) { return n.id !== target.dataset.noteId; });
                saveNotesData(delNoteData);
                navigate('/notes');
            }
            return;
        }

        // --- NPC Family Tree handlers (DM page) ---
        if (isDM() && (target.matches('[data-action="add-family"]') || target.closest('[data-action="add-family"]'))) {
            var btn = target.matches('[data-action="add-family"]') ? target : target.closest('[data-action="add-family"]');
            var form = document.getElementById('ftree-add-form');
            var tierInput = document.getElementById('fam-tier');
            if (form && tierInput) {
                tierInput.value = btn.dataset.tier || 'sibling';
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
                var nameEl = document.getElementById('fam-name');
                if (nameEl) nameEl.value = '';
                var relEl = document.getElementById('fam-relation');
                if (relEl) relEl.value = '';
                var notesEl = document.getElementById('fam-notes');
                if (notesEl) notesEl.value = '';
            }
            return;
        }
        if (isDM() && target.matches('[data-action="save-family"]')) {
            // Find which NPC card this form belongs to
            var npcCard = target.closest('.npc-card');
            if (!npcCard) return;
            var npcIdx = -1;
            var npcCards = document.querySelectorAll('.npc-card');
            for (var nc = 0; nc < npcCards.length; nc++) {
                if (npcCards[nc] === npcCard) { npcIdx = nc; break; }
            }
            if (npcIdx < 0) return;
            var sourceEl = document.getElementById('fam-source');
            var nameEl = document.getElementById('fam-name');
            var relEl = document.getElementById('fam-relation');
            var statusEl = document.getElementById('fam-status');
            var notesEl = document.getElementById('fam-notes');
            var tierEl = document.getElementById('fam-tier');
            var source = sourceEl ? sourceEl.value : 'custom';
            var entry = {
                name: nameEl ? nameEl.value.trim() : '',
                relation: relEl ? relEl.value.trim() : '',
                status: statusEl ? statusEl.value : 'Alive',
                notes: notesEl ? notesEl.value.trim() : '',
                tier: tierEl ? tierEl.value : 'sibling'
            };
            if (source.indexOf('char:') === 0) {
                var srcCharId = source.substring(5);
                var srcCfg = loadCharConfig(srcCharId);
                if (srcCfg) { if (!entry.name) entry.name = srcCfg.name; entry.linkedChar = srcCharId; }
            }
            if (!entry.name) return;
            var npcData = getNPCData();
            if (!npcData.npcs[npcIdx].family) npcData.npcs[npcIdx].family = [];
            npcData.npcs[npcIdx].family.push(entry);
            saveNPCData(npcData);
            renderApp();
            return;
        }
        if (isDM() && target.matches('[data-action="cancel-family"]')) {
            var form = document.getElementById('ftree-add-form');
            if (form) form.style.display = 'none';
            return;
        }
        if (isDM() && target.matches('[data-action="remove-family"]')) {
            var famIdx = parseInt(target.dataset.idx);
            if (isNaN(famIdx)) return;
            var ctxId = target.dataset.contextId || '';
            // NPC context: contextId === "npc:<idx>"
            if (ctxId.indexOf('npc:') === 0) {
                var npcIdx = parseInt(ctxId.slice(4));
                if (isNaN(npcIdx)) return;
                var npcData = getNPCData();
                if (!npcData.npcs[npcIdx]) return;
                var fam = (npcData.npcs[npcIdx].family || []).slice();
                fam.splice(famIdx, 1);
                npcData.npcs[npcIdx].family = fam;
                saveNPCData(npcData);
                renderApp();
                return;
            }
            // Character context: contextId is the charId (covers DM families panel)
            if (ctxId) {
                var cfg = loadCharConfig(ctxId);
                if (!cfg) return;
                var cFam = (cfg.family || []).slice();
                cFam.splice(famIdx, 1);
                saveCharConfigField(ctxId, 'family', cFam);
                renderApp();
                return;
            }
            // Legacy fallback: derive npcIdx from .npc-card position
            var npcCard = target.closest('.npc-card');
            if (!npcCard) return;
            var fbIdx = -1;
            var npcCards = document.querySelectorAll('.npc-card');
            for (var nc = 0; nc < npcCards.length; nc++) {
                if (npcCards[nc] === npcCard) { fbIdx = nc; break; }
            }
            if (fbIdx < 0) return;
            var fbData = getNPCData();
            var fbFam = (fbData.npcs[fbIdx].family || []).slice();
            fbFam.splice(famIdx, 1);
            fbData.npcs[fbIdx].family = fbFam;
            saveNPCData(fbData);
            renderApp();
            return;
        }

        // --- Home: enter campaign ---
        if (target.matches('[data-action="enter-campaign"]') || target.closest('[data-action="enter-campaign"]')) {
            // Don't navigate when the click originated on a per-card action button (edit, delete, etc.)
            if (target.matches('[data-action="edit-campaign-session"]') || target.closest('[data-action="edit-campaign-session"]')) {
                // Fall through — the dedicated handler below will pick this up.
            } else {
                var card = target.matches('[data-action="enter-campaign"]') ? target : target.closest('[data-action="enter-campaign"]');
                setActiveCampaign(card.dataset.campaignId);
                navigate('/dashboard');
                return;
            }
        }

        // --- Home: join campaign by code ---
        if (target.matches('[data-action="join-campaign-code"]')) {
            var codeInput = document.getElementById('join-code-input');
            if (codeInput && codeInput.value.trim()) {
                navigate('/join/' + codeInput.value.trim());
            }
            return;
        }

        // --- Party: assign character ---
        if (target.matches('[data-action="assign-to-party"]') || target.closest('[data-action="assign-to-party"]')) {
            var assignCard = target.matches('[data-action="assign-to-party"]') ? target : target.closest('[data-action="assign-to-party"]');
            var assignCharId = assignCard.dataset.charId;
            var camps = getCampaigns();
            var activeCampId = getActiveCampaign();
            if (camps[activeCampId]) {
                if (!camps[activeCampId].party) camps[activeCampId].party = {};
                camps[activeCampId].party[currentUserId()] = assignCharId;
                saveCampaigns(camps);
                showToast(t('party.char.added'), 'success');
                renderApp();
            }
            return;
        }

        // --- Party: change character ---
        if (target.matches('[data-action="change-party-char"]')) {
            var camps = getCampaigns();
            var activeCampId = getActiveCampaign();
            if (camps[activeCampId] && camps[activeCampId].party) {
                delete camps[activeCampId].party[currentUserId()];
                saveCampaigns(camps);
                renderApp();
            }
            return;
        }

        // --- Party: copy invite link ---
        if (target.matches('[data-action="copy-invite-link"]')) {
            var linkInput = document.getElementById('invite-link-input');
            if (linkInput) {
                linkInput.select();
                document.execCommand('copy');
                showToast(t('party.link.copied'), 'success');
            }
            return;
        }

        // --- Party: remove member ---
        if (target.matches('[data-action="remove-member"]')) {
            var removeUid = target.dataset.userId;
            if (!confirm(t('party.remove.confirm'))) return;
            var camps = getCampaigns();
            var activeCampId = getActiveCampaign();
            if (camps[activeCampId]) {
                var members = camps[activeCampId].members || [];
                var idx = members.indexOf(removeUid);
                if (idx !== -1) members.splice(idx, 1);
                if (camps[activeCampId].party) delete camps[activeCampId].party[removeUid];
                saveCampaigns(camps);
                renderApp();
            }
            return;
        }

        // --- Party: add member ---
        if (target.matches('[data-action="add-member"]')) {
            var addInput = document.getElementById('add-member-input');
            if (!addInput || !addInput.value.trim()) return;
            var addUid = addInput.value.trim().toLowerCase();
            var addUser = getUserData(addUid);
            if (!addUser) {
                showToast(t('party.user.notfound'), 'error');
                return;
            }
            var camps = getCampaigns();
            var activeCampId = getActiveCampaign();
            if (camps[activeCampId]) {
                if (!camps[activeCampId].members) camps[activeCampId].members = [];
                if (camps[activeCampId].members.indexOf(addUid) === -1) {
                    camps[activeCampId].members.push(addUid);
                    saveCampaigns(camps);
                    showToast(addUser.name + t('party.user.added'), 'success');
                    renderApp();
                } else {
                    showToast(t('party.already.member'), 'info');
                }
            }
            return;
        }

        // --- Campaign management (DM tools) ---
        if (target.matches('[data-action="create-campaign"]')) {
            var wizHtml = '<div class="modal-overlay" id="campaign-wizard">';
            wizHtml += '<div class="modal-box campaign-wizard" style="max-width:440px;">';
            wizHtml += '<h3>&#127760; ' + t('home.newcampaign') + '</h3>';
            wizHtml += '<div style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem;">';
            wizHtml += '<div><label class="settings-label">' + t('campaign.name.label') + '</label>';
            wizHtml += '<input type="text" class="edit-input" id="wiz-camp-name" placeholder="' + t('campaign.name.plh') + '" autofocus></div>';
            wizHtml += '<div><label class="settings-label">' + t('campaign.desc.label') + '</label>';
            wizHtml += '<textarea class="edit-textarea auto-grow" id="wiz-camp-desc" placeholder="' + t('campaign.desc.plh') + '" style="min-height:60px;"></textarea></div>';
            wizHtml += '</div>';
            wizHtml += '<div class="modal-actions" style="margin-top:1.25rem;">';
            wizHtml += '<button class="btn btn-primary" data-modal-action="create-camp">' + t('campaign.create') + '</button>';
            wizHtml += '<button class="btn btn-ghost" data-modal-action="cancel-camp">' + t('generic.cancel') + '</button>';
            wizHtml += '</div>';
            wizHtml += '</div></div>';
            document.body.insertAdjacentHTML('beforeend', wizHtml);
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            var nameInput = document.getElementById('wiz-camp-name');
            if (nameInput) nameInput.focus();
            var wizModal = document.getElementById('campaign-wizard');
            wizModal.addEventListener('click', function(we) {
                var actionEl = we.target.closest('[data-modal-action]');
                var action = actionEl ? actionEl.dataset.modalAction : null;
                if (we.target === wizModal) action = 'cancel-camp';
                if (!action) return;
                if (action === 'create-camp') {
                    var nameEl = document.getElementById('wiz-camp-name');
                    var campName = nameEl ? nameEl.value.trim() : '';
                    if (!campName) { nameEl.style.borderColor = 'var(--danger)'; return; }
                    var campId = campName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    var camps = getCampaigns();
                    var invCode = generateInviteCode();
                    camps[campId] = { name: campName, dm: currentUserId(), created: Date.now(), members: [currentUserId()], party: {}, inviteCode: invCode };
                    var descEl = document.getElementById('wiz-camp-desc');
                    if (descEl && descEl.value.trim()) camps[campId].description = descEl.value.trim();
                    saveCampaigns(camps);
                    setActiveCampaign(campId);
                    showToast(t('campaign.created') + ' Invite code: ' + invCode, 'success');
                }
                wizModal.remove();
                if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
                renderApp();
            });
            return;
        }
        if (target.matches('[data-action="activate-campaign"]')) {
            setActiveCampaign(target.dataset.campaignId);
            renderApp();
            return;
        }
        if (target.matches('[data-action="edit-campaign-session"]') || target.closest('[data-action="edit-campaign-session"]')) {
            // Stop the card-wide enter-campaign click from also firing
            ev.stopPropagation();
            ev.preventDefault();
            var btn = target.matches('[data-action="edit-campaign-session"]') ? target : target.closest('[data-action="edit-campaign-session"]');
            var cId = btn.dataset.campaignId;
            var camps = getCampaigns();
            var camp = camps[cId];
            if (!camp) return;
            var currentCount = camp.sessionCount || 0;
            var currentDate = camp.nextSession || '';

            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML =
                '<div class="modal-card" onclick="event.stopPropagation();" style="max-width:420px;padding:1.5rem;">' +
                    '<div class="modal-header"><h2>' + t('home.editsession') + '</h2><button class="modal-close" data-action="close-session-modal">&times;</button></div>' +
                    '<label class="login-label" style="display:block;margin-block:0.75rem 0.25rem;">' + t('home.sessionnumber') + '</label>' +
                    '<input type="number" min="0" step="1" class="edit-input" id="edit-session-count" value="' + (currentCount || '') + '" style="width:100%;">' +
                    '<label class="login-label" style="display:block;margin-block:1rem 0.25rem;">' + t('home.sessiondate') + '</label>' +
                    '<input type="datetime-local" class="edit-input" id="edit-session-date" value="' + escapeAttr(currentDate) + '" style="width:100%;">' +
                    '<div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.25rem;">' +
                        '<button class="btn btn-ghost btn-sm" data-action="close-session-modal">' + t('generic.cancel') + '</button>' +
                        '<button class="btn btn-primary btn-sm" data-action="confirm-edit-session" data-campaign-id="' + escapeAttr(cId) + '">' + t('quest.save') + '</button>' +
                    '</div>' +
                '</div>';
            overlay.addEventListener('click', function(evt) {
                if (evt.target === overlay || evt.target.matches('[data-action="close-session-modal"]') || evt.target.closest('[data-action="close-session-modal"]')) {
                    overlay.remove();
                    return;
                }
                if (evt.target.matches('[data-action="confirm-edit-session"]') || evt.target.closest('[data-action="confirm-edit-session"]')) {
                    var countEl = document.getElementById('edit-session-count');
                    var dateEl = document.getElementById('edit-session-date');
                    var c = getCampaigns();
                    if (c[cId]) {
                        var countVal = countEl ? parseInt(countEl.value, 10) : 0;
                        c[cId].sessionCount = (isNaN(countVal) || countVal < 0) ? 0 : countVal;
                        c[cId].nextSession = dateEl && dateEl.value ? dateEl.value : '';
                        saveCampaigns(c);
                    }
                    overlay.remove();
                    renderApp();
                }
            });
            document.body.appendChild(overlay);
            var inp = document.getElementById('edit-session-count');
            if (inp) { inp.focus(); inp.select(); }
            return;
        }
        if (target.matches('[data-action="rename-campaign"]')) {
            var cId = target.dataset.campaignId;
            var camps = getCampaigns();
            if (camps[cId]) {
                var overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.innerHTML = '<div class="modal-card" onclick="event.stopPropagation();" style="max-width:400px;padding:1.5rem;">' +
                    '<div class="modal-header"><h2>' + t('dm.camp.rename') + '</h2><button class="modal-close" data-action="close-rename-modal">&times;</button></div>' +
                    '<input type="text" class="edit-input" id="rename-campaign-input" value="' + escapeAttr(camps[cId].name) + '" style="width:100%;margin:1rem 0;">' +
                    '<div style="display:flex;gap:0.5rem;justify-content:flex-end;">' +
                    '<button class="btn btn-ghost btn-sm" data-action="close-rename-modal">' + t('generic.cancel') + '</button>' +
                    '<button class="btn btn-primary btn-sm" data-action="confirm-rename-campaign" data-campaign-id="' + escapeAttr(cId) + '">' + t('quest.save') + '</button>' +
                    '</div></div>';
                overlay.addEventListener('click', function(ev) {
                    if (ev.target === overlay || ev.target.matches('[data-action="close-rename-modal"]') || ev.target.closest('[data-action="close-rename-modal"]')) {
                        overlay.remove();
                    }
                    if (ev.target.matches('[data-action="confirm-rename-campaign"]') || ev.target.closest('[data-action="confirm-rename-campaign"]')) {
                        var input = document.getElementById('rename-campaign-input');
                        var newName = input ? input.value.trim() : '';
                        if (newName) {
                            var c = getCampaigns();
                            c[cId].name = newName;
                            saveCampaigns(c);
                            overlay.remove();
                            renderApp();
                        }
                    }
                });
                document.body.appendChild(overlay);
                var inp = document.getElementById('rename-campaign-input');
                if (inp) { inp.focus(); inp.select(); }
            }
            return;
        }
        if (target.matches('[data-action="delete-campaign"]')) {
            var cId = target.dataset.campaignId;
            if (confirm(t('campaign.delete.confirm'))) {
                var camps = getCampaigns();
                delete camps[cId];
                saveCampaigns(camps);
                if (getActiveCampaign() === cId) setActiveCampaign(Object.keys(camps)[0] || '');
                renderApp();
            }
            return;
        }

        // --- Family Diagram handlers (DM page + character sheet) ---
        if (target.matches('[data-action="famdiag-select-family"]') || target.closest('[data-action="famdiag-select-family"]')) {
            var sel = target.matches('[data-action="famdiag-select-family"]') ? target : target.closest('[data-action="famdiag-select-family"]');
            var fid = sel.dataset.familyId;
            familiesExpandedId = familiesExpandedId === fid ? null : fid;
            renderApp();
            return;
        }

        if (target.matches('[data-action="famdiag-zoom-fit"]')) {
            var fitFid = target.dataset.familyId;
            var fitWrap = document.querySelector('.famdiag-wrap[data-family-id="' + fitFid + '"]');
            if (fitWrap) {
                var scrollEl = fitWrap.querySelector('.famdiag-canvas-scroll');
                var canvasEl = fitWrap.querySelector('.famdiag-canvas');
                if (scrollEl && canvasEl) {
                    var canvasW = parseFloat(canvasEl.style.width) || canvasEl.scrollWidth;
                    var canvasH = parseFloat(canvasEl.style.height) || canvasEl.scrollHeight;
                    var availW = scrollEl.clientWidth - 16;
                    var availH = scrollEl.clientHeight - 16;
                    var scale = Math.min(availW / canvasW, availH / canvasH, 1);
                    if (!isFinite(scale) || scale <= 0) scale = 1;
                    scale = Math.max(0.4, Math.min(1.5, scale));
                    scrollEl.style.setProperty('--famdiag-scale', scale.toFixed(3));
                    var fitSlider = fitWrap.querySelector('input[data-action="famdiag-zoom-slider"]');
                    if (fitSlider) fitSlider.value = scale;
                    var fitPct = document.getElementById('famdiag-zoom-pct-' + fitFid);
                    if (fitPct) fitPct.textContent = Math.round(scale * 100) + '%';
                }
            }
            return;
        }
        if (target.matches('[data-action="famdiag-create-family"]')) {
            var existingCreate = document.getElementById('famdiag-create-modal');
            if (existingCreate) existingCreate.remove();

            var fcHtml = '<div class="modal-overlay" id="famdiag-create-modal">';
            fcHtml += '<div class="modal-box famdiag-edit-box">';
            fcHtml += '<div class="modal-header"><h3>Nieuwe familie</h3>';
            fcHtml += '<button class="modal-close" data-fc-action="cancel" aria-label="Sluiten">&times;</button></div>';
            fcHtml += '<div class="famdiag-edit-grid" style="grid-template-columns:1fr;">';
            fcHtml += '<label class="famdiag-edit-field"><span>Familienaam (achternaam)</span><input type="text" class="edit-input" id="fc-surname" autofocus placeholder="bv. Stormwind"></label>';
            fcHtml += '<label class="famdiag-edit-field"><span>Notities (optioneel)</span><textarea class="edit-input" id="fc-notes" rows="3" placeholder="Korte beschrijving, oorsprong, etc."></textarea></label>';
            fcHtml += '</div>';
            fcHtml += '<div class="modal-actions">';
            fcHtml += '<button class="btn btn-ghost" data-fc-action="cancel">Annuleren</button>';
            fcHtml += '<button class="btn btn-primary" data-fc-action="save">Aanmaken</button>';
            fcHtml += '</div></div></div>';

            document.body.insertAdjacentHTML('beforeend', fcHtml);
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            var fcModal = document.getElementById('famdiag-create-modal');
            var fcInput = document.getElementById('fc-surname');
            if (fcInput) fcInput.focus();

            function fcClose() {
                fcModal.remove();
                if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            }
            function fcSave() {
                var surname = (document.getElementById('fc-surname').value || '').trim();
                if (!surname) { fcInput && fcInput.focus(); return; }
                var notes = (document.getElementById('fc-notes').value || '').trim();
                var fnew = createFamily(surname, notes || undefined);
                familiesExpandedId = fnew.id;
                fcClose();
                renderApp();
            }
            fcModal.addEventListener('click', function(me) {
                var actEl = me.target.closest('[data-fc-action]');
                var act = actEl ? actEl.dataset.fcAction : null;
                if (me.target === fcModal) act = 'cancel';
                if (act === 'cancel') fcClose();
                else if (act === 'save') fcSave();
            });
            fcModal.addEventListener('keydown', function(ke) {
                if (ke.key === 'Escape') fcClose();
                else if (ke.key === 'Enter' && ke.target.tagName === 'INPUT') fcSave();
            });
            return;
        }
        if (target.matches('[data-action="famdiag-rename"]') || target.closest('[data-action="famdiag-rename"]')) {
            var rbtn = target.matches('[data-action="famdiag-rename"]') ? target : target.closest('[data-action="famdiag-rename"]');
            var rfid = rbtn.dataset.familyId;
            var rfam = getFamily(rfid);
            if (!rfam) return;
            var rnew = prompt('Nieuwe familienaam:', rfam.surname || '');
            if (rnew !== null) { renameFamily(rfid, rnew.trim()); renderApp(); }
            return;
        }
        if (target.matches('[data-action="famdiag-delete-family"]') || target.closest('[data-action="famdiag-delete-family"]')) {
            var dbtn = target.matches('[data-action="famdiag-delete-family"]') ? target : target.closest('[data-action="famdiag-delete-family"]');
            var dfid = dbtn.dataset.familyId;
            var dfam = getFamily(dfid);
            if (!dfam) return;
            if (confirm('Familie "' + (dfam.surname || '(naamloos)') + '" en alle leden verwijderen?')) {
                deleteFamily(dfid);
                if (familiesExpandedId === dfid) familiesExpandedId = null;
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="famdiag-add-root"]') || target.closest('[data-action="famdiag-add-root"]')) {
            var arbtn = target.matches('[data-action="famdiag-add-root"]') ? target : target.closest('[data-action="famdiag-add-root"]');
            var arfid = arbtn.dataset.familyId;
            var arfam = getFamily(arfid);
            if (!arfam) return;

            var existingArMod = document.getElementById('famdiag-addroot-modal');
            if (existingArMod) existingArMod.remove();

            var arHtml = '<div class="modal-overlay" id="famdiag-addroot-modal">';
            arHtml += '<div class="modal-box famdiag-edit-box">';
            arHtml += '<div class="modal-header"><h3>Familielid toevoegen</h3>';
            arHtml += '<button class="modal-close" data-ar-action="cancel" aria-label="Sluiten">&times;</button></div>';
            arHtml += '<div class="famdiag-edit-grid">';
            arHtml += '<label class="famdiag-edit-field"><span>Voornaam</span><input type="text" class="edit-input" id="ar-first" autofocus></label>';
            arHtml += '<label class="famdiag-edit-field"><span>Achternaam</span><input type="text" class="edit-input" id="ar-last" value="' + escapeAttr(arfam.surname || '') + '"></label>';
            arHtml += '<label class="famdiag-edit-field"><span>Geboortejaar</span><input type="text" class="edit-input" id="ar-birth" placeholder="optioneel"></label>';
            arHtml += '<label class="famdiag-edit-field"><span>Sterfjaar</span><input type="text" class="edit-input" id="ar-death" placeholder="leeg = nog levend"></label>';
            arHtml += '<label class="famdiag-edit-field"><span>Ras</span><input type="text" class="edit-input" id="ar-race" placeholder="optioneel"></label>';
            arHtml += '<label class="famdiag-edit-field"><span>Geslacht</span><select class="edit-input" id="ar-gender">';
            var arGender = [{v:'',l:'— onbekend —'},{v:'man',l:'Man'},{v:'vrouw',l:'Vrouw'},{v:'neutraal',l:'Neutraal'}];
            for (var arGi=0; arGi<arGender.length; arGi++) {
                arHtml += '<option value="' + arGender[arGi].v + '">' + arGender[arGi].l + '</option>';
            }
            arHtml += '</select></label>';
            arHtml += '</div>';
            arHtml += '<div class="modal-actions">';
            arHtml += '<button class="btn btn-ghost" data-ar-action="cancel">Annuleren</button>';
            arHtml += '<button class="btn btn-primary" data-ar-action="save">Toevoegen</button>';
            arHtml += '</div></div></div>';

            document.body.insertAdjacentHTML('beforeend', arHtml);
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            var arModal = document.getElementById('famdiag-addroot-modal');
            var arFirstInput = document.getElementById('ar-first');
            if (arFirstInput) arFirstInput.focus();

            function arClose() {
                arModal.remove();
                if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            }
            function arSave() {
                var arFirst = (document.getElementById('ar-first').value || '').trim();
                if (!arFirst) { arFirstInput && arFirstInput.focus(); return; }
                createMember(arfid, {
                    firstName: arFirst,
                    lastName: (document.getElementById('ar-last').value || '').trim(),
                    birth: (document.getElementById('ar-birth').value || '').trim(),
                    death: (document.getElementById('ar-death').value || '').trim(),
                    race: (document.getElementById('ar-race').value || '').trim(),
                    gender: (document.getElementById('ar-gender').value || '').trim()
                });
                arClose();
                renderApp();
            }
            arModal.addEventListener('click', function(me) {
                var actEl = me.target.closest('[data-ar-action]');
                var act = actEl ? actEl.dataset.arAction : null;
                if (me.target === arModal) act = 'cancel';
                if (act === 'cancel') arClose();
                else if (act === 'save') arSave();
            });
            arModal.addEventListener('keydown', function(ke) {
                if (ke.key === 'Escape') arClose();
                else if (ke.key === 'Enter' && ke.target.tagName === 'INPUT') arSave();
            });
            return;
        }
        if (target.matches('[data-action="famdiag-add-partner"]') || target.closest('[data-action="famdiag-add-partner"]')) {
            var apbtn = target.matches('[data-action="famdiag-add-partner"]') ? target : target.closest('[data-action="famdiag-add-partner"]');
            var apMid = apbtn.dataset.memberId;
            var apMem = getMember(apMid);
            if (!apMem) return;
            // Check if already partnered in own family — if so, ask if user wants 2nd marriage (skip for v1, just block)
            var existingP = findUnionsAsPartner(apMid).filter(function(u) { return u.partnerIds.length >= 2; });
            if (existingP.length > 0) { alert('Deze persoon heeft al een partner. Multi-partner ondersteuning komt later.'); return; }
            var apName = prompt('Voornaam van de partner:');
            if (!apName) return;
            var apLast = prompt('Achternaam van de partner (leeg = zelfde familie):', apMem.lastName || '') || '';
            apLast = apLast.trim();
            // Determine target family for new partner
            var apTargetFamId;
            if (!apLast || apLast.toLowerCase() === (apMem.lastName || '').toLowerCase()) {
                apTargetFamId = apMem.familyId;
                apLast = apMem.lastName || '';
            } else {
                var apFam = findOrCreateFamilyBySurname(apLast);
                apTargetFamId = apFam.id;
            }
            var newPartner = createMember(apTargetFamId, { firstName: apName.trim(), lastName: apLast });
            createUnion(apMid, newPartner.id);
            renderApp();
            return;
        }
        if (target.matches('[data-action="famdiag-add-parent"]') || target.closest('[data-action="famdiag-add-parent"]')) {
            var ppbtn = target.matches('[data-action="famdiag-add-parent"]') ? target : target.closest('[data-action="famdiag-add-parent"]');
            var ppMid = ppbtn.dataset.memberId;
            var ppMem = getMember(ppMid);
            if (!ppMem) return;
            var existingChildUnion = findUnionAsChild(ppMid);
            var ppName = prompt('Voornaam van de ouder:');
            if (!ppName) return;
            var ppLast = prompt('Achternaam van de ouder (leeg = zelfde familie):', ppMem.lastName || '') || '';
            ppLast = ppLast.trim();
            var ppTargetFamId;
            if (!ppLast || ppLast.toLowerCase() === (ppMem.lastName || '').toLowerCase()) {
                ppTargetFamId = ppMem.familyId;
                ppLast = ppMem.lastName || '';
            } else {
                var ppFam = findOrCreateFamilyBySurname(ppLast);
                ppTargetFamId = ppFam.id;
            }
            var newParent = createMember(ppTargetFamId, { firstName: ppName.trim(), lastName: ppLast });
            if (existingChildUnion) {
                addPartnerToUnion(existingChildUnion.id, newParent.id);
            } else {
                var newPU = createUnion(newParent.id);
                if (newPU) addChildToUnion(newPU.id, ppMid);
            }
            renderApp();
            return;
        }
        if (target.matches('[data-action="famdiag-add-child"]') || target.closest('[data-action="famdiag-add-child"]')) {
            var acbtn = target.matches('[data-action="famdiag-add-child"]') ? target : target.closest('[data-action="famdiag-add-child"]');
            var acUid = acbtn.dataset.unionId;
            var acFid = acbtn.dataset.familyId;
            var acUni = getUnion(acUid);
            if (!acUni) return;
            var acName = prompt('Voornaam van het kind:');
            if (!acName) return;
            // Default child surname = surname of family currently being viewed
            var acFam = getFamily(acFid);
            var acDefaultLast = acFam ? (acFam.surname || '') : '';
            var acLast = prompt('Achternaam (leeg = ' + (acDefaultLast || 'geen') + '):', acDefaultLast) || '';
            acLast = acLast.trim();
            var acTargetFamId = acFid;
            if (acLast && acLast.toLowerCase() !== (acDefaultLast || '').toLowerCase()) {
                var acTF = findOrCreateFamilyBySurname(acLast);
                acTargetFamId = acTF.id;
            }
            var newChild = createMember(acTargetFamId, { firstName: acName.trim(), lastName: acLast });
            addChildToUnion(acUid, newChild.id);
            renderApp();
            return;
        }
        if (target.matches('[data-action="famdiag-edit-member"]') || target.closest('[data-action="famdiag-edit-member"]')) {
            var ebtn = target.matches('[data-action="famdiag-edit-member"]') ? target : target.closest('[data-action="famdiag-edit-member"]');
            var emid = ebtn.dataset.memberId;
            var emem = getMember(emid);
            if (!emem) return;

            var existing = document.getElementById('famdiag-edit-modal');
            if (existing) existing.remove();

            var fmHtml = '<div class="modal-overlay" id="famdiag-edit-modal">';
            fmHtml += '<div class="modal-box famdiag-edit-box">';
            fmHtml += '<div class="modal-header"><h3>Familielid bewerken</h3>';
            fmHtml += '<button class="modal-close" data-fam-action="cancel" aria-label="Sluiten">&times;</button></div>';
            fmHtml += '<div class="famdiag-edit-grid">';
            fmHtml += '<label class="famdiag-edit-field"><span>Voornaam</span><input type="text" class="edit-input" id="fm-first" value="' + escapeAttr(emem.firstName || '') + '" autofocus></label>';
            fmHtml += '<label class="famdiag-edit-field"><span>Achternaam</span><input type="text" class="edit-input" id="fm-last" value="' + escapeAttr(emem.lastName || '') + '"></label>';
            fmHtml += '<label class="famdiag-edit-field"><span>Geboortejaar</span><input type="text" class="edit-input" id="fm-birth" value="' + escapeAttr(emem.birth || '') + '" placeholder="optioneel"></label>';
            fmHtml += '<label class="famdiag-edit-field"><span>Sterfjaar</span><input type="text" class="edit-input" id="fm-death" value="' + escapeAttr(emem.death || '') + '" placeholder="leeg = nog levend"></label>';
            fmHtml += '<label class="famdiag-edit-field"><span>Ras</span><input type="text" class="edit-input" id="fm-race" value="' + escapeAttr(emem.race || '') + '" placeholder="optioneel"></label>';
            fmHtml += '<label class="famdiag-edit-field"><span>Geslacht</span><select class="edit-input" id="fm-gender">';
            var genderOpts = [{v:'',l:'— onbekend —'},{v:'man',l:'Man'},{v:'vrouw',l:'Vrouw'},{v:'neutraal',l:'Neutraal'}];
            for (var gi=0; gi<genderOpts.length; gi++) {
                var sel = (emem.gender || '') === genderOpts[gi].v ? ' selected' : '';
                fmHtml += '<option value="' + genderOpts[gi].v + '"' + sel + '>' + genderOpts[gi].l + '</option>';
            }
            fmHtml += '</select></label>';
            fmHtml += '</div>';
            fmHtml += '<div class="modal-actions">';
            fmHtml += '<button class="btn btn-ghost" data-fam-action="cancel">Annuleren</button>';
            fmHtml += '<button class="btn btn-primary" data-fam-action="save">Opslaan</button>';
            fmHtml += '</div></div></div>';

            document.body.insertAdjacentHTML('beforeend', fmHtml);
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            var fmModal = document.getElementById('famdiag-edit-modal');
            var fmFirstInput = document.getElementById('fm-first');
            if (fmFirstInput) { fmFirstInput.focus(); fmFirstInput.select(); }

            function fmClose() {
                fmModal.remove();
                if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            }
            function fmSave() {
                updateMember(emid, {
                    firstName: (document.getElementById('fm-first').value || '').trim(),
                    lastName: (document.getElementById('fm-last').value || '').trim(),
                    birth: (document.getElementById('fm-birth').value || '').trim(),
                    death: (document.getElementById('fm-death').value || '').trim(),
                    race: (document.getElementById('fm-race').value || '').trim(),
                    gender: (document.getElementById('fm-gender').value || '').trim()
                });
                fmClose();
                renderApp();
            }
            fmModal.addEventListener('click', function(me) {
                var actEl = me.target.closest('[data-fam-action]');
                var act = actEl ? actEl.dataset.famAction : null;
                if (me.target === fmModal) act = 'cancel';
                if (act === 'cancel') fmClose();
                else if (act === 'save') fmSave();
            });
            fmModal.addEventListener('keydown', function(ke) {
                if (ke.key === 'Escape') fmClose();
                else if (ke.key === 'Enter' && ke.target.tagName === 'INPUT') fmSave();
            });
            return;
        }
        if (target.matches('[data-action="famdiag-remove-member"]') || target.closest('[data-action="famdiag-remove-member"]')) {
            var rbtn2 = target.matches('[data-action="famdiag-remove-member"]') ? target : target.closest('[data-action="famdiag-remove-member"]');
            var rmid = rbtn2.dataset.memberId;
            var rmem = getMember(rmid);
            if (!rmem) return;
            var rname = ((rmem.firstName || '') + ' ' + (rmem.lastName || '')).trim() || '(naamloos)';
            if (confirm('Lid "' + rname + '" verwijderen uit familie?')) {
                deleteMember(rmid);
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="famdiag-open-link"]') || target.closest('[data-action="famdiag-open-link"]')) {
            var olbtn = target.matches('[data-action="famdiag-open-link"]') ? target : target.closest('[data-action="famdiag-open-link"]');
            var lt = olbtn.dataset.linkType;
            var lid = olbtn.dataset.linkId;
            if (lt === 'character') navigate('/characters/' + lid);
            else if (lt === 'npc') navigate('/lore/npcs');
            return;
        }

        // --- NPC card expand/collapse ---
        if (target.matches('[data-action="toggle-npc-card"]') || target.closest('[data-action="toggle-npc-card"]')) {
            var card = target.closest('.npc-card');
            if (card) card.classList.toggle('expanded');
            return;
        }

        // --- NPC handlers ---
        if (target.matches('[data-action="add-npc"]')) {
            var npcName = prompt('NPC name:');
            if (npcName && npcName.trim()) {
                var npcLoc = prompt('Location (optional):') || '';
                var npcDisp = prompt('Disposition (friendly/neutral/hostile/unknown):') || 'unknown';
                var npcNotes = prompt('Notes (optional):') || '';
                var npcData = getNPCData();
                npcData.npcs.push({ name: npcName.trim(), location: npcLoc.trim(), disposition: npcDisp.trim().toLowerCase(), notes: npcNotes.trim(), id: 'npc' + Date.now() });
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="edit-npc"]')) {
            var npcIdx = parseInt(target.dataset.npcIdx);
            var npcData = getNPCData();
            if (npcData.npcs[npcIdx]) {
                var npc = npcData.npcs[npcIdx];
                var nName = prompt('Name:', npc.name); if (nName === null) return;
                var nLoc = prompt('Location:', npc.location); if (nLoc === null) return;
                var nDisp = prompt('Disposition (friendly/neutral/hostile/unknown):', npc.disposition); if (nDisp === null) return;
                var nNotes = prompt('Notes:', npc.notes); if (nNotes === null) return;
                npc.name = nName.trim() || npc.name;
                npc.location = nLoc.trim();
                npc.disposition = nDisp.trim().toLowerCase();
                npc.notes = nNotes.trim();
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="delete-npc"]')) {
            if (confirm('Delete this NPC?')) {
                var npcIdx = parseInt(target.dataset.npcIdx);
                var npcData = getNPCData();
                npcData.npcs.splice(npcIdx, 1);
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }

        // Remove note image
        if (target.matches('[data-action="remove-note-image"]')) {
            var noteImgPreview = document.querySelector('.note-image-preview');
            if (noteImgPreview) {
                noteImgPreview.outerHTML = '<label class="note-image-upload"><span>+ Afbeelding toevoegen</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
            }
            return;
        }

        // Toggle pin on note
        if (target.matches('[data-action="toggle-note-pin"]') || target.closest('[data-action="toggle-note-pin"]')) {
            var pinBtn = target.matches('[data-action="toggle-note-pin"]') ? target : target.closest('[data-action="toggle-note-pin"]');
            var pinNoteId = pinBtn.dataset.noteId;
            var pinData = getNotesData();
            for (var pni = 0; pni < pinData.notes.length; pni++) {
                if (pinData.notes[pni].id === pinNoteId) {
                    pinData.notes[pni].pinned = !pinData.notes[pni].pinned;
                    break;
                }
            }
            saveNotesData(pinData);
            renderApp();
            return;
        }

        // Add tag to note
        if (target.matches('[data-action="add-tag"]')) {
            var tagTextEl = document.getElementById('tag-text');
            var tagCatEl = document.getElementById('tag-category');
            if (tagTextEl && tagTextEl.value.trim()) {
                if (!window._noteTags) {
                    // Initialize from existing tags in DOM
                    window._noteTags = [];
                    document.querySelectorAll('#note-tags-list .note-tag').forEach(function(el) {
                        var txt = el.textContent.replace('\u00d7', '').trim();
                        // Remove leading emoji
                        txt = txt.replace(/^[\ud800-\udbff][\udc00-\udfff]\s*/, '').trim();
                        window._noteTags.push({ text: txt, category: 'other' });
                    });
                }
                window._noteTags.push({
                    text: tagTextEl.value.trim(),
                    category: tagCatEl ? tagCatEl.value : 'other'
                });
                // Re-render tag list
                var tagListEl = document.getElementById('note-tags-list');
                if (tagListEl) {
                    var tagHtml = '';
                    for (var tti = 0; tti < window._noteTags.length; tti++) {
                        var tg = window._noteTags[tti];
                        var tgCat = null;
                        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                            if (TAG_CATEGORIES[tci].id === tg.category) { tgCat = TAG_CATEGORIES[tci]; break; }
                        }
                        if (!tgCat) tgCat = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];
                        tagHtml += '<span class="note-tag" style="border-color:' + tgCat.color + '">' + tgCat.icon + ' ' + escapeHtml(tg.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + tti + '">&times;</button></span>';
                    }
                    tagListEl.innerHTML = tagHtml;
                }
                tagTextEl.value = '';
            }
            return;
        }

        // Remove tag from note
        if (target.matches('[data-action="remove-tag"]') || target.closest('[data-action="remove-tag"]')) {
            var removeTagBtn = target.matches('[data-action="remove-tag"]') ? target : target.closest('[data-action="remove-tag"]');
            var tagIdx = parseInt(removeTagBtn.dataset.tagIdx);
            if (!window._noteTags) window._noteTags = [];
            if (!isNaN(tagIdx) && tagIdx < window._noteTags.length) {
                window._noteTags.splice(tagIdx, 1);
                // Re-render
                var tagListEl = document.getElementById('note-tags-list');
                if (tagListEl) {
                    var tagHtml = '';
                    for (var tti = 0; tti < window._noteTags.length; tti++) {
                        var tg = window._noteTags[tti];
                        var tgCat = null;
                        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                            if (TAG_CATEGORIES[tci].id === tg.category) { tgCat = TAG_CATEGORIES[tci]; break; }
                        }
                        if (!tgCat) tgCat = TAG_CATEGORIES[TAG_CATEGORIES.length - 1];
                        tagHtml += '<span class="note-tag" style="border-color:' + tgCat.color + '">' + tgCat.icon + ' ' + escapeHtml(tg.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + tti + '">&times;</button></span>';
                    }
                    tagListEl.innerHTML = tagHtml;
                }
            }
            return;
        }

        // Remove gallery image
        if (target.matches('[data-action="remove-gallery-image"]')) {
            var thumbEl = target.closest('.note-gallery-thumb');
            if (thumbEl) thumbEl.remove();
            return;
        }

        // Add checklist item
        if (target.matches('[data-action="add-check-item"]')) {
            var checklistEl = document.getElementById('note-checklist');
            if (checklistEl) {
                var newIdx = checklistEl.children.length;
                var itemHtml = '<div class="note-checklist-item" data-check-idx="' + newIdx + '">';
                itemHtml += '<input type="checkbox" class="note-check-box" data-action="toggle-check" data-idx="' + newIdx + '">';
                itemHtml += '<input type="text" class="note-check-text" data-action="edit-check-text" data-idx="' + newIdx + '" value="" placeholder="Item...">';
                itemHtml += '<button class="note-check-remove" data-action="remove-check-item" data-idx="' + newIdx + '">&times;</button>';
                itemHtml += '</div>';
                checklistEl.insertAdjacentHTML('beforeend', itemHtml);
                var newInput = checklistEl.lastElementChild.querySelector('.note-check-text');
                if (newInput) newInput.focus();
            }
            return;
        }

        // Remove checklist item
        if (target.matches('[data-action="remove-check-item"]')) {
            var checkItemEl = target.closest('.note-checklist-item');
            if (checkItemEl) checkItemEl.remove();
            return;
        }

        // Toggle checklist item in view mode
        if (target.matches('[data-action="toggle-view-check"]') || target.closest('[data-action="toggle-view-check"]')) {
            var checkEl = target.matches('[data-action="toggle-view-check"]') ? target : target.closest('[data-action="toggle-view-check"]');
            var tvNoteId = checkEl.dataset.noteId;
            var tvIdx = parseInt(checkEl.dataset.idx, 10);
            var tvData = getNotesData();
            for (var tvi = 0; tvi < tvData.notes.length; tvi++) {
                if (tvData.notes[tvi].id === tvNoteId && tvData.notes[tvi].checklist && tvData.notes[tvi].checklist[tvIdx]) {
                    tvData.notes[tvi].checklist[tvIdx].done = !tvData.notes[tvi].checklist[tvIdx].done;
                    tvData.notes[tvi].updated = Date.now();
                    break;
                }
            }
            saveNotesData(tvData);
            renderApp();
            return;
        }

        // Delete NPC from initiative pool
        if (target.matches('[data-action="init-delete-npc"]') || target.closest('[data-action="init-delete-npc"]')) {
            e.stopPropagation();
            var delBtn = target.closest('[data-action="init-delete-npc"]') || target;
            var nIdx = parseInt(delBtn.dataset.npcIdx);
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!isNaN(nIdx) && initData.npcs) {
                initData.npcs.splice(nIdx, 1);
                initData.entries = initData.entries.filter(function(ent) { return ent.npcIdx !== nIdx; });
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Create NPC for initiative
        if (target.matches('[data-action="init-create-npc"]')) {
            var nameEl = document.getElementById('init-npc-name');
            var dispEl = document.getElementById('init-npc-disp');
            if (!nameEl || !nameEl.value.trim()) return;
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!initData.npcs) initData.npcs = [];
            initData.npcs.push({ name: nameEl.value.trim(), disposition: dispEl ? dispEl.value : 'hostile' });
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // (delete-npc handler moved earlier in chain)

        // Next turn
        if (target.matches('[data-action="next-turn"]')) {
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (initData.entries.length > 0) {
                initData.currentTurn = (initData.currentTurn + 1) % initData.entries.length;
                if (initData.currentTurn === 0) initData.round++;
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Remove from initiative
        if (target.matches('[data-action="remove-init"]')) {
            var ridx = parseInt(target.dataset.initIdx);
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!isNaN(ridx)) {
                initData.entries.splice(ridx, 1);
                if (initData.currentTurn >= initData.entries.length) initData.currentTurn = 0;
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Reset initiative (entries back to their boxes, keep NPCs, reset round)
        if (target.matches('[data-action="reset-init"]')) {
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            initData.entries = [];
            initData.currentTurn = 0;
            initData.round = 1;
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Sync upload all
        if (target.matches('[data-action="sync-upload-all"]')) {
            if (typeof syncSeedCampaign === 'function') syncSeedCampaign();
            else if (typeof syncUploadAll === 'function') syncUploadAll();
            target.textContent = t('dm.sync.uploaded');
            setTimeout(function() { target.textContent = t('dm.sync.uploadall'); }, 2000);
            return;
        }

        // Seed campaign data to Firebase
        if (target.matches('[data-action="sync-seed-campaign"]')) {
            if (typeof syncSeedCampaign === 'function') syncSeedCampaign();
            target.textContent = 'Seeded!';
            setTimeout(function() { target.textContent = 'Seed Campaign Data'; }, 2000);
            return;
        }

        // Dice roller
        // Global dice panel toggle
        if (target.matches('[data-action="toggle-dice-panel"]') || target.closest('[data-action="toggle-dice-panel"]')) {
            var panel = document.getElementById('dice-panel');
            if (panel) {
                var wasHidden = panel.style.display === 'none';
                panel.style.display = wasHidden ? 'flex' : 'none';
                if (wasHidden && typeof DiceHand !== 'undefined') DiceHand.render();
            }
            return;
        }

        // Quick notes panel toggle
        if (target.matches('[data-action="toggle-notes-panel"]') || target.closest('[data-action="toggle-notes-panel"]')) {
            var npanel = document.getElementById('notes-panel');
            if (npanel) {
                var nWasHidden = npanel.style.display === 'none';
                npanel.style.display = nWasHidden ? 'flex' : 'none';
                if (nWasHidden && typeof QuickNotes !== 'undefined') QuickNotes.render();
            }
            return;
        }
        if (target.matches('[data-action="qnote-cat"]')) {
            if (typeof QuickNotes !== 'undefined') QuickNotes.setCategory(target.dataset.cat);
            return;
        }
        if (target.matches('[data-action="qnote-save"]')) {
            if (typeof QuickNotes !== 'undefined') QuickNotes.save();
            return;
        }
        if (target.matches('[data-action="qnote-add-tag"]')) {
            if (typeof QuickNotes !== 'undefined') QuickNotes.addTag();
            return;
        }
        if (target.matches('[data-action="qnote-remove-tag"]') || target.closest('[data-action="qnote-remove-tag"]')) {
            var remBtn = target.matches('[data-action="qnote-remove-tag"]') ? target : target.closest('[data-action="qnote-remove-tag"]');
            if (typeof QuickNotes !== 'undefined') QuickNotes.removeTag(parseInt(remBtn.dataset.tagIdx));
            return;
        }

        // Dice hand: add die
        if (target.matches('[data-action="dice-add"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.add(parseInt(target.dataset.die));
            return;
        }
        // Dice hand: remove from hand
        if (target.matches('[data-action="dice-remove-hand"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.remove(parseInt(target.dataset.idx));
            return;
        }
        // Dice hand: roll
        if (target.matches('[data-action="dice-roll-hand"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.roll();
            return;
        }
        // Dice hand: reset
        if (target.matches('[data-action="dice-reset"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.reset();
            return;
        }
        // Dice hand: return result to pool
        if (target.matches('[data-action="dice-remove-result"]') || target.closest('[data-action="dice-remove-result"]')) {
            var chip = target.matches('[data-action="dice-remove-result"]') ? target : target.closest('[data-action="dice-remove-result"]');
            if (typeof DiceHand !== 'undefined') DiceHand.removeResult(parseInt(chip.dataset.idx));
            return;
        }

        // DM dice roller (legacy)
        if (target.matches('[data-action="roll-dice"]')) {
            var die = parseInt(target.dataset.die);
            var result = Math.floor(Math.random() * die) + 1;
            var resultEl = document.getElementById('dice-result');
            if (resultEl) {
                resultEl.innerHTML = '<span class="dice-roll-value">' + result + '</span><span class="dice-roll-label">d' + die + '</span>';
                resultEl.classList.add('dice-animate');
                setTimeout(function() { resultEl.classList.remove('dice-animate'); }, 300);
            }
            return;
        }

        // (Character page handlers removed — empty canvas awaiting Widget Grid V8.)


        // --- Session number +/- ---
        if (target.matches('[data-action="session-plus"]')) {
            var n = parseInt(localStorage.getItem('dw_session_number') || '0');
            localStorage.setItem('dw_session_number', String(n + 1));
            if (typeof syncUpload === 'function') syncUpload('dw_session_number');
            renderApp();
            return;
        }
        if (target.matches('[data-action="session-minus"]')) {
            var n = parseInt(localStorage.getItem('dw_session_number') || '0');
            if (n > 0) localStorage.setItem('dw_session_number', String(n - 1));
            if (typeof syncUpload === 'function') syncUpload('dw_session_number');
            renderApp();
            return;
        }

        // --- Dashboard: whispers ---
        if (target.matches('[data-action="send-whisper"]')) {
            var wTarget = document.getElementById('whisper-target');
            var wText = document.getElementById('whisper-text');
            if (wTarget && wText && wText.value.trim()) {
                var wKey = 'dw_whisper_' + wTarget.value;
                var existing = JSON.parse(localStorage.getItem(wKey) || '[]');
                existing.push({ text: wText.value.trim(), time: Date.now(), from: 'DM' });
                localStorage.setItem(wKey, JSON.stringify(existing));
                if (typeof syncUpload === 'function') syncUpload(wKey);
                wText.value = '';
                showToast(t('dm.whisper.sentto') + wTarget.options[wTarget.selectedIndex].text);
            }
            return;
        }
        if (target.matches('[data-action="dismiss-whisper"]')) {
            var wIdx = parseInt(target.dataset.whisperIdx);
            var wKey = 'dw_whisper_' + currentUserId();
            var whispers = JSON.parse(localStorage.getItem(wKey) || '[]');
            whispers.splice(wIdx, 1);
            localStorage.setItem(wKey, JSON.stringify(whispers));
            if (typeof syncUpload === 'function') syncUpload(wKey);
            renderApp();
            return;
        }

        // --- Dashboard: quests ---
        if (target.matches('[data-action="add-quest"]')) {
            var qForm = document.getElementById('quest-add-form');
            if (qForm) {
                qForm.style.display = qForm.style.display === 'none' ? 'block' : 'none';
                var editIdx = document.getElementById('quest-edit-idx');
                if (editIdx) editIdx.value = '';
                var qtEl = document.getElementById('quest-title'); if (qtEl) qtEl.value = '';
                var qdEl = document.getElementById('quest-desc'); if (qdEl) qdEl.value = '';
                var qgEl = document.getElementById('quest-giver'); if (qgEl) qgEl.value = '';
                var qrEl = document.getElementById('quest-reward'); if (qrEl) qrEl.value = '';
                var qtagEl = document.getElementById('quest-tags'); if (qtagEl) qtagEl.value = '';
            }
            return;
        }
        if (target.matches('[data-action="edit-quest"]') || target.closest('[data-action="edit-quest"]')) {
            var editBtn = target.matches('[data-action="edit-quest"]') ? target : target.closest('[data-action="edit-quest"]');
            var qIdx = parseInt(editBtn.dataset.questIdx);
            var qData = getQuestData();
            var quest = qData.active[qIdx];
            if (!quest) return;
            var qForm = document.getElementById('quest-add-form');
            if (qForm) {
                qForm.style.display = 'block';
                var qtEl = document.getElementById('quest-title'); if (qtEl) qtEl.value = quest.title || '';
                var qdEl = document.getElementById('quest-desc'); if (qdEl) qdEl.value = quest.desc || '';
                var qgEl = document.getElementById('quest-giver'); if (qgEl) qgEl.value = quest.giver || '';
                var qrEl = document.getElementById('quest-reward'); if (qrEl) qrEl.value = quest.reward || '';
                var qtagEl = document.getElementById('quest-tags'); if (qtagEl) qtagEl.value = quest.tags || '';
                var editIdx = document.getElementById('quest-edit-idx'); if (editIdx) editIdx.value = qIdx;
                qForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        if (target.matches('[data-action="save-quest"]')) {
            var qTitleEl = document.getElementById('quest-title');
            if (!qTitleEl || !qTitleEl.value.trim()) return;
            var qData = getQuestData();
            var editIdx = document.getElementById('quest-edit-idx');
            var questObj = {
                title: qTitleEl.value.trim(),
                desc: (document.getElementById('quest-desc') || {}).value || '',
                giver: (document.getElementById('quest-giver') || {}).value || '',
                reward: (document.getElementById('quest-reward') || {}).value || '',
                tags: (document.getElementById('quest-tags') || {}).value || '',
                id: 'q' + Date.now()
            };
            if (editIdx && editIdx.value !== '') {
                var ei = parseInt(editIdx.value);
                if (qData.active[ei]) {
                    questObj.id = qData.active[ei].id || questObj.id;
                    qData.active[ei] = questObj;
                }
            } else {
                qData.active.push(questObj);
            }
            localStorage.setItem('dw_quests', JSON.stringify(qData));
            if (typeof syncUpload === 'function') syncUpload('dw_quests');
            renderApp();
            return;
        }
        if (target.matches('[data-action="cancel-quest"]')) {
            var qForm = document.getElementById('quest-add-form');
            if (qForm) qForm.style.display = 'none';
            return;
        }
        var completeBtn = target.matches('[data-action="complete-quest"]') ? target : target.closest('[data-action="complete-quest"]');
        if (completeBtn) {
            var qIdx = parseInt(completeBtn.dataset.questIdx);
            var qData = getQuestData();
            if (qData.active[qIdx]) {
                qData.completed.push(qData.active[qIdx]);
                qData.active.splice(qIdx, 1);
                localStorage.setItem('dw_quests', JSON.stringify(qData));
                if (typeof syncUpload === 'function') syncUpload('dw_quests');
                renderApp();
            }
            return;
        }
        var uncompleteBtn = target.matches('[data-action="uncomplete-quest"]') ? target : target.closest('[data-action="uncomplete-quest"]');
        if (uncompleteBtn) {
            var qIdx = parseInt(uncompleteBtn.dataset.questIdx);
            var qData = getQuestData();
            if (qData.completed[qIdx]) {
                qData.active.push(qData.completed[qIdx]);
                qData.completed.splice(qIdx, 1);
                localStorage.setItem('dw_quests', JSON.stringify(qData));
                if (typeof syncUpload === 'function') syncUpload('dw_quests');
                renderApp();
            }
            return;
        }
        var deleteBtn = target.matches('[data-action="delete-quest"]') ? target : target.closest('[data-action="delete-quest"]');
        if (deleteBtn) {
            var qIdx = parseInt(deleteBtn.dataset.questIdx);
            var fromCompleted = deleteBtn.dataset.completed === '1';
            var qData = getQuestData();
            if (fromCompleted) {
                qData.completed.splice(qIdx, 1);
            } else {
                qData.active.splice(qIdx, 1);
            }
            localStorage.setItem('dw_quests', JSON.stringify(qData));
            if (typeof syncUpload === 'function') syncUpload('dw_quests');
            renderApp();
            return;
        }

        // --- Dashboard: campaign name & banner ---
        if (target.matches('[data-action="edit-campaign-name"]')) {
            var dd = getDashboardData();
            var newName = prompt('Campaign name:', dd.campaignName || '');
            if (newName !== null && newName.trim()) {
                dd.campaignName = newName.trim();
                saveDashboardData(dd);
                renderApp();
            }
            return;
        }

        // --- Timeline: chapter & event handlers ---
        // Select chapter (but not if clicking the edit button inside it)
        if (!target.matches('[data-action="edit-chapter"]') && (target.matches('[data-action="select-chapter"]') || target.closest('[data-action="select-chapter"]'))) {
            var btn = target.closest('[data-action="select-chapter"]') || target;
            activeChapter = parseInt(btn.dataset.chapter) || 0;
            renderApp();
            return;
        }

        // Add chapter
        if (target.matches('[data-action="add-chapter"]')) {
            var chName = prompt(t('timeline.chaptername'));
            if (chName && chName.trim()) {
                var tlData = getTimelineData();
                tlData.chapters.push({ id: 'ch' + Date.now(), name: chName.trim(), events: [] });
                saveTimelineData(tlData);
                activeChapter = tlData.chapters.length - 1;
                renderApp();
            }
            return;
        }

        // Add event (show form)
        if (target.matches('[data-action="add-event"]')) {
            var form = document.getElementById('event-add-form');
            if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
            return;
        }

        // Edit event (inline in the event box)
        if (target.matches('[data-action="edit-event"]')) {
            var evIdx = parseInt(target.dataset.event);
            var tlData = getTimelineData();
            var ch = tlData.chapters[activeChapter];
            if (ch && ch.events[evIdx]) {
                var ev = ch.events[evIdx];
                var eventEl = target.closest('.timeline-event');
                if (eventEl) {
                    var contentEl = eventEl.querySelector('.timeline-content');
                    if (contentEl) {
                        contentEl.innerHTML = renderEventForm(evIdx, ev);
                    }
                }
            }
            return;
        }

        // Pick event layout (in form)
        if (target.matches('[data-action="pick-event-layout"]') || target.closest('[data-action="pick-event-layout"]')) {
            var btn = target.matches('[data-action="pick-event-layout"]') ? target : target.closest('[data-action="pick-event-layout"]');
            var layout = btn.dataset.layout;
            var eIdx = parseInt(btn.dataset.eventIdx);
            // Update active state
            var allOpts = btn.parentElement.querySelectorAll('.event-layout-option');
            for (var oi = 0; oi < allOpts.length; oi++) allOpts[oi].classList.remove('active');
            btn.classList.add('active');
            // Show/hide image section
            var imgSection = btn.closest('.timeline-content, .timeline-add-form');
            if (imgSection) {
                var evImgSec = imgSection.querySelector('.event-image-section');
                if (evImgSec) evImgSec.style.display = layout === 'text' ? 'none' : 'block';
            }
            // If editing existing event, save layout immediately
            if (eIdx >= 0) {
                var tlData = getTimelineData();
                var ch = tlData.chapters[activeChapter];
                if (ch && ch.events[eIdx]) {
                    ch.events[eIdx].layout = layout;
                    saveTimelineData(tlData);
                }
            }
            return;
        }

        // Remove event image
        if (target.matches('[data-action="remove-event-image"]')) {
            var eIdx = parseInt(target.dataset.eventIdx);
            if (eIdx >= 0) {
                var tlData = getTimelineData();
                var ch = tlData.chapters[activeChapter];
                if (ch && ch.events[eIdx]) {
                    ch.events[eIdx].image = null;
                    saveTimelineData(tlData);
                    renderApp();
                }
            }
            return;
        }

        // Edit chapter name
        if (target.matches('[data-action="edit-chapter"]')) {
            var chIdx = parseInt(target.dataset.chapter);
            var tlData = getTimelineData();
            if (tlData.chapters[chIdx]) {
                var newName = prompt(t('timeline.newchaptername'), tlData.chapters[chIdx].name);
                if (newName && newName.trim()) {
                    tlData.chapters[chIdx].name = newName.trim();
                    saveTimelineData(tlData);
                    renderApp();
                }
            }
            return;
        }

        // Save event (supports inline edit + new event form)
        if (target.matches('[data-action="save-event"]')) {
            var editIdx = target.dataset.editIdx;
            var isEdit = editIdx !== undefined && editIdx !== '';
            var prefix = isEdit ? 'edit-' : '';

            // Find form fields — search in closest container first, then document
            var container = target.closest('.timeline-content') || target.closest('.timeline-add-form') || document;
            var titleEl = container.querySelector('#' + prefix + 'ev-title') || document.getElementById(prefix + 'ev-title');
            var descEl = container.querySelector('#' + prefix + 'ev-desc') || document.getElementById(prefix + 'ev-desc');
            var sessionEl = container.querySelector('#' + prefix + 'ev-session') || document.getElementById(prefix + 'ev-session');
            var typeEl = container.querySelector('#' + prefix + 'ev-type') || document.getElementById(prefix + 'ev-type');
            var layoutBtn = container.querySelector('.event-layout-option.active');

            if (titleEl && titleEl.value.trim()) {
                var tlData = getTimelineData();
                var layout = layoutBtn ? layoutBtn.dataset.layout : 'text';

                if (isEdit) {
                    var idx = parseInt(editIdx);
                    var ch = tlData.chapters[activeChapter];
                    if (ch && ch.events[idx]) {
                        ch.events[idx].title = titleEl.value.trim();
                        ch.events[idx].desc = descEl ? descEl.value.trim() : '';
                        ch.events[idx].session = sessionEl ? sessionEl.value.trim() : '';
                        ch.events[idx].type = typeEl ? typeEl.value : 'quest';
                        ch.events[idx].layout = layout;
                    }
                } else {
                    if (tlData.chapters[activeChapter]) {
                        tlData.chapters[activeChapter].events.push({
                            id: 'ev' + Date.now(),
                            title: titleEl.value.trim(),
                            desc: descEl ? descEl.value.trim() : '',
                            session: sessionEl ? sessionEl.value.trim() : '',
                            type: typeEl ? typeEl.value : 'quest',
                            layout: layout,
                            image: null
                        });
                    }
                }
                saveTimelineData(tlData);
                renderApp();
            }
            return;
        }

        // Cancel event
        if (target.matches('[data-action="cancel-event"]')) {
            var form = document.getElementById('event-add-form');
            if (form) form.style.display = 'none';
            return;
        }

        // Delete event
        if (target.matches('[data-action="delete-event"]')) {
            var evIdx = parseInt(target.dataset.event);
            var tlData = getTimelineData();
            if (tlData.chapters[activeChapter] && !isNaN(evIdx)) {
                tlData.chapters[activeChapter].events.splice(evIdx, 1);
                saveTimelineData(tlData);
                renderApp();
            }
            return;
        }

        // --- Maps: dimension, map, pin handlers ---
        // Dimension selection
        if (target.matches('[data-action="select-dimension"]')) {
            activeDimension = parseInt(target.dataset.dim) || 0;
            activeMapId = null;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Add dimension
        if (target.matches('[data-action="add-dimension"]')) {
            var dimName = prompt(t('maps.dimname'));
            if (dimName && dimName.trim()) {
                var mData = getMapsData();
                mData.dimensions.push({ id: 'dim' + Date.now(), name: dimName.trim(), maps: [{ id: 'map' + Date.now(), name: t('maps.mainmap'), image: null, isRoot: true, pins: [] }] });
                saveMapsData(mData);
                activeDimension = mData.dimensions.length - 1;
                renderApp();
            }
            return;
        }

        // Open map
        if (target.matches('[data-action="open-map"]') || target.closest('[data-action="open-map"]')) {
            var card = target.closest('[data-action="open-map"]') || target;
            activeMapId = card.dataset.mapId;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Map back to grid
        if (target.matches('[data-action="map-back"]')) {
            activeMapId = null;
            addingPin = false;
            window._mapHistory = [];
            renderApp();
            return;
        }

        // Map go back to previous map in history
        if (target.matches('[data-action="map-go-back"]')) {
            if (window._mapHistory && window._mapHistory.length > 0) {
                var prev = window._mapHistory.pop();
                activeDimension = prev.dim;
                activeMapId = prev.mapId;
                mapZoom = 1; mapPanX = 0; mapPanY = 0;
                renderApp();
            }
            return;
        }

        // Add map — vraag main/sub + (bij sub) parent
        if (target.matches('[data-action="add-map"]') || target.closest('[data-action="add-map"]')) {
            var mapName = prompt(t('maps.mapname'));
            if (!mapName || !mapName.trim()) return;
            var mData = getMapsData();
            var mDim = mData.dimensions[activeDimension];
            if (!mDim) return;
            // Main of sub?
            var mainList = (mDim.maps || []).filter(function(m) { return !m.parentMapId; });
            var asMain = true;
            var parentMapId = null;
            if (mainList.length > 0) {
                asMain = confirm('Main map (OK) of sub map (Cancel)?\n\n"OK" = main map, eigen rij in overzicht.\n"Cancel" = sub map, kies daarna welke main.');
                if (!asMain) {
                    var listTxt = mainList.map(function(m, idx) { return (idx + 1) + '. ' + m.name; }).join('\n');
                    var pick = prompt('Bij welke main map hoort "' + mapName.trim() + '"?\n\n' + listTxt + '\n\nVoer nummer in:');
                    var idx = parseInt(pick, 10);
                    if (isNaN(idx) || idx < 1 || idx > mainList.length) {
                        alert('Ongeldige keuze, kaart niet toegevoegd.');
                        return;
                    }
                    parentMapId = mainList[idx - 1].id;
                }
            }
            mDim.maps.push({
                id: 'map' + Date.now(),
                name: mapName.trim(),
                image: null,
                isRoot: false,
                parentMapId: parentMapId,
                pins: []
            });
            saveMapsData(mData);
            renderApp();
            return;
        }

        // Set map category
        if (target.matches('[data-action="set-map-category"]')) {
            e.stopPropagation();
            var catMapId = target.dataset.mapId;
            var mData = getMapsData();
            var mDim = mData.dimensions[activeDimension];
            if (mDim) {
                for (var mi = 0; mi < mDim.maps.length; mi++) {
                    if (mDim.maps[mi].id === catMapId) {
                        var curCat = mDim.maps[mi].category || '';
                        var newCat = prompt('Map category (empty to remove):', curCat);
                        if (newCat !== null) {
                            mDim.maps[mi].category = newCat.trim();
                            saveMapsData(mData);
                            renderApp();
                        }
                        break;
                    }
                }
            }
            return;
        }

        // Delete map
        if (target.matches('[data-action="delete-map"]')) {
            e.stopPropagation();
            var delMapId = target.dataset.mapId;
            if (confirm(t('maps.deletemap'))) {
                var mData = getMapsData();
                var mDim = mData.dimensions[activeDimension];
                if (mDim) {
                    mDim.maps = mDim.maps.filter(function(m) { return m.id !== delMapId; });
                    saveMapsData(mData);
                    renderApp();
                }
            }
            return;
        }

        // Goto linked map (pin click) — supports cross-dimension
        if (target.matches('[data-action="goto-map"]') || target.closest('[data-action="goto-map"]')) {
            var gotoEl = target.closest('[data-action="goto-map"]') || target;
            var targetDim = gotoEl.dataset.targetDim;
            if (targetDim !== undefined && targetDim !== null) {
                activeDimension = parseInt(targetDim, 10);
            }
            // Save history for back navigation
            if (!window._mapHistory) window._mapHistory = [];
            window._mapHistory.push({ mapId: activeMapId, dim: activeDimension });
            activeMapId = gotoEl.dataset.target;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Toggle pin-edit mode
        if (target.matches('[data-action="toggle-edit-pins"]') || target.closest('[data-action="toggle-edit-pins"]')) {
            editingPins = !editingPins;
            addingPin = false;
            renderApp();
            return;
        }

        // Rename map
        if (target.matches('[data-action="rename-map"]') || target.closest('[data-action="rename-map"]')) {
            var renBtn = target.closest('[data-action="rename-map"]') || target;
            var renMapId = renBtn.dataset.mapId;
            if (renMapId) {
                var mDataRen = getMapsData();
                var mDimRen = mDataRen.dimensions[activeDimension];
                if (mDimRen && mDimRen.maps) {
                    var curMap = mDimRen.maps.find(function(m){ return m.id === renMapId; });
                    var newName = prompt('New map name:', curMap ? curMap.name : '');
                    if (newName && newName.trim() && curMap) {
                        curMap.name = newName.trim();
                        saveMapsData(mDataRen);
                        renderApp();
                    }
                }
            }
            return;
        }

        // Delete map
        if (target.matches('[data-action="delete-map"]') || target.closest('[data-action="delete-map"]')) {
            var delBtn = target.closest('[data-action="delete-map"]') || target;
            var delMapId = delBtn.dataset.mapId;
            if (delMapId && confirm('Are you sure you want to delete this map? This cannot be undone.')) {
                var mDataDel = getMapsData();
                var mDimDel = mDataDel.dimensions[activeDimension];
                if (mDimDel && mDimDel.maps) {
                    mDimDel.maps = mDimDel.maps.filter(function(m){ return m.id !== delMapId; });
                    saveMapsData(mDataDel);
                    activeMapId = null;
                    window._mapHistory = [];
                    renderApp();
                }
            }
            return;
        }

        // Add pin mode
        if (target.matches('[data-action="add-pin"]')) {
            addingPin = true;
            renderApp();
            return;
        }

        if (target.matches('[data-action="cancel-add-pin"]')) {
            addingPin = false;
            renderApp();
            return;
        }

        // Click on map to place pin (when in addingPin mode)
        if (addingPin && (target.matches('.map-image') || target.matches('.map-canvas') || target.closest('.map-canvas'))) {
            var viewer = document.getElementById('map-viewer');
            var canvas = document.getElementById('map-canvas');
            if (viewer && canvas) {
                var iRect = (typeof _imageRenderedRect === 'function') ? _imageRenderedRect(canvas) : canvas.getBoundingClientRect();
                var pinX = Math.round(((e.clientX - iRect.left) / iRect.width) * 1000) / 10;
                var pinY = Math.round(((e.clientY - iRect.top)  / iRect.height) * 1000) / 10;

                // Show pin creation modal
                var mData = getMapsData();
                var allDims = mData.dimensions || [];
                var modalHtml = '<div class="modal-overlay" id="pin-modal">';
                modalHtml += '<div class="modal-box" style="max-width:400px;">';
                modalHtml += '<h3>&#128205; ' + t('maps.addpin.title') + '</h3>';
                modalHtml += '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem;">';
                modalHtml += '<input type="text" class="edit-input" id="pin-label-input" placeholder="' + t('maps.addpin.label') + '" autofocus>';
                modalHtml += '<label style="font-size:0.8rem;color:var(--text-dim);">' + t('maps.addpin.link') + '</label>';
                modalHtml += '<select class="edit-input" id="pin-link-select" style="padding:0.5rem;">';
                modalHtml += '<option value="">' + t('maps.addpin.nolink') + '</option>';
                for (var pdi = 0; pdi < allDims.length; pdi++) {
                    var pdMaps = allDims[pdi].maps || [];
                    for (var pdmi = 0; pdmi < pdMaps.length; pdmi++) {
                        if (pdMaps[pdmi].id === activeMapId) continue;
                        var dimLabel = allDims.length > 1 ? ' (' + allDims[pdi].name + ')' : '';
                        modalHtml += '<option value="' + pdMaps[pdmi].id + '">' + escapeHtml(pdMaps[pdmi].name) + dimLabel + '</option>';
                    }
                }
                modalHtml += '</select>';
                modalHtml += '</div>';
                modalHtml += '<div class="modal-actions" style="margin-top:1rem;">';
                modalHtml += '<button class="btn btn-primary" data-modal-action="save-pin">' + t('generic.save') + '</button>';
                modalHtml += '<button class="btn btn-ghost" data-modal-action="cancel-pin">' + t('generic.cancel') + '</button>';
                modalHtml += '</div>';
                modalHtml += '</div></div>';

                document.body.insertAdjacentHTML('beforeend', modalHtml);
                if (typeof lockBodyScroll === 'function') lockBodyScroll();
                var pinLabelInput = document.getElementById('pin-label-input');
                if (pinLabelInput) pinLabelInput.focus();

                var pinModal = document.getElementById('pin-modal');
                pinModal.addEventListener('click', function(me) {
                    var actionEl = me.target.closest('[data-modal-action]');
                    var action = actionEl ? actionEl.dataset.modalAction : null;
                    if (me.target === pinModal) action = 'cancel-pin';
                    if (!action) return;

                    if (action === 'save-pin') {
                        var labelEl = document.getElementById('pin-label-input');
                        var linkEl = document.getElementById('pin-link-select');
                        var label = labelEl ? labelEl.value.trim() : '';
                        // Empty label allowed: dot-only pin for locations already named on the map

                        var targetMapId = linkEl ? linkEl.value : null;
                        var mData2 = getMapsData();
                        var mDim2 = mData2.dimensions[activeDimension];
                        for (var cmi2 = 0; cmi2 < mDim2.maps.length; cmi2++) {
                            if (mDim2.maps[cmi2].id === activeMapId) {
                                if (!Array.isArray(mDim2.maps[cmi2].pins)) mDim2.maps[cmi2].pins = mDim2.maps[cmi2].pins ? Object.values(mDim2.maps[cmi2].pins) : [];
                                var newPin = {
                                    id: 'pin' + Date.now(),
                                    label: label,
                                    targetMap: targetMapId || null,
                                    shape: { kind: 'circle', cx: pinX, cy: pinY, r: 5, nodes: [] }
                                };
                                mDim2.maps[cmi2].pins.push(newPin);
                                break;
                            }
                        }
                        saveMapsData(mData2);
                        // Open edit-mode na plaatsen zodat user direct nodes kan toevoegen
                        editingPins = true;
                    }

                    pinModal.remove();
                    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
                    addingPin = false;
                    renderApp();
                });
            }
            return;
        }

        // Delete pin
        if (target.matches('[data-action="delete-pin"]') || target.closest('[data-action="delete-pin"]')) {
            e.stopPropagation();
            var dpBtn = target.closest('[data-action="delete-pin"]') || target;
            var delPinIdx = parseInt(dpBtn.dataset.pinIdx);
            if (!confirm('Verwijder deze pin?')) return;
            var mData = getMapsData();
            var mDim = mData.dimensions[activeDimension];
            for (var dmi = 0; dmi < mDim.maps.length; dmi++) {
                if (mDim.maps[dmi].id === activeMapId) {
                    mDim.maps[dmi].pins.splice(delPinIdx, 1);
                    saveMapsData(mData);
                    renderApp();
                    break;
                }
            }
            return;
        }

        // Edit pin label/link
        if (target.matches('[data-action="edit-pin-meta"]') || target.closest('[data-action="edit-pin-meta"]')) {
            e.stopPropagation();
            var epBtn = target.closest('[data-action="edit-pin-meta"]') || target;
            var epIdx = parseInt(epBtn.dataset.pinIdx);
            var epData = getMapsData();
            var epDim = epData.dimensions[activeDimension];
            var epMap = null;
            for (var epmi = 0; epmi < epDim.maps.length; epmi++) {
                if (epDim.maps[epmi].id === activeMapId) { epMap = epDim.maps[epmi]; break; }
            }
            if (!epMap || !epMap.pins[epIdx]) return;
            var epPin = epMap.pins[epIdx];

            var epModalHtml = '<div class="modal-overlay" id="pin-meta-modal">';
            epModalHtml += '<div class="modal-box" style="max-width:400px;">';
            epModalHtml += '<h3>Pin bewerken</h3>';
            epModalHtml += '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem;">';
            epModalHtml += '<input type="text" class="edit-input" id="pin-meta-label" placeholder="Label" value="' + escapeAttr(epPin.label || '') + '">';
            epModalHtml += '<label style="font-size:0.8rem;color:var(--text-dim);">Link naar map</label>';
            epModalHtml += '<select class="edit-input" id="pin-meta-link" style="padding:0.5rem;">';
            epModalHtml += '<option value="">' + t('maps.addpin.nolink') + '</option>';
            for (var epdi = 0; epdi < epData.dimensions.length; epdi++) {
                var epdMaps = epData.dimensions[epdi].maps || [];
                for (var epdmi = 0; epdmi < epdMaps.length; epdmi++) {
                    if (epdMaps[epdmi].id === activeMapId) continue;
                    var epDimLabel = epData.dimensions.length > 1 ? ' (' + epData.dimensions[epdi].name + ')' : '';
                    var selAttr = epdMaps[epdmi].id === epPin.targetMap ? ' selected' : '';
                    epModalHtml += '<option value="' + epdMaps[epdmi].id + '"' + selAttr + '>' + escapeHtml(epdMaps[epdmi].name) + epDimLabel + '</option>';
                }
            }
            epModalHtml += '</select>';
            epModalHtml += '</div>';
            epModalHtml += '<div class="modal-actions" style="margin-top:1rem;">';
            epModalHtml += '<button class="btn btn-primary" data-modal-action="save-pin-meta">' + t('generic.save') + '</button>';
            epModalHtml += '<button class="btn btn-ghost" data-modal-action="cancel-pin-meta">' + t('generic.cancel') + '</button>';
            epModalHtml += '</div>';
            epModalHtml += '</div></div>';

            document.body.insertAdjacentHTML('beforeend', epModalHtml);
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            var epModal = document.getElementById('pin-meta-modal');
            epModal.addEventListener('click', function(me) {
                var actionEl = me.target.closest('[data-modal-action]');
                var action = actionEl ? actionEl.dataset.modalAction : null;
                if (me.target === epModal) action = 'cancel-pin-meta';
                if (!action) return;
                if (action === 'save-pin-meta') {
                    var lblEl = document.getElementById('pin-meta-label');
                    var lnkEl = document.getElementById('pin-meta-link');
                    epPin.label = lblEl ? lblEl.value.trim() : '';
                    epPin.targetMap = lnkEl && lnkEl.value ? lnkEl.value : null;
                    saveMapsData(epData);
                }
                epModal.remove();
                if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
                renderApp();
            });
            return;
        }

        // --- Lore handlers ---
        // Save lore article
        if (target.matches('[data-action="save-lore"]')) {
            var lTitleEl = document.getElementById('lore-title');
            var lContentEl = document.getElementById('lore-content');
            if (lTitleEl && lTitleEl.value.trim()) {
                var loreData = getLoreData();
                var editId = target.dataset.editId;
                if (editId) {
                    for (var li = 0; li < loreData.articles.length; li++) {
                        if (loreData.articles[li].id === editId) {
                            loreData.articles[li].title = lTitleEl.value.trim();
                            loreData.articles[li].content = lContentEl ? lContentEl.value : '';
                            break;
                        }
                    }
                } else {
                    loreData.articles.push({
                        id: 'art' + Date.now(),
                        title: lTitleEl.value.trim(),
                        content: lContentEl ? lContentEl.value : '',
                        createdBy: currentUserId()
                    });
                }
                saveLoreData(loreData);
                navigate('/lore');
            }
            return;
        }

        // Delete lore article
        if (target.matches('[data-action="delete-lore"]')) {
            var artId = target.dataset.articleId;
            if (artId && confirm(t('lore.deletearticle'))) {
                var loreData = getLoreData();
                loreData.articles = loreData.articles.filter(function(a) { return a.id !== artId; });
                saveLoreData(loreData);
                navigate('/lore');
            }
            return;
        }
    };

    // ---- Change delegation ----
    app.onchange = function(e) {
        var target = e.target;

        // Campaign switch
        if (target.matches('[data-action="switch-campaign"]')) {
            setActiveCampaign(target.value);
            renderApp();
            return;
        }

        // Family source picker — auto-fill name from selected character/NPC
        if (target.matches('#fam-source')) {
            var nameEl = document.getElementById('fam-name');
            if (!nameEl) return;
            var val = target.value;
            if (val.indexOf('char:') === 0) {
                var cid = val.substring(5);
                var cfg = loadCharConfig(cid);
                if (cfg) nameEl.value = cfg.name;
            } else if (val.indexOf('npc:') === 0) {
                var nIdx = parseInt(val.substring(4));
                var nList = getNPCData().npcs || [];
                if (nList[nIdx]) nameEl.value = nList[nIdx].name;
            } else {
                nameEl.value = '';
            }
            return;
        }

        // Show custom NPC name when "custom" selected in initiative
        if (target.matches('#init-char')) {
            var customField = document.getElementById('init-custom-name');
            if (customField) customField.style.display = target.value === 'custom' ? 'block' : 'none';
            return;
        }

        // Dashboard banner upload
        if (target.matches('[data-action="upload-dash-banner"]')) {
            if (isDM() && target.files && target.files[0]) {
                var dbReader = new FileReader();
                dbReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxW = 1400;
                        var scale = Math.min(1, maxW / img.width);
                        cvs.width = img.width * scale;
                        cvs.height = img.height * scale;
                        cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
                        var dd = getDashboardData();
                        dd.bannerImage = cvs.toDataURL('image/jpeg', 0.8);
                        saveDashboardData(dd);
                        renderApp();
                    };
                    img.src = ev.target.result;
                };
                dbReader.readAsDataURL(target.files[0]);
            }
            return;
        }

        // Timeline event image upload
        if (target.matches('[data-action="upload-event-image"]')) {
            var evIdx = parseInt(target.dataset.eventIdx);
            if (isDM() && target.files && target.files[0] && !isNaN(evIdx)) {
                var evReader = new FileReader();
                evReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxW = 1200;
                        var scale = Math.min(1, maxW / img.width);
                        cvs.width = img.width * scale;
                        cvs.height = img.height * scale;
                        cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
                        var tlData = getTimelineData();
                        var ch = tlData.chapters[activeChapter];
                        if (ch && ch.events[evIdx]) {
                            ch.events[evIdx].image = cvs.toDataURL('image/jpeg', 0.8);
                            saveTimelineData(tlData);
                            renderApp();
                        }
                    };
                    img.src = ev.target.result;
                };
                evReader.readAsDataURL(target.files[0]);
            }
            return;
        }

        // Map image upload (new maps system)
        if (target.matches('[data-action="update-map-image"]')) {
            var mapFile = target.files && target.files[0];
            var mapId = target.dataset.mapId;
            if (mapFile && mapId) {
                var mapReader = new FileReader();
                mapReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxSize = 1200;
                        var w = img.width, h = img.height;
                        if (w > maxSize || h > maxSize) {
                            if (w > h) { h = h * (maxSize / w); w = maxSize; }
                            else { w = w * (maxSize / h); h = maxSize; }
                        }
                        cvs.width = w;
                        cvs.height = h;
                        cvs.getContext('2d').drawImage(img, 0, 0, w, h);
                        var base64 = cvs.toDataURL('image/jpeg', 0.7);

                        var mData = getMapsData();
                        var mDim = mData.dimensions[activeDimension];
                        for (var mi = 0; mi < mDim.maps.length; mi++) {
                            if (mDim.maps[mi].id === mapId) {
                                mDim.maps[mi].image = base64;
                                break;
                            }
                        }
                        try {
                            saveMapsData(mData);
                        } catch (err) {
                            showWarning(t('maps.imagetoolarge'));
                        }
                        renderApp();
                    };
                    img.src = ev.target.result;
                };
                mapReader.readAsDataURL(mapFile);
            }
            target.value = '';
            return;
        }

        // Note image upload
        if (e.target.matches('[data-action="upload-note-image"]')) {
            var noteFile = e.target.files && e.target.files[0];
            if (noteFile) {
                var noteReader = new FileReader();
                noteReader.onload = function(ev) {
                    var nimg = new Image();
                    nimg.onload = function() {
                        var canvas = document.createElement('canvas');
                        var nmax = 800;
                        var nw = nimg.width, nh = nimg.height;
                        if (nw > nmax || nh > nmax) { if (nw > nh) { nh = nh * (nmax / nw); nw = nmax; } else { nw = nw * (nmax / nh); nh = nmax; } }
                        canvas.width = nw; canvas.height = nh;
                        canvas.getContext('2d').drawImage(nimg, 0, 0, nw, nh);
                        var noteBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        var noteSection = document.querySelector('.note-image-section');
                        if (noteSection) {
                            noteSection.innerHTML = '<div class="note-image-preview"><img src="' + noteBase64 + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">' + t('generic.delete') + '</button></div>';
                        }
                    };
                    nimg.src = ev.target.result;
                };
                noteReader.readAsDataURL(noteFile);
            }
            e.target.value = '';
            return;
        }

        // Gallery multi-image upload
        if (e.target.matches('[data-action="upload-gallery-image"]')) {
            var galleryFiles = e.target.files;
            if (galleryFiles && galleryFiles.length > 0) {
                for (var gfi = 0; gfi < galleryFiles.length; gfi++) {
                    (function(file) {
                        var gr = new FileReader();
                        gr.onload = function(ev) {
                            var gimg = new Image();
                            gimg.onload = function() {
                                var gc = document.createElement('canvas');
                                var gmax = 800;
                                var gw = gimg.width, gh = gimg.height;
                                if (gw > gmax || gh > gmax) { if (gw > gh) { gh = gh * (gmax / gw); gw = gmax; } else { gw = gw * (gmax / gh); gh = gmax; } }
                                gc.width = gw; gc.height = gh;
                                gc.getContext('2d').drawImage(gimg, 0, 0, gw, gh);
                                var gBase64 = gc.toDataURL('image/jpeg', 0.7);
                                var grid = document.getElementById('note-gallery-grid');
                                if (grid) {
                                    var addBtn = grid.querySelector('.note-gallery-add');
                                    var idx = grid.querySelectorAll('.note-gallery-thumb').length;
                                    var thumbHtml = '<div class="note-gallery-thumb" data-gallery-idx="' + idx + '"><img src="' + gBase64 + '" alt=""><button class="note-gallery-remove" data-action="remove-gallery-image" data-idx="' + idx + '">&times;</button></div>';
                                    if (addBtn) addBtn.insertAdjacentHTML('beforebegin', thumbHtml);
                                }
                            };
                            gimg.src = ev.target.result;
                        };
                        gr.readAsDataURL(file);
                    })(galleryFiles[gfi]);
                }
            }
            e.target.value = '';
            return;
        }
    };

    // ---- Input delegation ----
    app.oninput = function(e) {
        var target = e.target;

        if (target.matches('input[data-action="famdiag-zoom-slider"]')) {
            var zfid = target.dataset.familyId;
            var zwrap = document.querySelector('.famdiag-wrap[data-family-id="' + zfid + '"]');
            var zscroll = zwrap ? zwrap.querySelector('.famdiag-canvas-scroll') : null;
            if (zscroll) {
                var zval = parseFloat(target.value) || 1;
                zscroll.style.setProperty('--famdiag-scale', zval.toFixed(3));
                var zpct = document.getElementById('famdiag-zoom-pct-' + zfid);
                if (zpct) zpct.textContent = Math.round(zval * 100) + '%';
            }
            return;
        }

        // NPC search
        if (target.matches('#npc-search')) {
            npcSearchQuery = target.value;
            // Debounced re-render
            clearTimeout(target._searchTimer);
            target._searchTimer = setTimeout(function() {
                var cursorPos = target.selectionStart;
                renderApp();
                var el = document.getElementById('npc-search');
                if (el) { el.focus(); el.setSelectionRange(cursorPos, cursorPos); }
            }, 200);
            return;
        }

        // Family search
        if (target.matches('#famdiag-search-input')) {
            familiesSearchQuery = target.value;
            clearTimeout(target._searchTimer);
            target._searchTimer = setTimeout(function() {
                var cursorPos = target.selectionStart;
                renderApp();
                var el = document.getElementById('famdiag-search-input');
                if (el) { el.focus(); el.setSelectionRange(cursorPos, cursorPos); }
            }, 200);
            return;
        }

        // Notes search
        if (target.matches('[data-action="search-notes"]') || target.matches('.notes-search-input')) {
            notesSearch = target.value;
            var caret = target.selectionStart;
            clearTimeout(window._notesSearchTimer);
            window._notesSearchTimer = setTimeout(function() {
                renderApp();
                var input = document.querySelector('.notes-search-input');
                if (input) { input.focus(); try { input.setSelectionRange(caret, caret); } catch(e){} }
            }, 250);
        }

        // Session number (DM) - no longer uses input
    };

    // ---- Keydown for login Enter key ----
    app.onkeydown = function(e) {
        if (e.key === 'Enter' && e.target.matches('.login-input')) {
            var submitBtn = document.querySelector('[data-action="login-submit"]');
            if (submitBtn) submitBtn.click();
        }
    };

    // Character-page hover/tooltip handlers removed with the dashboard nuke.
    // Generic tooltip popup helpers (showTooltipPopup/removeTooltipPopup) stay
    // in ui-world.js for other systems (maps, world pages).
}

// ============================================================
// Section 31: Mobile Touch Support
// ============================================================

var isTouchDevice = false;

function detectTouch() {
    isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia('(pointer: coarse)').matches);
}

function lockBodyScroll() {
    var scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.dataset.scrollY = scrollY;
    document.body.style.top = '-' + scrollY + 'px';
}

function unlockBodyScroll() {
    document.body.classList.remove('modal-open');
    var scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
}

function initMobileSupport() {
    detectTouch();

    if (!isTouchDevice) return;

    // -- Tap-to-dismiss tooltips: tap anywhere outside closes tooltip --
    document.addEventListener('touchstart', function(e) {
        var tooltip = document.querySelector('.tooltip-popup');
        if (tooltip && !tooltip.contains(e.target)) {
            removeTooltipPopup();
        }
    }, { passive: true });

    // -- Close mobile nav on outside tap --
    document.addEventListener('touchstart', function(e) {
        var navLinks = document.querySelector('.nav-links.open');
        if (!navLinks) return;
        var navToggle = e.target.closest('[data-action="toggle-nav"]');
        if (!navToggle && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
        }
    }, { passive: true });
}

// Touch tooltip patch was character-page-only; no-op stub kept because
// app.js calls patchTooltipEvents() at boot.
function patchTooltipEvents() { /* no-op since character-page nuke */ }

