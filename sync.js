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
    'dw_notes_'
];
var SYNC_EXACT = [
    'dw_maps', 'dw_timeline', 'dw_lore',
    'dw_initiative', 'dw_session_number'
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

    // DM tools
    if (key === 'dw_initiative') return 'dm/initiative';

    // Campaign
    if (key === 'dw_session_number') return 'campaign/session_number';

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

    // characters/<id>/notes → dw_notes_<id>
    if (p[0] === 'characters' && p[2] === 'notes')
        return 'dw_notes_' + p[1];

    // world/*
    if (p[0] === 'world' && p[1]) return 'dw_' + p[1];

    // dm/notes → dw_notes_dm
    if (p[0] === 'dm' && p[1] === 'notes') return 'dw_notes_dm';

    // dm/initiative → dw_initiative
    if (p[0] === 'dm' && p[1] === 'initiative') return 'dw_initiative';

    // campaign/session_number → dw_session_number
    if (p[0] === 'campaign' && p[1] === 'session_number') return 'dw_session_number';

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

        syncDownloadAll(function() {
            console.log('[Sync] Download voltooid.');
            syncStartListeners();
            if (typeof renderApp === 'function') renderApp();
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
    for (var i = 0; i < leaves.length; i++) {
        var val = leaves[i].value;
        if (val === null || val === undefined) {
            localStorage.removeItem(leaves[i].key);
        } else if (typeof val === 'object') {
            localStorage.setItem(leaves[i].key, JSON.stringify(val));
        } else {
            localStorage.setItem(leaves[i].key, String(val));
        }
    }
}

// ===== Download all data from Firebase =====

function syncDownloadAll(callback) {
    if (!syncDb) { if (callback) callback(); return; }

    syncDb.ref('dw').once('value', function(snapshot) {
        var data = snapshot.val();
        if (!data) { if (callback) callback(); return; }

        syncPaused = true;
        var leaves = [];
        extractLeaves(data, '', leaves);
        applyLeaves(leaves);
        syncPaused = false;
        if (callback) callback();
    }, function(err) {
        console.error('[Sync] Download mislukt:', err);
        syncPaused = false;
        if (callback) callback();
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
                    applyLeaves(leaves);
                    syncPaused = false;
                    if (typeof renderApp === 'function') renderApp();
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
                    applyLeaves(leaves);
                    syncPaused = false;
                    if (typeof renderApp === 'function') renderApp();
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
