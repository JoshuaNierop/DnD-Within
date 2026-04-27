// social/adapters/firebase-rest.js
// Firebase RTDB adapter via REST + EventSource. Geen SDK bundle.
//
// Host project levert: databaseURL, rootPath, getToken(), getUid(), getMyProfile().

import { chatIdFor, emailSlug, otherMemberUid } from './core.js';

export function createFirebaseAdapter({
    databaseURL,
    rootPath = '',
    getToken,
    getUid,
    getMyProfile,
}) {
    if (!databaseURL || !getToken || !getUid || !getMyProfile) {
        throw new Error('createFirebaseAdapter: ontbrekende config');
    }

    const root = rootPath ? rootPath.replace(/^\/+|\/+$/g, '') + '/' : '';

    function url(path) {
        const tok = getToken();
        const base = `${databaseURL.replace(/\/+$/, '')}/${root}${path}.json`;
        return tok ? `${base}?auth=${encodeURIComponent(tok)}` : base;
    }

    async function dbGet(path) {
        const r = await fetch(url(path));
        if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
        return r.json();
    }
    async function dbPut(path, data) {
        const r = await fetch(url(path), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error(`PUT ${path}: ${r.status} — ${await r.text()}`);
        return r.json();
    }
    async function dbPatch(path, data) {
        const r = await fetch(url(path), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error(`PATCH ${path}: ${r.status} — ${await r.text()}`);
        return r.json();
    }
    async function dbDelete(path) {
        const r = await fetch(url(path), { method: 'DELETE' });
        if (!r.ok) throw new Error(`DELETE ${path}: ${r.status}`);
    }
    async function dbPost(path, data) {
        const r = await fetch(url(path), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!r.ok) throw new Error(`POST ${path}: ${r.status}`);
        return r.json();
    }

    // ===== Identity / lookup =====

    async function ensureMyLookup() {
        const me = await getMyProfile();
        if (!me?.email || !me?.uid) return;
        const slug = emailSlug(me.email);
        if (!slug) return;
        await dbPut(`lookups/email/${slug}`, {
            uid: me.uid,
            displayName: me.displayName || me.email,
        });
    }

    async function findUserByEmail(email) {
        const slug = emailSlug(email);
        if (!slug) return null;
        const lookup = await dbGet(`lookups/email/${slug}`);
        if (!lookup?.uid) return null;
        return {
            uid: lookup.uid,
            displayName: lookup.displayName || email,
            email: String(email).toLowerCase().trim(),
        };
    }

    async function getProfile(uid) {
        if (!uid) return null;
        const p = await dbGet(`users/${uid}/profile`);
        if (!p) return null;
        return { uid, displayName: p.displayName || p.email || uid, email: p.email || '' };
    }

    // ===== Friends =====

    async function listFriends() {
        const me = getUid();
        const data = await dbGet(`users/${me}/friends`);
        if (!data) return [];
        return Object.entries(data).map(([uid, f]) => ({
            uid,
            displayName: f.displayName || uid,
            email: f.email || '',
            status: f.status || 'accepted',
            since: f.since || 0,
        })).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    async function listIncoming() {
        const me = getUid();
        const data = await dbGet(`users/${me}/incoming`);
        if (!data) return [];
        return Object.entries(data).map(([uid, f]) => ({
            uid,
            displayName: f.displayName || uid,
            email: f.email || '',
            status: 'pending',
            since: f.since || 0,
            message: f.message || '',
        })).sort((a, b) => b.since - a.since);
    }

    async function sendFriendRequest(toUid, toProfile, message = '') {
        const me = await getMyProfile();
        if (!me?.uid) throw new Error('Niet ingelogd');
        if (toUid === me.uid) throw new Error('Kan jezelf niet toevoegen');

        const existing = await dbGet(`users/${me.uid}/friends/${toUid}`);
        if (existing) throw new Error('Deze gebruiker is al een vriend (of pending)');

        const since = Date.now();
        // Schrijf op mijn kant: pending outgoing
        await dbPut(`users/${me.uid}/friends/${toUid}`, {
            status: 'pending',
            since,
            displayName: toProfile.displayName,
            email: toProfile.email,
            outgoing: true,
        });
        // Schrijf bij ontvanger: incoming
        await dbPut(`users/${toUid}/incoming/${me.uid}`, {
            since,
            displayName: me.displayName,
            email: me.email,
            message,
        });
    }

    async function acceptFriendRequest(fromUid) {
        const me = await getMyProfile();
        if (!me?.uid) throw new Error('Niet ingelogd');

        const incoming = await dbGet(`users/${me.uid}/incoming/${fromUid}`);
        if (!incoming) throw new Error('Geen verzoek gevonden');

        const since = Date.now();
        // Op mijn kant: voeg toe als accepted, verwijder incoming
        await dbPut(`users/${me.uid}/friends/${fromUid}`, {
            status: 'accepted',
            since,
            displayName: incoming.displayName,
            email: incoming.email,
        });
        await dbDelete(`users/${me.uid}/incoming/${fromUid}`);
        // Bij hen: update pending → accepted
        await dbPut(`users/${fromUid}/friends/${me.uid}`, {
            status: 'accepted',
            since,
            displayName: me.displayName,
            email: me.email,
        });
    }

    async function declineFriendRequest(fromUid) {
        const me = getUid();
        await dbDelete(`users/${me}/incoming/${fromUid}`);
        // Verwijder ook de pending-outgoing aan hun kant zodat ze 'm opnieuw kunnen sturen
        try { await dbDelete(`users/${fromUid}/friends/${me}`); } catch {}
    }

    async function removeFriend(uid) {
        const me = getUid();
        await dbDelete(`users/${me}/friends/${uid}`);
        try { await dbDelete(`users/${uid}/friends/${me}`); } catch {}
    }

    // ===== Chat =====

    async function listChats() {
        const me = getUid();
        const indexData = await dbGet(`users/${me}/chats`);
        if (!indexData) return [];

        const chats = await Promise.all(Object.entries(indexData).map(async ([chatId, idx]) => {
            const meta = await dbGet(`chats/${chatId}/meta`).catch(() => null);
            const otherUid = otherMemberUid(chatId, me);
            const friend = await dbGet(`users/${me}/friends/${otherUid}`).catch(() => null);
            return {
                chatId,
                otherUid,
                otherDisplayName: friend?.displayName || meta?.lastFromName || otherUid,
                lastMessage: meta?.lastMessage || '',
                lastTs: meta?.lastTs || 0,
                lastFrom: meta?.lastFrom || '',
                unread: idx?.unread || 0,
                lastSeenTs: idx?.lastSeenTs || 0,
            };
        }));
        return chats.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
    }

    async function loadMessages(chatId, { limit = 100 } = {}) {
        // Firebase RTDB orderBy + limitToLast vereist .indexOn op de path
        const tok = getToken();
        const base = `${databaseURL.replace(/\/+$/, '')}/${root}chats/${chatId}/messages.json`;
        const params = new URLSearchParams({ orderBy: '"ts"', limitToLast: String(limit) });
        if (tok) params.set('auth', tok);
        const u = `${base}?${params.toString()}`;
        const r = await fetch(u);
        if (!r.ok) throw new Error(`loadMessages: ${r.status}`);
        const data = await r.json();
        if (!data) return [];
        return Object.entries(data)
            .map(([id, m]) => ({ id, from: m.from, text: m.text, ts: m.ts }))
            .sort((a, b) => a.ts - b.ts);
    }

    async function sendMessage(chatId, otherUid, text) {
        const me = await getMyProfile();
        if (!me?.uid) throw new Error('Niet ingelogd');
        const trimmed = String(text || '').trim();
        if (!trimmed) return;

        const ts = Date.now();
        // Push message
        const pushRes = await dbPost(`chats/${chatId}/messages`, {
            from: me.uid,
            text: trimmed,
            ts,
        });
        // Update meta (geen members-write — die wordt initialiseerd op chat-creation)
        const metaExists = await dbGet(`chats/${chatId}/meta/members/${me.uid}`);
        if (!metaExists) {
            // First message → bootstrap meta
            await dbPatch(`chats/${chatId}/meta`, {
                [`members/${me.uid}`]: true,
                [`members/${otherUid}`]: true,
                lastMessage: trimmed.slice(0, 200),
                lastTs: ts,
                lastFrom: me.uid,
                lastFromName: me.displayName,
            });
        } else {
            await dbPatch(`chats/${chatId}/meta`, {
                lastMessage: trimmed.slice(0, 200),
                lastTs: ts,
                lastFrom: me.uid,
                lastFromName: me.displayName,
            });
        }
        // Index entries voor beide users — sender lastSeen=now (heeft 'm net verstuurd)
        await dbPatch(`users/${me.uid}/chats/${chatId}`, { lastSeenTs: ts, unread: 0 });
        // Receiver: increment unread (transactioneel-onveilig maar OK voor v1)
        const recvIdx = await dbGet(`users/${otherUid}/chats/${chatId}`).catch(() => null);
        await dbPatch(`users/${otherUid}/chats/${chatId}`, {
            unread: (recvIdx?.unread || 0) + 1,
            lastTs: ts,
        });
        return pushRes?.name;
    }

    async function markRead(chatId) {
        const me = getUid();
        await dbPatch(`users/${me}/chats/${chatId}`, {
            unread: 0,
            lastSeenTs: Date.now(),
        });
    }

    // ===== Realtime via EventSource (SSE) =====
    // Firebase RTDB ondersteunt Accept: text/event-stream. Browser EventSource
    // kan geen custom headers, maar `auth` als query-param werkt prima.

    function makeSSE(path, onValue, onError) {
        let es = null;
        let stopped = false;
        let pollFallback = null;
        // Lokale snapshot van de subscribed sub-tree. Firebase SSE stuurt
        // diff-events: {path: "/", data: {...full root...}} bij init,
        // daarna {path: "/<childKey>", data: {...}} bij wijzigingen.
        // We mergen die in `snapshot` en emitten altijd de volledige tree
        // zodat consumers (friends-page, chat-list) niet hun eigen merge-logic
        // hoeven te schrijven.
        let snapshot = null;

        function applyDiff(diffPath, diffData) {
            const segs = String(diffPath || '/').split('/').filter(Boolean);
            if (segs.length === 0) {
                // Root replace
                snapshot = (diffData === null || diffData === undefined) ? null : diffData;
                return;
            }
            // Diepere paden: zorg dat snapshot een object is en navigeer/maak
            if (snapshot === null || typeof snapshot !== 'object') snapshot = {};
            let node = snapshot;
            for (let i = 0; i < segs.length - 1; i++) {
                const key = segs[i];
                if (node[key] === null || typeof node[key] !== 'object') node[key] = {};
                node = node[key];
            }
            const lastKey = segs[segs.length - 1];
            if (diffData === null || diffData === undefined) {
                delete node[lastKey];
            } else {
                node[lastKey] = diffData;
            }
        }

        function applyPatch(diffPath, diffData) {
            // Patch is shallow merge op het opgegeven path (kind van root)
            const segs = String(diffPath || '/').split('/').filter(Boolean);
            if (snapshot === null || typeof snapshot !== 'object') snapshot = {};
            let node = snapshot;
            for (let i = 0; i < segs.length; i++) {
                const key = segs[i];
                if (node[key] === null || typeof node[key] !== 'object') node[key] = {};
                node = node[key];
            }
            for (const [k, v] of Object.entries(diffData || {})) {
                if (v === null || v === undefined) delete node[k];
                else node[k] = v;
            }
        }

        function startPolling() {
            let lastJson = '';
            const tick = async () => {
                if (stopped) return;
                try {
                    const data = await dbGet(path);
                    const json = JSON.stringify(data);
                    if (json !== lastJson) {
                        lastJson = json;
                        snapshot = data;
                        onValue(snapshot);
                    }
                } catch (e) {
                    onError?.(e);
                }
            };
            tick();
            pollFallback = setInterval(tick, 4000);
        }

        function connect() {
            if (stopped) return;
            try {
                es = new EventSource(url(path));
                es.addEventListener('put', (e) => {
                    try {
                        const msg = JSON.parse(e.data);
                        applyDiff(msg.path, msg.data);
                        onValue(snapshot, 'put');
                    } catch (err) { onError?.(err); }
                });
                es.addEventListener('patch', (e) => {
                    try {
                        const msg = JSON.parse(e.data);
                        applyPatch(msg.path, msg.data);
                        onValue(snapshot, 'patch');
                    } catch (err) { onError?.(err); }
                });
                es.addEventListener('keep-alive', () => {});
                es.addEventListener('cancel', () => {
                    es?.close();
                    if (!stopped) startPolling();
                });
                es.addEventListener('auth_revoked', () => {
                    es?.close();
                    setTimeout(connect, 1000);
                });
                es.onerror = () => {
                    es?.close();
                    if (!stopped) {
                        // Switch naar polling als SSE blijft falen
                        if (!pollFallback) startPolling();
                    }
                };
            } catch (e) {
                onError?.(e);
                startPolling();
            }
        }

        connect();

        return () => {
            stopped = true;
            es?.close();
            if (pollFallback) clearInterval(pollFallback);
        };
    }

    function subscribeFriends(callback) {
        const me = getUid();
        let friendsSnap = null;
        let incomingSnap = null;
        const emit = () => {
            const friends = friendsSnap
                ? Object.entries(friendsSnap).map(([uid, f]) => ({
                    uid, ...f, status: f.status || 'accepted',
                }))
                : [];
            const incoming = incomingSnap
                ? Object.entries(incomingSnap).map(([uid, f]) => ({
                    uid, ...f, status: 'pending',
                }))
                : [];
            callback({ friends, incoming });
        };
        const unF = makeSSE(`users/${me}/friends`, (d) => { friendsSnap = d; emit(); });
        const unI = makeSSE(`users/${me}/incoming`, (d) => { incomingSnap = d; emit(); });
        return () => { unF(); unI(); };
    }

    function subscribeChatList(callback) {
        const me = getUid();
        return makeSSE(`users/${me}/chats`, async () => {
            const chats = await listChats().catch(() => []);
            callback(chats);
        });
    }

    function subscribeMessages(chatId, callback) {
        // SSE op de hele messages-collection. Bij elke put/patch herladen we
        // (eenvoudiger dan delta-management; messages-pagina is klein).
        return makeSSE(`chats/${chatId}/messages`, async () => {
            const msgs = await loadMessages(chatId, { limit: 200 }).catch(() => []);
            callback(msgs);
        });
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
        subscribeFriends,
        // chat
        chatIdFor,
        listChats,
        loadMessages,
        sendMessage,
        markRead,
        subscribeChatList,
        subscribeMessages,
    };
}
