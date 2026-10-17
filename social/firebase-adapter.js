// social/firebase-adapter.js
// Firebase RTDB adapter on the compat SDK that index.html already loads.
// One multiplexed websocket for every listener, automatic reconnects, the
// Firebase Auth token is attached by the SDK, and local writes show up
// instantly (latency compensation). Data layout is unchanged:
//   chats/{chatId}/messages/{pushKey} = {from, text, ts}
//   chats/{chatId}/meta               = {members, lastMessage, lastTs, lastFrom, lastFromName}
//   users/{uid}/chats/{chatId}        = {unread, lastSeenTs, lastTs}
//   users/{uid}/friends/{uid}         = {status, since, displayName, email}
//
// Host project supplies: rootPath, getUid(), getMyProfile(), optional resolveName(uid).

import { chatIdFor, emailSlug, otherMemberUid } from './core.js';

const MAX_TEXT = 2000;

export function createFirebaseAdapter({
    rootPath = '',
    getUid,
    getMyProfile,
    resolveName = () => null,
}) {
    if (!getUid || !getMyProfile) {
        throw new Error('createFirebaseAdapter: missing config');
    }

    const root = rootPath.replace(/^\/+|\/+$/g, '');

    function db() {
        if (typeof firebase === 'undefined') throw new Error('Firebase SDK not loaded');
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        return firebase.database();
    }
    const ref = (path) => db().ref(path ? `${root}/${path}` : root);
    const SV = () => firebase.database.ServerValue;

    async function val(path) {
        const snap = await ref(path).get();
        return snap.val();
    }

    // ===== Identity / lookup =====

    async function ensureMyLookup() {
        const me = await getMyProfile();
        if (!me?.email || !me?.uid) return;
        const slug = emailSlug(me.email);
        if (!slug) return;
        await ref(`lookups/email/${slug}`).set({
            uid: me.uid,
            displayName: me.displayName || me.email,
        });
    }

    async function findUserByEmail(email) {
        const slug = emailSlug(email);
        if (!slug) return null;
        const lookup = await val(`lookups/email/${slug}`);
        if (!lookup?.uid) return null;
        return {
            uid: lookup.uid,
            displayName: lookup.displayName || email,
            email: String(email).toLowerCase().trim(),
        };
    }

    async function getProfile(uid) {
        if (!uid) return null;
        const p = await val(`users/${uid}/profile`);
        if (!p) return null;
        return { uid, displayName: p.displayName || p.email || uid, email: p.email || '' };
    }

    // ===== Friends =====

    function friendList(data, status) {
        return Object.entries(data || {}).map(([uid, f]) => ({
            uid,
            displayName: resolveName(uid) || f.displayName || uid,
            email: f.email || '',
            status: status || f.status || 'accepted',
            since: f.since || 0,
            message: f.message || '',
            outgoing: !!f.outgoing,
        }));
    }

    async function listFriends() {
        return friendList(await val(`users/${getUid()}/friends`))
            .sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    async function listIncoming() {
        return friendList(await val(`users/${getUid()}/incoming`), 'pending')
            .sort((a, b) => b.since - a.since);
    }

    async function sendFriendRequest(toUid, toProfile, message = '') {
        const me = await getMyProfile();
        if (!me?.uid) throw new Error('Not signed in');
        if (toUid === me.uid) throw new Error('You cannot add yourself');
        if (await val(`users/${me.uid}/friends/${toUid}`)) {
            throw new Error('This user is already a friend (or the request is pending)');
        }
        const since = Date.now();
        await ref().update({
            [`users/${me.uid}/friends/${toUid}`]: {
                status: 'pending', since, outgoing: true,
                displayName: toProfile.displayName, email: toProfile.email || '',
            },
            [`users/${toUid}/incoming/${me.uid}`]: {
                since, displayName: me.displayName, email: me.email || '', message,
            },
        });
    }

    async function acceptFriendRequest(fromUid) {
        const me = await getMyProfile();
        if (!me?.uid) throw new Error('Not signed in');
        const incoming = await val(`users/${me.uid}/incoming/${fromUid}`);
        if (!incoming) throw new Error('No request found');
        const since = Date.now();
        await ref().update({
            [`users/${me.uid}/friends/${fromUid}`]: {
                status: 'accepted', since,
                displayName: incoming.displayName, email: incoming.email || '',
            },
            [`users/${me.uid}/incoming/${fromUid}`]: null,
            [`users/${fromUid}/friends/${me.uid}`]: {
                status: 'accepted', since,
                displayName: me.displayName, email: me.email || '',
            },
        });
    }

    async function declineFriendRequest(fromUid) {
        const me = getUid();
        await ref().update({
            [`users/${me}/incoming/${fromUid}`]: null,
            // Also clear the pending request on their side so they can send it again
            [`users/${fromUid}/friends/${me}`]: null,
        });
    }

    async function removeFriend(uid) {
        const me = getUid();
        await ref().update({
            [`users/${me}/friends/${uid}`]: null,
            [`users/${uid}/friends/${me}`]: null,
        });
    }

    // Mirror a contact list (the party) as accepted friends + chat-index entries.
    // Two reads, one write — only adds what is missing.
    async function ensureContacts(contacts) {
        const me = getUid();
        if (!me) return;
        const [friends, chats] = await Promise.all([
            val(`users/${me}/friends`), val(`users/${me}/chats`),
        ]);
        const updates = {};
        for (const c of contacts) {
            if (!c?.uid || c.uid === me) continue;
            if (!friends?.[c.uid]) {
                updates[`users/${me}/friends/${c.uid}`] = {
                    status: 'accepted', since: Date.now(),
                    displayName: c.displayName || c.uid, email: c.email || '',
                };
            }
            const chatId = chatIdFor(me, c.uid);
            if (!chats?.[chatId]) updates[`users/${me}/chats/${chatId}`] = { unread: 0, lastSeenTs: 0 };
        }
        if (Object.keys(updates).length) await ref().update(updates);
    }

    function subscribeFriends(callback) {
        const me = getUid();
        let friendsSnap = null, incomingSnap = null;
        const emit = () => callback({
            friends: friendList(friendsSnap),
            incoming: friendList(incomingSnap, 'pending'),
        });
        const fRef = ref(`users/${me}/friends`);
        const iRef = ref(`users/${me}/incoming`);
        const onF = fRef.on('value', s => { friendsSnap = s.val(); emit(); }, e => console.warn('[social] friends:', e));
        const onI = iRef.on('value', s => { incomingSnap = s.val(); emit(); }, e => console.warn('[social] incoming:', e));
        return () => { fRef.off('value', onF); iRef.off('value', onI); };
    }

    // ===== Chat =====

    function chatMeta(chatId, me, idx, meta, friend) {
        const otherUid = otherMemberUid(chatId, me);
        return {
            chatId,
            otherUid,
            otherDisplayName: resolveName(otherUid) || friend?.displayName
                || (meta?.lastFrom === otherUid && meta?.lastFromName) || otherUid,
            lastMessage: meta?.lastMessage || '',
            lastTs: meta?.lastTs || 0,
            lastFrom: meta?.lastFrom || '',
            unread: idx?.unread || 0,
            lastSeenTs: idx?.lastSeenTs || 0,
        };
    }

    function sortChats(list) {
        // Conversations with messages first (newest on top), then the rest by name
        return list.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0)
            || a.otherDisplayName.localeCompare(b.otherDisplayName));
    }

    async function listChats() {
        const me = getUid();
        const [index, friends] = await Promise.all([val(`users/${me}/chats`), val(`users/${me}/friends`)]);
        const ids = Object.keys(index || {});
        const metas = await Promise.all(ids.map(id => val(`chats/${id}/meta`).catch(() => null)));
        return sortChats(ids.map((id, i) =>
            chatMeta(id, me, index[id], metas[i], friends?.[otherMemberUid(id, me)])));
    }

    // Live chat list: the chat index, the friend names, and one meta listener per
    // chat. All share the SDK's single connection; updates are batched per tick.
    function subscribeChatList(callback) {
        const me = getUid();
        let index = {}, friends = {};
        const metas = {};
        const metaOff = {};
        let queued = false;
        const emit = () => {
            if (queued) return;
            queued = true;
            queueMicrotask(() => {
                queued = false;
                callback(sortChats(Object.keys(index).map(id =>
                    chatMeta(id, me, index[id], metas[id], friends[otherMemberUid(id, me)]))));
            });
        };
        const warn = (what) => (e) => console.warn(`[social] ${what}:`, e);

        const idxRef = ref(`users/${me}/chats`);
        const frRef = ref(`users/${me}/friends`);
        const onIdx = idxRef.on('value', (s) => {
            index = s.val() || {};
            for (const id of Object.keys(index)) {
                if (metaOff[id]) continue;
                const mRef = ref(`chats/${id}/meta`);
                const cb = mRef.on('value', ms => { metas[id] = ms.val(); emit(); }, warn('chat meta'));
                metaOff[id] = () => mRef.off('value', cb);
            }
            for (const id of Object.keys(metaOff)) {
                if (index[id]) continue;
                metaOff[id]();
                delete metaOff[id];
                delete metas[id];
            }
            emit();
        }, warn('chat index'));
        const onFr = frRef.on('value', (s) => { friends = s.val() || {}; emit(); }, warn('friends'));

        return () => {
            idxRef.off('value', onIdx);
            frRef.off('value', onFr);
            Object.values(metaOff).forEach(off => off());
        };
    }

    const toMsg = (snap) => {
        const m = snap.val() || {};
        return { id: snap.key, from: m.from, text: m.text, ts: m.ts };
    };

    // Push keys are chronological, so ordering by key needs no .indexOn.
    async function loadMessages(chatId, { limit = 200 } = {}) {
        const snap = await ref(`chats/${chatId}/messages`).orderByKey().limitToLast(limit).get();
        const out = [];
        snap.forEach(c => { out.push(toMsg(c)); });
        return out;
    }

    // Incremental: onEvent('add'|'change'|'remove', msg). The initial batch of the
    // last `limit` messages arrives as 'add' events, followed by one 'ready'
    // (value events fire after the child events for the same data).
    function subscribeMessages(chatId, onEvent, { limit = 200 } = {}) {
        const q = ref(`chats/${chatId}/messages`).orderByKey().limitToLast(limit);
        const warn = (e) => { console.warn('[social] messages:', e); onEvent('error', e); };
        q.once('value', () => onEvent('ready'), warn);
        const add = q.on('child_added', s => onEvent('add', toMsg(s)), warn);
        const chg = q.on('child_changed', s => onEvent('change', toMsg(s)), warn);
        const rem = q.on('child_removed', s => onEvent('remove', { id: s.key }), warn);
        return () => {
            q.off('child_added', add);
            q.off('child_changed', chg);
            q.off('child_removed', rem);
        };
    }

    // One atomic multi-path write: message + chat meta + both index entries.
    // Returns a promise with `.key` set synchronously, so the UI can show the
    // message as "sending" until the server confirms it.
    function sendMessage(chatId, otherUid, text) {
        const uid = getUid();
        const trimmed = String(text || '').trim().slice(0, MAX_TEXT);
        if (!uid) return Promise.reject(new Error('Not signed in'));
        if (!trimmed) return Promise.resolve(null);

        const key = ref(`chats/${chatId}/messages`).push().key;
        const done = Promise.resolve(getMyProfile()).then((me) => {
            const ts = SV().TIMESTAMP;
            const preview = trimmed.slice(0, 200);
            return ref().update({
                [`chats/${chatId}/messages/${key}`]: { from: uid, text: trimmed, ts },
                [`chats/${chatId}/meta/members/${uid}`]: true,
                [`chats/${chatId}/meta/members/${otherUid}`]: true,
                [`chats/${chatId}/meta/lastMessage`]: preview,
                [`chats/${chatId}/meta/lastTs`]: ts,
                [`chats/${chatId}/meta/lastFrom`]: uid,
                [`chats/${chatId}/meta/lastFromName`]: me?.displayName || uid,
                [`users/${uid}/chats/${chatId}/unread`]: 0,
                [`users/${uid}/chats/${chatId}/lastSeenTs`]: ts,
                [`users/${otherUid}/chats/${chatId}/unread`]: SV().increment(1),
                [`users/${otherUid}/chats/${chatId}/lastTs`]: ts,
            });
        }).then(() => key);
        done.key = key;
        return done;
    }

    async function markRead(chatId) {
        await ref(`users/${getUid()}/chats/${chatId}`).update({
            unread: 0,
            lastSeenTs: SV().TIMESTAMP,
        });
    }

    // Connection state: callback(true|false). Uses the SDK's .info/connected.
    function subscribeConnection(callback) {
        const cRef = db().ref('.info/connected');
        const cb = cRef.on('value', s => callback(s.val() === true));
        return () => cRef.off('value', cb);
    }

    return {
        // identity
        getCurrentUid: getUid,
        getMyProfile,
        ensureMyLookup,
        findUserByEmail,
        getProfile,
        // friends
        listFriends,
        listIncoming,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        ensureContacts,
        subscribeFriends,
        // chat
        chatIdFor,
        listChats,
        loadMessages,
        sendMessage,
        markRead,
        subscribeChatList,
        subscribeMessages,
        subscribeConnection,
    };
}
