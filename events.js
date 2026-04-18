// D&D Within — Event Handling (click delegation, image upload, mobile support)
// Requires: core.js, all ui-*.js files

// ============================================================
// Section 29: Image Upload Helpers
// ============================================================

function handleImageUpload(file, charId, type, maxSize) {
    if (!file) return;
    maxSize = maxSize || 500000; // 500KB default

    var reader = new FileReader();
    reader.onload = function(e) {
        var result = e.target.result;

        // Compress if needed using canvas
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxDim = type === 'banner' ? 1600 : 600;
            var quality = type === 'banner' ? 0.85 : 0.9;
            var w = img.width;
            var h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round(h * maxDim / w);
                    w = maxDim;
                } else {
                    w = Math.round(w * maxDim / h);
                    h = maxDim;
                }
            }
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var compressed = canvas.toDataURL('image/jpeg', quality);
            try {
                saveImage(charId, type, compressed);
                renderApp();
            } catch (err) {
                showWarning(t('warn.imagetoolarge'));
            }
        };
        img.src = result;
    };
    reader.readAsDataURL(file);
}

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
            var npcCard = target.closest('.npc-card');
            if (!npcCard) return;
            var npcIdx = -1;
            var npcCards = document.querySelectorAll('.npc-card');
            for (var nc = 0; nc < npcCards.length; nc++) {
                if (npcCards[nc] === npcCard) { npcIdx = nc; break; }
            }
            if (npcIdx < 0) return;
            var famIdx = parseInt(target.dataset.idx);
            if (isNaN(famIdx)) return;
            var npcData = getNPCData();
            var fam = (npcData.npcs[npcIdx].family || []).slice();
            fam.splice(famIdx, 1);
            npcData.npcs[npcIdx].family = fam;
            saveNPCData(npcData);
            renderApp();
            return;
        }

        // --- Home: enter campaign ---
        if (target.matches('[data-action="enter-campaign"]') || target.closest('[data-action="enter-campaign"]')) {
            var card = target.matches('[data-action="enter-campaign"]') ? target : target.closest('[data-action="enter-campaign"]');
            setActiveCampaign(card.dataset.campaignId);
            navigate('/dashboard');
            return;
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

        // --- Families: person toggle ---
        if (target.matches('[data-action="toggle-family-person"]') || target.closest('[data-action="toggle-family-person"]')) {
            var personCard = target.closest('[data-person-id]');
            if (personCard) {
                var pid = personCard.dataset.personId;
                familiesExpandedId = familiesExpandedId === pid ? null : pid;
                renderApp();
            }
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
                        if (!tgCat) tgCat = TAG_CATEGORIES[5];
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
                        if (!tgCat) tgCat = TAG_CATEGORIES[5];
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

        // --- Character Sheet Events ---
        if (charId && config && state) {
            // Tab switching
            if (target.matches('.tab-btn')) {
                activeTab = target.dataset.tab || 'overview';
                // Update URL for deep linking without triggering hashchange
                var newHash = '#/characters/' + charId + '/' + activeTab;
                history.replaceState(null, '', newHash);
                renderApp();
                return;
            }

            // Options dropdown toggle
            if (target.matches('[data-action="toggle-options"]') || target.closest('[data-action="toggle-options"]')) {
                var dropdown = document.getElementById('options-dropdown');
                if (dropdown) dropdown.classList.toggle('open');
                return;
            }

            // Close dropdown when clicking elsewhere
            if (!target.closest('.header-actions')) {
                var dropdown2 = document.getElementById('options-dropdown');
                if (dropdown2) dropdown2.classList.remove('open');
            }

            // Level up
            if (target.matches('[data-action="level-up"]')) {
                if (state.level < 20 && canEdit(charId)) {
                    showLevelUpModal(charId, config, state);
                }
                return;
            }

            // Level down
            if (target.matches('[data-action="level-down"]')) {
                if (state.level > 1 && canEdit(charId)) {
                    cleanupLevelDown(config, state);
                    state.level--;
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // Add XP
            if (target.matches('[data-action="add-xp"]')) {
                if (!canEdit(charId)) return;
                var xpInput = document.getElementById('xp-add-input');
                var xpAmt = xpInput ? parseInt(xpInput.value) || 0 : 0;
                if (xpAmt > 0) {
                    state.xp = (state.xp || 0) + xpAmt;
                    saveCharState(charId, state);
                    showToast('+' + xpAmt + ' XP');
                    renderApp();
                }
                return;
            }

            // Remove XP
            if (target.matches('[data-action="remove-xp"]')) {
                if (!canEdit(charId)) return;
                var xpInput = document.getElementById('xp-add-input');
                var xpAmt = xpInput ? parseInt(xpInput.value) || 0 : 0;
                if (xpAmt > 0) {
                    state.xp = Math.max(0, (state.xp || 0) - xpAmt);
                    saveCharState(charId, state);
                    showToast('-' + xpAmt + ' XP', 'warning');
                    renderApp();
                }
                return;
            }

            // Refresh quote
            if (target.matches('[data-action="refresh-quote"]') || target.closest('[data-action="refresh-quote"]')) {
                var quoteEl = app.querySelector('.char-quote-dynamic');
                if (quoteEl && config.quotes && config.quotes.length > 0) {
                    var newQuote = config.quotes[Math.floor(Math.random() * config.quotes.length)];
                    quoteEl.innerHTML = '&ldquo;' + escapeHtml(newQuote) + '&rdquo;';
                }
                return;
            }

            // ---- Inline Editing Handlers ----

            // Edit name
            if (target.matches('[data-action="edit-name"]') || target.closest('[data-action="edit-name"]')) {
                if (!canEdit(charId)) return;
                var nameWrap = app.querySelector('.char-name-wrap');
                if (nameWrap && !nameWrap.querySelector('.edit-input')) {
                    var nameDisplay = nameWrap.querySelector('.char-name-display');
                    var curName = config.name || '';
                    nameDisplay.style.display = 'none';
                    var editBtn = nameWrap.querySelector('[data-action="edit-name"]');
                    if (editBtn) editBtn.style.display = 'none';
                    var nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.className = 'edit-input edit-name-input';
                    nameInput.value = curName;
                    var saveBtn = document.createElement('button');
                    saveBtn.className = 'edit-save';
                    saveBtn.setAttribute('data-action', 'save-name');
                    saveBtn.textContent = t('generic.save');
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'edit-cancel';
                    cancelBtn.setAttribute('data-action', 'cancel-edit');
                    cancelBtn.textContent = t('generic.cancel');
                    var actionsDiv = document.createElement('div');
                    actionsDiv.className = 'edit-actions';
                    actionsDiv.appendChild(saveBtn);
                    actionsDiv.appendChild(cancelBtn);
                    nameWrap.insertBefore(nameInput, nameDisplay.nextSibling);
                    nameWrap.insertBefore(actionsDiv, nameInput.nextSibling);
                    nameInput.focus();
                    nameInput.select();
                }
                return;
            }

            // Save name
            if (target.matches('[data-action="save-name"]') || target.closest('[data-action="save-name"]')) {
                if (!canEdit(charId)) return;
                var nameInputEl = app.querySelector('.edit-name-input');
                if (nameInputEl) {
                    var newName = nameInputEl.value.trim();
                    if (newName) {
                        saveCharConfigField(charId, 'name', newName);
                        config = loadCharConfig(charId);
                    }
                }
                renderApp();
                return;
            }

            // Color picker toggle
            if (target.matches('[data-action="pick-color"]') || target.closest('[data-action="pick-color"]')) {
                var popup = app.querySelector('.color-picker-popup');
                if (popup) {
                    popup.style.display = popup.style.display === 'none' ? 'grid' : 'none';
                }
                return;
            }

            // Select color
            if (target.matches('[data-action="select-color"]') || target.closest('[data-action="select-color"]')) {
                var colorBtn = target.matches('[data-action="select-color"]') ? target : target.closest('[data-action="select-color"]');
                var newColor = colorBtn.dataset.color;
                if (newColor && canEdit(charId)) {
                    saveCharConfigField(charId, 'accentColor', newColor);
                    document.documentElement.style.setProperty('--accent', newColor);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Edit info-grid field (race, class, subclass, background, alignment, age)
            if (target.matches('[data-action="edit-info"]') || target.closest('[data-action="edit-info"]')) {
                if (!canEdit(charId)) return;
                var infoBtn = target.matches('[data-action="edit-info"]') ? target : target.closest('[data-action="edit-info"]');
                var infoField = infoBtn.dataset.infoField;
                var infoItem = infoBtn.closest('.info-item');
                var valueDisplay = infoItem ? infoItem.querySelector('.info-value-display') : null;
                if (!infoItem || !valueDisplay || infoItem.querySelector('.info-edit-select, .info-edit-input')) return;

                infoBtn.style.display = 'none';
                valueDisplay.style.display = 'none';

                if (infoField === 'age') {
                    var ageInput = document.createElement('input');
                    ageInput.type = 'number';
                    ageInput.className = 'edit-input info-edit-input';
                    ageInput.value = config.age || '';
                    ageInput.min = '1';
                    ageInput.setAttribute('data-info-field', 'age');
                    infoItem.appendChild(ageInput);
                    ageInput.focus();
                    ageInput.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            var newAge = parseInt(ageInput.value) || null;
                            saveCharConfigField(charId, 'age', newAge);
                            renderApp();
                        } else if (e.key === 'Escape') {
                            renderApp();
                        }
                    });
                    ageInput.addEventListener('blur', function() {
                        var newAge = parseInt(ageInput.value) || null;
                        if (newAge !== (config.age || null)) {
                            saveCharConfigField(charId, 'age', newAge);
                        }
                        renderApp();
                    });
                } else {
                    var options = getInfoFieldOptions(infoField, config);
                    var currentVal = infoField === 'background' ? (config.background || '') : (config[infoField] || '');
                    var sel = document.createElement('select');
                    sel.className = 'edit-input info-edit-select';
                    sel.setAttribute('data-info-field', infoField);
                    if (infoField === 'subclass') {
                        var emptyOpt = document.createElement('option');
                        emptyOpt.value = '';
                        emptyOpt.textContent = t('generic.select');
                        sel.appendChild(emptyOpt);
                    }
                    for (var oi = 0; oi < options.length; oi++) {
                        var opt = document.createElement('option');
                        opt.value = options[oi].value;
                        opt.textContent = options[oi].label;
                        if (options[oi].value === currentVal) opt.selected = true;
                        sel.appendChild(opt);
                    }
                    infoItem.appendChild(sel);
                    sel.focus();
                    sel.addEventListener('change', function() {
                        var newVal = sel.value;
                        if (infoField === 'className') {
                            saveCharConfigField(charId, 'className', newVal);
                            saveCharConfigField(charId, 'subclass', '');
                        } else {
                            saveCharConfigField(charId, infoField, newVal);
                        }
                        renderApp();
                    });
                    sel.addEventListener('blur', function() {
                        renderApp();
                    });
                }
                return;
            }

            // Add weapon
            if (target.matches('[data-action="add-weapon"]')) {
                if (!canEdit(charId)) return;
                var wForm = app.querySelector('.weapon-add-form');
                if (wForm) {
                    wForm.style.display = wForm.style.display === 'none' ? 'flex' : 'none';
                    if (wForm.style.display !== 'none') {
                        var wNameInput = wForm.querySelector('.weapon-name-input');
                        if (wNameInput) wNameInput.focus();
                    }
                }
                return;
            }

            // Confirm weapon
            if (target.matches('[data-action="confirm-weapon"]')) {
                if (!canEdit(charId)) return;
                var wFormEl = app.querySelector('.weapon-add-form');
                if (wFormEl) {
                    var wName = (wFormEl.querySelector('.weapon-name-input') || {}).value || '';
                    var wDmg = (wFormEl.querySelector('.weapon-dmg-input') || {}).value || '1d4';
                    var wType = (wFormEl.querySelector('.weapon-type-input') || {}).value || 'slashing';
                    var wFinesse = !!(wFormEl.querySelector('.weapon-finesse-input') || {}).checked;
                    wName = wName.trim();
                    if (wName) {
                        if (!config.weapons) config.weapons = [];
                        config.weapons.push({ name: wName, dmg: wDmg, type: wType, finesse: wFinesse });
                        saveCharConfig(charId, config);
                        renderApp();
                    }
                }
                return;
            }

            // Cancel weapon
            if (target.matches('[data-action="cancel-weapon"]')) {
                var wFormEl2 = app.querySelector('.weapon-add-form');
                if (wFormEl2) wFormEl2.style.display = 'none';
                return;
            }

            // Delete weapon
            if (target.matches('[data-action="delete-weapon"]')) {
                if (!canEdit(charId)) return;
                var wIdx = parseInt(target.dataset.weaponIdx);
                if (!isNaN(wIdx) && config.weapons && config.weapons[wIdx] !== undefined) {
                    config.weapons.splice(wIdx, 1);
                    saveCharConfig(charId, config);
                    renderApp();
                }
                return;
            }

            // Edit field (generic)
            if (target.matches('[data-action="edit-field"]') || target.closest('[data-action="edit-field"]')) {
                if (!canEdit(charId)) return;
                var editTrigger = target.matches('[data-action="edit-field"]') ? target : target.closest('[data-action="edit-field"]');
                var fieldName = editTrigger.dataset.field;
                var fieldWrap = editTrigger.closest('.editable-field');
                if (!fieldWrap || fieldWrap.querySelector('.edit-textarea')) return;

                var displayEl = fieldWrap.querySelector('.field-display');
                var currentVal = '';
                if (fieldName.indexOf('appearance') === 0) {
                    var appIdx = parseInt(fieldName.replace('appearance', ''));
                    currentVal = (config.appearance && config.appearance[appIdx]) ? config.appearance[appIdx] : '';
                } else if (fieldName.indexOf('personality.') === 0) {
                    var pKey = fieldName.replace('personality.', '');
                    currentVal = (config.personality && config.personality[pKey]) ? config.personality[pKey] : '';
                } else if (fieldName === 'backstory') {
                    currentVal = config.backstory || '';
                }

                displayEl.style.display = 'none';
                editTrigger.style.display = 'none';

                var textarea = document.createElement('textarea');
                textarea.className = 'edit-textarea';
                textarea.value = currentVal;
                textarea.setAttribute('data-field', fieldName);

                var actions = document.createElement('div');
                actions.className = 'edit-actions';
                var sSaveBtn = document.createElement('button');
                sSaveBtn.className = 'edit-save';
                sSaveBtn.setAttribute('data-action', 'save-field');
                sSaveBtn.setAttribute('data-field', fieldName);
                sSaveBtn.textContent = t('generic.save');
                var sCancelBtn = document.createElement('button');
                sCancelBtn.className = 'edit-cancel';
                sCancelBtn.setAttribute('data-action', 'cancel-edit');
                sCancelBtn.textContent = t('generic.cancel');
                actions.appendChild(sSaveBtn);
                actions.appendChild(sCancelBtn);

                fieldWrap.appendChild(textarea);
                fieldWrap.appendChild(actions);
                textarea.focus();
                return;
            }

            // Save field (generic)
            if (target.matches('[data-action="save-field"]') || target.closest('[data-action="save-field"]')) {
                if (!canEdit(charId)) return;
                var saveFieldBtn = target.matches('[data-action="save-field"]') ? target : target.closest('[data-action="save-field"]');
                var saveFieldName = saveFieldBtn.dataset.field;
                var saveFieldWrap = saveFieldBtn.closest('.editable-field');
                var textareaEl = saveFieldWrap ? saveFieldWrap.querySelector('.edit-textarea') : null;
                if (!textareaEl) return;
                var newVal = textareaEl.value.trim();

                if (saveFieldName.indexOf('appearance') === 0) {
                    var aIdx = parseInt(saveFieldName.replace('appearance', ''));
                    var curAppearance = (config.appearance || []).slice();
                    while (curAppearance.length <= aIdx) curAppearance.push('');
                    curAppearance[aIdx] = newVal;
                    saveCharConfigField(charId, 'appearance', curAppearance);
                } else if (saveFieldName.indexOf('personality.') === 0) {
                    var ppKey = saveFieldName.replace('personality.', '');
                    var curPersonality = config.personality ? Object.assign({}, config.personality) : {};
                    curPersonality[ppKey] = newVal;
                    saveCharConfigField(charId, 'personality', curPersonality);
                } else if (saveFieldName === 'backstory') {
                    saveCharConfigField(charId, 'backstory', newVal);
                }

                config = loadCharConfig(charId);
                renderApp();
                return;
            }

            // Cancel edit (generic)
            if (target.matches('[data-action="cancel-edit"]') || target.closest('[data-action="cancel-edit"]')) {
                renderApp();
                return;
            }

            // Add appearance entry
            if (target.matches('[data-action="add-appearance"]')) {
                if (!canEdit(charId)) return;
                var curAppear = (config.appearance || []).slice();
                curAppear.push('');
                saveCharConfigField(charId, 'appearance', curAppear);
                renderApp();
                return;
            }

            // Remove appearance entry
            if (target.matches('[data-action="remove-appearance"]')) {
                if (!canEdit(charId)) return;
                var removeIdx = parseInt(target.dataset.appearIdx);
                if (!isNaN(removeIdx)) {
                    var curAppear2 = (config.appearance || []).slice();
                    curAppear2.splice(removeIdx, 1);
                    saveCharConfigField(charId, 'appearance', curAppear2);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Add quote
            if (target.matches('[data-action="add-quote"]') || target.closest('[data-action="add-quote"]')) {
                if (!canEdit(charId)) return;
                var quoteInput = app.querySelector('.quote-add-input');
                if (quoteInput) {
                    var quoteVal = quoteInput.value.trim();
                    if (quoteVal) {
                        var curQuotes = (config.quotes || []).slice();
                        curQuotes.push(quoteVal);
                        saveCharConfigField(charId, 'quotes', curQuotes);
                        config = loadCharConfig(charId);
                        renderApp();
                    }
                }
                return;
            }

            // Remove quote
            if (target.matches('[data-action="remove-quote"]') || target.closest('[data-action="remove-quote"]')) {
                if (!canEdit(charId)) return;
                var removeBtn = target.matches('[data-action="remove-quote"]') ? target : target.closest('[data-action="remove-quote"]');
                var qIdx = parseInt(removeBtn.dataset.quoteIdx);
                if (!isNaN(qIdx)) {
                    var curQ = (config.quotes || []).slice();
                    curQ.splice(qIdx, 1);
                    saveCharConfigField(charId, 'quotes', curQ);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Add timeline entry
            if (target.matches('[data-action="add-timeline-entry"]')) {
                if (!canEdit(charId)) return;
                var ctAge = document.getElementById('ct-age');
                var ctEvent = document.getElementById('ct-event');
                if (ctAge && ctEvent && ctEvent.value.trim()) {
                    var tl = (config.charTimeline || []).slice();
                    tl.push({ age: ctAge.value.trim(), event: ctEvent.value.trim() });
                    saveCharConfigField(charId, 'charTimeline', tl);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Remove timeline entry
            if (target.matches('[data-action="remove-timeline-entry"]')) {
                if (!canEdit(charId)) return;
                var ctIdx = parseInt(target.dataset.idx);
                if (!isNaN(ctIdx)) {
                    var tl = (config.charTimeline || []).slice();
                    tl.splice(ctIdx, 1);
                    saveCharConfigField(charId, 'charTimeline', tl);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Show family add form for specific tier
            if (target.matches('[data-action="add-family"]') || target.closest('[data-action="add-family"]')) {
                var btn = target.matches('[data-action="add-family"]') ? target : target.closest('[data-action="add-family"]');
                if (!canEdit(charId)) return;
                var form = document.getElementById('ftree-add-form');
                var tierInput = document.getElementById('fam-tier');
                if (form && tierInput) {
                    tierInput.value = btn.dataset.tier || 'sibling';
                    form.style.display = form.style.display === 'none' ? 'block' : 'none';
                    // Reset form
                    var nameEl = document.getElementById('fam-name');
                    if (nameEl) nameEl.value = '';
                    var relEl = document.getElementById('fam-relation');
                    if (relEl) relEl.value = '';
                    var notesEl = document.getElementById('fam-notes');
                    if (notesEl) notesEl.value = '';
                }
                return;
            }

            // Save family member from form
            if (target.matches('[data-action="save-family"]')) {
                if (!canEdit(charId)) return;
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
                // Auto-fill from character or NPC source
                if (source.indexOf('char:') === 0) {
                    var srcCharId = source.substring(5);
                    var srcCfg = loadCharConfig(srcCharId);
                    if (srcCfg) {
                        if (!entry.name) entry.name = srcCfg.name;
                        entry.linkedChar = srcCharId;
                    }
                } else if (source.indexOf('npc:') === 0) {
                    var srcNpcIdx = parseInt(source.substring(4));
                    var npcList = getNPCData().npcs || [];
                    if (npcList[srcNpcIdx]) {
                        if (!entry.name) entry.name = npcList[srcNpcIdx].name;
                        entry.linkedNpc = srcNpcIdx;
                    }
                }
                if (!entry.name) return;
                var fam = (config.family || []).slice();
                fam.push(entry);
                saveCharConfigField(charId, 'family', fam);
                config = loadCharConfig(charId);
                renderApp();
                return;
            }

            // Cancel family add
            if (target.matches('[data-action="cancel-family"]')) {
                var form = document.getElementById('ftree-add-form');
                if (form) form.style.display = 'none';
                return;
            }

            // Remove family member
            if (target.matches('[data-action="remove-family"]')) {
                if (!canEdit(charId)) return;
                var famIdx = parseInt(target.dataset.idx);
                if (!isNaN(famIdx)) {
                    var fam = (config.family || []).slice();
                    fam.splice(famIdx, 1);
                    saveCharConfigField(charId, 'family', fam);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Export
            if (target.matches('[data-action="export-char"]') || target.closest('[data-action="export-char"]')) {
                exportCharacter(charId, state);
                return;
            }

            // Delete character
            if (target.matches('[data-action="delete-char"]') || target.closest('[data-action="delete-char"]')) {
                if (confirm('Are you sure you want to delete this character? This cannot be undone.')) {
                    fetch('https://dnd-within-firebase-default-rtdb.firebaseio.com/dw/characters/' + charId + '.json', { method: 'DELETE' })
                        .then(function() { location.hash = '#/home'; location.reload(); });
                }
                return;
            }

            // Reset
            if (target.matches('[data-action="reset-char"]') || target.closest('[data-action="reset-char"]')) {
                showResetModal(charId, config, state);
                return;
            }

            // Ability edit mode toggle
            if (target.matches('[data-action="ability-edit"]') || target.closest('[data-action="ability-edit"]')) {
                abilityEditMode = true;
                editAbilities = null;
                renderApp();
                return;
            }

            // Ability adjustment in edit mode
            if (target.matches('.ability-adj')) {
                var ab = target.dataset.ab;
                var dir = target.dataset.dir;
                if (editAbilities && ab) {
                    if (dir === 'up' && editAbilities[ab] < 30) {
                        editAbilities[ab]++;
                    } else if (dir === 'down' && editAbilities[ab] > 1) {
                        editAbilities[ab]--;
                    }
                    renderApp();
                }
                return;
            }

            // Ability edit save
            if (target.matches('[data-action="ability-save"]')) {
                if (editAbilities) {
                    state.customAbilities = Object.assign({}, editAbilities);
                    saveCharState(charId, state);
                }
                abilityEditMode = false;
                editAbilities = null;
                renderApp();
                return;
            }

            // Ability edit cancel
            if (target.matches('[data-action="ability-cancel"]')) {
                abilityEditMode = false;
                editAbilities = null;
                renderApp();
                return;
            }

            // Spell star/favorite toggle
            if (target.matches('[data-spell-star]') || target.closest('[data-spell-star]')) {
                var starEl = target.matches('[data-spell-star]') ? target : target.closest('[data-spell-star]');
                var spellStarName = starEl.dataset.spellStar;
                if (spellStarName && canEdit(charId)) {
                    if (!state.favorites) state.favorites = [];
                    var starIdx = state.favorites.indexOf(spellStarName);
                    if (starIdx >= 0) {
                        state.favorites.splice(starIdx, 1);
                    } else {
                        state.favorites.push(spellStarName);
                    }
                    saveCharState(charId, state);
                    renderApp();
                    e.stopPropagation();
                    return;
                }
            }

            // Suppress click if long-press tooltip fired
            if (window.__spellLongPressFired) {
                window.__spellLongPressFired = false;
                if (target.closest('.spell-toggle')) return;
            }

            // Spell toggle (not if clicking star)
            if ((target.matches('.spell-toggle') || target.closest('.spell-toggle')) &&
                !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
                if (!canEdit(charId)) return;
                var btn = target.closest('.spell-toggle') || target;
                var spellName = btn.dataset.spell;
                var spellLevel = parseInt(btn.dataset.level);

                if (spellLevel === 0) {
                    toggleCantrip(charId, config, state, spellName);
                } else {
                    togglePrepared(charId, config, state, spellName);
                }
                return;
            }

            // Filter bar
            if (target.matches('.filter-btn')) {
                spellFilter = target.dataset.filter || 'all';
                renderApp();
                return;
            }

            // Metamagic toggle
            if (target.matches('.metamagic-option') || target.closest('.metamagic-option')) {
                if (!canEdit(charId)) return;
                var mmBtn = target.closest('.metamagic-option') || target;
                if (mmBtn.classList.contains('locked')) return;
                var mmName = mmBtn.dataset.metamagic;
                toggleMetamagic(charId, config, state, mmName);
                return;
            }

            // ASI option buttons
            if (target.matches('.asi-option') || target.closest('.asi-option')) {
                if (!canEdit(charId)) return;
                var asiBtn = target.closest('.asi-option') || target;
                var asiLevel = parseInt(asiBtn.dataset.asiLevel);
                var asiType = asiBtn.dataset.asiType;

                if (asiType === 'reset') {
                    delete state.asiChoices[asiLevel];
                    saveCharState(charId, state);
                    renderApp();
                    return;
                }
                if (asiType === 'asi-two') {
                    showASIAbilityPicker(charId, config, state, asiLevel, 'asi-two');
                    return;
                }
                if (asiType === 'asi-split') {
                    showASIAbilityPicker(charId, config, state, asiLevel, 'asi-split');
                    return;
                }
                if (asiType === 'feat') {
                    showFeatPicker(charId, config, state, asiLevel);
                    return;
                }
            }

            // Weapon mastery tooltip
            if (target.matches('.item-mastery') || target.closest('.item-mastery')) {
                var badge = target.matches('.item-mastery') ? target : target.closest('.item-mastery');
                var mName = badge.dataset.mastery;
                var mDesc = badge.dataset.masteryDesc;
                if (mName && mDesc) {
                    showTooltipPopup(
                        '<div class="mastery-tooltip">' +
                        '<h4 class="mastery-tooltip-title">' + capitalize(mName) + '</h4>' +
                        '<p>' + escapeHtml(mDesc) + '</p>' +
                        '</div>',
                        badge
                    );
                }
                return;
            }

            // Item autocomplete option click
            if (target.matches('.item-autocomplete-option')) {
                var nameInput = app.querySelector('.item-name-input');
                if (nameInput) {
                    nameInput.value = target.dataset.value;
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                var drop = document.querySelector('.item-autocomplete-dropdown');
                if (drop) drop.remove();
                return;
            }

            // Item add button
            if (target.matches('[data-action="add-item"]')) {
                var form = app.querySelector('.item-add-form');
                if (form) {
                    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
                    if (form.style.display !== 'none') {
                        var nameInput = form.querySelector('.item-name-input');
                        if (nameInput) nameInput.focus();
                    }
                }
                return;
            }

            // Item confirm
            if (target.matches('[data-action="confirm-item"]')) {
                var formEl = app.querySelector('.item-add-form');
                if (formEl) {
                    var itemNameInput = formEl.querySelector('.item-name-input');
                    var itemWeightInput = formEl.querySelector('.item-weight-input');
                    var itemNotesInput = formEl.querySelector('.item-notes-input');
                    var itemName = (itemNameInput ? itemNameInput.value : '').trim();
                    var itemWeight = itemWeightInput ? parseFloat(itemWeightInput.value) || 0 : 0;
                    var itemNotes = itemNotesInput ? itemNotesInput.value.trim() : '';
                    if (itemName) {
                        if (!state.items) state.items = [];
                        state.items.push({ name: itemName, weight: itemWeight, notes: itemNotes });
                        saveCharState(charId, state);
                        renderApp();
                    }
                }
                return;
            }

            // Item cancel
            if (target.matches('[data-action="cancel-item"]')) {
                var formEl2 = app.querySelector('.item-add-form');
                if (formEl2) formEl2.style.display = 'none';
                return;
            }

            // Item remove
            if (target.matches('.item-remove')) {
                var itemIdx = parseInt(target.dataset.itemIdx);
                if (!isNaN(itemIdx) && state.items && state.items[itemIdx] !== undefined) {
                    state.items.splice(itemIdx, 1);
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // === Combat Tab Event Handlers ===

            // Take damage
            if (target.matches('[data-action="take-damage"]') || target.closest('[data-action="take-damage"]')) {
                if (!canEdit(charId)) return;
                var dmgInput = app.querySelector('#damage-input');
                var dmgVal = dmgInput ? parseInt(dmgInput.value) || 0 : 0;
                if (dmgVal <= 0) return;
                var maxHPVal = getHP(config, state);
                var curHP = (state.currentHP === null || state.currentHP === undefined) ? maxHPVal : state.currentHP;
                var curTempHP = state.tempHP || 0;
                // Damage goes to temp HP first
                if (curTempHP > 0) {
                    if (dmgVal <= curTempHP) {
                        state.tempHP = curTempHP - dmgVal;
                        dmgVal = 0;
                    } else {
                        dmgVal -= curTempHP;
                        state.tempHP = 0;
                    }
                }
                if (dmgVal > 0) {
                    state.currentHP = Math.max(0, curHP - dmgVal);
                } else {
                    state.currentHP = curHP;
                }
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'damage', amount: parseInt(dmgInput.value), time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Heal
            if (target.matches('[data-action="heal"]') || target.closest('[data-action="heal"]')) {
                if (!canEdit(charId)) return;
                var healInput = app.querySelector('#heal-input');
                var healVal = healInput ? parseInt(healInput.value) || 0 : 0;
                if (healVal <= 0) return;
                var maxHPHeal = getHP(config, state);
                var curHPHeal = (state.currentHP === null || state.currentHP === undefined) ? maxHPHeal : state.currentHP;
                state.currentHP = Math.min(maxHPHeal, curHPHeal + healVal);
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'heal', amount: healVal, time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Set temp HP
            if (target.matches('[data-action="set-temp-hp"]') || target.closest('[data-action="set-temp-hp"]')) {
                if (!canEdit(charId)) return;
                var tempInput = app.querySelector('#temp-hp-input');
                var tempVal = tempInput ? parseInt(tempInput.value) || 0 : 0;
                state.tempHP = Math.max(0, tempVal);
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle death save
            if (target.matches('[data-action="toggle-death-save"]')) {
                if (!canEdit(charId)) return;
                var saveType = target.dataset.saveType;
                var saveIdx = parseInt(target.dataset.saveIdx);
                if (!state.deathSaves) state.deathSaves = { successes: 0, failures: 0 };
                if (saveIdx < state.deathSaves[saveType]) {
                    state.deathSaves[saveType] = saveIdx;
                } else {
                    state.deathSaves[saveType] = saveIdx + 1;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Reset death saves
            if (target.matches('[data-action="reset-death-saves"]')) {
                if (!canEdit(charId)) return;
                state.deathSaves = { successes: 0, failures: 0 };
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle condition
            if (target.matches('[data-action="toggle-condition"]')) {
                if (!canEdit(charId)) return;
                var condName = target.dataset.condition;
                if (!state.conditions) state.conditions = [];
                var condIdx = state.conditions.indexOf(condName);
                if (condIdx >= 0) {
                    state.conditions.splice(condIdx, 1);
                } else {
                    state.conditions.push(condName);
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Roll weapon attack
            if (target.matches('[data-action="roll-attack"]') || target.closest('[data-action="roll-attack"]')) {
                var rollBtn = target.matches('[data-action="roll-attack"]') ? target : target.closest('[data-action="roll-attack"]');
                var hitMod = parseInt(rollBtn.dataset.hit);
                var dmgDice = rollBtn.dataset.dmg;
                var dmgMod = parseInt(rollBtn.dataset.dmgMod);
                var weaponName = rollBtn.dataset.weapon;

                // Roll d20 + hit mod
                var attackRoll = Math.floor(Math.random() * 20) + 1;
                var totalHit = attackRoll + hitMod;
                var isNat20 = attackRoll === 20;
                var isNat1 = attackRoll === 1;

                // Roll damage
                var dmgMatch = dmgDice.match(/(\d+)d(\d+)/);
                var dmgTotal = 0;
                if (dmgMatch) {
                    var numDice = parseInt(dmgMatch[1]) * (isNat20 ? 2 : 1);
                    var dieSize = parseInt(dmgMatch[2]);
                    for (var rd = 0; rd < numDice; rd++) dmgTotal += Math.floor(Math.random() * dieSize) + 1;
                    dmgTotal += dmgMod;
                }

                // Show result in a toast-like popup near the button
                var resultDiv = document.createElement('div');
                resultDiv.className = 'weapon-roll-result' + (isNat20 ? ' nat20' : '') + (isNat1 ? ' nat1' : '');
                resultDiv.innerHTML = '<strong>' + escapeHtml(weaponName) + '</strong><br>' +
                    'Attack: ' + attackRoll + ' + ' + hitMod + ' = <b>' + totalHit + '</b>' +
                    (isNat20 ? ' NAT 20!' : '') + (isNat1 ? ' NAT 1!' : '') +
                    '<br>Damage: <b>' + dmgTotal + '</b>';
                rollBtn.closest('.weapon').appendChild(resultDiv);
                setTimeout(function() { resultDiv.remove(); }, 3000);
                return;
            }

            // Drop concentration
            if (target.matches('[data-action="drop-concentration"]')) {
                if (!canEdit(charId)) return;
                state.concentrating = null;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle spell slot
            if (target.matches('[data-action="toggle-spell-slot"]')) {
                if (!canEdit(charId)) return;
                var slotLevel = target.dataset.slotLevel;
                var slotIdx = parseInt(target.dataset.slotIdx);
                if (!state.spellSlotsUsed) state.spellSlotsUsed = {};
                var currentUsedSlots = state.spellSlotsUsed[slotLevel] || 0;
                if (slotIdx < currentUsedSlots) {
                    state.spellSlotsUsed[slotLevel] = slotIdx;
                } else {
                    state.spellSlotsUsed[slotLevel] = slotIdx + 1;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Short rest
            if (target.matches('[data-action="short-rest"]') || target.closest('[data-action="short-rest"]')) {
                if (!canEdit(charId)) return;
                // Warlock: recover pact slots
                if (config.className === 'warlock') {
                    if (!state.spellSlotsUsed) state.spellSlotsUsed = {};
                    state.spellSlotsUsed['pact'] = 0;
                }
                // Short rest resource refresh (2024 PHB)
                if (config.className === 'monk') state.focusPointsUsed = 0;
                if (config.className === 'fighter') {
                    state.secondWindUsed = 0;
                    state.actionSurgeUsed = 0;
                }
                if (config.className === 'bard' && state.level >= 5) state.bardicInspirationUsed = 0;
                if (config.className === 'druid' && state.level >= 2) state.wildShapeUsed = 0;
                // Cleric Channel Divinity: short rest refresh vanaf lvl 2
                if ((config.className === 'cleric' || config.className === 'paladin') && state.level >= 2) state.channelDivinityUsed = 0;
                // Spend hit dice to heal
                var hdAvailable = state.level - (state.hitDiceUsed || 0);
                if (hdAvailable > 0 && state.currentHP !== null) {
                    var maxHP = getHP(config, state);
                    if (state.currentHP < maxHP) {
                        var hdToSpend = Math.min(hdAvailable, Math.ceil((maxHP - state.currentHP) / 6));
                        var conMod = getMod(getAbilityScore(config, state, 'con'));
                        var classHD = DATA.classes[config.className] ? DATA.classes[config.className].hitDie : 8;
                        var healed = 0;
                        for (var hdi = 0; hdi < hdToSpend; hdi++) {
                            healed += Math.max(1, Math.floor(Math.random() * classHD) + 1 + conMod);
                        }
                        state.currentHP = Math.min(maxHP, state.currentHP + healed);
                        state.hitDiceUsed = (state.hitDiceUsed || 0) + hdToSpend;
                        // Log
                        if (!state.combatLog) state.combatLog = [];
                        state.combatLog.unshift({ type: 'heal', amount: healed, source: 'Short Rest (' + hdToSpend + ' HD)', time: Date.now() });
                        if (state.combatLog.length > 20) state.combatLog.length = 20;
                    }
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Long rest
            if (target.matches('[data-action="long-rest"]') || target.closest('[data-action="long-rest"]')) {
                if (!canEdit(charId)) return;
                var maxHPRest = getHP(config, state);
                state.currentHP = maxHPRest;
                state.tempHP = 0;
                state.deathSaves = { successes: 0, failures: 0 };
                state.conditions = [];
                state.spellSlotsUsed = {};
                state.concentrating = null;
                var hitDiceToRestore = Math.ceil(state.level / 2);
                state.hitDiceUsed = Math.max(0, (state.hitDiceUsed || 0) - hitDiceToRestore);
                // Reset alle class resources op long rest (2024 PHB: meeste class features refresh)
                state.rageUsed = 0;
                state.focusPointsUsed = 0;
                state.channelDivinityUsed = 0;
                state.bardicInspirationUsed = 0;
                state.layOnHandsUsed = 0;
                state.sorceryPointsUsed = 0;
                state.secondWindUsed = 0;
                state.actionSurgeUsed = 0;
                state.indomitableUsed = 0;
                state.wildShapeUsed = 0;
                state.mysticArcanumUsed = 0;
                // Exhaustion: -1 level per long rest
                if (state.exhaustion && state.exhaustion > 0) state.exhaustion = state.exhaustion - 1;
                // Log
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'rest', source: 'Long Rest — Full recovery', time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Delete combat log entry
            if (target.matches('[data-action="delete-combat-log"]')) {
                if (!canEdit(charId)) return;
                var logIdx = parseInt(target.dataset.logIdx);
                if (state.combatLog && state.combatLog[logIdx] !== undefined) {
                    state.combatLog.splice(logIdx, 1);
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // Clear combat log
            if (target.matches('[data-action="clear-combat-log"]')) {
                if (!canEdit(charId)) return;
                state.combatLog = [];
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle inspiration
            if (target.matches('[data-action="toggle-inspiration"]') || target.closest('[data-action="toggle-inspiration"]')) {
                if (!canEdit(charId)) return;
                state.inspiration = !state.inspiration;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Exhaustion level setter
            var exEl = target.matches('[data-action="set-exhaustion"]') ? target : target.closest('[data-action="set-exhaustion"]');
            if (exEl) {
                if (!canEdit(charId)) return;
                var newLevel = parseInt(exEl.dataset.level);
                if (isNaN(newLevel)) return;
                // Toggle: als klik op huidige level → clear, anders zet op dat level
                if (state.exhaustion === newLevel) {
                    state.exhaustion = newLevel - 1;
                    if (state.exhaustion < 0) state.exhaustion = 0;
                } else {
                    state.exhaustion = newLevel;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Class resource toggle (dot UI)
            var resEl = target.matches('[data-action="toggle-resource"]') ? target : target.closest('[data-action="toggle-resource"]');
            if (resEl) {
                if (!canEdit(charId)) return;
                var resKey = resEl.dataset.resource;
                var resIdx = parseInt(resEl.dataset.idx);
                var cur = state[resKey] || 0;
                if (resIdx < cur) {
                    state[resKey] = resIdx;
                } else {
                    state[resKey] = resIdx + 1;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }
        }

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
        var deleteBtn = target.matches('[data-action="delete-quest"]') ? target : target.closest('[data-action="delete-quest"]');
        if (deleteBtn) {
            var qIdx = parseInt(deleteBtn.dataset.questIdx);
            var qData = getQuestData();
            qData.active.splice(qIdx, 1);
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

        // Add map
        if (target.matches('[data-action="add-map"]') || target.closest('[data-action="add-map"]')) {
            var mapName = prompt(t('maps.mapname'));
            if (mapName && mapName.trim()) {
                var mData = getMapsData();
                var mDim = mData.dimensions[activeDimension];
                if (mDim) {
                    mDim.maps.push({ id: 'map' + Date.now(), name: mapName.trim(), image: null, isRoot: false, pins: [] });
                    saveMapsData(mData);
                    renderApp();
                }
            }
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

        // Zoom controls
        if (target.matches('[data-action="zoom-in"]')) { mapZoom = Math.min(mapZoom * 1.3, 5); renderApp(); return; }
        if (target.matches('[data-action="zoom-out"]')) { mapZoom = Math.max(mapZoom / 1.3, 0.3); renderApp(); return; }
        if (target.matches('[data-action="zoom-reset"]')) { mapZoom = 1; mapPanX = 0; mapPanY = 0; renderApp(); return; }

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
                var rect = canvas.getBoundingClientRect();
                var pinX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
                var pinY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

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
                                mDim2.maps[cmi2].pins.push({
                                    id: 'pin' + Date.now(),
                                    x: pinX,
                                    y: pinY,
                                    label: label,
                                    targetMap: targetMapId || null
                                });
                                break;
                            }
                        }
                        saveMapsData(mData2);
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
        if (target.matches('[data-action="delete-pin"]')) {
            e.stopPropagation();
            var delPinIdx = parseInt(target.dataset.pinIdx);
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

        // Set concentration via select
        if (target.matches('[data-action="set-concentration"]')) {
            if (!charId || !canEdit(charId)) return;
            var concState = loadCharState(charId);
            concState.concentrating = target.value || null;
            saveCharState(charId, concState);
            renderApp();
            return;
        }

        // Class resource pool (Lay on Hands, Focus Points, Sorcery Points) via number input
        if (target.matches('[data-action="set-resource"]')) {
            if (!charId || !canEdit(charId)) return;
            var resState = loadCharState(charId);
            var resKey = target.dataset.resource;
            var resMax = parseInt(target.dataset.max);
            var v = parseInt(target.value) || 0;
            if (v < 0) v = 0;
            if (!isNaN(resMax) && v > resMax) v = resMax;
            resState[resKey] = v;
            saveCharState(charId, resState);
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

        // Import character file
        if (target.matches('[data-action="import-char"]')) {
            if (!charId || !canEdit(charId)) return;
            var file = target.files && target.files[0];
            if (file) {
                importCharacter(charId, file, function(imported) {
                    var cfgLocal = loadCharConfig(charId);
                    var defaults = {
                        level: 1, skills: [], expertise: [], cantrips: [], prepared: [],
                        metamagic: [], asiChoices: {}, favorites: [],
                        items: (cfgLocal.defaultItems || []).map(function(itm) { return Object.assign({}, itm); }),
                        customAbilities: null, currentHP: null, tempHP: 0,
                        deathSaves: { successes: 0, failures: 0 }, conditions: [],
                        spellSlotsUsed: {}, hitDiceUsed: 0, inspiration: false,
                        gold: 0, notes: ''
                    };
                    var newState = {};
                    var dkeys = Object.keys(defaults);
                    for (var dk = 0; dk < dkeys.length; dk++) {
                        newState[dkeys[dk]] = imported[dkeys[dk]] !== undefined ? imported[dkeys[dk]] : defaults[dkeys[dk]];
                    }
                    saveCharState(charId, newState);
                    spellFilter = 'all';
                    abilityEditMode = false;
                    editAbilities = null;
                    renderApp();
                });
            }
            target.value = '';
            return;
        }

        // Banner upload
        if (target.matches('[data-action="upload-banner"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'banner');
            }
            return;
        }

        // Portrait upload
        if (target.matches('[data-action="upload-portrait"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'portrait');
            }
            return;
        }

        // Appearance upload
        if (target.matches('[data-action="upload-appearance"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'appearance');
            }
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

        // Auto-fill weight from datalist + custom mobile autocomplete
        if (target.matches('.item-name-input')) {
            var val = target.value.trim();
            var lowerVal = val.toLowerCase();
            // Remove existing dropdown
            var oldDrop = document.querySelector('.item-autocomplete-dropdown');
            if (oldDrop) oldDrop.remove();

            if (typeof DATA !== 'undefined' && DATA.items) {
                var cats = Object.keys(DATA.items);
                // Auto-fill weight on exact match
                for (var ci = 0; ci < cats.length; ci++) {
                    var catItems = DATA.items[cats[ci]];
                    if (Array.isArray(catItems)) {
                        for (var di = 0; di < catItems.length; di++) {
                            var ditem = catItems[di];
                            var iName = typeof ditem === 'string' ? ditem : ditem.name;
                            var iWeight = typeof ditem === 'object' ? ditem.weight : undefined;
                            if (iName === val && iWeight !== undefined) {
                                var wInput = app.querySelector('.item-weight-input');
                                if (wInput) wInput.value = iWeight;
                            }
                        }
                    }
                }
                // Build custom dropdown for mobile
                if (lowerVal.length >= 1) {
                    var matches = [];
                    for (var ci2 = 0; ci2 < cats.length; ci2++) {
                        var catItems2 = DATA.items[cats[ci2]];
                        if (Array.isArray(catItems2)) {
                            for (var di2 = 0; di2 < catItems2.length; di2++) {
                                var d2 = catItems2[di2];
                                var n2 = typeof d2 === 'string' ? d2 : d2.name;
                                if (n2.toLowerCase().indexOf(lowerVal) >= 0) matches.push(n2);
                            }
                        }
                    }
                    if (matches.length > 0 && matches.length <= 20) {
                        var dropdown = document.createElement('div');
                        dropdown.className = 'item-autocomplete-dropdown';
                        for (var mi = 0; mi < matches.length; mi++) {
                            var opt = document.createElement('div');
                            opt.className = 'item-autocomplete-option';
                            opt.textContent = matches[mi];
                            opt.dataset.value = matches[mi];
                            dropdown.appendChild(opt);
                        }
                        target.parentNode.style.position = 'relative';
                        target.parentNode.appendChild(dropdown);
                    }
                }
            }
        }

        // Gold input
        if (target.matches('[data-action="update-gold"]')) {
            if (charId && canEdit(charId)) {
                var goldState = loadCharState(charId);
                goldState.gold = parseInt(target.value) || 0;
                saveCharState(charId, goldState);
            }
        }

        // Secret gold input
        if (target.matches('[data-action="update-secret-gold"]')) {
            if (charId && canEdit(charId)) {
                var goldState = loadCharState(charId);
                goldState.secretGold = parseInt(target.value) || 0;
                saveCharState(charId, goldState);
            }
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

    // ---- Tooltip events (on document for broader coverage) ----
    document.onmouseover = function(e) {
        var target = e.target;

        // Ability score tooltip
        if (!abilityEditMode && charId && config && state) {
            var abilityEl = target.closest('.ability[data-ability]');
            if (abilityEl) {
                var ab = abilityEl.dataset.ability;
                if (ab) {
                    showAbilityTooltip(ab, config, state, abilityEl);
                    return;
                }
            }
        }

        // Spell tooltip
        var spellBtn = target.closest('.spell-toggle');
        if (spellBtn && !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
            var spName = spellBtn.dataset.spell;
            if (spName) {
                showSpellTooltip(spName, spellBtn);
                return;
            }
        }

        // Condition tag tooltip
        var condTag = target.closest('.condition-tag[data-tip]');
        if (condTag) {
            showTooltipPopup('<div>' + escapeHtml(condTag.dataset.tip) + '</div>', condTag);
            return;
        }

        // Prepared spell tooltip (combat tab)
        var prepSpell = target.closest('.prepared-spell-tag[data-spell]');
        if (prepSpell) {
            showSpellTooltip(prepSpell.dataset.spell, prepSpell);
            return;
        }

        // Info item tooltip
        var infoItem = target.closest('.info-item');
        if (infoItem) {
            var valueEl = infoItem.querySelector('.value');
            if (valueEl) {
                var tipValue = valueEl.textContent.trim();
                showInfoTooltip(tipValue, infoItem);
                return;
            }
        }
    };

    document.onmouseout = function(e) {
        var target = e.target;
        var abilityEl = target.closest('.ability[data-ability]');
        var spellBtn = target.closest('.spell-toggle');
        var infoItem = target.closest('.info-item');
        var condTag = target.closest('.condition-tag[data-tip]');
        var prepSpell = target.closest('.prepared-spell-tag[data-spell]');
        if (abilityEl || spellBtn || infoItem || condTag || prepSpell) {
            var related = e.relatedTarget;
            if (abilityEl && abilityEl.contains(related)) return;
            if (spellBtn && spellBtn.contains(related)) return;
            if (infoItem && infoItem.contains(related)) return;
            if (condTag && condTag.contains(related)) return;
            if (prepSpell && prepSpell.contains(related)) return;
            removeTooltipPopup();
        }
    };
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

// Patch tooltip events: on touch devices use tap instead of hover
var origInitEvents = (typeof initEvents === 'function') ? initEvents : null;

function patchTooltipEvents() {
    if (!isTouchDevice) return;

    // Override mouseover/mouseout — they still fire on touch but unreliably
    // Add touchstart-based tooltip triggers on #app
    var appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.addEventListener('touchstart', function(e) {
        var target = e.target;

        // Ability score tooltip (tap)
        if (typeof abilityEditMode !== 'undefined' && !abilityEditMode && typeof charId !== 'undefined' && charId && typeof config !== 'undefined' && config && typeof state !== 'undefined' && state) {
            var abilityEl = target.closest('.ability[data-ability]');
            if (abilityEl) {
                var ab = abilityEl.dataset.ability;
                if (ab) {
                    e.preventDefault();
                    showAbilityTooltip(ab, config, state, abilityEl);
                    return;
                }
            }
        }

        // Spell tooltip on long-press; short tap toggles spell (click fires normally)
        var spellBtn = target.closest('.spell-toggle');
        if (spellBtn) {
            var spName = spellBtn.dataset.spell;
            if (spName) {
                window.__spellLongPressTimer = setTimeout(function() {
                    window.__spellLongPressFired = true;
                    showSpellTooltip(spName, spellBtn);
                }, 500);
                var cancel = function() {
                    clearTimeout(window.__spellLongPressTimer);
                    spellBtn.removeEventListener('touchend', cancel);
                    spellBtn.removeEventListener('touchmove', cancel);
                };
                spellBtn.addEventListener('touchend', cancel);
                spellBtn.addEventListener('touchmove', cancel);
            }
        }

        // Info item tooltip (tap)
        var infoItem = target.closest('.info-item');
        if (infoItem) {
            var valueEl = infoItem.querySelector('.value');
            if (valueEl) {
                var tipValue = valueEl.textContent.trim();
                e.preventDefault();
                showInfoTooltip(tipValue, infoItem);
                return;
            }
        }
    }, { passive: false });
}

