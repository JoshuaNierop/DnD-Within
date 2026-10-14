/**
 * Central Bug Hub — v2.1 (hardened).
 *
 * Every report goes to Nexus Firebase `/shared/bugs/<pushId>` with type 'report'
 * (no bug/feature/design split any more). Anyone can write a new report; only
 * Joshua's Nexus account can read the hub or set review fields (see Nexus
 * db/firebase-rules.json `shared.bugs`). Old entries keep type bug/feature.
 *
 * Hardening (2.1): the payload is rebuilt from a fixed field whitelist, every
 * string is cleaned (control, zero-width, bidi and tag characters removed) and
 * capped to the limits the hub rules enforce, routes/URLs that leave the site are
 * dropped, token-like query values are redacted, and the timestamp is set by the
 * server. Reviewer updates may only touch the review fields.
 */

import { getToken } from './review-auth.js';

export const VERSION = '2.1.0';

const HUB_BASE = 'https://nexus-12fc7-default-rtdb.europe-west1.firebasedatabase.app';
const BUGS_PATH = '/shared/bugs';

export const HUB_URL = HUB_BASE + BUGS_PATH + '.json';

// Keep in sync with the hub rules (Nexus db/firebase-rules*.json, shared.bugs).
export const LIMITS = Object.freeze({
    description: 1999,
    element: 300,
    elementPath: 500,
    selector: 500,
    elementText: 80,
    route: 500,
    url: 500,
    reporter: 120,
    rejectNote: 480,
});

const PROJECT_RE = /^[a-z0-9][a-z0-9-]{0,29}$/;
const ID_RE = /^[-0-9A-Za-z_]{1,40}$/;
const REVIEW_FIELDS = new Set(['verdict', 'reviewed', 'verdictAt', 'rejectNote', 'hidden']);

// C0/C1 controls (newline and tab survive), soft hyphen, zero-width, joiners, bidi
// controls, invisible fillers, variation selectors, BOM and Unicode tag characters.
const INVISIBLE = /[\u{0}-\u{8}\u{B}\u{C}\u{E}-\u{1F}\u{7F}-\u{9F}\u{AD}\u{34F}\u{61C}\u{115F}\u{1160}\u{17B4}\u{17B5}\u{180B}-\u{180F}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{206F}\u{3164}\u{FE00}-\u{FE0F}\u{FEFF}\u{FFA0}\u{FFF0}-\u{FFFB}\u{1D173}-\u{1D17A}\u{E0000}-\u{E007F}\u{E0100}-\u{E01EF}]/gu;
const SENSITIVE_PARAM = /token|key|secret|pass|auth|session|code|sig|otp|jwt|cred/i;

function cap(s, max) {
    if (s.length <= max) return s;
    s = s.slice(0, max);
    return /[\uD800-\uDBFF]$/.test(s) ? s.slice(0, -1) : s;
}

/** Plain, visible text only: no control/invisible characters, capped, trimmed. */
export function cleanText(value, max, { multiline = false } = {}) {
    if (value == null || typeof value === 'object') return '';
    let s = String(value);
    if (typeof s.toWellFormed === 'function') s = s.toWellFormed();
    s = s.normalize('NFC').replace(/\r\n?|[\u{2028}\u{2029}]/gu, '\n').replace(INVISIBLE, '');
    s = multiline
        ? s.replace(/[^\S\n]+$/gm, '').replace(/\n{4,}/g, '\n\n\n')
        : s.replace(/\s+/g, ' ');
    return cap(s.trim(), max);
}

function redactParams(params) {
    for (const key of [...params.keys()]) {
        if (SENSITIVE_PARAM.test(key)) params.set(key, 'redacted');
    }
}

/** '#…' or a same-site path; anything that could leave the site becomes ''. */
export function safeRoute(value) {
    let s = cleanText(value, LIMITS.route * 2);
    if (!s) return '';
    if (s[0] === '#') {
        if (/(access_token|id_token|refresh_token|token|code)=/i.test(s)) {
            s = s.split(/[?&]/)[0];
            if (s.includes('=')) s = '#';
        }
        return cap(s, LIMITS.route);
    }
    if (s[0] !== '/') return '';
    s = s.replace(/^[/\\]+/, '/');
    try {
        const u = new URL(s, 'https://site.invalid');
        if (u.origin !== 'https://site.invalid') return '';
        redactParams(u.searchParams);
        return cap(u.pathname + u.search + u.hash, LIMITS.route);
    } catch (e) {
        return '';
    }
}

/** Only http(s)/file URLs; credentials and token-like query values removed. */
export function safeUrl(value) {
    const s = cleanText(value, LIMITS.url * 2);
    if (!/^(https?:\/\/|file:\/\/\/)/i.test(s)) return '';
    try {
        const u = new URL(s);
        u.username = '';
        u.password = '';
        redactParams(u.searchParams);
        if (/(access_token|id_token|token|code)=/i.test(u.hash)) u.hash = '';
        return cap(u.href, LIMITS.url);
    } catch (e) {
        return '';
    }
}

function num(v, lo, hi) {
    return typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : 0;
}

function cleanMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const d = meta.device && typeof meta.device === 'object' ? meta.device : {};
    const s = meta.screen && typeof meta.screen === 'object' ? meta.screen : {};
    const out = {
        v: 2,
        device: {
            name: cleanText(d.name, 60),
            os: cleanText(d.os, 40),
            osVersion: cleanText(d.osVersion, 40),
            model: cleanText(d.model, 60),
            browser: cleanText(d.browser, 40),
            browserVersion: cleanText(d.browserVersion, 40),
            mobile: d.mobile === true,
            touch: d.touch === true,
        },
        screen: {
            vw: num(s.vw, 0, 100000), vh: num(s.vh, 0, 100000),
            sw: num(s.sw, 0, 100000), sh: num(s.sh, 0, 100000),
            dpr: num(s.dpr, 0, 20),
        },
        theme: cleanText(meta.theme, 20),
        prefersDark: meta.prefersDark === true,
        lang: cleanText(meta.lang, 35),
        timezone: cleanText(meta.timezone, 60),
        title: cleanText(meta.title, 120),
        ua: cleanText(meta.ua, 400),
    };
    const appVersion = cleanText(meta.appVersion, 40);
    if (appVersion) out.appVersion = appVersion;
    return out;
}

/** The exact object that is sent to the hub: whitelisted fields only. */
export function buildHubPayload(projectId, report) {
    if (typeof projectId !== 'string' || !PROJECT_RE.test(projectId)) {
        throw new Error('Invalid projectId (use lowercase-kebab-case)');
    }
    const r = report && typeof report === 'object' ? report : {};
    const description = cleanText(r.description, LIMITS.description, { multiline: true });
    if (!description) throw new Error('Please describe what should change');
    const payload = {
        project: projectId,
        type: 'report',
        element: cleanText(r.element, LIMITS.element),
        elementPath: cleanText(r.elementPath, LIMITS.elementPath),
        route: safeRoute(r.route),
        description,
        reporter: cleanText(r.reporter, LIMITS.reporter) || 'anonymous',
        timestamp: { '.sv': 'timestamp' },
        createdAt: new Date().toISOString(),
        status: 'open',
    };
    const selector = cleanText(r.selector, LIMITS.selector);
    if (selector) payload.selector = selector;
    const elementText = cleanText(r.elementText, LIMITS.elementText);
    if (elementText) payload.elementText = elementText;
    const url = safeUrl(r.url);
    if (url) payload.url = url;
    if (Number.isInteger(r.elementLevel) && r.elementLevel >= 0 && r.elementLevel <= 100) payload.elementLevel = r.elementLevel;
    const meta = cleanMeta(r.meta);
    if (meta) payload.meta = meta;
    return payload;
}

export async function submitToHub(projectId, report) {
    const payload = buildHubPayload(projectId, report);
    const res = await fetch(HUB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Report could not be sent (' + res.status + ')');
    return res.json();
}

async function authed(path) {
    const token = await getToken();
    if (!token) throw new Error('Sign in to see the changelog.');
    return HUB_BASE + path + (path.includes('?') ? '&' : '?') + 'auth=' + encodeURIComponent(token);
}

/** All fixed changes of one project, newest first (reviewer only). */
export async function fetchChanges(project, max = 50) {
    const q = `${BUGS_PATH}.json?orderBy=${encodeURIComponent('"project"')}&equalTo=${encodeURIComponent(JSON.stringify(project))}`;
    const res = await fetch(await authed(q), { cache: 'no-store' });
    if (res.status === 401 || res.status === 403) throw new Error('This account cannot read the changelog.');
    if (!res.ok) throw new Error('Changelog could not be loaded (' + res.status + ')');
    const data = (await res.json()) || {};
    return Object.entries(data)
        .filter(([id, b]) => ID_RE.test(id) && b && typeof b === 'object')
        .map(([id, b]) => ({ ...b, id }))
        .filter(b => b.status === 'fixed' && b.hidden !== true)
        .sort((a, b) => (Number(b.fixedAt || b.timestamp) || 0) - (Number(a.fixedAt || a.timestamp) || 0))
        .slice(0, max);
}

/** Patch the review fields of one hub entry (reviewer only). */
export async function updateHubBug(bugId, updates) {
    if (!ID_RE.test(String(bugId || ''))) throw new Error('Invalid report id');
    const body = {};
    for (const [key, value] of Object.entries(updates || {})) {
        if (!REVIEW_FIELDS.has(key)) continue;
        body[key] = key === 'rejectNote' ? cleanText(value, LIMITS.rejectNote, { multiline: true }) : value;
    }
    if (!Object.keys(body).length) throw new Error('Nothing to save');
    const res = await fetch(await authed(`${BUGS_PATH}/${encodeURIComponent(bugId)}.json`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Could not save (' + res.status + ')');
    return res.json();
}
