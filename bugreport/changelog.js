/**
 * Changelog — v2. Shows the changes Claude made on THIS site after a report,
 * and lets the reviewer Accept or Reject each one. Clicking a change opens the
 * place where it can be seen.
 *
 * Only for the reviewer: reading the hub needs Joshua's Nexus sign-in
 * (review-auth.js). Everyone else only sees the report button. Sign in via the
 * "Review changes" link under the report window, or open the site once with ?review=1.
 *
 * Reject → verdict 'rejected' (+ optional note): /bugfix picks it up again and
 * reworks it. Accept → verdict 'accepted'. Colours follow the --br-* contract of
 * bugreport.js, so the window follows the site's light/dark theme.
 *
 * Usage (init.js):
 *   import { mountChangelog } from './changelog.js';
 *   mountChangelog(reporter, { project: 'meridian', repo: 'Meridian', owner: 'Joshua-NTS' });
 */

import { fetchChanges, updateHubBug } from './central-hub.js';
import { isReviewer, reviewerEmail, signIn, signOut, onReviewerChange } from './review-auth.js';

export const VERSION = '2.0.0';

const CSS = `
.cv-btn { position: fixed; right: 1.5rem; bottom: calc(2rem + 62px); z-index: 10001;
  display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .75rem; border-radius: 999px;
  font: 600 .8rem/1.2 system-ui, sans-serif; cursor: pointer;
  background: var(--_br-bg); color: var(--_br-text); border: 1px solid var(--_br-border); box-shadow: 0 2px 10px rgba(0,0,0,.2); }
.cv-btn.in-container { position: static; }
.cv-btn:hover { border-color: var(--_br-accent); }
.cv-badge { min-width: 1.2rem; height: 1.2rem; padding: 0 .3rem; border-radius: 999px; display: inline-flex;
  align-items: center; justify-content: center; font-size: .7rem; background: var(--_br-accent); color: var(--_br-on-accent); }
.cv-badge[hidden] { display: none; }
.cv-backdrop { position: fixed; inset: 0; z-index: 10002; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; padding: 16px; }
.cv-backdrop[hidden] { display: none; }
.cv-modal { width: min(720px, 100%); max-height: min(82vh, 780px); display: flex; flex-direction: column;
  border-radius: 12px; overflow: hidden; font: .85rem/1.45 system-ui, sans-serif;
  background: var(--_br-bg); color: var(--_br-text); border: 1px solid var(--_br-border); box-shadow: 0 12px 40px rgba(0,0,0,.3); }
.cv-head { display: flex; align-items: center; gap: .6rem; padding: .7rem 1rem; border-bottom: 1px solid var(--_br-border); flex-wrap: wrap; }
.cv-head h2 { margin: 0; font-size: 1rem; flex: 1; }
.cv-chips { display: inline-flex; gap: .3rem; flex-wrap: wrap; }
.cv-chip { font: 600 .72rem system-ui, sans-serif; padding: .2rem .55rem; border-radius: 999px; cursor: pointer;
  background: transparent; color: var(--_br-muted); border: 1px solid var(--_br-border); }
.cv-chip.is-on { color: var(--_br-accent); border-color: var(--_br-accent); }
.cv-close { background: none; border: 0; color: inherit; font-size: 1.3rem; line-height: 1; cursor: pointer; padding: 0 .2rem; }
.cv-list { overflow-y: auto; padding: .3rem 1rem .8rem; }
.cv-empty { padding: 1.5rem 0; text-align: center; color: var(--_br-muted); }
.cv-item { padding: .7rem .5rem; margin: 0 -.5rem; border-bottom: 1px solid var(--_br-border); border-radius: 8px; cursor: pointer; }
.cv-item:hover { background: color-mix(in srgb, var(--_br-accent) 7%, transparent); }
.cv-item:last-child { border-bottom: 0; }
.cv-item.is-done { opacity: .65; }
.cv-summary { margin: 0 0 .2rem; overflow-wrap: anywhere; font-weight: 600; }
.cv-summary.is-missing { font-style: italic; font-weight: 400; color: var(--_br-muted); }
.cv-report { color: var(--_br-muted); font-size: .78rem; overflow-wrap: anywhere; }
.cv-note { margin-top: .3rem; font-size: .78rem; color: var(--_br-danger); overflow-wrap: anywhere; }
.cv-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .8rem; margin-top: .35rem; font-size: .75rem; color: var(--_br-muted); }
.cv-meta a { color: var(--_br-accent); font-family: ui-monospace, monospace; }
.cv-tag { padding: 0 .45rem; border-radius: 4px; border: 1px solid var(--_br-border); }
.cv-tag.is-accepted { color: var(--_br-ok); border-color: var(--_br-ok); }
.cv-tag.is-rejected { color: var(--_br-danger); border-color: var(--_br-danger); }
.cv-tag.is-pending { color: var(--_br-accent); border-color: var(--_br-accent); }
.cv-actions { margin-left: auto; display: inline-flex; gap: .4rem; }
.cv-actions button, .cv-reject button { font: 600 .75rem system-ui, sans-serif; padding: .25rem .6rem; border-radius: 6px; cursor: pointer;
  background: transparent; color: var(--_br-text); border: 1px solid var(--_br-border); }
.cv-actions .cv-accept { border-color: var(--_br-ok); color: var(--_br-ok); }
.cv-actions .cv-rejectbtn, .cv-reject .cv-confirm { border-color: var(--_br-danger); color: var(--_br-danger); }
.cv-actions button:disabled, .cv-reject button:disabled { opacity: .5; cursor: default; }
.cv-reject { margin-top: .5rem; display: flex; gap: .4rem; align-items: flex-start; cursor: default; }
.cv-reject textarea { flex: 1; min-height: 3.2em; resize: vertical; box-sizing: border-box; padding: .4rem .5rem; border-radius: 6px;
  font: .8rem/1.4 system-ui, sans-serif; background: color-mix(in srgb, var(--_br-text) 4%, transparent); color: var(--_br-text); border: 1px solid var(--_br-border); }
.cv-foot { padding: .5rem 1rem; border-top: 1px solid var(--_br-border); font-size: .75rem; color: var(--_br-muted); display: flex; gap: .6rem; }
.cv-foot button { background: none; border: 0; padding: 0; color: var(--_br-accent); font: inherit; cursor: pointer; text-decoration: underline; }
.cv-error { padding: .5rem 1rem; color: var(--_br-danger); font-size: .8rem; }
.cv-error[hidden] { display: none; }
.cv-login { padding: 1rem; display: grid; gap: .6rem; }
.cv-login input { padding: .55rem .65rem; border-radius: 8px; font: .9rem system-ui, sans-serif;
  background: color-mix(in srgb, var(--_br-text) 4%, transparent); color: var(--_br-text); border: 1px solid var(--_br-border); }
.cv-login button { padding: .6rem; border: 0; border-radius: 8px; font: 600 .9rem system-ui, sans-serif; cursor: pointer;
  background: var(--_br-accent); color: var(--_br-on-accent); }
.cv-login p { margin: 0; color: var(--_br-muted); font-size: .8rem; }
`;

function injectCSS() {
    if (document.getElementById('cv-module-css')) return;
    const style = document.createElement('style');
    style.id = 'cv-module-css';
    style.textContent = CSS;
    document.head.appendChild(style);
}

function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
}

function shorten(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function fmtDate(ms) {
    if (!Number.isFinite(ms)) return '';
    return new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** pending | accepted | rejected. Older fixes without a verdict count as accepted unless still unreviewed. */
export function stateOf(b) {
    if (b.verdict === 'rejected') return 'rejected';
    if (b.verdict === 'accepted') return 'accepted';
    return b.reviewed === false ? 'pending' : 'accepted';
}

const STATE_LABEL = { pending: 'To review', accepted: 'Accepted', rejected: 'Rejected — being reworked' };
const FILTERS = [['pending', 'To review'], ['rejected', 'Rejected'], ['accepted', 'Accepted'], ['all', 'All']];

export function mountChangelog(reporter, { project, repo, owner = 'Joshua-NTS', container, onNavigate } = {}) {
    if (!project) throw new Error('mountChangelog: project is required');
    injectCSS();

    let items = [];
    let filter = 'pending';

    const btn = el('button', 'cv-btn' + (container ? ' in-container' : ''));
    btn.type = 'button';
    btn.title = 'Changes made on this site after a report';
    btn.append(el('span', null, 'Changelog'));
    const badge = el('span', 'cv-badge');
    badge.hidden = true;
    btn.append(badge);

    const backdrop = el('div', 'cv-backdrop');
    backdrop.hidden = true;
    const modal = el('div', 'cv-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Changelog');
    const head = el('div', 'cv-head');
    const title = el('h2', null, 'Changelog');
    const chips = el('span', 'cv-chips');
    const close = el('button', 'cv-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    head.append(title, chips, close);
    const errorBox = el('div', 'cv-error');
    errorBox.hidden = true;
    const list = el('div', 'cv-list');
    const foot = el('div', 'cv-foot');
    modal.append(head, errorBox, list, foot);
    backdrop.append(modal);

    for (const [key, label] of FILTERS) {
        const c = el('button', 'cv-chip', label);
        c.type = 'button';
        c.dataset.filter = key;
        c.addEventListener('click', () => { filter = key; render(); });
        chips.append(c);
    }

    const showError = (msg) => { errorBox.textContent = msg || ''; errorBox.hidden = !msg; };
    const updateBadge = () => {
        const n = items.filter(b => stateOf(b) === 'pending').length;
        badge.textContent = String(n);
        badge.hidden = n === 0;
    };
    const commitUrl = (hash) => repo && /^[0-9a-f]{7,40}$/i.test(hash || '')
        ? `https://github.com/${owner}/${repo}/commit/${hash}` : null;

    const save = async (bug, updates, buttons) => {
        buttons.forEach(b => { b.disabled = true; });
        showError('');
        try {
            await updateHubBug(bug.id, updates);
            Object.assign(bug, updates, { verdictAt: Date.now() });
            if (updates.hidden) items = items.filter(b => b !== bug);
            updateBadge();
            render();
        } catch (e) {
            showError(e.message);
            buttons.forEach(b => { b.disabled = false; });
        }
    };
    const stamp = { '.sv': 'timestamp' };

    function renderFoot() {
        foot.textContent = '';
        foot.append(el('span', null, 'Signed in as ' + reviewerEmail()));
        const out = el('button', null, 'Sign out');
        out.type = 'button';
        out.addEventListener('click', () => { signOut(); hide(); });
        foot.append(out);
    }

    function renderLogin(message) {
        chips.hidden = true;
        foot.textContent = '';
        list.textContent = '';
        const form = el('form', 'cv-login');
        form.append(el('p', null, message || 'Only the site owner can review changes. Sign in with your Nexus account.'));
        const email = document.createElement('input');
        email.type = 'email'; email.placeholder = 'Email'; email.autocomplete = 'username'; email.required = true;
        const pw = document.createElement('input');
        pw.type = 'password'; pw.placeholder = 'Password'; pw.autocomplete = 'current-password'; pw.required = true;
        const go = el('button', null, 'Sign in');
        go.type = 'submit';
        form.append(email, pw, go);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            go.disabled = true;
            showError('');
            try { await signIn(email.value.trim(), pw.value); load(true); }
            catch (err) { showError(err.message); go.disabled = false; }
        });
        list.append(form);
        setTimeout(() => email.focus(), 0);
    }

    function render() {
        chips.hidden = false;
        chips.querySelectorAll('.cv-chip').forEach(c => c.classList.toggle('is-on', c.dataset.filter === filter));
        renderFoot();
        list.textContent = '';
        const visible = items.filter(b => filter === 'all' || stateOf(b) === filter);
        if (!visible.length) {
            list.append(el('div', 'cv-empty', filter === 'pending' ? 'Nothing to review right now.' : 'No changes here yet.'));
            return;
        }
        for (const bug of visible) {
            const state = stateOf(bug);
            const row = el('div', 'cv-item' + (state === 'accepted' ? ' is-done' : ''));
            row.title = 'Show where this changed';
            const summary = el('div', 'cv-summary' + (bug.fixSummary ? '' : ' is-missing'), bug.fixSummary || 'No summary recorded.');
            const report = el('div', 'cv-report', 'Report: ' + shorten(bug.description, 180));
            row.append(summary, report);
            if (state === 'rejected' && bug.rejectNote) row.append(el('div', 'cv-note', 'Your note: ' + bug.rejectNote));

            const meta = el('div', 'cv-meta');
            meta.append(el('span', 'cv-tag is-' + state, STATE_LABEL[state]));
            const when = fmtDate(bug.fixedAt || bug.timestamp);
            if (when) meta.append(el('span', null, when));
            const href = commitUrl(bug.fixCommit);
            if (href) {
                const a = el('a', null, bug.fixCommit.slice(0, 7));
                a.href = href; a.target = '_blank'; a.rel = 'noopener';
                a.addEventListener('click', (e) => e.stopPropagation());
                meta.append(a);
            }
            if (bug.rejectCount > 0) meta.append(el('span', null, 'Attempt ' + (bug.rejectCount + 1)));

            const actions = el('span', 'cv-actions');
            if (state === 'pending') {
                const ok = el('button', 'cv-accept', 'Accept');
                ok.type = 'button';
                const no = el('button', 'cv-rejectbtn', 'Reject');
                no.type = 'button';
                ok.addEventListener('click', (e) => { e.stopPropagation(); save(bug, { verdict: 'accepted', reviewed: true, verdictAt: stamp }, [ok, no]); });
                no.addEventListener('click', (e) => { e.stopPropagation(); openReject(row, bug, [ok, no]); });
                actions.append(ok, no);
            } else if (state === 'accepted') {
                const hideBtn = el('button', null, 'Hide');
                hideBtn.type = 'button';
                hideBtn.title = 'Remove from this list';
                hideBtn.addEventListener('click', (e) => { e.stopPropagation(); save(bug, { hidden: true }, [hideBtn]); });
                actions.append(hideBtn);
            }
            meta.append(actions);
            row.append(meta);
            row.addEventListener('click', () => {
                hide();
                reporter.showPlace({ route: bug.route, selector: bug.selector, elementPath: bug.elementPath, elementText: bug.elementText }, onNavigate);
            });
            list.append(row);
        }
    }

    function openReject(row, bug, buttons) {
        if (row.querySelector('.cv-reject')) return;
        const box = el('div', 'cv-reject');
        box.addEventListener('click', (e) => e.stopPropagation());
        const note = document.createElement('textarea');
        note.maxLength = 480;
        note.placeholder = 'What is wrong or what should be different? (optional)';
        const confirm = el('button', 'cv-confirm', 'Reject');
        confirm.type = 'button';
        confirm.addEventListener('click', () => save(bug, {
            verdict: 'rejected', reviewed: true, verdictAt: stamp, rejectNote: note.value.trim(),
        }, [...buttons, confirm]));
        box.append(note, confirm);
        row.append(box);
        note.focus();
    }

    const load = async (andRender) => {
        if (!isReviewer()) { items = []; updateBadge(); if (!backdrop.hidden) renderLogin(); return; }
        try {
            items = await fetchChanges(project);
            showError('');
        } catch (e) {
            showError(e.message);
            if (!isReviewer()) { if (!backdrop.hidden) renderLogin(); return; }
        }
        updateBadge();
        if (andRender || !backdrop.hidden) render();
    };

    const open = () => {
        backdrop.hidden = false;
        showError('');
        if (!isReviewer()) { renderLogin(); return; }
        list.textContent = '';
        list.append(el('div', 'cv-empty', 'Loading…'));
        load(true);
        close.focus();
    };
    const hide = () => { backdrop.hidden = true; };

    btn.addEventListener('click', open);
    close.addEventListener('click', hide);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) hide(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !backdrop.hidden) hide(); });
    window.addEventListener('focus', () => { if (btn.isConnected) load(); });

    const host = container || document.body;
    document.body.append(backdrop);
    let fabVisible = false;
    const sync = () => {
        const want = fabVisible && isReviewer();
        if (want && !btn.isConnected) { host.append(btn); load(); }
        if (!want && btn.isConnected) { btn.remove(); hide(); }
    };
    onReviewerChange(sync);

    // Link under the report window: sign in / open the changelog.
    reporter.footerLinks.push({ label: 'Review changes', onClick: open });

    // Follow Developer mode: piggyback on the reporter's FAB show/hide.
    const origShow = reporter.showFab.bind(reporter);
    const origHide = reporter.hideFab.bind(reporter);
    reporter.showFab = () => { origShow(); fabVisible = true; sync(); };
    reporter.hideFab = () => { origHide(); fabVisible = false; sync(); };
    fabVisible = reporter.isDevMode();
    sync();

    // ?review=1 opens the sign-in once on this device.
    try {
        const url = new URL(location.href);
        if (url.searchParams.get('review') === '1') {
            url.searchParams.delete('review');
            history.replaceState(history.state, '', url.pathname + url.search + url.hash);
            open();
        }
    } catch (e) { /* ignore */ }

    return { button: btn, open, close: hide, refresh: load };
}
