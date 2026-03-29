// ============================================================
// D&D Within — Firebase Realtime Sync
// Syncs localStorage data to Firebase so all players share state
// ============================================================

// ===== Firebase Configuration =====
// STAP 1: Ga naar https://console.firebase.google.com
// STAP 2: Maak een nieuw project (bijv. "dnd-within")
// STAP 3: Ga naar Project Settings > General > Your apps > Web app
// STAP 4: Kopieer je config hieronder
// STAP 5: Ga naar Realtime Database > Create Database > Start in test mode
// STAP 6: Verander de rules naar:
//   {
//     "rules": {
//       ".read": true,
//       ".write": true
//     }
//   }

var FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// ===== Sync State =====
var syncReady = false;
var syncDb = null;
var syncListeners = [];
var syncPaused = false;

// Keys that should be synced (shared between all users)
var SYNC_KEYS = [
    'dw_char_', 'dw_charconfig_', 'dw_img_',
    'dw_maps', 'dw_timeline', 'dw_lore',
    'dw_initiative', 'dw_session_number',
    'dw_notes_'
];

// Keys that stay local only
var LOCAL_ONLY_KEYS = ['dw_session', 'dw_theme_'];

function isSyncableKey(key) {
    for (var i = 0; i < SYNC_KEYS.length; i++) {
        if (key === SYNC_KEYS[i] || key.indexOf(SYNC_KEYS[i]) === 0) return true;
    }
    return false;
}

// Convert localStorage key to Firebase path (dots/slashes not allowed in Firebase keys)
function keyToPath(key) {
    return key.replace(/\./g, '_dot_');
}

function pathToKey(path) {
    return path.replace(/_dot_/g, '.');
}

// ===== Initialize Firebase =====
function initFirebaseSync() {
    // Check if config is filled in
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) {
        console.log('[Sync] Firebase niet geconfigureerd — alleen lokale opslag actief.');
        console.log('[Sync] Vul FIREBASE_CONFIG in sync.js in om gedeelde opslag te activeren.');
        return;
    }

    try {
        // Initialize Firebase (v9 compat)
        if (typeof firebase === 'undefined') {
            console.warn('[Sync] Firebase SDK niet geladen.');
            return;
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        syncDb = firebase.database();
        syncReady = true;
        console.log('[Sync] Firebase verbonden — gedeelde opslag actief!');

        // Initial download: pull all data from Firebase into localStorage
        syncDownloadAll(function() {
            console.log('[Sync] Initieel downloaden voltooid.');
            // Start realtime listeners after initial download
            syncStartListeners();
            // Re-render app with synced data
            if (typeof renderApp === 'function') renderApp();
        });

    } catch (e) {
        console.error('[Sync] Firebase init mislukt:', e);
    }
}

// ===== Download all data from Firebase =====
function syncDownloadAll(callback) {
    if (!syncDb) { if (callback) callback(); return; }

    syncDb.ref('dw').once('value', function(snapshot) {
        var data = snapshot.val();
        if (!data) { if (callback) callback(); return; }

        syncPaused = true; // Prevent re-upload during download
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            var localKey = pathToKey(keys[i]);
            var value = data[keys[i]];
            if (typeof value === 'object' && value !== null) {
                localStorage.setItem(localKey, JSON.stringify(value));
            } else if (typeof value === 'string') {
                localStorage.setItem(localKey, value);
            }
        }
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
        // Key was removed
        syncDb.ref('dw/' + path).remove();
        return;
    }

    // Try to parse as JSON, otherwise store as string
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

// ===== Start realtime listeners =====
function syncStartListeners() {
    if (!syncDb) return;

    // Listen for any changes under /dw/
    syncDb.ref('dw').on('child_changed', function(snapshot) {
        if (syncPaused) return;
        var localKey = pathToKey(snapshot.key);
        var value = snapshot.val();

        syncPaused = true;
        if (typeof value === 'object' && value !== null) {
            localStorage.setItem(localKey, JSON.stringify(value));
        } else if (value !== null) {
            localStorage.setItem(localKey, String(value));
        }
        syncPaused = false;

        // Re-render to show changes from other users
        if (typeof renderApp === 'function') renderApp();
    });

    syncDb.ref('dw').on('child_added', function(snapshot) {
        if (syncPaused) return;
        var localKey = pathToKey(snapshot.key);
        var value = snapshot.val();

        // Only update if we don't already have this data
        if (!localStorage.getItem(localKey)) {
            if (typeof value === 'object' && value !== null) {
                localStorage.setItem(localKey, JSON.stringify(value));
            } else if (value !== null) {
                localStorage.setItem(localKey, String(value));
            }
        }
    });

    syncDb.ref('dw').on('child_removed', function(snapshot) {
        if (syncPaused) return;
        var localKey = pathToKey(snapshot.key);
        syncPaused = true;
        localStorage.removeItem(localKey);
        syncPaused = false;
        if (typeof renderApp === 'function') renderApp();
    });
}

// ===== Upload ALL local data to Firebase (first-time setup) =====
function syncUploadAll() {
    if (!syncReady || !syncDb) {
        console.warn('[Sync] Firebase niet klaar. Configureer eerst FIREBASE_CONFIG in sync.js.');
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

// ===== Sync status indicator =====
function getSyncStatus() {
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) return 'not-configured';
    if (!syncReady) return 'offline';
    return 'online';
}
