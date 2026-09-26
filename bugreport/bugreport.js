/**
 * Report button + element selector + report window — v2.
 *
 * No report types: everything is "a report". Colours come from the site's own
 * tokens (see the --br-* contract below), so the button and window follow the
 * site's light/dark theme without any JS. UI is always English.
 *
 * Usage:
 *   import { BugReporter } from './bugreport.js';
 *   import { submitToHub } from './central-hub.js';
 *   const reporter = new BugReporter({
 *       storageKey: 'myapp_devmode',
 *       getUser: () => 'anonymous',
 *       onSubmit: (report) => submitToHub('my-app', report),
 *       getAppVersion: () => '1.4.2',          // optional, goes into the metadata
 *       fab: true,                            // false: the site renders its own trigger → reporter.startSelector()
 *   });
 *
 * Site colour contract (optional; defaults fall back to common token names):
 *   --br-bg --br-text --br-muted --br-border --br-accent --br-on-accent --br-danger --br-ok
 */

export const VERSION = '2.1.0';

const CSS = `
:where(.br-fab,.br-hud,.br-overlay,.br-modal-wrap,.br-toast,.cv-btn,.cv-backdrop,.br-pulse){
  --_br-bg: var(--br-bg, var(--dm-bg,     var(--surface, var(--panel, var(--bg-card, var(--bg-3, Canvas))))));
  --_br-text: var(--br-text, var(--dm-text,   var(--text, var(--ink, var(--text-main, var(--text-0, CanvasText))))));
  --_br-muted: var(--br-muted, var(--dm-hint,   var(--text-dim, var(--muted, var(--text-2, GrayText)))));
  --_br-border: var(--br-border, var(--dm-border, var(--border, var(--line, color-mix(in srgb, CanvasText 18%, transparent)))));
  --_br-accent: var(--br-accent, var(--dm-accent, var(--accent, AccentColor)));
  --_br-on-accent: var(--br-on-accent, var(--on-accent, var(--accent-ink, #fff)));
  --_br-danger: var(--br-danger, var(--dm-danger, var(--danger, var(--bad, var(--error, #dc2626)))));
  --_br-ok: var(--br-ok, var(--ok, var(--good, var(--success, #16a34a))));
}
.br-fab {
  position: fixed; bottom: 2rem; right: 1.5rem;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--_br-bg); border: 2px solid var(--_br-accent); color: var(--_br-accent);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 10001;
  box-shadow: 0 2px 12px color-mix(in srgb, var(--_br-accent) 30%, transparent); transition: transform .2s, box-shadow .2s;
}
.br-fab:hover { transform: scale(1.1); box-shadow: 0 4px 20px color-mix(in srgb, var(--_br-accent) 50%, transparent); }
.br-fab svg { width: 26px; height: 26px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }

body.br-selecting { cursor: crosshair !important; }
body.br-selecting * { cursor: crosshair !important; }
body.br-selecting .br-fab { cursor: pointer !important; }

.br-overlay, .br-pulse {
  position: fixed; pointer-events: none; border: 2px solid var(--_br-accent);
  background: color-mix(in srgb, var(--_br-accent) 12%, transparent);
  border-radius: 4px; z-index: 99999; display: none;
  transition: top .08s, left .08s, width .08s, height .08s;
}
.br-pulse { display: block; animation: br-pulse 1s ease-in-out 3; }
@keyframes br-pulse { 50% { background: color-mix(in srgb, var(--_br-accent) 30%, transparent); } }

.br-hud {
  position: fixed; z-index: 100000; display: none; align-items: center; gap: .5rem;
  padding: .3rem .55rem; border-radius: 6px; max-width: min(360px, 90vw);
  background: var(--_br-bg); border: 1px solid var(--_br-accent); color: var(--_br-text);
  font-size: .75rem; font-family: inherit; box-shadow: 0 2px 12px rgba(0,0,0,.25); cursor: default !important;
}
.br-hud * { cursor: default !important; }
.br-hud-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.br-hud-text b { color: var(--_br-accent); font-weight: 600; }
.br-level { width: 90px; flex-shrink: 0; accent-color: var(--_br-accent); cursor: pointer !important; }
.br-level-row { display: flex; align-items: center; gap: .6rem; margin-top: .4rem; }
.br-level-row .br-level { flex: 1; width: auto; }
.br-level-row small { color: var(--_br-muted); font-size: .75rem; white-space: nowrap; }

.br-modal-wrap { position: fixed; inset: 0; z-index: 10002; display: flex; align-items: flex-start; justify-content: center; background: rgba(0,0,0,.45); padding: 0 16px; }
.br-modal {
  background: var(--_br-bg); color: var(--_br-text); border: 1px solid var(--_br-border);
  border-radius: 12px; max-width: 460px; width: 100%; margin-top: 8vh; max-height: 86vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.35); font-family: inherit;
}
.br-modal-header { padding: 1rem 1.2rem; border-bottom: 1px solid var(--_br-border); display: flex; align-items: center; justify-content: space-between; }
.br-modal-header h2 { margin: 0; font-size: 1.1rem; color: var(--_br-text); }
.br-modal-close { background: none; border: none; color: var(--_br-muted); font-size: 1.5rem; cursor: pointer; padding: 0 4px; line-height: 1; }
.br-modal-close:hover { color: var(--_br-text); }
.br-modal-body { padding: 1.2rem; }
.br-field { margin-bottom: 1rem; }
.br-label { display: block; font-size: .78rem; color: var(--_br-muted); margin-bottom: .3rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.br-info code { background: color-mix(in srgb, var(--_br-text) 7%, transparent); padding: .25rem .5rem; border-radius: 4px; font-size: .85rem; color: var(--_br-accent); display: inline-block; overflow-wrap: anywhere; }
.br-path small, .br-hint { color: var(--_br-muted); font-size: .75rem; margin-top: .2rem; display: block; overflow-wrap: anywhere; }
.br-textarea, .br-input {
  width: 100%; box-sizing: border-box; background: color-mix(in srgb, var(--_br-text) 4%, transparent);
  border: 1px solid var(--_br-border); border-radius: 8px; color: var(--_br-text);
  padding: .6rem .7rem; font-size: .9rem; font-family: inherit;
}
.br-textarea { resize: vertical; min-height: 80px; }
.br-textarea:focus, .br-input:focus { outline: none; border-color: var(--_br-accent); }
.br-draft { display: flex; align-items: center; gap: .6rem; margin-bottom: .45rem; padding: .45rem .6rem; border-radius: 8px;
  border: 1px dashed var(--_br-accent); background: color-mix(in srgb, var(--_br-accent) 8%, transparent); font-size: .8rem; color: var(--_br-muted); }
.br-draft span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.br-draft button { flex-shrink: 0; background: var(--_br-accent); color: var(--_br-on-accent); border: 0; border-radius: 6px; padding: .3rem .6rem; font: 600 .75rem/1.2 inherit; font-family: inherit; cursor: pointer; }
.br-submit {
  width: 100%; padding: .7rem; border: none; border-radius: 8px;
  background: var(--_br-accent); color: var(--_br-on-accent); font-size: .9rem; font-weight: 600; cursor: pointer;
}
.br-submit:hover { filter: brightness(1.08); }
.br-submit:disabled { opacity: .6; cursor: default; }
.br-foot { margin-top: .9rem; display: flex; justify-content: flex-end; gap: .6rem; font-size: .75rem; color: var(--_br-muted); }
.br-foot button { background: none; border: 0; padding: 0; color: var(--_br-accent); font: inherit; cursor: pointer; text-decoration: underline; }

.br-toast {
  position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
  padding: .6rem 1.2rem; border-radius: 8px; font-size: .85rem; z-index: 10010; animation: br-fade-in .2s;
  background: var(--_br-bg); color: var(--_br-text); border: 1px solid var(--_br-border); box-shadow: 0 4px 20px rgba(0,0,0,.3);
}
.br-toast.success { border-color: var(--_br-ok); }
.br-toast.error { border-color: var(--_br-danger); color: var(--_br-danger); }
.br-toast.info { border-color: var(--_br-accent); }
@keyframes br-fade-in { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

const BUG_SVG = `<svg viewBox="0 0 24 24"><path d="M8 2l1.5 3M16 2l-1.5 3"/><path d="M3 10h2M19 10h2M3 14h2M19 14h2"/><ellipse cx="12" cy="13" rx="5" ry="7"/><circle cx="12" cy="7" r="3"/><line x1="12" y1="10" x2="12" y2="20"/><line x1="7" y1="13" x2="17" y2="13"/></svg>`;

const DEVICE_KEY = 'br_device_name';
const HIGHLIGHT_KEY = 'br_highlight';
const DRAFT_KEY = 'br_draft';

// ---------------------------------------------------------------- metadata

async function detectDevice() {
    const ua = navigator.userAgent || '';
    const d = { os: '', osVersion: '', model: '', browser: '', browserVersion: '', mobile: /Mobi|Android|iPhone|iPad/i.test(ua) };
    const uad = navigator.userAgentData;
    if (uad) {
        d.mobile = !!uad.mobile;
        d.os = uad.platform || '';
        try {
            const h = await uad.getHighEntropyValues(['platformVersion', 'model', 'fullVersionList']);
            d.model = h.model || '';
            const list = h.fullVersionList || uad.brands || [];
            const b = list.find(x => !/Not.?A.?Brand|Chromium/i.test(x.brand)) || list.find(x => /Chromium/i.test(x.brand));
            if (b) { d.browser = b.brand.replace(/^Google /, ''); d.browserVersion = b.version; }
            const major = parseInt(h.platformVersion, 10);
            if (d.os === 'Windows' && major > 0) d.osVersion = major >= 13 ? '11' : '10';
            else if (h.platformVersion) d.osVersion = h.platformVersion.split('.').slice(0, 2).join('.');
        } catch (e) { /* high-entropy hints not available */ }
    }
    if (!d.os) {
        let m;
        if ((m = ua.match(/Windows NT ([\d.]+)/))) { d.os = 'Windows'; d.osVersion = m[1] === '10.0' ? '10/11' : m[1]; }
        else if ((m = ua.match(/(?:iPhone|iPad|iPod).*? OS ([\d_]+)/))) { d.os = 'iOS'; d.osVersion = m[1].replace(/_/g, '.'); d.model = /iPad/.test(ua) ? 'iPad' : 'iPhone'; }
        else if ((m = ua.match(/Android ([\d.]+)/))) { d.os = 'Android'; d.osVersion = m[1]; }
        else if ((m = ua.match(/Mac OS X ([\d_]+)/))) { d.os = 'macOS'; d.osVersion = m[1].replace(/_/g, '.'); }
        else if (/CrOS/.test(ua)) d.os = 'ChromeOS';
        else if (/Linux/.test(ua)) d.os = 'Linux';
    }
    if (!d.browser) {
        let m;
        if ((m = ua.match(/Edg\/([\d.]+)/))) { d.browser = 'Edge'; d.browserVersion = m[1]; }
        else if ((m = ua.match(/OPR\/([\d.]+)/))) { d.browser = 'Opera'; d.browserVersion = m[1]; }
        else if ((m = ua.match(/Firefox\/([\d.]+)/))) { d.browser = 'Firefox'; d.browserVersion = m[1]; }
        else if ((m = ua.match(/Chrome\/([\d.]+)/))) { d.browser = 'Chrome'; d.browserVersion = m[1]; }
        else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) { d.browser = 'Safari'; d.browserVersion = m[1]; }
    }
    return d;
}

function deviceLabel(d) {
    const os = [d.os, d.osVersion].filter(Boolean).join(' ');
    const model = d.model ? ` (${d.model})` : '';
    const browser = [d.browser, (d.browserVersion || '').split('.')[0]].filter(Boolean).join(' ');
    return [os + model, browser].filter(Boolean).join(' · ') || 'Unknown device';
}

function detectTheme() {
    const root = document.documentElement;
    const attr = (root.dataset.theme || document.body?.dataset.theme || '').toLowerCase();
    if (attr === 'light' || attr === 'dark') return attr;
    const scheme = getComputedStyle(root).colorScheme || '';
    if (scheme.trim() === 'dark' || scheme.trim() === 'light') return scheme.trim();
    const bg = getComputedStyle(document.body || root).backgroundColor.match(/\d+(\.\d+)?/g);
    if (bg && bg.length >= 3 && (bg.length < 4 || +bg[3] > 0)) {
        const [r, g, b] = bg.map(Number);
        return (0.299 * r + 0.587 * g + 0.114 * b) < 128 ? 'dark' : 'light';
    }
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readDraft() {
    try { const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); return d && d.text ? d : null; } catch (e) { return null; }
}

function writeDraft(draft) {
    try {
        if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        else localStorage.removeItem(DRAFT_KEY);
    } catch (e) { /* storage blocked: no draft */ }
}

function draftAge(at) {
    const min = Math.round((Date.now() - (at || 0)) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + ' min ago';
    const h = Math.round(min / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function readDeviceName() {
    try { return localStorage.getItem(DEVICE_KEY) || ''; } catch (e) { return ''; }
}

// ---------------------------------------------------------------- reporter

export class BugReporter {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'app_devmode';
        this.onSubmit = options.onSubmit || (() => {});
        this.getUser = options.getUser || (() => 'anonymous');
        this.getAppVersion = options.getAppVersion || (() => null);
        this.getTheme = options.getTheme || detectTheme;
        this.esc = options.escapeHtml || this._esc;
        this.getFabContainer = options.getFabContainer || (() => document.body);
        this.useFab = options.fab !== false;
        this.footerLinks = [];               // [{ label, onClick }] shown under the report window (e.g. changelog sign-in)

        this._active = false;
        this._overlay = null;
        this._hud = null;
        this._fab = null;
        this._chain = [];
        this._level = 0;
        this._device = null;
        detectDevice().then(d => { this._device = d; }).catch(() => {});

        this._onMove = this._onMove.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onEsc = this._onEsc.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onReposition = this._onReposition.bind(this);

        this._injectCSS();
        if (this.isDevMode()) this.showFab();
        this._resumeHighlight();
    }

    // --- Public API ---

    isDevMode() {
        try { return localStorage.getItem(this.storageKey) === 'true'; } catch (e) { return false; }
    }

    setDevMode(enabled) {
        try { localStorage.setItem(this.storageKey, enabled ? 'true' : 'false'); } catch (e) { /* ignore */ }
        if (enabled) this.showFab();
        else this.hideFab();
    }

    showFab() {
        if (this._fab || !this.useFab) return;
        this._fab = document.createElement('div');
        this._fab.className = 'br-fab';
        this._fab.title = 'Send a report';
        this._fab.innerHTML = BUG_SVG;
        this._fab.addEventListener('click', () => this.startSelector());
        (this.getFabContainer() || document.body).appendChild(this._fab);
    }

    hideFab() {
        if (this._fab) { this._fab.remove(); this._fab = null; }
        this._stopSelector();
    }

    startSelector() {
        this._startSelector();
    }

    /**
     * Show where a change is: navigate to its route, then find the element and pulse it.
     * target = { route, selector, elementPath, elementText }. onNavigate(route) lets a
     * site with its own router take over; otherwise hash routes set location.hash and
     * other paths reload the page and pick the highlight up on load.
     */
    showPlace(target, onNavigate) {
        const route = target.route || '';
        const here = location.hash || (location.pathname + location.search);
        if (route && route !== here) {
            if (onNavigate) {
                Promise.resolve(onNavigate(route)).then(() => setTimeout(() => this.highlight(target), 400));
                return;
            }
            if (route.startsWith('#')) {
                location.hash = route;
                setTimeout(() => this.highlight(target), 400);
                return;
            }
            try { sessionStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(target)); } catch (e) { /* ignore */ }
            location.assign(route);
            return;
        }
        this.highlight(target);
    }

    highlight(target) {
        const el = this._find(target);
        if (!el) { this._toast('Opened the page, but the exact spot was not found', 'info'); return false; }
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => {
            const r = el.getBoundingClientRect();
            const box = document.createElement('div');
            box.className = 'br-pulse';
            Object.assign(box.style, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
            document.body.appendChild(box);
            setTimeout(() => box.remove(), 3200);
        }, 350);
        return true;
    }

    // --- Element Selector ---

    _startSelector() {
        if (this._active) { this._stopSelector(); return; }
        this._active = true;
        document.body.classList.add('br-selecting');

        this._ensureOverlay();

        this._hud = document.createElement('div');
        this._hud.className = 'br-hud';
        this._hud.innerHTML = `<span class="br-hud-text"></span><input type="range" class="br-level" min="0" max="0" value="0" title="Level (or scroll)">`;
        this._hud.querySelector('.br-level').addEventListener('input', (e) => this._setLevel(+e.target.value));
        document.body.appendChild(this._hud);

        this._chain = [];
        this._level = 0;
        document.addEventListener('mousemove', this._onMove, true);
        document.addEventListener('click', this._onClick, true);
        document.addEventListener('keydown', this._onEsc, true);
        document.addEventListener('wheel', this._onWheel, { capture: true, passive: false });
        this._toast('Click the spot you want to report (scroll = bigger/smaller area, Esc = cancel)', 'info');
    }

    _stopSelector(keepOverlay = false) {
        this._active = false;
        document.body.classList.remove('br-selecting');
        if (!keepOverlay) this._removeOverlay();
        if (this._hud) { this._hud.remove(); this._hud = null; }
        document.removeEventListener('mousemove', this._onMove, true);
        document.removeEventListener('click', this._onClick, true);
        document.removeEventListener('keydown', this._onEsc, true);
        document.removeEventListener('wheel', this._onWheel, { capture: true });
    }

    _isOwnUi(el) {
        return !el || !el.closest || !!el.closest('.br-overlay, .br-fab, .br-hud, .br-modal-wrap, .br-toast, .cv-btn, .cv-backdrop, [data-br-trigger]');
    }

    _buildChain(el) {
        const chain = [];
        let cur = el;
        while (cur && cur !== document.documentElement) {
            chain.push(cur);
            if (cur === document.body) break;
            cur = cur.parentElement;
        }
        return chain;
    }

    _onMove(e) {
        const el = e.target;
        if (this._isOwnUi(el)) return;
        if (this._chain[0] !== el) {
            this._chain = this._buildChain(el);
            this._level = 0;
        }
        this._render();
    }

    _onWheel(e) {
        if (!this._chain.length || this._isOwnUi(e.target) && !e.target.closest('.br-hud')) return;
        e.preventDefault();
        e.stopPropagation();
        this._setLevel(this._level + (e.deltaY < 0 ? 1 : -1));
    }

    _setLevel(level) {
        if (!this._chain.length) return;
        this._level = Math.max(0, Math.min(this._chain.length - 1, level));
        this._render();
    }

    _current() {
        return this._chain[this._level] || null;
    }

    _render() {
        const el = this._current();
        if (!el || !this._overlay) return;
        const rect = el.getBoundingClientRect();
        Object.assign(this._overlay.style, {
            top: rect.top + 'px', left: rect.left + 'px',
            width: rect.width + 'px', height: rect.height + 'px', display: 'block',
        });

        if (this._hud) {
            const range = this._hud.querySelector('.br-level');
            range.max = this._chain.length - 1;
            range.value = this._level;
            this._hud.querySelector('.br-hud-text').innerHTML =
                `<b>level ${this._level + 1}/${this._chain.length}</b> · ${this.esc(this._shortName(el))}`;
            this._hud.style.display = 'flex';
            const hudH = this._hud.offsetHeight || 28;
            const top = rect.top - hudH - 6 >= 0 ? rect.top - hudH - 6 : Math.min(rect.bottom + 6, window.innerHeight - hudH - 4);
            const left = Math.max(4, Math.min(rect.left, window.innerWidth - this._hud.offsetWidth - 4));
            this._hud.style.top = top + 'px';
            this._hud.style.left = left + 'px';
        }

        const modal = document.querySelector('.br-modal-wrap');
        if (modal) {
            modal.querySelector('.br-info-element').textContent = this._getDescriptor(el);
            modal.querySelector('.br-path small').textContent = this._getPath(el);
            modal.querySelector('.br-level-label').textContent = `level ${this._level + 1}/${this._chain.length}`;
        }
    }

    _onClick(e) {
        const el = e.target;
        if (this._isOwnUi(el)) return;
        e.preventDefault();
        e.stopPropagation();
        if (this._chain[0] !== el) {
            this._chain = this._buildChain(el);
            this._level = 0;
        }
        this._stopSelector(true);
        this._openModal();
    }

    _onEsc(e) {
        if (e.key === 'Escape') this._stopSelector();
    }

    _onReposition() {
        this._render();
    }

    _ensureOverlay() {
        if (this._overlay) return;
        this._overlay = document.createElement('div');
        this._overlay.className = 'br-overlay';
        document.body.appendChild(this._overlay);
    }

    _removeOverlay() {
        if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    }

    _classes(el, n) {
        return typeof el.className === 'string'
            ? el.className.split(/\s+/).filter(c => c && !c.startsWith('br-')).slice(0, n).join('.') : '';
    }

    _shortName(el) {
        if (el === document.body) return 'body';
        const tag = el.tagName.toLowerCase();
        if (el.id) return tag + '#' + el.id;
        const cls = this._classes(el, 2);
        return cls ? tag + '.' + cls : tag;
    }

    _route() {
        return window.location.hash || (window.location.pathname + window.location.search) || '/';
    }

    _selectionInfo() {
        const el = this._current();
        if (!el) return { descriptor: 'Page', path: '', selector: '', text: '', route: this._route() };
        return {
            descriptor: this._getDescriptor(el),
            path: this._getPath(el),
            selector: this._cssPath(el),
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
            route: this._route(),
        };
    }

    // --- Element Description ---

    _getDescriptor(el) {
        if (!el || el === document.body || el === document.documentElement) return 'Page';
        if (el.dataset?.action) return el.dataset.action;
        if (el.id) return el.tagName.toLowerCase() + '#' + el.id;
        const tag = el.tagName.toLowerCase();
        const cls = this._classes(el, 3);
        const parts = [cls ? tag + '.' + cls : tag];
        const full = (el.textContent || '').replace(/\s+/g, ' ').trim();
        const text = full.substring(0, 40);
        if (text) parts.push('"' + text + (full.length > 40 ? '...' : '') + '"');
        return parts.join(' ') || tag;
    }

    _getPath(el) {
        const path = [];
        let cur = el;
        while (cur && cur !== document.body && path.length < 4) {
            const tag = cur.tagName.toLowerCase();
            const cls = this._classes(cur, 2);
            path.unshift(cls ? tag + '.' + cls : tag);
            cur = cur.parentElement;
        }
        return path.join(' > ');
    }

    /** A precise selector (anchored on the nearest id) so the spot can be found again. */
    _cssPath(el) {
        const parts = [];
        let cur = el;
        while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 10) {
            if (cur.id && /^[A-Za-z][\w-]*$/.test(cur.id)) { parts.unshift('#' + cur.id); return parts.join(' > '); }
            let i = 1, s = cur;
            while ((s = s.previousElementSibling)) if (s.tagName === cur.tagName) i++;
            parts.unshift(cur.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
            cur = cur.parentElement;
        }
        return (cur === document.body ? 'body > ' : '') + parts.join(' > ');
    }

    _find(t) {
        const tryQ = (q) => { try { return q ? document.querySelector(q) : null; } catch (e) { return null; } };
        let el = tryQ(t.selector);
        if (el && t.elementText && !(el.textContent || '').includes(t.elementText.slice(0, 20))) el = null;
        if (!el && t.elementPath) {
            const all = (() => { try { return [...document.querySelectorAll(t.elementPath)]; } catch (e) { return []; } })();
            el = (t.elementText && all.find(n => (n.textContent || '').includes(t.elementText.slice(0, 20)))) || all[0] || null;
        }
        return el || tryQ(t.selector);
    }

    _resumeHighlight() {
        let t = null;
        try { t = JSON.parse(sessionStorage.getItem(HIGHLIGHT_KEY) || 'null'); sessionStorage.removeItem(HIGHLIGHT_KEY); } catch (e) { /* ignore */ }
        if (!t) return;
        const go = () => setTimeout(() => this.highlight(t), 600);
        if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    }

    // --- Modal ---

    _openModal() {
        const existing = document.querySelector('.br-modal-wrap');
        if (existing) existing.remove();

        const info = this._selectionInfo();
        const hasChain = this._chain.length > 1;
        const deviceName = readDeviceName() || (this._device ? deviceLabel(this._device) : '');
        const draft = readDraft();
        const wrap = document.createElement('div');
        wrap.className = 'br-modal-wrap';
        wrap.innerHTML = `
            <div class="br-modal" role="dialog" aria-modal="true" aria-label="Send a report">
                <div class="br-modal-header">
                    <h2>Send a report</h2>
                    <button class="br-modal-close" data-br="close" title="Close" aria-label="Close">&times;</button>
                </div>
                <div class="br-modal-body">
                    <div class="br-field">
                        <label class="br-label">Element</label>
                        <div class="br-info"><code class="br-info-element">${this.esc(info.descriptor)}</code></div>
                        <div class="br-path"><small>${this.esc(info.path)}</small></div>
                        ${hasChain ? `<div class="br-level-row">
                            <small>smaller</small>
                            <input type="range" class="br-level" data-br="level" min="0" max="${this._chain.length - 1}" value="${this._level}">
                            <small>bigger</small>
                            <small class="br-level-label">level ${this._level + 1}/${this._chain.length}</small>
                        </div>` : '<small class="br-level-label" hidden></small>'}
                    </div>
                    <div class="br-field">
                        <label class="br-label">Page</label>
                        <div class="br-info"><code>${this.esc(info.route)}</code></div>
                    </div>
                    <div class="br-field">
                        <label class="br-label" for="br-description">What should change?</label>
                        ${draft ? `<div class="br-draft" data-br="draft"><span>Unsent report from ${this.esc(draftAge(draft.at))}: “${this.esc(draft.text.replace(/\s+/g, ' ').slice(0, 60))}${draft.text.length > 60 ? '…' : ''}”</span><button type="button" data-br="restore">Restore last report</button></div>` : ''}
                        <textarea class="br-textarea" id="br-description" rows="4" placeholder="Describe the problem, question or wish..."></textarea>
                    </div>
                    <div class="br-field">
                        <label class="br-label" for="br-device">Device</label>
                        <input class="br-input" id="br-device" maxlength="60" value="${this.esc(deviceName)}" placeholder="e.g. Work laptop">
                        <small class="br-hint">Remembered on this device. Browser, screen size and theme are added automatically.</small>
                    </div>
                    <button class="br-submit" data-br="submit">Send</button>
                    ${this.footerLinks.length ? `<div class="br-foot">${this.footerLinks.map((l, i) => `<button type="button" data-br-link="${i}">${this.esc(l.label)}</button>`).join('')}</div>` : ''}
                </div>
            </div>`;

        document.body.appendChild(wrap);
        document.body.style.overflow = 'hidden';

        // Only ×, Esc or Send close the window — a click beside it does not.
        wrap.querySelector('[data-br="close"]').addEventListener('click', () => this._closeModal());
        wrap.querySelector('[data-br="restore"]')?.addEventListener('click', () => {
            const ta = wrap.querySelector('#br-description');
            ta.value = draft.text;
            wrap.querySelector('[data-br="draft"]')?.remove();
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        });
        this._onModalKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this._closeModal(); } };
        document.addEventListener('keydown', this._onModalKey, true);
        wrap.querySelector('[data-br="submit"]').addEventListener('click', () => this._submit());
        wrap.querySelector('[data-br="level"]')?.addEventListener('input', (e) => this._setLevel(+e.target.value));
        wrap.querySelectorAll('[data-br-link]').forEach(b => b.addEventListener('click', () => {
            const link = this.footerLinks[+b.dataset.brLink];
            this._closeModal();
            link?.onClick();
        }));
        window.addEventListener('resize', this._onReposition);
        wrap.querySelector('#br-description')?.focus();
        this._render();
    }

    /** sent=false keeps typed text as a draft that the next report window offers to restore. */
    _closeModal(sent = false) {
        const el = document.querySelector('.br-modal-wrap');
        if (sent) writeDraft(null);
        else {
            const text = (el?.querySelector('#br-description')?.value || '').trim();
            if (text) writeDraft({ text, at: Date.now() });
        }
        if (this._onModalKey) { document.removeEventListener('keydown', this._onModalKey, true); this._onModalKey = null; }
        if (el) el.remove();
        document.body.style.overflow = '';
        window.removeEventListener('resize', this._onReposition);
        this._removeOverlay();
        this._chain = [];
        this._level = 0;
    }

    async _meta(deviceName) {
        const d = this._device || await detectDevice().catch(() => ({}));
        let version = null;
        try { version = await Promise.resolve(this.getAppVersion()); } catch (e) { /* ignore */ }
        let tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* ignore */ }
        const meta = {
            v: 2,
            device: {
                name: deviceName || deviceLabel(d),
                os: d.os || '', osVersion: d.osVersion || '', model: d.model || '',
                browser: d.browser || '', browserVersion: d.browserVersion || '',
                mobile: !!d.mobile, touch: (navigator.maxTouchPoints || 0) > 0,
            },
            screen: {
                vw: window.innerWidth, vh: window.innerHeight,
                sw: screen.width, sh: screen.height, dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
            },
            theme: this.getTheme(),
            prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
            lang: navigator.language || '',
            timezone: tz,
            title: String(document.title || '').slice(0, 120),
            ua: String(navigator.userAgent || '').slice(0, 400),
        };
        if (version != null && version !== '') meta.appVersion = String(version).slice(0, 40);
        return meta;
    }

    async _submit() {
        const desc = document.getElementById('br-description');
        if (!desc || !desc.value.trim()) {
            this._toast('Please describe what should change', 'error');
            return;
        }
        const btn = document.querySelector('.br-modal-wrap [data-br="submit"]');
        if (btn) btn.disabled = true;
        const deviceInput = document.getElementById('br-device');
        const deviceName = (deviceInput?.value || '').trim().slice(0, 60);
        try { if (deviceName) localStorage.setItem(DEVICE_KEY, deviceName); } catch (e) { /* ignore */ }

        const info = this._selectionInfo();
        const reporter = await Promise.resolve(this.getUser());
        const report = {
            type: 'report',
            element: info.descriptor,
            elementPath: info.path,
            selector: info.selector,
            elementText: info.text,
            route: info.route,
            url: location.href,
            description: desc.value.trim(),
            reporter: reporter || 'anonymous',
            timestamp: Date.now(),
            status: 'open',
            meta: await this._meta(deviceName),
        };
        if (this._chain.length) report.elementLevel = this._level;

        try {
            await this.onSubmit(report);
            this._closeModal(true);
            this._toast('Report sent — thank you!', 'success');
        } catch (err) {
            if (btn) btn.disabled = false;
            this._toast('Could not send: ' + err.message, 'error');
        }
    }

    // --- Utilities ---

    _esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    _toast(msg, type = 'info') {
        const el = document.createElement('div');
        el.className = 'br-toast ' + type;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3200);
    }

    _injectCSS() {
        if (document.getElementById('br-module-css')) return;
        const style = document.createElement('style');
        style.id = 'br-module-css';
        style.textContent = CSS;
        document.head.appendChild(style);
    }
}
