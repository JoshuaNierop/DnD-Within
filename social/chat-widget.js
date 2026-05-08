// social/ui/chat-widget.js — Floating chat widget (bottom-right).
// Modes: closed (FAB), list, conversation.

import { escHtml, formatRelativeTime, chatIdFor } from './core.js';

function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
}

const ICONS = {
    chat: `<svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="15 18 9 12 15 6"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

export function mountChatWidget(host, adapter, opts = {}) {
    const { onUnreadChange } = opts;

    const root = document.createElement('div');
    root.id = 'social-chat-widget';
    host.appendChild(root);

    const state = {
        mode: 'closed', // 'closed' | 'list' | 'chat'
        chats: [],
        activeChatId: null,
        activeOtherUid: null,
        activeOtherName: '',
        messages: [],
        loadingMsgs: false,
        sending: false,
    };

    let unsubChats = null;
    let unsubMsgs = null;
    let lastNotifiedTs = Date.now();

    function totalUnread() {
        return state.chats.reduce((sum, c) => sum + (c.unread || 0), 0);
    }

    function notifyUnread() {
        try { onUnreadChange?.(totalUnread()); } catch {}
    }

    function render() {
        if (state.mode === 'closed') {
            const unread = totalUnread();
            root.innerHTML = `
                <button class="scw-fab" id="scw-fab" aria-label="Open chat">
                    ${ICONS.chat}
                    ${unread ? `<span class="scw-badge">${unread > 99 ? '99+' : unread}</span>` : ''}
                </button>
            `;
            root.querySelector('#scw-fab').addEventListener('click', () => openList());
            return;
        }

        if (state.mode === 'list') {
            root.innerHTML = `
                <div class="scw-panel">
                    <div class="scw-header">
                        <div class="title">Chats</div>
                        <button id="scw-close" aria-label="Sluiten">${ICONS.close}</button>
                    </div>
                    <div class="scw-body">
                        ${state.chats.length === 0 ? `
                            <div class="scw-empty">
                                Nog geen chats. Open een vriend via de Friends-pagina om te beginnen.
                            </div>
                        ` : state.chats.map(c => `
                            <div class="scw-chat-row" data-chat="${escHtml(c.chatId)}" data-uid="${escHtml(c.otherUid)}" data-name="${escHtml(c.otherDisplayName)}">
                                <div class="scw-avatar">${escHtml(initials(c.otherDisplayName))}</div>
                                <div class="info">
                                    <div class="name">${escHtml(c.otherDisplayName)}</div>
                                    <div class="preview">${c.lastFrom === adapter.getCurrentUid() ? 'Jij: ' : ''}${escHtml(c.lastMessage || '—')}</div>
                                </div>
                                <div class="meta">
                                    <span class="ts">${escHtml(formatRelativeTime(c.lastTs))}</span>
                                    ${c.unread ? `<span class="unread">${c.unread > 99 ? '99+' : c.unread}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            root.querySelector('#scw-close').addEventListener('click', () => closeWidget());
            root.querySelectorAll('.scw-chat-row').forEach(row => {
                row.addEventListener('click', () => {
                    openConversation({
                        chatId: row.dataset.chat,
                        otherUid: row.dataset.uid,
                        otherName: row.dataset.name,
                    });
                });
            });
            return;
        }

        if (state.mode === 'chat') {
            root.innerHTML = `
                <div class="scw-panel">
                    <div class="scw-header">
                        <button id="scw-back" aria-label="Terug">${ICONS.back}</button>
                        <div class="title">${escHtml(state.activeOtherName)}</div>
                        <button id="scw-close" aria-label="Sluiten">${ICONS.close}</button>
                    </div>
                    <div class="scw-msgs" id="scw-msgs">
                        ${state.loadingMsgs ? '<div class="scw-empty">Berichten laden…</div>' : renderMessages()}
                    </div>
                    <form class="scw-input" id="scw-form">
                        <textarea id="scw-text" rows="1" placeholder="Bericht..." ${state.sending ? 'disabled' : ''}></textarea>
                        <button type="submit" ${state.sending ? 'disabled' : ''}>Stuur</button>
                    </form>
                </div>
            `;
            root.querySelector('#scw-close').addEventListener('click', () => closeWidget());
            root.querySelector('#scw-back').addEventListener('click', () => openList());
            const form = root.querySelector('#scw-form');
            const ta = root.querySelector('#scw-text');
            ta.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    form.requestSubmit();
                }
                // Auto-grow
                ta.style.height = 'auto';
                ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
            });
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = ta.value.trim();
                if (!text || state.sending) return;
                state.sending = true;
                ta.disabled = true;
                try {
                    await adapter.sendMessage(state.activeChatId, state.activeOtherUid, text);
                    ta.value = '';
                    ta.style.height = 'auto';
                    const myUid = adapter.getCurrentUid();
                    state.messages = [
                        ...state.messages,
                        { id: `_pending_${Date.now()}`, from: myUid, text, ts: Date.now() },
                    ];
                    state.sending = false;
                    if (state.mode === 'chat' && state.activeChatId) {
                        render();
                        scrollMsgsToBottom();
                    }
                    return;
                } catch (err) {
                    alert('Bericht verzenden mislukt: ' + (err.message || err));
                } finally {
                    state.sending = false;
                    ta.disabled = false;
                    ta.focus();
                }
            });
            ta.focus();
            scrollMsgsToBottom();
        }
    }

    function renderMessages() {
        if (!state.messages.length) {
            return '<div class="scw-empty">Nog geen berichten. Stuur de eerste!</div>';
        }
        const myUid = adapter.getCurrentUid();
        return state.messages.map(m => `
            <div class="scw-msg ${m.from === myUid ? 'mine' : 'theirs'}">
                ${escHtml(m.text)}
                <span class="ts">${escHtml(formatRelativeTime(m.ts))}</span>
            </div>
        `).join('');
    }

    function scrollMsgsToBottom() {
        const el = root.querySelector('#scw-msgs');
        if (el) el.scrollTop = el.scrollHeight;
    }

    function openList() {
        state.mode = 'list';
        if (!unsubChats) {
            unsubChats = adapter.subscribeChatList((chats) => {
                state.chats = chats || [];
                notifyUnread();
                maybeBrowserNotify();
                if (state.mode === 'list') render();
                else if (state.mode === 'closed') render();
            });
        }
        render();
    }

    function closeWidget() {
        state.mode = 'closed';
        try { unsubMsgs?.(); } catch {} unsubMsgs = null;
        state.activeChatId = null;
        state.activeOtherUid = null;
        state.messages = [];
        render();
    }

    async function openConversation({ chatId, otherUid, otherName }) {
        state.mode = 'chat';
        state.activeChatId = chatId;
        state.activeOtherUid = otherUid;
        state.activeOtherName = otherName || otherUid;
        state.messages = [];
        state.loadingMsgs = true;
        render();

        try {
            state.messages = await adapter.loadMessages(chatId, { limit: 200 });
        } catch (e) {
            console.warn('loadMessages:', e);
        }
        state.loadingMsgs = false;
        render();
        scrollMsgsToBottom();

        try { adapter.markRead(chatId); } catch {}

        try { unsubMsgs?.(); } catch {}
        unsubMsgs = adapter.subscribeMessages(chatId, (msgs) => {
            state.messages = msgs || [];
            if (state.mode === 'chat' && state.activeChatId === chatId) {
                render();
                scrollMsgsToBottom();
                try { adapter.markRead(chatId); } catch {}
            }
        });
    }

    async function maybeBrowserNotify() {
        // Bij nieuw bericht (lastTs > lastNotifiedTs) van iemand anders, en widget niet open op die chat
        for (const c of state.chats) {
            if (c.lastTs > lastNotifiedTs && c.lastFrom !== adapter.getCurrentUid()) {
                if (state.mode !== 'chat' || state.activeChatId !== c.chatId) {
                    showNotification(c);
                }
            }
        }
        lastNotifiedTs = Date.now();
    }

    function showNotification(chat) {
        if (!('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        if (document.visibilityState === 'visible' && state.mode === 'chat' && state.activeChatId === chat.chatId) return;
        try {
            const n = new Notification(`Nieuw bericht van ${chat.otherDisplayName}`, {
                body: chat.lastMessage || '',
                tag: chat.chatId,
                silent: false,
            });
            n.onclick = () => {
                window.focus();
                openConversation({
                    chatId: chat.chatId,
                    otherUid: chat.otherUid,
                    otherName: chat.otherDisplayName,
                });
                n.close();
            };
        } catch {}
    }

    // Listen voor "open-chat" event vanuit Friends-page
    window.addEventListener('social:open-chat', async (e) => {
        const otherUid = e.detail?.uid;
        if (!otherUid) return;
        const myUid = adapter.getCurrentUid();
        const id = chatIdFor(myUid, otherUid);
        // Naam komt mee in event (friends-page kent 'm); profile-read is geblokkeerd voor non-owner
        let name = e.detail?.name;
        if (!name) {
            const friends = await adapter.listFriends().catch(() => []);
            name = friends.find(f => f.uid === otherUid)?.displayName || otherUid;
        }
        openConversation({ chatId: id, otherUid, otherName: name });
    });

    // Initialize: subscribe to chat list zelfs als widget closed (voor unread-badge + notifications)
    unsubChats = adapter.subscribeChatList((chats) => {
        state.chats = chats || [];
        notifyUnread();
        maybeBrowserNotify();
        if (state.mode === 'closed' || state.mode === 'list') render();
    });

    render();

    return {
        open: () => openList(),
        openWith: (uid, name) => {
            const myUid = adapter.getCurrentUid();
            openConversation({ chatId: chatIdFor(myUid, uid), otherUid: uid, otherName: name });
        },
        close: () => closeWidget(),
        destroy() {
            try { unsubChats?.(); } catch {}
            try { unsubMsgs?.(); } catch {}
            host.removeChild(root);
        },
    };
}
