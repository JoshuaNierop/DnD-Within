// dnd-init.js — D&D Within bridge naar social-module.
//
// D&D heeft geen Firebase Auth (open rules). Identity = currentUserId() uit
// localStorage session. Party members in dw/users/ worden auto-gespiegeld als
// "friends" in dw/social/users/{me}/friends, zodat de standaard chat-widget
// "just works" zonder add/accept-flow.

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
        getToken: () => null,                     // open rules — geen auth nodig
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

    // Lees party uit dw/users via REST (geen auth nodig)
    const r = await fetch(`${FIREBASE_DB_URL}/dw/users.json`).catch(() => null);
    if (!r?.ok) return;
    const users = await r.json().catch(() => null);
    if (!users || typeof users !== 'object') return;

    const myUid = me.uid;
    const writes = [];
    for (const [uid, u] of Object.entries(users)) {
        if (uid === myUid) continue;
        const displayName = u?.name || u?.displayName || uid;
        const friendPath = `${FIREBASE_DB_URL}/${ROOT_PATH}/users/${myUid}/friends/${uid}.json`;
        // Schrijf alleen als nog niet bestaat (idempotent — voorkomt overschrijven van eigen wijzigingen)
        const exists = await fetch(friendPath).then(r => r.ok ? r.json() : null).catch(() => null);
        if (exists) continue;
        writes.push(fetch(friendPath, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'accepted',
                since: Date.now(),
                displayName,
                email: u?.email || '',
            }),
        }));
        // Index entry zodat ze in chat-list verschijnen (ook zonder berichten)
        const chatId = chatIdFor(myUid, uid);
        const idxPath = `${FIREBASE_DB_URL}/${ROOT_PATH}/users/${myUid}/chats/${chatId}.json`;
        const idxExists = await fetch(idxPath).then(r => r.ok ? r.json() : null).catch(() => null);
        if (!idxExists) {
            writes.push(fetch(idxPath, {
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

        // Notification permission (een keer vragen)
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

// Auto-mount zodra session klaar is. We polling-checken want D&D heeft
// geen formele auth-event.
let mountAttempts = 0;
const mountPoll = setInterval(() => {
    mountAttempts++;
    if (getCurrentUserSafe()?.uid) {
        clearInterval(mountPoll);
        mount();
    } else if (mountAttempts > 60) {
        // 30s gewacht, geef het op (waarschijnlijk niet ingelogd)
        clearInterval(mountPoll);
    }
}, 500);

// Re-mount bij route change (gebruiker switcht user via UI). Clean-URL router
// gebruikt History API → luister op popstate (back/forward) én op het custom
// 'dw:navigated' event dat navigate() bij elke pushState dispatcht.
function _onRouteChange() {
    const me = getCurrentUserSafe();
    if (me?.uid && me.uid !== lastSyncedUid) mount();
}
window.addEventListener('popstate', _onRouteChange);
window.addEventListener('dw:navigated', _onRouteChange);
