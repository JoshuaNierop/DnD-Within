// D&D Within — Echte authenticatie (Firebase Auth, e-mail + wachtwoord)
// ============================================================
// Dunne laag bóven het bestaande userId-systeem. Een Firebase-login wordt
// vertaald naar de interne userId; ALLES (characters, party-plek, thema's,
// chat) blijft aan die userId hangen → geen data-migratie, geen verloren chats.
//
// Transitie ("aan het begin werken beide"):
//   - Nieuwe weg: e-mail + wachtwoord via Firebase Auth.
//   - Oude weg: username + (legacy) wachtwoord blijft werken zolang
//     dw/config/legacyOpen === true. Die vlag houdt de DB-rules open zodat een
//     username-sessie (zonder Firebase-token) blijft lezen/schrijven.
//   - Cutover: admin zet legacyOpen op false → vanaf dan enkel geauthenticeerd.
//
// De social/chat-module krijgt het ID-token via window.dwGetIdToken().

var _dwIdToken = null;        // gecachte Firebase ID-token (JWT) voor REST-calls
var _dwAuthInited = false;

function dwAuthAvailable() {
    return typeof firebase !== 'undefined' && typeof firebase.auth === 'function';
}

// Token-provider voor REST-paden (wg-firebase.js, social/). Null = geen
// Firebase-sessie (bv. legacy username-login) → REST-call gaat zonder ?auth=.
function dwGetIdToken() { return _dwIdToken; }
window.dwGetIdToken = dwGetIdToken;

function dwAuthInit() {
    if (_dwAuthInited || !dwAuthAvailable()) return;
    _dwAuthInited = true;
    try {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (e) { /* persistence niet beschikbaar — niet fataal */ }

    // Token-cache verversen bij elke wissel (login, ~1u refresh, logout).
    firebase.auth().onIdTokenChanged(function (user) {
        if (user) {
            user.getIdToken().then(function (tok) { _dwIdToken = tok; }).catch(function () {});
        } else {
            _dwIdToken = null;
        }
    });

    // Sessie-herstel: bestaat er al een Firebase-sessie (LOCAL persistence) dan
    // koppelen we de interne userId en zetten we de app-sessie als die ontbreekt.
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

// Sessie-herstel ná het laden van usersCache. onAuthStateChanged kan vuren
// vóórdat de users gedownload zijn (LOCAL persistence herstelt de Firebase-sessie
// vroeg) — dan faalt resolve stil. sync.js roept dit aan zodra users binnen zijn.
function dwTryRestoreSession() {
    if (!dwAuthAvailable()) return;
    var user = firebase.auth().currentUser;
    if (!user) return;
    if (typeof currentUserId === 'function' && currentUserId()) return;  // al een sessie
    var uid = dwResolveUserIdFromAuth(user);
    if (!uid) return;
    dwLinkAuthUid(uid, user.uid);
    setSession(uid);
    if (typeof applyUserTheme === 'function') applyUserTheme();
    if (typeof renderApp === 'function') renderApp();
}

// Resolve interne userId bij een Firebase-account: eerst via authUid, anders via
// het gekoppelde e-mailadres.
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

// Vind userId op e-mailadres (vóór sign-in, om te weten welk account erbij hoort).
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

// Koppel een Firebase-uid aan een interne userId (idempotent). Schrijft ook een
// reverse-lookup dw/authMap/<uid> = userId zodat de DB-rules ownership kunnen
// afdwingen zonder de hele users-boom te scannen.
function dwLinkAuthUid(userId, authUid) {
    if (!userId || !authUid) return;
    var u = getUserData(userId);
    if (!u || u.authUid === authUid) return;
    // Lokale cache bijwerken — clone (NIET de DEFAULT_USERS-constante muteren).
    if (!usersCache) usersCache = {};
    if (!usersCache[userId]) usersCache[userId] = JSON.parse(JSON.stringify(u));
    usersCache[userId].authUid = authUid;
    // Schrijf ALLEEN het authUid-veld (geen full .set() → wist geen door de admin
    // gekoppelde email of andere velden op de remote user-node) + de reverse-lookup.
    if (typeof syncReady !== 'undefined' && syncReady && syncDb) {
        syncDb.ref('dw/users/' + userId + '/authUid').set(authUid);
        syncDb.ref('dw/authMap/' + authUid).set(userId);
    }
}

// E-mail + wachtwoord login. Zelf-registratie wanneer de admin het e-mailadres
// al aan een account koppelde maar er nog géén Firebase-account bestaat (eerste
// keer inloggen = wachtwoord instellen). Resolved naar userId (Promise).
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
            // Account bestaat mogelijk nog niet → probeer te registreren. Bestaat
            // het toch al, dan was de eerste fout een verkeerd wachtwoord
            // (email-enumeration-protection maskeert user-not-found).
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

// Wachtwoord-reset per e-mail.
function dwSendReset(email) {
    if (!dwAuthAvailable()) return Promise.reject({ code: 'auth-unavailable' });
    return firebase.auth().sendPasswordResetEmail((email || '').trim());
}

// Firebase-sessie afsluiten (naast de lokale clearSession()).
function dwSignOut() {
    _dwIdToken = null;
    if (dwAuthAvailable() && firebase.auth().currentUser) {
        try { firebase.auth().signOut(); } catch (e) {}
    }
}

// Transitie-config (gespiegeld uit dw/config door sync.js). legacyOpen default
// true zolang de vlag nog niet bestaat.
var dwConfig = window.dwConfig || {};
window.dwConfig = dwConfig;

// Is legacy username-login nog toegestaan? Gebruikt door de login-handler voor
// een nette melding bij de cutover.
function dwLegacyOpen() {
    return dwConfig && dwConfig.legacyOpen === false ? false : true;
}
