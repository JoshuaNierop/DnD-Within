// dnd-init.js — D&D Within bridge to the social module.
//
// Identity = currentUserId() from the session (the internal userId — NOT the
// Firebase uid). Chat threads therefore stay keyed on userId → no migration
// needed when moving to Firebase Auth. The adapter talks to the database via
// the Firebase SDK, which attaches the Auth token itself once someone is signed
// in. Party members (dw/users) are auto-mirrored as "friends" so the chat
// widget "just works" without an add/accept flow.

import { createFirebaseAdapter } from './firebase-adapter.js';
import { mountChatWidget } from './chat-widget.js';
import { renderFriendsPage } from './friends-page.js';

const ROOT_PATH = 'dw/social';

let widget = null;
let adapter = null;
let lastSyncedUid = null;
let initRunning = false;

function userName(uid) {
    try {
        const u = typeof window.getUserData === 'function' ? window.getUserData(uid) : null;
        return u?.name || u?.displayName || null;
    } catch { return null; }
}

function getCurrentUserSafe() {
    if (typeof window.currentUserId !== 'function') return null;
    const uid = window.currentUserId();
    if (!uid) return null;
    let user = null;
    try { user = typeof window.getUserData === 'function' ? window.getUserData(uid) : null; } catch {}
    return {
        uid,
        displayName: user?.name || user?.displayName || uid,
        email: user?.email || '',
    };
}

function getAdapter() {
    if (adapter) return adapter;
    adapter = createFirebaseAdapter({
        rootPath: ROOT_PATH,
        getUid: () => getCurrentUserSafe()?.uid,
        getMyProfile: () => getCurrentUserSafe() || { uid: 'anonymous', displayName: 'Anonymous', email: '' },
        resolveName: userName,
    });
    return adapter;
}

// Party = every known user (Firebase users cache, falling back to the seed list).
function partyContacts() {
    const users = window.usersCache || window.DEFAULT_USERS || {};
    return Object.entries(users).map(([uid, u]) => ({
        uid,
        displayName: u?.name || u?.displayName || uid,
        email: u?.email || '',
    }));
}

async function syncPartyAsFriends() {
    if (!getCurrentUserSafe()?.uid) return;
    await getAdapter().ensureContacts(partyContacts());
}

// ===== Mount/unmount widget =====
async function mount() {
    if (initRunning) return;
    initRunning = true;
    try {
        const me = getCurrentUserSafe();
        if (!me?.uid) return;
        if (widget && lastSyncedUid !== me.uid) unmount();
        if (widget) return;

        const a = getAdapter();
        widget = mountChatWidget(document.body, a);
        lastSyncedUid = me.uid;
        // Party sync in the background; the chat list updates live when it lands
        syncPartyAsFriends().catch(e => console.warn('[social] party sync:', e));
    } catch (e) {
        console.warn('[social] mount:', e);
    } finally {
        initRunning = false;
    }
}

function unmount() {
    if (widget) { try { widget.destroy(); } catch {} widget = null; }
    adapter = null;
    lastSyncedUid = null;
}

// ===== Public API on window =====
window.dndSocial = {
    mount,
    unmount,
    toggle: () => { if (!widget) mount(); widget?.toggle(); },
    openWith: (uid, name) => widget?.openWith(uid, name),
    openFriendsPage: (host) => renderFriendsPage(host, getAdapter()),
    syncParty: () => syncPartyAsFriends(),
};

// Auto-mount as soon as the session is ready. We poll because D&D has
// no formal auth event.
let mountAttempts = 0;
const mountPoll = setInterval(() => {
    mountAttempts++;
    if (getCurrentUserSafe()?.uid) {
        clearInterval(mountPoll);
        mount();
    } else if (mountAttempts > 60) {
        // Waited 30s, give up (probably not logged in)
        clearInterval(mountPoll);
    }
}, 500);

// Re-mount when the user switches (or unmount on logout). The clean-URL router
// uses the History API → listen on popstate and on 'dw:navigated'.
function _onRouteChange() {
    const me = getCurrentUserSafe();
    if (!me?.uid) { if (widget) unmount(); return; }
    if (me.uid !== lastSyncedUid) mount();
}
window.addEventListener('popstate', _onRouteChange);
window.addEventListener('dw:navigated', _onRouteChange);
