// social/ui/friends-page.js — Friends tab: list + requests + add-by-email.

import { escHtml, formatRelativeTime } from './core.js';

function initials(name) {
    const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || '?';
}

export function renderFriendsPage(host, adapter) {
    let activeTab = 'friends'; // 'friends' | 'requests'
    let friends = [];
    let incoming = [];
    let status = null; // {type:'error'|'ok', text:string}
    let loading = true;
    let unsubscribe = null;

    const root = document.createElement('div');
    root.className = 'social-root';
    host.innerHTML = '';
    host.appendChild(root);

    function setStatus(type, text, ms = 3000) {
        status = { type, text };
        render();
        if (ms) setTimeout(() => { status = null; render(); }, ms);
    }

    function render() {
        const incomingCount = incoming.length;
        root.innerHTML = `
            <h1>Friends</h1>

            <form class="soc-add-form" id="soc-add">
                <input type="email" id="soc-email" placeholder="Enter your friend's e-mail..." autocomplete="off" required>
                <button type="submit" class="soc-btn">Send request</button>
            </form>

            ${status ? `<div class="soc-status ${status.type}">${escHtml(status.text)}</div>` : ''}

            <div class="soc-tabs">
                <button class="soc-tab ${activeTab === 'friends' ? 'active' : ''}" data-tab="friends">
                    Friends <span style="color:var(--soc-muted);">(${friends.filter(f => f.status === 'accepted').length})</span>
                </button>
                <button class="soc-tab ${activeTab === 'requests' ? 'active' : ''}" data-tab="requests">
                    Requests${incomingCount ? `<span class="soc-pill">${incomingCount}</span>` : ''}
                </button>
            </div>

            <div class="soc-list">
                ${loading ? '<div class="soc-empty">Loading…</div>' : (
                    activeTab === 'friends' ? renderFriendsList() : renderIncomingList()
                )}
            </div>
        `;
        bind();
    }

    function renderFriendsList() {
        if (!friends.length) {
            return '<div class="soc-empty">No friends yet. Add one by e-mail.</div>';
        }
        return friends.map(f => `
            <div class="soc-list-item" data-uid="${escHtml(f.uid)}">
                <div class="soc-avatar">${escHtml(initials(f.displayName))}</div>
                <div class="info">
                    <div class="name">${escHtml(f.displayName)}
                        ${f.status === 'pending' ? '<span class="soc-pending-badge">pending</span>' : ''}
                    </div>
                    <div class="email">${escHtml(f.email)}</div>
                </div>
                <div class="actions">
                    ${f.status === 'accepted' ? `
                        <button class="soc-btn" data-action="chat">Chat</button>
                    ` : ''}
                    <button class="soc-btn soc-btn-ghost" data-action="remove">Remove</button>
                </div>
            </div>
        `).join('');
    }

    function renderIncomingList() {
        if (!incoming.length) {
            return '<div class="soc-empty">No pending requests.</div>';
        }
        return incoming.map(r => `
            <div class="soc-list-item" data-uid="${escHtml(r.uid)}">
                <div class="soc-avatar">${escHtml(initials(r.displayName))}</div>
                <div class="info">
                    <div class="name">${escHtml(r.displayName)}</div>
                    <div class="email">${escHtml(r.email)} · ${escHtml(formatRelativeTime(r.since))}</div>
                </div>
                <div class="actions">
                    <button class="soc-btn soc-btn-success" data-action="accept">Accept</button>
                    <button class="soc-btn soc-btn-ghost" data-action="decline">Decline</button>
                </div>
            </div>
        `).join('');
    }

    function bind() {
        root.querySelectorAll('.soc-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                render();
            });
        });

        const form = root.querySelector('#soc-add');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = root.querySelector('#soc-email');
            const email = input.value.trim().toLowerCase();
            if (!email) return;
            const submitBtn = form.querySelector('button');
            submitBtn.disabled = true;
            try {
                const me = await adapter.getMyProfile();
                if (email === (me.email || '').toLowerCase()) {
                    throw new Error('You cannot add yourself');
                }
                const target = await adapter.findUserByEmail(email);
                if (!target) {
                    throw new Error('No user found with this e-mail address. Ask them to sign in first.');
                }
                await adapter.sendFriendRequest(target.uid, target);
                input.value = '';
                setStatus('ok', `Request sent to ${target.displayName}`);
            } catch (err) {
                setStatus('error', err.message || 'Sending failed');
            } finally {
                submitBtn.disabled = false;
            }
        });

        root.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const item = btn.closest('.soc-list-item');
                const uid = item?.dataset.uid;
                if (!uid) return;
                const action = btn.dataset.action;
                btn.disabled = true;
                try {
                    if (action === 'accept') {
                        await adapter.acceptFriendRequest(uid);
                        setStatus('ok', 'Request accepted');
                    } else if (action === 'decline') {
                        await adapter.declineFriendRequest(uid);
                        setStatus('ok', 'Request declined');
                    } else if (action === 'remove') {
                        if (!(await showConfirmModal({ message: 'Remove this friend?', confirmLabel: 'Remove', danger: true }))) { btn.disabled = false; return; }
                        await adapter.removeFriend(uid);
                        setStatus('ok', 'Friend removed');
                    } else if (action === 'chat') {
                        // Open chat widget on this friend (pass the name along — we can't read it from their profile)
                        const friend = friends.find(f => f.uid === uid);
                        window.dispatchEvent(new CustomEvent('social:open-chat', {
                            detail: { uid, name: friend?.displayName || uid },
                        }));
                    }
                } catch (err) {
                    setStatus('error', err.message || 'Action failed');
                } finally {
                    btn.disabled = false;
                }
            });
        });
    }

    // Initial load + subscribe
    (async () => {
        try {
            await adapter.ensureMyLookup();
        } catch (e) { console.warn('ensureMyLookup:', e); }

        unsubscribe = adapter.subscribeFriends(({ friends: f, incoming: i }) => {
            friends = f || [];
            incoming = i || [];
            loading = false;
            render();
        });
    })();

    render();

    return {
        destroy() {
            try { unsubscribe?.(); } catch {}
            host.innerHTML = '';
        }
    };
}
