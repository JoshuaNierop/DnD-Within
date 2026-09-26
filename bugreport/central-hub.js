/**
 * Central Bug Hub — v2.
 *
 * Every report goes to Nexus Firebase `/shared/bugs/<pushId>` with type 'report'
 * (no bug/feature/design split any more). Anyone can write a new report; only
 * Joshua's Nexus account can read the hub or change an entry (see Nexus
 * db/firebase-rules.json `shared.bugs`). Old entries keep type bug/feature.
 */

import { getToken } from './review-auth.js';

export const VERSION = '2.0.0';

const HUB_BASE = 'https://nexus-12fc7-default-rtdb.europe-west1.firebasedatabase.app';
const BUGS_PATH = '/shared/bugs';

export const HUB_URL = HUB_BASE + BUGS_PATH + '.json';

export async function submitToHub(projectId, report) {
    if (!projectId || !/^[a-z0-9-]+$/.test(projectId)) {
        throw new Error('Invalid projectId (use lowercase-kebab-case)');
    }
    const payload = {
        project: projectId,
        type: 'report',
        element: report.element || '',
        elementPath: report.elementPath || '',
        route: report.route || '',
        description: String(report.description || '').slice(0, 1999),
        reporter: report.reporter || 'anonymous',
        timestamp: report.timestamp || Date.now(),
        createdAt: new Date().toISOString(),
        status: 'open',
    };
    if (report.selector) payload.selector = String(report.selector).slice(0, 500);
    if (report.elementText) payload.elementText = String(report.elementText).slice(0, 80);
    if (report.url) payload.url = String(report.url).slice(0, 500);
    if (Number.isInteger(report.elementLevel)) payload.elementLevel = report.elementLevel;
    if (report.meta && typeof report.meta === 'object') payload.meta = report.meta;
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
        .map(([id, b]) => ({ id, ...b }))
        .filter(b => b.status === 'fixed' && b.hidden !== true)
        .sort((a, b) => (b.fixedAt || b.timestamp || 0) - (a.fixedAt || a.timestamp || 0))
        .slice(0, max);
}

/** Patch one hub entry (reviewer only). */
export async function updateHubBug(bugId, updates) {
    const res = await fetch(await authed(`${BUGS_PATH}/${encodeURIComponent(bugId)}.json`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Could not save (' + res.status + ')');
    return res.json();
}
