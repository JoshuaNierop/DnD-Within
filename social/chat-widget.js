// social/chat-widget.js — Floating chat widget (bottom-right).
// The DOM is built once; the chat list and the message list re-render on their
// own, so the textarea (and whatever you are typing) is never replaced.

import { escHtml, formatRelativeTime, chatIdFor } from './core.js';

function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
}

function timeOf(ts) {
    return ts ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
}

function dayLabel(ts) {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short',
        year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

const ICONS = {
    chat: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
};

export function mountChatWidget(host, adapter, opts = {}) {
    const { onUnreadChange } = opts;
    const myUid = () => adapter.getCurrentUid();

    const root = document.createElement('div');
    root.id = 'social-chat-widget';
    root.innerHTML = `
        <button class="scw-fab" id="scw-fab" type="button" aria-label="Open chat" aria-expanded="false">
            ${ICONS.chat}<span class="scw-badge" hidden></span>
        </button>
        <div class="scw-panel" role="dialog" aria-label="Chat" hidden>
            <div class="scw-header">
                <button type="button" class="scw-back" aria-label="Back" hidden>${ICONS.back}</button>
                <div class="title">Chats</div>
                <button type="button" class="scw-close" aria-label="Close">${ICONS.close}</button>
            </div>
            <div class="scw-offline" hidden>Offline — messages are sent when the connection is back.</div>
            <div class="scw-body scw-list"></div>
            <div class="scw-conv" hidden>
                <div class="scw-msgs" aria-live="polite"></div>
                <form class="scw-input">
                    <textarea rows="1" placeholder="Message…" maxlength="2000" aria-label="Message"></textarea>
                    <button type="submit" aria-label="Send" title="Send (Enter)">${ICONS.send}</button>
                </form>
            </div>
        </div>
    `;
    host.appendChild(root);

    const el = {
        fab: root.querySelector('.scw-fab'),
        badge: root.querySelector('.scw-badge'),
        panel: root.querySelector('.scw-panel'),
        back: root.querySelector('.scw-back'),
        title: root.querySelector('.scw-header .title'),
        close: root.querySelector('.scw-close'),
        offline: root.querySelector('.scw-offline'),
        list: root.querySelector('.scw-list'),
        conv: root.querySelector('.scw-conv'),
        msgs: root.querySelector('.scw-msgs'),
        form: root.querySelector('.scw-input'),
        ta: root.querySelector('.scw-input textarea'),
    };

    const state = {
        open: false,
        view: 'list',          // 'list' | 'chat'
        chats: [],
        listReady: false,
        active: null,          // { chatId, otherUid, name }
        messages: [],          // sorted by id (push keys are chronological)
        msgsReady: false,
        msgsError: false,
        pending: new Set(),    // keys written locally, not yet confirmed by the server
        drafts: new Map(),     // chatId → unsent text
    };

    let unsubMsgs = null;
    let msgsFrame = 0;
    const notifiedTs = new Map(); // chatId → lastTs already notified/seen
    const mountedAt = Date.now(); // never notify messages older than the widget

    // ===== Unread =====
    function totalUnread() {
        return state.chats.reduce((sum, c) => sum + (c.unread || 0), 0);
    }

    function renderUnread() {
        const n = totalUnread();
        el.badge.hidden = !n;
        el.badge.textContent = n > 99 ? '99+' : String(n);
        // The dashboard bottom-bar chat button reads this (see social.css)
        const html = document.documentElement;
        if (n) {
            html.dataset.chatUnread = String(n);
            html.style.setProperty('--chat-unread', String(Math.min(n, 99)));
        } else {
            delete html.dataset.chatUnread;
        }
        try { onUnreadChange?.(n); } catch {}
    }

    // ===== Chat list =====
    function renderList() {
        if (!state.listReady) {
            el.list.innerHTML = '<div class="scw-empty">Loading chats…</div>';
            return;
        }
        if (!state.chats.length) {
            el.list.innerHTML = '<div class="scw-empty">No one to chat with yet. Party members appear here automatically.</div>';
            return;
        }
        const me = myUid();
        el.list.innerHTML = state.chats.map(c => `
            <button type="button" class="scw-chat-row${c.unread ? ' has-unread' : ''}" data-chat="${escHtml(c.chatId)}">
                <span class="scw-avatar">${escHtml(initials(c.otherDisplayName))}</span>
                <span class="info">
                    <span class="name">${escHtml(c.otherDisplayName)}</span>
                    <span class="preview">${c.lastMessage
                        ? (c.lastFrom === me ? 'You: ' : '') + escHtml(c.lastMessage)
                        : '<em>Start a conversation</em>'}</span>
                </span>
                <span class="meta">
                    <span class="ts">${escHtml(formatRelativeTime(c.lastTs))}</span>
                    ${c.unread ? `<span class="unread">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
                </span>
            </button>
        `).join('');
    }

    function onChatList(chats) {
        state.chats = chats || [];
        state.listReady = true;
        renderUnread();
        notifyNew();
        if (state.view === 'list') renderList();
        if (state.view === 'chat' && state.active) {
            // Keep the header name fresh and clear unread for the open chat
            const c = state.chats.find(x => x.chatId === state.active.chatId);
            if (c) {
                state.active.name = c.otherDisplayName;
                el.title.textContent = c.otherDisplayName;
                if (c.unread) maybeMarkRead();
            }
        }
    }

    // ===== Messages =====
    function scheduleMsgsRender() {
        if (msgsFrame) return;
        msgsFrame = requestAnimationFrame(() => { msgsFrame = 0; renderMessages(); });
    }

    function renderMessages(forceBottom) {
        const box = el.msgs;
        const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        if (state.msgsError) {
            box.innerHTML = '<div class="scw-empty">Could not load messages. Check your connection and try again.</div>';
            return;
        }
        if (!state.msgsReady && !state.messages.length) {
            box.innerHTML = '<div class="scw-empty">Loading messages…</div>';
            return;
        }
        if (!state.messages.length) {
            box.innerHTML = `<div class="scw-empty">No messages yet. Say hi to ${escHtml(state.active?.name || '')}!</div>`;
            return;
        }
        const me = myUid();
        let lastDay = '';
        let prevFrom = null;
        const out = [];
        for (const m of state.messages) {
            const ts = m.ts || Date.now();
            const day = new Date(ts).toDateString();
            if (day !== lastDay) {
                out.push(`<div class="scw-day">${escHtml(dayLabel(ts))}</div>`);
                lastDay = day;
                prevFrom = null;
            }
            const pending = state.pending.has(m.id);
            const cls = ['scw-msg', m.from === me ? 'mine' : 'theirs'];
            if (m.from === prevFrom) cls.push('cont');
            if (pending) cls.push('pending');
            out.push(`<div class="${cls.join(' ')}">${escHtml(m.text)}<span class="ts">${pending ? 'Sending…' : escHtml(timeOf(m.ts))}</span></div>`);
            prevFrom = m.from;
        }
        box.innerHTML = out.join('');
        if (forceBottom || nearBottom) box.scrollTop = box.scrollHeight;
    }

    function onMessageEvent(chatId, type, msg) {
        if (!state.active || state.active.chatId !== chatId) return;
        let forceBottom = false;
        if (type === 'ready') {
            state.msgsReady = true;
            forceBottom = true;
        } else if (type === 'error') {
            state.msgsError = true;
        } else if (type === 'add' || type === 'change') {
            const i = state.messages.findIndex(m => m.id === msg.id);
            if (i >= 0) state.messages[i] = msg;
            else {
                // Nearly always appended at the end; keep the list sorted by key anyway
                let j = state.messages.length;
                while (j > 0 && state.messages[j - 1].id > msg.id) j--;
                state.messages.splice(j, 0, msg);
                if (msg.from === myUid()) forceBottom = true;
            }
        } else if (type === 'remove') {
            state.messages = state.messages.filter(m => m.id !== msg.id);
        }
        if (forceBottom) {
            cancelAnimationFrame(msgsFrame);
            msgsFrame = 0;
            renderMessages(true);
        } else {
            scheduleMsgsRender();
        }
        if (type === 'add' && msg.from !== myUid() && state.msgsReady) maybeMarkRead();
    }

    function maybeMarkRead() {
        if (!state.open || state.view !== 'chat' || !state.active) return;
        if (document.visibilityState !== 'visible') return;
        adapter.markRead(state.active.chatId).catch(e => console.warn('[social] markRead:', e));
    }

    // ===== Views =====
    function setOpen(open) {
        state.open = open;
        el.panel.hidden = !open;
        el.fab.setAttribute('aria-expanded', String(open));
        root.classList.toggle('is-open', open);
        if (open && state.view === 'chat') {
            maybeMarkRead();
            el.ta.focus();
        }
    }

    function showList() {
        saveDraft();
        stopConversation();
        state.view = 'list';
        el.back.hidden = true;
        el.title.textContent = 'Chats';
        el.conv.hidden = true;
        el.list.hidden = false;
        renderList();
        setOpen(true);
    }

    function stopConversation() {
        try { unsubMsgs?.(); } catch {}
        unsubMsgs = null;
        state.active = null;
        state.messages = [];
        state.msgsReady = false;
        state.msgsError = false;
    }

    function openConversation({ chatId, otherUid, otherName }) {
        if (state.active?.chatId === chatId && state.view === 'chat') { setOpen(true); return; }
        saveDraft();
        stopConversation();
        state.view = 'chat';
        state.active = { chatId, otherUid, name: otherName || otherUid };
        el.back.hidden = false;
        el.title.textContent = state.active.name;
        el.list.hidden = true;
        el.conv.hidden = false;
        el.ta.value = state.drafts.get(chatId) || '';
        autoGrow();
        renderMessages(true);
        unsubMsgs = adapter.subscribeMessages(chatId, (type, msg) => onMessageEvent(chatId, type, msg));
        setOpen(true);
    }

    function closeWidget() {
        saveDraft();
        setOpen(false);
    }

    function toggle() {
        if (state.open) closeWidget();
        else if (state.view === 'chat' && state.active) setOpen(true);
        else showList();
    }

    function saveDraft() {
        if (!state.active) return;
        const v = el.ta.value;
        if (v.trim()) state.drafts.set(state.active.chatId, v);
        else state.drafts.delete(state.active.chatId);
    }

    function autoGrow() {
        el.ta.style.height = 'auto';
        const h = el.ta.scrollHeight + 2; // + top/bottom border (border-box)
        el.ta.style.height = Math.min(h, 120) + 'px';
        el.ta.style.overflowY = h > 120 ? 'auto' : 'hidden';
    }

    // ===== Sending =====
    function send() {
        const text = el.ta.value.trim();
        if (!text || !state.active) return;
        const { chatId, otherUid } = state.active;
        el.ta.value = '';
        autoGrow();
        state.drafts.delete(chatId);
        const p = adapter.sendMessage(chatId, otherUid, text);
        if (p?.key) state.pending.add(p.key);
        Promise.resolve(p).then(() => {
            state.pending.delete(p?.key);
            if (state.active?.chatId === chatId) scheduleMsgsRender();
        }).catch((err) => {
            state.pending.delete(p?.key);
            console.warn('[social] send:', err);
            // Give the text back so nothing is lost
            if (state.active?.chatId === chatId && !el.ta.value) { el.ta.value = text; autoGrow(); }
            else if (!state.drafts.has(chatId)) state.drafts.set(chatId, text);
            const msg = 'Your message could not be sent' + (err?.message ? ': ' + err.message : '.');
            if (typeof window.showAlertModal === 'function') {
                window.showAlertModal({ title: 'Message not sent', message: msg });
            }
        });
        el.ta.focus();
    }

    // ===== Notifications =====
    function notifyNew() {
        const me = myUid();
        for (const c of state.chats) {
            const seen = notifiedTs.get(c.chatId) || 0;
            if (!c.lastTs || c.lastTs <= seen) continue;
            notifiedTs.set(c.chatId, c.lastTs);
            if (c.lastTs <= mountedAt || c.lastFrom === me || c.lastTs <= c.lastSeenTs) continue;
            const viewing = state.open && state.view === 'chat' && state.active?.chatId === c.chatId;
            if (viewing && document.visibilityState === 'visible') continue;
            if (document.visibilityState === 'visible') {
                if (typeof window.showToast === 'function') {
                    window.showToast(`💬 ${c.otherDisplayName}: ${c.lastMessage.slice(0, 80)}`, 'info');
                }
            } else {
                browserNotify(c);
            }
        }
    }

    function browserNotify(chat) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const n = new Notification(`New message from ${chat.otherDisplayName}`, {
                body: chat.lastMessage || '',
                tag: chat.chatId,
            });
            n.onclick = () => {
                window.focus();
                openConversation({ chatId: chat.chatId, otherUid: chat.otherUid, otherName: chat.otherDisplayName });
                n.close();
            };
        } catch {}
    }

    function askNotifyPermission() {
        // Must come from a user gesture; asked once, the first time the chat is opened
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }

    // ===== Events =====
    el.fab.addEventListener('click', () => { askNotifyPermission(); toggle(); });
    el.close.addEventListener('click', closeWidget);
    el.back.addEventListener('click', showList);
    el.list.addEventListener('click', (e) => {
        const row = e.target.closest('.scw-chat-row');
        if (!row) return;
        const c = state.chats.find(x => x.chatId === row.dataset.chat);
        if (c) openConversation({ chatId: c.chatId, otherUid: c.otherUid, otherName: c.otherDisplayName });
    });
    el.form.addEventListener('submit', (e) => { e.preventDefault(); send(); });
    el.ta.addEventListener('input', autoGrow);
    el.ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            send();
        }
    });
    root.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !state.open) return;
        e.stopPropagation();
        closeWidget();
        el.fab.focus();
    });

    function onVisibility() {
        if (document.visibilityState === 'visible') {
            const c = state.active && state.chats.find(x => x.chatId === state.active.chatId);
            if (c?.unread) maybeMarkRead();
        }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // "Open chat" from the Friends page
    function onOpenChatEvent(e) {
        const otherUid = e.detail?.uid;
        if (!otherUid) return;
        const known = state.chats.find(c => c.otherUid === otherUid);
        openConversation({
            chatId: chatIdFor(myUid(), otherUid),
            otherUid,
            otherName: e.detail?.name || known?.otherDisplayName || otherUid,
        });
    }
    window.addEventListener('social:open-chat', onOpenChatEvent);

    // Live chat list (also while closed, for the unread badge + notifications)
    const unsubChats = adapter.subscribeChatList(onChatList);

    // Offline banner — only after a grace period, so the initial connect doesn't flash it
    let offlineTimer = 0;
    const unsubConn = adapter.subscribeConnection?.((connected) => {
        clearTimeout(offlineTimer);
        if (connected) el.offline.hidden = true;
        else offlineTimer = setTimeout(() => { el.offline.hidden = false; }, 4000);
    });

    renderList();
    renderUnread();

    return {
        open: () => showList(),
        toggle,
        openWith: (uid, name) => openConversation({ chatId: chatIdFor(myUid(), uid), otherUid: uid, otherName: name }),
        close: () => closeWidget(),
        destroy() {
            try { unsubChats?.(); } catch {}
            try { unsubConn?.(); } catch {}
            stopConversation();
            clearTimeout(offlineTimer);
            cancelAnimationFrame(msgsFrame);
            window.removeEventListener('social:open-chat', onOpenChatEvent);
            document.removeEventListener('visibilitychange', onVisibility);
            delete document.documentElement.dataset.chatUnread;
            root.remove();
        },
    };
}
