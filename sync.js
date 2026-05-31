// ============================================================
// D&D Within — Firebase Realtime Sync
// ============================================================
//
// Firebase structure:
//   dw/
//     campaign/
//       session_number
//     characters/
//       <charId>/
//         config    ← name, race, class, background, appearance, etc.
//         state     ← level, HP, spells, inventory, gold, etc.
//         images/
//           portrait
//           banner
//         notes     ← personal notes for this character's player
//     world/
//       maps
//       timeline
//       lore
//     dm/
//       initiative
//       notes       ← DM's personal notes
//
// localStorage keys map 1:1 to Firebase paths:
//   dw_charconfig_<id>      → characters/<id>/config
//   dw_char_<id>            → characters/<id>/state
//   dw_img_<id>_<type>      → characters/<id>/images/<type>
//   dw_notes_<userId>       → characters/<userId>/notes (or dm/notes)
//   dw_maps                 → world/maps
//   dw_timeline             → world/timeline
//   dw_lore                 → world/lore
//   dw_initiative           → dm/initiative
//   dw_session_number       → campaign/session_number
// ============================================================

var FIREBASE_CONFIG = {
    apiKey: "AIzaSyCpgLfArDsej7CvP6q6xTYwzDvZ5Dv-y2Q",
    authDomain: "dnd-within-firebase.firebaseapp.com",
    databaseURL: "https://dnd-within-firebase-default-rtdb.firebaseio.com",
    projectId: "dnd-within-firebase",
    storageBucket: "dnd-within-firebase.firebasestorage.app",
    messagingSenderId: "635957665402",
    appId: "1:635957665402:web:a67c143c86072b7a7165c3"
};

// ===== Sync State =====
var syncReady = false;
var syncDb = null;
var syncPaused = false;

// Keys that should be synced
var SYNC_PREFIXES = [
    'dw_char_', 'dw_charconfig_', 'dw_img_',
    'dw_notes_', 'dw_whisper_',
    'dw_scene_'  // timeline scene blobs (one per scene, image incl.)
];
var SYNC_EXACT = [
    'dw_maps', 'dw_timeline', 'dw_lore',
    'dw_chapters', 'dw_party_level',
    'dw_initiative', 'dw_session_number', 'dw_dashboard', 'dw_party_gold', 'dw_quests', 'dw_npcs', 'dw_campaigns', 'dw_families'
];

function isSyncableKey(key) {
    for (var i = 0; i < SYNC_EXACT.length; i++) {
        if (key === SYNC_EXACT[i]) return true;
    }
    for (var i = 0; i < SYNC_PREFIXES.length; i++) {
        if (key.indexOf(SYNC_PREFIXES[i]) === 0) return true;
    }
    return false;
}

// ===== Path Mapping: localStorage → Firebase =====

function keyToPath(key) {
    // Character config: dw_charconfig_ren → characters/ren/config
    if (key.indexOf('dw_charconfig_') === 0)
        return 'characters/' + key.substring(14) + '/config';

    // Character images: dw_img_ren_portrait → characters/ren/images/portrait
    if (key.indexOf('dw_img_') === 0) {
        var rest = key.substring(7); // "ren_portrait"
        var idx = rest.indexOf('_');
        if (idx > 0) {
            return 'characters/' + rest.substring(0, idx) + '/images/' + rest.substring(idx + 1);
        }
        return 'characters/' + rest + '/images/default';
    }

    // Character state: dw_char_ren → characters/ren/state
    if (key.indexOf('dw_char_') === 0)
        return 'characters/' + key.substring(8) + '/state';

    // Whispers: dw_whisper_ren → characters/ren/whispers
    if (key.indexOf('dw_whisper_') === 0) {
        return 'characters/' + key.substring(11) + '/whispers';
    }

    // Notes: dw_notes_dm → dm/notes, dw_notes_ren → characters/ren/notes
    if (key.indexOf('dw_notes_') === 0) {
        var userId = key.substring(9);
        if (userId === 'dm') return 'dm/notes';
        return 'characters/' + userId + '/notes';
    }

    // World data
    if (key === 'dw_maps') return 'world/maps';
    if (key === 'dw_timeline') return 'world/timeline';
    if (key === 'dw_lore') return 'world/lore';
    if (key === 'dw_chapters') return 'world/timeline/chapters';
    if (key.indexOf('dw_scene_') === 0) return 'world/timeline/scenes/' + key.substring(9);
    if (key === 'dw_party_level') return 'campaign/party_level';

    // DM tools
    if (key === 'dw_initiative') return 'dm/initiative';

    // Campaign
    if (key === 'dw_session_number') return 'campaign/session_number';
    if (key === 'dw_dashboard') return 'campaign/dashboard';
    if (key === 'dw_party_gold') return 'campaign/party_gold';
    if (key === 'dw_quests') return 'world/quests';
    if (key === 'dw_npcs') return 'world/npcs';
    if (key === 'dw_families') return 'world/families';
    if (key === 'dw_campaigns') return 'campaign/campaigns';

    return 'other/' + key;
}

// ===== Path Mapping: Firebase → localStorage =====

function firebasePathToLocalKey(path) {
    var p = path.split('/');

    // characters/<id>/config → dw_charconfig_<id>
    if (p[0] === 'characters' && p[2] === 'config')
        return 'dw_charconfig_' + p[1];

    // characters/<id>/state → dw_char_<id>
    if (p[0] === 'characters' && p[2] === 'state')
        return 'dw_char_' + p[1];

    // characters/<id>/images/<type> → dw_img_<id>_<type>
    if (p[0] === 'characters' && p[2] === 'images' && p[3])
        return 'dw_img_' + p[1] + '_' + p[3];

    // characters/<id>/whispers → dw_whisper_<id>
    if (p[0] === 'characters' && p[2] === 'whispers')
        return 'dw_whisper_' + p[1];

    // characters/<id>/notes → dw_notes_<id>
    if (p[0] === 'characters' && p[2] === 'notes')
        return 'dw_notes_' + p[1];

    // world/*
    if (p[0] === 'world' && p[1] === 'quests') return 'dw_quests';
    if (p[0] === 'world' && p[1] === 'npcs') return 'dw_npcs';
    if (p[0] === 'world' && p[1] === 'families') return 'dw_families';
    if (p[0] === 'world' && p[1] === 'timeline' && p[2] === 'chapters') return 'dw_chapters';
    if (p[0] === 'world' && p[1] === 'timeline' && p[2] === 'scenes' && p[3]) return 'dw_scene_' + p[3];
    if (p[0] === 'world' && p[1]) return 'dw_' + p[1];

    // dm/notes → dw_notes_dm
    if (p[0] === 'dm' && p[1] === 'notes') return 'dw_notes_dm';

    // dm/initiative → dw_initiative
    if (p[0] === 'dm' && p[1] === 'initiative') return 'dw_initiative';

    // campaign/session_number → dw_session_number
    if (p[0] === 'campaign' && p[1] === 'session_number') return 'dw_session_number';
    if (p[0] === 'campaign' && p[1] === 'dashboard') return 'dw_dashboard';
    if (p[0] === 'campaign' && p[1] === 'party_gold') return 'dw_party_gold';
    if (p[0] === 'campaign' && p[1] === 'party_level') return 'dw_party_level';
    if (p[0] === 'campaign' && p[1] === 'campaigns') return 'dw_campaigns';

    return null;
}

// ===== Initialize Firebase =====

function initFirebaseSync() {
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) {
        console.log('[Sync] Firebase niet geconfigureerd.');
        return;
    }

    try {
        if (typeof firebase === 'undefined') {
            console.warn('[Sync] Firebase SDK niet geladen.');
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        syncDb = firebase.database();
        syncReady = true;
        console.log('[Sync] Firebase verbonden!');

        // Initialize the image-storage layer (Cloudinary with base64
        // fallback). Safe no-op if CONFIG isn't filled in yet.
        if (typeof DWImages !== 'undefined' && DWImages.init) DWImages.init();

        // Download users first, then all data
        syncDownloadUsers(function() {
            seedUsers();
            syncDownloadAll(function(changed) {
                console.log('[Sync] Download voltooid. Wijzigingen: ' + changed);
                syncStartListeners();
                syncListenUsers();
                syncDownloadBugs();
                syncListenBugs();
                initPresence();
                // Re-render alleen als Firebase nieuwe/andere data leverde dan de localStorage cache.
                // Voorkomt dubbele intro-animatie op return-visits met up-to-date cache.
                if (changed > 0 && typeof renderApp === 'function') renderApp();
            });
        });

    } catch (e) {
        console.error('[Sync] Firebase init mislukt:', e);
    }
}

// ===== Recursive leaf extraction from Firebase snapshot =====

function extractLeaves(obj, prefix, result) {
    if (obj === null || obj === undefined) return;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var path = prefix ? prefix + '/' + keys[i] : keys[i];
        var val = obj[keys[i]];
        var localKey = firebasePathToLocalKey(path);
        if (localKey) {
            result.push({ key: localKey, value: val });
        } else if (typeof val === 'object' && val !== null) {
            extractLeaves(val, path, result);
        }
    }
}

function applyLeaves(leaves) {
    var changed = 0;
    for (var i = 0; i < leaves.length; i++) {
        var key = leaves[i].key;
        var val = leaves[i].value;
        var existing = localStorage.getItem(key);
        var next;
        if (val === null || val === undefined) {
            if (existing !== null) {
                localStorage.removeItem(key);
                changed++;
            }
            continue;
        } else if (typeof val === 'object') {
            next = JSON.stringify(val);
        } else {
            next = String(val);
        }
        if (existing !== next) {
            try {
                localStorage.setItem(key, next);
                changed++;
            } catch (e) {
                // localStorage quota exceeded (typically a large base64 image
                // blob). Skip this single key instead of aborting the whole
                // sync loop — otherwise every key after it silently fails to
                // land locally. The UI hydrates missing images on demand
                // straight from Firebase (see hydrateCharCardPortraits).
                console.warn('[Sync] localStorage skip (quota?):', key, e && e.message);
            }
        }
    }
    return changed;
}

// ===== Download all data from Firebase =====

function syncDownloadAll(callback) {
    if (!syncDb) { if (callback) callback(0); return; }

    syncDb.ref('dw').once('value', function(snapshot) {
        var data = snapshot.val();
        if (!data) { if (callback) callback(0); return; }

        syncPaused = true;
        var leaves = [];
        extractLeaves(data, '', leaves);
        var changed = applyLeaves(leaves);
        syncPaused = false;
        if (callback) callback(changed);
    }, function(err) {
        console.error('[Sync] Download mislukt:', err);
        syncPaused = false;
        if (callback) callback(0);
    });
}

// ===== Upload a key to Firebase =====

function syncUpload(key) {
    if (!syncReady || !syncDb || syncPaused) return;
    if (!isSyncableKey(key)) return;

    var value = localStorage.getItem(key);
    var path = keyToPath(key);

    if (value === null) {
        syncDb.ref('dw/' + path).remove();
        return;
    }

    try {
        var parsed = JSON.parse(value);
        syncDb.ref('dw/' + path).set(parsed);
    } catch (e) {
        syncDb.ref('dw/' + path).set(value);
    }
}

// ===== Remove a key from Firebase =====

function syncRemove(key) {
    if (!syncReady || !syncDb) return;
    if (!isSyncableKey(key)) return;
    syncDb.ref('dw/' + keyToPath(key)).remove();
}

// ===== Realtime listeners =====

function syncStartListeners() {
    if (!syncDb) return;

    // Listen on top-level folders
    var folders = ['characters', 'world', 'dm', 'campaign'];

    for (var f = 0; f < folders.length; f++) {
        (function(folder) {
            var ref = syncDb.ref('dw/' + folder);

            ref.on('child_changed', function(snapshot) {
                if (syncPaused) return;
                var fullPath = folder + '/' + snapshot.key;
                var value = snapshot.val();
                var leaves = [];
                var directKey = firebasePathToLocalKey(fullPath);

                if (directKey) {
                    leaves.push({ key: directKey, value: value });
                } else if (typeof value === 'object' && value !== null) {
                    extractLeaves(value, fullPath, leaves);
                }

                if (leaves.length > 0) {
                    syncPaused = true;
                    var changed = applyLeaves(leaves);
                    syncPaused = false;
                    if (changed > 0 && typeof renderApp === 'function') renderApp();
                }
            });

            ref.on('child_added', function(snapshot) {
                if (syncPaused) return;
                var fullPath = folder + '/' + snapshot.key;
                var value = snapshot.val();
                var leaves = [];
                var directKey = firebasePathToLocalKey(fullPath);

                if (directKey) {
                    if (!localStorage.getItem(directKey)) {
                        leaves.push({ key: directKey, value: value });
                    }
                } else if (typeof value === 'object' && value !== null) {
                    extractLeaves(value, fullPath, leaves);
                    // Only add leaves we don't already have
                    leaves = leaves.filter(function(l) {
                        return !localStorage.getItem(l.key);
                    });
                }

                if (leaves.length > 0) {
                    syncPaused = true;
                    applyLeaves(leaves);
                    syncPaused = false;
                }
            });

            ref.on('child_removed', function(snapshot) {
                if (syncPaused) return;
                var fullPath = folder + '/' + snapshot.key;
                var value = snapshot.val();
                var leaves = [];
                var directKey = firebasePathToLocalKey(fullPath);

                if (directKey) {
                    leaves.push({ key: directKey, value: null });
                } else if (typeof value === 'object' && value !== null) {
                    extractLeaves(value, fullPath, leaves);
                    leaves = leaves.map(function(l) { return { key: l.key, value: null }; });
                }

                if (leaves.length > 0) {
                    syncPaused = true;
                    var changed = applyLeaves(leaves);
                    syncPaused = false;
                    if (changed > 0 && typeof renderApp === 'function') renderApp();
                }
            });
        })(folders[f]);
    }
}

// ===== Upload ALL local data to Firebase =====

function syncUploadAll() {
    if (!syncReady || !syncDb) {
        console.warn('[Sync] Firebase niet klaar.');
        return;
    }

    var count = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (isSyncableKey(key)) {
            syncUpload(key);
            count++;
        }
    }
    console.log('[Sync] ' + count + ' items geupload naar Firebase.');
}

// ===== Seed campaign data to Firebase =====
// Call this once to populate Firebase with CHAR_DEFAULTS data

function syncSeedCampaign() {
    if (!syncReady || !syncDb) {
        console.warn('[Sync] Firebase niet klaar.');
        return;
    }

    if (typeof SEED_DATA === 'undefined') {
        console.warn('[Sync] Geen SEED_DATA gevonden.');
        return;
    }

    // Write each character's config to Firebase and localStorage
    var charIds = Object.keys(SEED_DATA);
    for (var i = 0; i < charIds.length; i++) {
        var charId = charIds[i];
        var config = SEED_DATA[charId];
        var localKey = 'dw_charconfig_' + charId;

        // Only seed if localStorage doesn't already have this config
        if (!localStorage.getItem(localKey)) {
            localStorage.setItem(localKey, JSON.stringify(config));
        }
        syncUpload(localKey);
    }

    // Also upload any existing state, images, world data
    syncUploadAll();

    console.log('[Sync] Campaign data geüpload (' + charIds.length + ' characters).');
}

// ===== Sync status indicator =====

function getSyncStatus() {
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) return 'not-configured';
    if (!syncReady) return 'offline';
    return 'online';
}

// ===== Real-time Presence =====
var onlineUsers = {};

function initPresence() {
    if (!syncDb) return;
    var userId = typeof currentUserId === 'function' ? currentUserId() : null;
    if (!userId) return;

    var presenceRef = syncDb.ref('presence/' + userId);
    var connectedRef = syncDb.ref('.info/connected');

    connectedRef.on('value', function(snap) {
        if (snap.val() === true) {
            presenceRef.set({ online: true, lastSeen: firebase.database.ServerValue.TIMESTAMP });
            presenceRef.onDisconnect().set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
        }
    });

    // Listen for all presence changes
    syncDb.ref('presence').on('value', function(snap) {
        onlineUsers = snap.val() || {};
        if (typeof renderApp === 'function') {
            // Only re-render dashboard elements, not the whole app
            var dots = document.querySelectorAll('.presence-dot');
            dots.forEach(function(dot) {
                var uid = dot.dataset.userId;
                if (onlineUsers[uid] && onlineUsers[uid].online) {
                    dot.classList.add('online');
                } else {
                    dot.classList.remove('online');
                }
            });
        }
    });
}

function isUserOnline(userId) {
    return onlineUsers[userId] && onlineUsers[userId].online;
}

// ===== Bug Report Sync =====
// Central hub: all bug/feature reports go to Nexus Firebase /shared/bugs.
// Reader: /bugfix skill (~/.claude/commands/bugfix.md). Project filter: 'dnd-within'.

var BUG_HUB_URL = 'https://nexus-12fc7-default-rtdb.europe-west1.firebasedatabase.app/shared/bugs.json';
var BUG_PROJECT_ID = 'dnd-within';

function submitBugToHub(bug) {
    // Maps DW bug shape to hub schema.
    var payload = {
        project: BUG_PROJECT_ID,
        type: bug.type || 'bug',
        element: bug.element || '',
        elementPath: bug.elementPath || '',
        route: bug.route || '',
        description: String(bug.description || '').slice(0, 1999),
        reporter: bug.reporter || 'anonymous',
        timestamp: bug.timestamp || Date.now(),
        createdAt: new Date().toISOString(),
        status: 'open'
    };
    return fetch(BUG_HUB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(function(res) {
        if (!res.ok) throw new Error('Bug hub submit failed: ' + res.status);
        return res.json();
    });
}

// Legacy shims — kept so older call sites compile but are no-ops.
// The hub is authoritative; localStorage is only a write-through copy for the new flow.
function syncUploadBugs(bugs) {
    // New single-report flow goes via submitBugToHub() directly from ui-settings.
    // Bulk upload of localStorage array is obsolete.
}
function syncDownloadBugs(callback) { if (callback) callback([]); }
function syncListenBugs() { /* no-op: /bugfix reads hub directly */ }

// ===== User Sync =====

function syncDownloadUsers(callback) {
    if (!syncDb) { if (callback) callback(); return; }

    syncDb.ref('dw/users').once('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            usersCache = data;
            localStorage.setItem('dw_users', JSON.stringify(usersCache));
            console.log('[Sync] Users gedownload:', Object.keys(usersCache).length);
        } else {
            // Load from localStorage cache
            var cached = localStorage.getItem('dw_users');
            if (cached) {
                try { usersCache = JSON.parse(cached); } catch (e) { usersCache = null; }
            }
        }
        if (callback) callback();
    }, function(err) {
        console.error('[Sync] Users download mislukt:', err);
        // Fallback to localStorage cache
        var cached = localStorage.getItem('dw_users');
        if (cached) {
            try { usersCache = JSON.parse(cached); } catch (e) { usersCache = null; }
        }
        if (callback) callback();
    });
}

function syncSaveUser(userId, userData) {
    if (!syncReady || !syncDb) return;
    syncDb.ref('dw/users/' + userId).set(userData);
    // Also update local cache
    if (!usersCache) usersCache = {};
    usersCache[userId] = userData;
    localStorage.setItem('dw_users', JSON.stringify(usersCache));
}

function syncListenUsers() {
    if (!syncDb) return;

    syncDb.ref('dw/users').on('value', function(snapshot) {
        var data = snapshot.val();
        if (data) {
            usersCache = data;
            localStorage.setItem('dw_users', JSON.stringify(usersCache));
        }
    });
}

function seedUsers() {
    if (!syncReady || !syncDb) {
        console.warn('[Sync] Firebase niet klaar voor user seeding.');
        return;
    }
    if (typeof DEFAULT_USERS === 'undefined') return;

    syncDb.ref('dw/users').once('value', function(snapshot) {
        var existing = snapshot.val() || {};
        var userIds = Object.keys(DEFAULT_USERS);
        var updates = {};

        for (var i = 0; i < userIds.length; i++) {
            var uid = userIds[i];
            var expectedChars = DEFAULT_USERS[uid].characters || ((uid !== 'admin' && uid !== 'dm') ? [uid] : []);
            if (!existing[uid]) {
                updates[uid] = {
                    name: DEFAULT_USERS[uid].name,
                    password: DEFAULT_USERS[uid].password,
                    role: DEFAULT_USERS[uid].role,
                    characters: expectedChars
                };
            } else {
                // Sync name and password from DEFAULT_USERS
                if (existing[uid].name !== DEFAULT_USERS[uid].name) updates[uid + '/name'] = DEFAULT_USERS[uid].name;
                if (existing[uid].password !== DEFAULT_USERS[uid].password) updates[uid + '/password'] = DEFAULT_USERS[uid].password;
                if (!existing[uid].characters || !Array.isArray(existing[uid].characters) || existing[uid].characters.length === 0) {
                    if (expectedChars.length > 0) updates[uid + '/characters'] = expectedChars;
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            syncDb.ref('dw/users').update(updates, function(err) {
                if (err) {
                    console.error('[Sync] User seeding mislukt:', err);
                } else {
                    console.log('[Sync] Default users geseeded:', Object.keys(updates).length);
                    // Refresh cache
                    syncDownloadUsers();
                }
            });
        }
    });
}
