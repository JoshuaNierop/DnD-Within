// ============================================================
// D&D Within — Cloudinary delete proxy (Cloudflare Worker)
// ============================================================
//
// The DnD site is a static page on GitHub Pages — it cannot hold a secret.
// Deleting a Cloudinary asset requires the API SECRET, which must never ship
// to the browser. This Worker holds the secret server-side and exposes a
// single, tightly-scoped delete endpoint the site can call.
//
// Safety layers (a static site can't fully authenticate, so defense in depth):
//   1. CORS + Origin check — only the configured site origin is allowed.
//   2. Shared bearer token — raises the bar past casual scanning.
//   3. Prefix lock — ONLY public_ids under PREFIX (e.g. "dnd-within/") can be
//      deleted, and ONLY the destroy operation. Worst case if all else is
//      bypassed: someone deletes campaign images, which players re-upload.
//
// Endpoint:  POST /          body: { "public_id": "dnd-within/..." }
//                            or:   { "public_ids": ["dnd-within/a", ...] }
//            header:         Authorization: Bearer <SHARED_TOKEN>
//
// Config (wrangler.toml [vars] + one secret):
//   CLOUD_NAME      e.g. "dqmdh3b4d"        (var)
//   API_KEY         e.g. "7893774...."      (var; semi-public)
//   ALLOWED_ORIGIN  e.g. "https://joshuanierop.github.io"  (var)
//   SHARED_TOKEN    long random string      (var; also lives in storage.js)
//   PREFIX          e.g. "dnd-within/"      (var)
//   CLOUDINARY_API_SECRET                   (SECRET — `wrangler secret put`)
// ============================================================

function corsHeaders(origin, allowed) {
  return {
    'Access-Control-Allow-Origin': origin === allowed ? origin : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
  });
}

async function sha1Hex(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cloudinary signed destroy for one public_id. Signature = sha1 of the
// alphabetically-sorted params (minus api_key/signature/file) + api_secret.
async function destroyOne(env, publicId) {
  const ts = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${ts}`;
  const signature = await sha1Hex(toSign + env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('timestamp', String(ts));
  form.append('api_key', env.API_KEY);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return { public_id: publicId, result: data.result || ('http-' + res.status), raw: data };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ error: 'method-not-allowed' }, 405, cors);
    }

    // 1. Origin check
    if (allowed && origin && origin !== allowed) {
      return json({ error: 'origin-not-allowed' }, 403, cors);
    }
    // 2. Shared token
    const auth = request.headers.get('Authorization') || '';
    if (!env.SHARED_TOKEN || auth !== 'Bearer ' + env.SHARED_TOKEN) {
      return json({ error: 'unauthorized' }, 401, cors);
    }

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'bad-json' }, 400, cors); }

    let ids = [];
    if (typeof body.public_id === 'string') ids = [body.public_id];
    else if (Array.isArray(body.public_ids)) ids = body.public_ids.filter(x => typeof x === 'string');
    if (!ids.length) return json({ error: 'no-public-id' }, 400, cors);

    // 3. Prefix lock — only our own folders, nothing else in the account.
    // PREFIX may be a comma-separated list (e.g. "DnD Within/,dnd-within/") so
    // both the current spaced tree and legacy roots can be cleaned up.
    const prefixes = (env.PREFIX || 'dnd-within/').split(',').map(p => p.trim()).filter(Boolean);
    const bad = ids.filter(id => !prefixes.some(p => id.indexOf(p) === 0));
    if (bad.length) return json({ error: 'prefix-locked', prefixes, rejected: bad }, 403, cors);

    const results = [];
    for (const id of ids) {
      try { results.push(await destroyOne(env, id)); }
      catch (e) { results.push({ public_id: id, result: 'error', error: String(e && e.message || e) }); }
    }
    return json({ ok: true, results }, 200, cors);
  },
};
