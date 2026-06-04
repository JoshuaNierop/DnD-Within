// ============================================================
// D&D Within — Image Storage Abstraction (Cloudinary)
// ============================================================
//
// Separates IMAGES from the text Realtime Database. Images go to
// Cloudinary (binary CDN, 25 GB free, no credit card); the text DB only
// keeps a small https URL string instead of a fat base64 blob.
//
// Why Cloudinary and not Firebase Storage: since late 2024 new Firebase
// Cloud Storage buckets require the Blaze (pay-as-you-go) plan, which
// needs a credit card. Cloudinary's free tier needs neither.
//
// SAFE BY DESIGN — automatic base64 fallback:
//   * If Cloudinary is not configured (CLOUD_NAME / UPLOAD_PRESET still
//     placeholders) or an upload fails, DWImages.save() resolves with the
//     ORIGINAL base64 dataURL. The caller stores that exactly like before
//     → behaviour is identical to the pre-Storage app. Nothing breaks.
//   * Once configured, save() returns an https URL and new uploads stop
//     bloating the text DB.
//
// Display code is unaffected: every render uses <img src="${value}">,
// which works for both a base64 dataURL and an https URL.
//
// DELETE: unsigned (browser-side) uploads can't be deleted directly (needs
// the API secret, which must never ship to the client). del() therefore
// routes through a small Cloudflare Worker (cloudinary-worker/) that holds
// the secret server-side and is prefix-locked to dnd-within/. Until
// DELETE_WORKER_URL is configured, del() is a safe no-op and removed images
// simply orphan in Cloudinary (harmless on the 25 GB free tier).
//
// SETUP (Joshua, one-time — no credit card):
//   1. Create a free account at https://cloudinary.com  → note your
//      "Cloud name" (Dashboard top, e.g. "dxxxxxx").
//   2. Settings → Upload → Upload presets → "Add upload preset":
//        - Signing mode: **Unsigned**  (the only required setting)
//        - (optional) Incoming transformation: f_auto,q_auto  → smaller
//          files, auto webp/avif
//      Leave the rest default. Save and note the preset name.
//      Uploads pass a `folder` (honoured by unsigned uploads); Cloudinary
//      auto-names each asset uniquely, so a changed image never collides
//      with the old one (no overwrite needed; unsigned can't overwrite).
//   3. Paste the preset name into UPLOAD_PRESET below and commit.
//
// Image taxonomy (Cloudinary folder = nested path via "/") — mirrors Joshua's
// local "DnD Within" tree so the media library is human-browsable. The first
// segment is the human LOGIN NAME. There are exactly TWO buckets:
//   * a CHARACTER image files under the character's OWNER (e.g. Ren → Joshua);
//   * EVERY other (campaign) asset files under the OWNER of the actively-open
//     campaign (e.g. Serpent of Valoria → Maxime) — NOT under whoever uploaded
//     it (so an admin upload never lands under "Admin").
// App-created item folders are Capitalised ("Portrait").
//   DnD Within/<Owner>/Characters/<CharName>/<Type>    (Portrait, notes, …)
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/NPCs/<NpcName>
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Monsters/<Name>
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Items/<Name>
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Places/<Name>  (Places + maps)
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Religions|Factions|Events/<Name>
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Session/<sceneId>   (timeline scenes)
//   DnD Within/<CampaignOwner>/Campains/<Campaign>/Backgrounds/<slot>  (banners)
// Note: unsigned uploads cannot set a custom filename, so each asset gets an
// auto-generated name INSIDE its named folder (the folder leaf is the entity
// name). The single source of truth for this mapping is buildFolder() below.
// ============================================================

(function () {
    // ---- CONFIG ------------------------------------------------
    // Both values are PUBLIC by design (cloud name is in every URL; an
    // unsigned preset is meant to be exposed). Safe to commit.
    var CLOUD_NAME = 'dqmdh3b4d';            // ← step 1 (public by design)
    var UPLOAD_PRESET = 'dnd_within';        // ← step 2 (unsigned preset)

    // Optional delete-proxy (Cloudflare Worker in cloudinary-worker/). Until
    // DELETE_WORKER_URL is filled in, del() is a safe no-op. The token is the
    // same one in the Worker's wrangler.toml — not truly secret on a static
    // site, just one defense-in-depth layer (see cloudinary-worker/README.md).
    var DELETE_WORKER_URL = 'YOUR_WORKER_URL'; // e.g. https://dnd-within-cloudinary.<sub>.workers.dev
    var DELETE_TOKEN = 'dcd3b636b8e3d33fc302a3a0ef83c20f23b4b2d8041c8722';
    // ------------------------------------------------------------

    var STORAGE_READY = false;

    function isConfigured() {
        return CLOUD_NAME && UPLOAD_PRESET &&
            CLOUD_NAME !== 'YOUR_CLOUD_NAME' &&
            UPLOAD_PRESET !== 'YOUR_UNSIGNED_PRESET';
    }

    function initStorage() {
        STORAGE_READY = isConfigured();
        if (STORAGE_READY) {
            console.log('[Storage] Cloudinary ready (cloud: ' + CLOUD_NAME + ').');
        } else {
            console.warn('[Storage] Cloudinary not configured, using base64 fallback.');
        }
    }

    function isDataUrl(s) {
        return typeof s === 'string' && s.indexOf('data:') === 0;
    }
    function isHttpUrl(s) {
        return typeof s === 'string' && (s.indexOf('https://') === 0 || s.indexOf('http://') === 0);
    }

    // Root folder for the whole library — mirrors Joshua's local "DnD Within"
    // tree so Cloudinary stays human-browsable. sanitizeFolder turns the space
    // into "_" (→ "DnD_Within"). Legacy assets migrated earlier live under the
    // old "dnd-within" root; those can be re-pathed later if desired.
    var ROOT = 'DnD Within';

    // Map a 'campaign' subpath's first segment to its human folder name.
    var CAMPAIGN_SEG_MAP = {
        dashboard: 'Backgrounds',
        timeline:  'Session',
        maps:      'Places',
        notes:     'Notes'
    };
    // Map a lore-category id to its folder name. 'places' is the single
    // location category (legacy 'locations'/'cities' still map here for old data).
    var LORE_CAT_MAP = {
        items: 'Items', monsters: 'Monsters', places: 'Places',
        locations: 'Places', cities: 'Places',
        religions: 'Religions', factions: 'Factions', events: 'Events', npcs: 'NPCs'
    };

    function cap(s) {
        s = String(s || '');
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    // Best-effort active campaign id for path scoping (single-campaign default).
    function activeCampaignId() {
        try {
            if (typeof getActiveCampaign === 'function') {
                var c = getActiveCampaign();
                if (c) return String(c);
            }
        } catch (e) { /* ignore */ }
        return 'valoria';
    }

    // Human campaign name (e.g. "The Serpent of Valoria") for the folder tree;
    // falls back to the id.
    function activeCampaignName() {
        try {
            var id = activeCampaignId();
            if (typeof getCampaigns === 'function') {
                var camps = getCampaigns();
                if (camps && camps[id] && camps[id].name) return camps[id].name;
            }
            return id;
        } catch (e) { return 'valoria'; }
    }

    // Character display name (e.g. "Ren Ashvane") for the folder tree; falls
    // back to the id.
    function charNameFromId(charId) {
        try {
            if (typeof loadCharConfig === 'function') {
                var cfg = loadCharConfig(charId);
                if (cfg && cfg.name) return cfg.name;
            }
        } catch (e) { /* ignore */ }
        return charId || 'unknown';
    }

    // Build the Cloudinary folder for a (category, subpath) pair. This is the
    // single source of truth for the library hierarchy:
    //   DnD Within/<Owner>/Characters/<Name>/<type>
    //   DnD Within/<CampaignOwner>/Campains/<Campaign>/<Category>/<entity>
    // The uploading user scopes the whole tree ("DnD Within/<User>/…") so two
    // users can never collide on the same entity name. Falls back to 'shared'.
    function uploaderId() {
        try {
            if (typeof currentUserId === 'function') {
                var u = currentUserId();
                if (u) return String(u);
            }
        } catch (e) { /* ignore */ }
        return 'shared';
    }

    // Login/display name for a user id (the human folder segment shown in
    // Cloudinary), e.g. 'ren' → 'Joshua', 'dm' → 'Maxime'. Falls back to the id.
    function userDisplayName(userId) {
        try {
            if (typeof getUserData === 'function') {
                var u = getUserData(userId);
                if (u && u.name) return u.name;
            }
        } catch (e) { /* ignore */ }
        return userId || 'shared';
    }

    // Owner of a character → owner's display name. A character stores `player`
    // = the owning user's id, so a portrait uploaded BY the admin still files
    // under the OWNER (e.g. Ren → Joshua), not the uploader. Falls back to the
    // uploader's display name if the owner can't be resolved.
    function charOwnerName(charId) {
        try {
            if (typeof loadCharConfig === 'function') {
                var cfg = loadCharConfig(charId);
                if (cfg && cfg.player) return userDisplayName(cfg.player);
            }
        } catch (e) { /* ignore */ }
        return userDisplayName(uploaderId());
    }

    // Owner display name of the actively-open campaign — campaign assets (NPCs,
    // maps, scenes, lore, banners) all file under the campaign OWNER (e.g.
    // Serpent of Valoria → Maxime), regardless of who uploads them. The owner is
    // the campaign's explicit `owner` field, else its `dm`. Crucially it NEVER
    // falls back to the uploader (that is what put fresh Items/Places under
    // "Admin"); an unresolvable campaign yields the stable 'shared' bucket.
    function campaignOwnerName() {
        try {
            var id = activeCampaignId();
            if (typeof getCampaigns === 'function') {
                var camps = getCampaigns();
                var camp = camps && camps[id];
                if (camp) {
                    var ownerId = camp.owner || camp.dm;
                    if (ownerId) return userDisplayName(ownerId);
                }
            }
        } catch (e) { /* ignore */ }
        return 'shared';
    }

    // Capitalise each "/"-segment of a fixed item-type path so app-created
    // folders read as "Portrait", "Notes", etc. (per Joshua's convention).
    function capPath(p) {
        return String(p || '').split('/').map(function (s) { return cap(s); }).join('/');
    }

    function buildFolder(category, subpath) {
        subpath = String(subpath || '');
        if (category === 'player' || category === 'character') {
            // subpath: "<charId>/<type>" → <Owner>/Characters/<CharName>/<Type>
            var cp = subpath.split('/');
            var charId = cp[0] || 'unknown';
            var type = cp.slice(1).join('/');
            var f = ROOT + '/' + charOwnerName(charId) + '/Characters/' + charNameFromId(charId);
            if (type) f += '/' + capPath(type);
            return f;
        }
        // Campaign-scoped assets all live under the campaign OWNER's folder.
        // Folder is "Campains" (matches Joshua's existing local tree — yes, the
        // spelling is intentional so new uploads group with the old ones).
        var dmBase = ROOT + '/' + campaignOwnerName() + '/Campains/' + activeCampaignName();
        if (category === 'campaign') {
            // subpath: "<seg>/<rest>" e.g. "timeline/<id>", "dashboard/<slot>"
            var cs = subpath.split('/');
            var seg = cs[0] || 'Other';
            var mapped = CAMPAIGN_SEG_MAP[seg] || cap(seg);
            var rest = cs.slice(1).join('/');
            var cf = dmBase + '/' + mapped;
            if (rest) cf += '/' + rest;
            return cf;
        }
        if (category === 'npc') {
            // subpath: "<npcName>"
            return dmBase + '/NPCs/' + (subpath || 'unnamed');
        }
        if (category === 'lore') {
            // subpath: "<loreCat>/<entityName>"
            var lp = subpath.split('/');
            var lcat = LORE_CAT_MAP[lp[0]] || cap(lp[0] || 'Other');
            var entity = lp.slice(1).join('/') || 'unnamed';
            return dmBase + '/' + lcat + '/' + entity;
        }
        // Fallback for any other category.
        return ROOT + '/' + userDisplayName(uploaderId()) + '/' + category + '/' + subpath;
    }

    // Sanitise a Cloudinary folder path. Keep "/" as the separator and KEEP
    // SPACES (Joshua wants readable folder names without underscores, e.g.
    // "DnD Within/Campains/The Serpent of Valoria/NPCs/Mara Veldin"). Only
    // truly-unsafe characters are stripped (→ space); repeats collapsed; ends
    // trimmed.
    function sanitizeFolder(p) {
        return String(p)
            .replace(/[^a-zA-Z0-9 /_-]+/g, ' ')
            .replace(/ {2,}/g, ' ')
            .replace(/\/{2,}/g, '/')
            .replace(/ *\/ */g, '/')
            .replace(/^[\s/]+|[\s/]+$/g, '');
    }

    // Low-level: upload a base64 dataURL into a Cloudinary folder → Promise<secure_url>.
    // We pass `folder` (honoured by unsigned uploads) rather than `public_id`
    // (which this preset ignores in favour of an auto-generated unguessable
    // name). Cloudinary names each asset uniquely, so a changed portrait/map
    // never collides with an old one — no overwrite needed. The old asset
    // orphans (del() is a no-op) — harmless on the free tier.
    function uploadDataUrl(folder, dataUrl) {
        if (!STORAGE_READY) return Promise.reject(new Error('storage-not-ready'));
        if (!isDataUrl(dataUrl)) return Promise.reject(new Error('not-a-dataurl'));

        var endpoint = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload';
        var form = new FormData();
        form.append('file', dataUrl);                  // Cloudinary accepts a data URI directly
        form.append('upload_preset', UPLOAD_PRESET);
        form.append('folder', sanitizeFolder(folder));

        return fetch(endpoint, { method: 'POST', body: form }).then(function (res) {
            return res.json().then(function (json) {
                if (!res.ok || !json.secure_url) {
                    var msg = (json && json.error && json.error.message) || ('http-' + res.status);
                    throw new Error(msg);
                }
                return json.secure_url;
            });
        });
    }

    // Like uploadDataUrl but accepts a remote https URL as the source. Cloudinary
    // fetches it server-side (no CORS, no secret) and stores a COPY in `folder`.
    // Used by the underscore→space folder migration to re-home existing assets.
    function uploadByUrl(folder, url) {
        if (!STORAGE_READY) return Promise.reject(new Error('storage-not-ready'));
        if (!isHttpUrl(url)) return Promise.reject(new Error('not-an-url'));
        var endpoint = 'https://api.cloudinary.com/v1_1/' + CLOUD_NAME + '/image/upload';
        var form = new FormData();
        form.append('file', url);
        form.append('upload_preset', UPLOAD_PRESET);
        form.append('folder', sanitizeFolder(folder));
        return fetch(endpoint, { method: 'POST', body: form }).then(function (res) {
            return res.json().then(function (json) {
                if (!res.ok || !json.secure_url) {
                    throw new Error((json && json.error && json.error.message) || ('http-' + res.status));
                }
                return json.secure_url;
            });
        });
    }

    // One-shot: re-home every ENTITY image (character portrait / NPC / lore) that
    // isn't already under the correct space-named tree "DnD Within/…" — copy it
    // there (unsigned upload-by-URL, no secret) and rewrite the entity's stored
    // URL. Browser-only (admin session). OLD assets are left in place (orphaned)
    // so the run is reversible — delete the old/loose assets in the Cloudinary UI
    // afterwards. dryRun (default true) only reports the plan; {dryRun:false} applies.
    function migrateImagesToTree(opts) {
        opts = opts || {};
        var dryRun = opts.dryRun !== false;
        if (!STORAGE_READY) return Promise.reject(new Error('storage-not-ready'));
        if (typeof collectEntities !== 'function') return Promise.reject(new Error('collectEntities-missing'));

        var ents = collectEntities().filter(function (e) { return e.image && isHttpUrl(e.image); });
        var jobs = [];
        ents.forEach(function (e) {
            var folder = null;
            if (e.type === 'character') folder = buildFolder('player', e.id + '/portrait');
            else if (e.type === 'npc') folder = buildFolder('npc', e.name);
            else if (e.type === 'lore') folder = buildFolder('lore', e.loreCat + '/' + e.name);
            if (!folder) return;
            var pid = publicIdFromUrl(e.image) || '';
            // public_id from the URL is %20-encoded; decode before the check so an
            // asset already in its exact target folder is skipped (idempotent).
            var decoded; try { decoded = decodeURIComponent(pid); } catch (x) { decoded = pid; }
            if (decoded.indexOf(folder + '/') === 0) return; // already in the right place
            jobs.push({ ent: e, folder: folder, oldUrl: e.image });
        });

        var summary = {
            found: jobs.length, migrated: 0, failed: 0, errors: [],
            plan: jobs.map(function (j) { return { name: j.ent.name, type: j.ent.type, from: publicIdFromUrl(j.oldUrl), toFolder: j.folder }; })
        };
        console.log('[images→tree] ' + jobs.length + ' image(s) to re-home.');
        if (dryRun) { console.log('[images→tree] DRY RUN — no changes. Plan:', summary.plan); return Promise.resolve(summary); }

        // Apply sequentially; batch the npc/lore store writes at the end.
        var npcData = (typeof getNPCData === 'function') ? getNPCData() : null;
        var loreData = (typeof getLoreCatsData === 'function') ? getLoreCatsData() : null;
        var npcDirty = false, loreDirty = false;
        var chain = Promise.resolve();
        jobs.forEach(function (job) {
            chain = chain.then(function () {
                return uploadByUrl(job.folder, job.oldUrl).then(function (newUrl) {
                    var e = job.ent;
                    if (e.type === 'character') {
                        var key = 'dw_img_' + e.id + '_portrait';
                        localStorage.setItem(key, newUrl);
                        if (typeof syncUpload === 'function') syncUpload(key);
                    } else if (e.type === 'npc' && npcData) {
                        for (var i = 0; i < (npcData.npcs || []).length; i++) if (npcData.npcs[i].id === e.id) { npcData.npcs[i].image = newUrl; npcDirty = true; break; }
                    } else if (e.type === 'lore' && loreData && Array.isArray(loreData[e.loreCat])) {
                        for (var j = 0; j < loreData[e.loreCat].length; j++) if (loreData[e.loreCat][j].id === e.id) { loreData[e.loreCat][j].image = newUrl; loreDirty = true; break; }
                    }
                    summary.migrated++;
                    console.log('[images→tree] ' + summary.migrated + '/' + summary.found + '  ' + e.type + ':' + e.name);
                }).catch(function (err) {
                    summary.failed++;
                    summary.errors.push({ name: job.ent.name, error: err && err.message });
                    console.warn('[images→tree] FAILED ' + job.ent.name + ': ' + (err && err.message));
                });
            });
        });
        return chain.then(function () {
            if (npcDirty && typeof saveNPCData === 'function') saveNPCData(npcData);
            if (loreDirty && typeof saveLoreCatsData === 'function') saveLoreCatsData(loreData);
            console.log('[images→tree] done.', summary);
            return summary;
        });
    }

    // High-level: store an image and get back the value to persist in the
    // text DB. Returns an https URL when Cloudinary is live, otherwise the
    // original base64 dataURL (identical to legacy behaviour).
    //
    // category: 'player'|'character' | 'campaign' | 'npc' | 'lore' | other
    // subpath:  'player'  → '<charId>/<type>'
    //           'campaign'→ '<seg>/<rest>' (timeline/dashboard/maps/notes/…)
    //           'npc'     → '<npcName>'
    //           'lore'    → '<loreCat>/<entityName>'
    // dataUrl:  the base64 image to store
    function saveImage(category, subpath, dataUrl) {
        if (!isDataUrl(dataUrl)) {
            // Already a URL or empty — nothing to upload.
            return Promise.resolve(dataUrl);
        }
        var folder = buildFolder(category, subpath);
        return uploadDataUrl(folder, dataUrl).then(function (url) {
            return url;
        }).catch(function (err) {
            // Fallback: keep base64 exactly as before. Site never breaks.
            if (err && err.message !== 'storage-not-ready') {
                console.warn('[Storage] upload failed, base64 fallback:', err.message);
            }
            return dataUrl;
        });
    }

    function deleteConfigured() {
        return DELETE_WORKER_URL && DELETE_WORKER_URL !== 'YOUR_WORKER_URL';
    }

    // Extract the Cloudinary public_id from a secure_url.
    //   https://res.cloudinary.com/<cloud>/image/upload/v123/dnd-within/a/b.jpg
    //   → dnd-within/a/b
    // Returns null if the URL isn't a recognisable Cloudinary upload URL.
    function publicIdFromUrl(url) {
        if (!isHttpUrl(url) || url.indexOf('res.cloudinary.com') < 0) return null;
        var m = /\/upload\/(.+)$/.exec(url);
        if (!m) return null;
        var rest = m[1].split('?')[0];
        // Drop a leading version segment (v1234567890/) if present.
        rest = rest.replace(/^v\d+\//, '');
        // Drop the file extension.
        rest = rest.replace(/\.[a-zA-Z0-9]+$/, '');
        // URLs encode spaces as %20; the real Cloudinary public_id has spaces,
        // so decode for an accurate match (delete, skip-checks).
        try { rest = decodeURIComponent(rest); } catch (e) { /* keep raw */ }
        return rest || null;
    }

    // Delete an image from Cloudinary via the delete-proxy Worker. Safe no-op
    // for base64 values, non-Cloudinary URLs, or when the Worker isn't
    // configured. Never rejects — failures are logged, the app continues.
    function deleteImage(value) {
        if (!deleteConfigured()) return Promise.resolve();
        var publicId = publicIdFromUrl(value);
        if (!publicId) return Promise.resolve();
        return fetch(DELETE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + DELETE_TOKEN
            },
            body: JSON.stringify({ public_id: publicId })
        }).then(function (res) {
            return res.json().catch(function () { return {}; });
        }).then(function (data) {
            var r = data && data.results && data.results[0];
            if (!r || (r.result !== 'ok' && r.result !== 'not found')) {
                console.warn('[Storage] delete returned:', r ? r.result : data);
            }
            return data;
        }).catch(function (err) {
            console.warn('[Storage] delete failed (ignored):', err && err.message);
        });
    }

    // ========================================================
    // One-time migration: existing base64 images in the RTDB → Cloudinary.
    // Runs in the browser (admin), AFTER CONFIG is filled in. Walks the
    // whole dw/ tree, uploads every base64 image, and rewrites the field to
    // the resulting https URL. Idempotent: values that are already URLs are
    // skipped, so it is safe to re-run. Non-destructive ordering: the base64
    // is only overwritten once the upload + URL fetch succeed, so an
    // interrupted run loses nothing.
    //
    // Requires the Firebase Database SDK (already loaded for the text DB).
    // ========================================================
    function topLevelCategory(rtdbPath) {
        var first = rtdbPath.split('/')[0];
        if (first === 'characters') return 'player';
        if (first === 'world' || first === 'campaign' || first === 'dm') return 'campaign';
        return 'general';
    }

    function migrateAll(opts) {
        opts = opts || {};
        var dryRun = !!opts.dryRun;
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
            return Promise.reject(new Error('firebase-not-ready'));
        }
        if (!STORAGE_READY && !dryRun) {
            return Promise.reject(new Error('storage-not-ready — fill in CLOUD_NAME + UPLOAD_PRESET in storage.js first'));
        }
        var db = firebase.database();
        var summary = { found: 0, migrated: 0, skipped: 0, failed: 0, bytesSaved: 0, errors: [] };

        return db.ref('dw').once('value').then(function (snap) {
            var root = snap.val() || {};
            var jobs = [];

            (function walk(node, path) {
                if (node === null || node === undefined) return;
                if (typeof node === 'string') {
                    if (isDataUrl(node)) {
                        summary.found++;
                        jobs.push({ path: path, dataUrl: node });
                    }
                    return;
                }
                if (typeof node === 'object') {
                    for (var k in node) {
                        if (Object.prototype.hasOwnProperty.call(node, k)) {
                            walk(node[k], path ? path + '/' + k : k);
                        }
                    }
                }
            })(root, '');

            console.log('[Storage:migrate] found ' + summary.found + ' base64 image(s).');
            if (dryRun) { console.log('[Storage:migrate] dry run — no writes.'); return summary; }

            // Sequential to stay gentle on the connection.
            var chain = Promise.resolve();
            jobs.forEach(function (job) {
                chain = chain.then(function () {
                    var folder = ROOT + '/_migrated/' + topLevelCategory(job.path) + '/' + job.path;
                    return uploadDataUrl(folder, job.dataUrl).then(function (url) {
                        return db.ref('dw/' + job.path).set(url).then(function () {
                            summary.migrated++;
                            summary.bytesSaved += job.dataUrl.length;
                            console.log('[Storage:migrate] ' + summary.migrated + '/' + summary.found + '  ' + job.path);
                        });
                    }).catch(function (err) {
                        summary.failed++;
                        summary.errors.push({ path: job.path, error: err && err.message });
                        console.warn('[Storage:migrate] FAILED ' + job.path + ': ' + (err && err.message));
                    });
                });
            });
            return chain.then(function () {
                console.log('[Storage:migrate] done.', summary);
                return summary;
            });
        });
    }

    window.DWImages = {
        init: initStorage,
        save: saveImage,
        upload: uploadDataUrl,
        del: deleteImage,
        ready: function () { return STORAGE_READY; },
        isDataUrl: isDataUrl,
        isHttpUrl: isHttpUrl,
        publicIdFromUrl: publicIdFromUrl,
        activeCampaignId: activeCampaignId,
        activeCampaignName: activeCampaignName,
        buildFolder: buildFolder,
        sanitizeFolder: sanitizeFolder,
        migrateAll: migrateAll,
        uploadByUrl: uploadByUrl,
        migrateImagesToTree: migrateImagesToTree
    };
})();
