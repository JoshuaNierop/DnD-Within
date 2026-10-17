// D&D Within — Real authentication (Firebase Auth, email + password)
// ============================================================
// Thin layer on top of the existing userId system. A Firebase login is
// translated to the internal userId; EVERYTHING (characters, party slot, themes,
// chat) stays tied to that userId → no data migration, no lost chats.
//
// Transition ("both work at the start"):
//   - New way: email + password via Firebase Auth.
//   - Old way: username + (legacy) password keeps working as long as
//     dw/config/legacyOpen === true. That flag keeps the DB rules open so a
//     username session (without Firebase token) can keep reading/writing.
//   - Cutover: admin sets legacyOpen to false → from then on authenticated only.
//
// The social/chat module gets the ID token via window.dwGetIdToken().

var _dwIdToken = null;        // cached Firebase ID token (JWT) for REST calls
var _dwAuthInited = false;

function dwAuthAvailable() {
    return typeof firebase !== 'undefined' && typeof firebase.auth === 'function';
}

// Token provider for REST paths (wg-firebase.js, social/). Null = no
// Firebase session (e.g. legacy username login) → REST call goes without ?auth=.
function dwGetIdToken() { return _dwIdToken; }
window.dwGetIdToken = dwGetIdToken;

function dwAuthInit() {
    if (_dwAuthInited || !dwAuthAvailable()) return;
    _dwAuthInited = true;
    try {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) { /* persistence not available — not fatal */ }

    // Refresh the token cache on every change (login, ~1h refresh, logout).
    firebase.auth().onIdTokenChanged(function (user) {
        if (user) {
            user.getIdToken().then(function (tok) { _dwIdToken = tok; }).catch(function () {});
        } else {
            _dwIdToken = null;
        }
    });

    // Session restore: if a Firebase session already exists (LOCAL persistence) we
    // link the internal userId and set the app session if it is missing.
    firebase.auth().onAuthStateChanged(function (user) {
        if (!user) return;
        user.getIdToken().then(function (tok) { _dwIdToken = tok; }).catch(function () {});
        var uid = dwResolveUserIdFromAuth(user);
        if (!uid) return;
        dwLinkAuthUid(uid, user.uid);
        if (typeof currentUserId === 'function' && !currentUserId()) {
            setSession(uid);
            if (typeof applyUserTheme === 'function') applyUserTheme();
            if (typeof renderApp === 'function') renderApp();
        }
    });
}

// Session restore after usersCache has loaded. onAuthStateChanged can fire
// before the users have been downloaded (LOCAL persistence restores the Firebase session
// early) — then resolve fails silently. sync.js calls this once users are in.
function dwTryRestoreSession() {
    if (!dwAuthAvailable()) return;
    var user = firebase.auth().currentUser;
    if (!user) return;
    if (typeof currentUserId === 'function' && currentUserId()) return;  // already a session
    var uid = dwResolveUserIdFromAuth(user);
    if (!uid) return;
    dwLinkAuthUid(uid, user.uid);
    setSession(uid);
    if (typeof applyUserTheme === 'function') applyUserTheme();
    if (typeof renderApp === 'function') renderApp();
}

// Resolve the internal userId for a Firebase account: first via authUid, otherwise via
// the linked email address.
function dwResolveUserIdFromAuth(user) {
    if (!user) return null;
    var src = usersCache || {};
    var id;
    for (id in src) { if (src[id] && src[id].authUid === user.uid) return id; }
    var email = (user.email || '').trim().toLowerCase();
    if (email) {
        for (id in src) { if (src[id] && (src[id].email || '').toLowerCase() === email) return id; }
    }
    return null;
}

// Find userId by email address (before sign-in, to know which account belongs to it).
function dwFindUserIdByEmail(email) {
    email = (email || '').trim().toLowerCase();
    if (!email) return null;
    var src = usersCache || {};
    var id;
    for (id in src) { if (src[id] && (src[id].email || '').toLowerCase() === email) return id; }
    if (typeof DEFAULT_USERS !== 'undefined') {
        for (id in DEFAULT_USERS) { if ((DEFAULT_USERS[id].email || '').toLowerCase() === email) return id; }
    }
    return null;
}

// Link a Firebase uid to an internal userId (idempotent). Also writes a
// reverse lookup dw/authMap/<uid> = userId so the DB rules can enforce ownership
// without scanning the whole users tree.
function dwLinkAuthUid(userId, authUid) {
    if (!userId || !authUid) return;
    var u = getUserData(userId);
    if (!u || u.authUid === authUid) return;
    // Update local cache — clone (do NOT mutate the DEFAULT_USERS constant).
    if (!usersCache) usersCache = {};
    if (!usersCache[userId]) usersCache[userId] = JSON.parse(JSON.stringify(u));
    usersCache[userId].authUid = authUid;
    // Write ONLY the authUid field (no full .set() → does not wipe an email linked by the admin
    // or other fields on the remote user node) + the reverse lookup.
    if (typeof syncReady !== 'undefined' && syncReady && syncDb) {
        syncDb.ref('dw/users/' + userId + '/authUid').set(authUid);
        syncDb.ref('dw/authMap/' + authUid).set(userId);
    }
}

// Email + password login. Self-registration when the admin has linked the email address
// to an account but no Firebase account exists yet (first
// login = set password). Resolves to userId (Promise).
function dwEmailLogin(email, password) {
    email = (email || '').trim();
    if (!dwAuthAvailable()) return Promise.reject({ code: 'auth-unavailable' });
    var userId = dwFindUserIdByEmail(email);
    if (!userId) return Promise.reject({ code: 'no-account' });
    var auth = firebase.auth();
    return auth.signInWithEmailAndPassword(email, password)
        .then(function (cred) {
            dwLinkAuthUid(userId, cred.user.uid);
            return userId;
        })
        .catch(function (err) {
            // Account may not exist yet → try to register. If it
            // already exists, the first error was a wrong password
            // (email-enumeration-protection masks user-not-found).
            return auth.createUserWithEmailAndPassword(email, password)
                .then(function (cred) {
                    dwLinkAuthUid(userId, cred.user.uid);
                    try { cred.user.sendEmailVerification(); } catch (e) {}
                    return userId;
                })
                .catch(function (cerr) {
                    if (cerr && cerr.code === 'auth/email-already-in-use') throw { code: 'wrong-password' };
                    throw cerr;
                });
        });
}

// Password reset by email.
function dwSendReset(email) {
    if (!dwAuthAvailable()) return Promise.reject({ code: 'auth-unavailable' });
    return firebase.auth().sendPasswordResetEmail((email || '').trim());
}

// End the Firebase session (besides the local clearSession()).
function dwSignOut() {
    _dwIdToken = null;
    if (dwAuthAvailable() && firebase.auth().currentUser) {
        try { firebase.auth().signOut(); } catch (e) {}
    }
}

// Transition config (mirrored from dw/config by sync.js). legacyOpen defaults to
// true as long as the flag does not exist yet.
var dwConfig = window.dwConfig || {};
window.dwConfig = dwConfig;

// Is legacy username login still allowed? Used by the login handler for
// a clean message at the cutover.
function dwLegacyOpen() {
    return dwConfig && dwConfig.legacyOpen === false ? false : true;
}
