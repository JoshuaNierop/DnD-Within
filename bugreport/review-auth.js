/**
 * Reviewer sign-in for the changelog — v2.
 *
 * The hub (/shared/bugs) is readable only by Joshua's Nexus account (see Nexus
 * db/firebase-rules.json). Anyone can still send a report; reading the changelog
 * and Accept/Reject need this sign-in. The session is kept per site (origin).
 */

export const VERSION = '2.0.0';

const API_KEY = 'AIzaSyBzVSDoLHGSPnN1TDV5w7c5qOPQshDUf7U';
const SIGN_IN_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY;
const TOKEN_URL = 'https://securetoken.googleapis.com/v1/token?key=' + API_KEY;
const STORE_KEY = 'br_review_auth';
const listeners = new Set();

function read() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
}

function write(session) {
    try {
        if (session) localStorage.setItem(STORE_KEY, JSON.stringify(session));
        else localStorage.removeItem(STORE_KEY);
    } catch (e) { /* storage blocked: session lasts for this page only */ }
    listeners.forEach(fn => { try { fn(!!session); } catch (e) { /* listener error */ } });
}

export function isReviewer() {
    return !!read();
}

export function reviewerEmail() {
    return read()?.email || '';
}

export function onReviewerChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export async function signIn(email, password) {
    const res = await fetch(SIGN_IN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const code = data?.error?.message || String(res.status);
        throw new Error(/INVALID|PASSWORD|EMAIL_NOT_FOUND/.test(code) ? 'Wrong email or password.' : 'Sign-in failed: ' + code);
    }
    write({
        email: data.email,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (Number(data.expiresIn) || 3600) * 1000 - 60000,
    });
    return data.email;
}

export function signOut() {
    write(null);
}

/** A valid ID token for the hub, refreshed when needed. Null when not signed in. */
export async function getToken() {
    const s = read();
    if (!s) return null;
    if (s.idToken && Date.now() < s.expiresAt) return s.idToken;
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(s.refreshToken),
    });
    if (!res.ok) { write(null); throw new Error('Your review session expired. Sign in again.'); }
    const data = await res.json();
    const next = {
        ...s,
        idToken: data.id_token,
        refreshToken: data.refresh_token || s.refreshToken,
        expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 - 60000,
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    return next.idToken;
}
