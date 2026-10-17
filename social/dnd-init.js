// dnd-init.js — D&D Within bridge to the social module.
//
// Identity = currentUserId() from the session (the internal userId — NOT the
// Firebase uid). Chat threads therefore stay keyed on userId → no migration
// needed when moving to Firebase Auth. The Firebase ID token IS
// sent along (getToken) so the chat keeps working once the DB rules require
// authentication after the cutover. Party members in dw/users/ are auto-mirrored
// as "friends" so the chat widget "just works" without an add/accept flow.

import { createFirebaseAdapter } from './firebase-adapter.js';
import { mountChatWidget } from './chat-widget.js';
import { renderFriendsPage } from './friends-page.js';
import { chatIdFor } from './core.js';

const FIREBASE_DB_URL = 'https://dnd-within-firebase-default-rtdb.firebaseio.com';
const ROOT_PATH = 'dw/social';

let widget = null;
let adapter = null;
let lastSyncedUid = null;
let initRunning = false;

// Appends the Firebase ID token to a REST URL (no-op as long as there is no auth).
function authUrl(url) {
    const tok = (typeof window.dwGetIdToken === 'function') ? window.dwGetIdToken() : null;
    if (!tok) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'auth=' + encodeURIComponent(tok);
}

function getCurrentUserSafe() {
    if (typeof window.currentUserId !== 'function') return null;
    const uid = window.currentUserId();
    if (!uid) return null;
    let user = null;
    try {
        if (typeof window.getUserData === 'function') user = window.getUserData(uid);
        else if (typeof window.currentUser === 'function') user = window.currentUser();
    } catch {}
    return {
        uid,
        displayName: user?.name || user?.displayName || uid,
        email: user?.email || '',
        avatarUrl: user?.avatar || user?.portrait || '',
    };
}

function getAdapter() {
    if (adapter) return adapter;
    adapter = createFirebaseAdapter({
        databaseURL: FIREBASE_DB_URL,
        rootPath: ROOT_PATH,
        getToken: () => (typeof window.dwGetIdToken === 'function' ? window.dwGetIdToken() : null),
        getUid: () => getCurrentUserSafe()?.uid,
        getMyProfile: async () => getCurrentUserSafe() || {
            uid: 'anonymous', displayName: 'Anonymous', email: '',
        },
    });
    return adapter;
}

// ===== Party sync — spiegel dw/users → dw/social/users/{me}/friends =====
async function syncPartyAsFriends() {
    const me = getCurrentUserSafe();
    if (!me?.uid) return;

    // Read party from dw/users via REST (token included if logged in)
    const r = await fetch(authUrl(`${FIREBASE_DB_URL}/dw/users.json`)).catch(() => null);
    if (!r?.ok) return;
    const users = await r.json().catch(() => null);
    if (!users || typeof users !== 'object') return;

    const myUid = me.uid;
    const writes = [];
    for (const [uid, u] of Object.entries(users)) {
        if (uid === myUid) continue;
        const displayName = u?.name || u?.displayName || uid;
        const friendPath = `${FIREBASE_DB_URL}/${ROOT_PATH}/users/${myUid}/friends/${uid}.json`;
        // Only write if it doesn't exist yet (idempotent — prevents overwriting own changes)
        const exists = await fetch(authUrl(friendPath)).then(r => r.ok ? r.json() : null).catch(() => null);
        if (exists) continue;
        writes.push(fetch(authUrl(friendPath), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'accepted',
                since: Date.now(),
                displayName,
                email: u?.email || '',
            }),
        }));
        // Index entry so they show up in the chat list (even without messages)
        const chatId = chatIdFor(myUid, uid);
        const idxPath = `${FIREBASE_DB_URL}/${ROOT_PATH}/users/${myUid}/chats/${chatId}.json`;
        const idxExists = await fetch(authUrl(idxPath)).then(r => r.ok ? r.json() : null).catch(() => null);
        if (!idxExists) {
            writes.push(fetch(authUrl(idxPath), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ unread: 0, lastSeenTs: 0 }),
            }));
        }
    }
    await Promise.all(writes);
}

// ===== Mount/unmount widget =====
async function mount() {
    if (initRunning) return;
    initRunning = true;
    try {
        const me = getCurrentUserSafe();
        if (!me?.uid) return;
        if (widget && lastSyncedUid !== me.uid) {
            try { widget.destroy(); } catch {}
            widget = null;
            adapter = null;
        }
        if (widget) return;

        await syncPartyAsFriends().catch(e => console.warn('Party sync:', e));
        const a = getAdapter();
        widget = mountChatWidget(document.body, a);
        lastSyncedUid = me.uid;

        // Notification permission (ask once)
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
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

// Re-mount on route change (user switches user via UI). Clean-URL router
// uses History API → listen on popstate (back/forward) and on the custom
// 'dw:navigated' event that navigate() dispatches on every pushState.
function _onRouteChange() {
    const me = getCurrentUserSafe();
    if (me?.uid && me.uid !== lastSyncedUid) mount();
}
window.addEventListener('popstate', _onRouteChange);
window.addEventListener('dw:navigated', _onRouteChange);
