// ============================================================
// D&D Within — Image Storage Abstraction
// ============================================================
//
// Separates IMAGES from the text Realtime Database. Images go to
// Firebase Storage (binary, cheap, off the text DB); the text DB only
// keeps a small https download-URL string instead of a fat base64 blob.
//
// SAFE BY DESIGN — automatic base64 fallback:
//   * If Firebase Storage is not yet activated / SDK missing / upload
//     fails, DWImages.save() resolves with the ORIGINAL base64 dataURL.
//     The caller stores that exactly like before → behaviour is identical
//     to the pre-Storage app. Nothing breaks while Storage is off.
//   * Once Storage is activated (Firebase console → Storage → Get Started)
//     and storage.rules are deployed, save() returns an https URL and new
//     uploads stop bloating the text DB.
//
// Display code is unaffected: every render uses <img src="${value}">,
// which works for both a base64 dataURL and an https URL.
//
// Image taxonomy (4 categories, mirrors the text-DB restructure):
//   images/player/<charId>/<type>.<ext>          ← player uploads
//   images/campaign/<campId>/maps/<id>.<ext>     ← DM: world maps
//   images/campaign/<campId>/timeline/<id>.<ext> ← DM: scenes / events
//   images/campaign/<campId>/npcs/<id>.<ext>     ← DM: NPC portraits
//   images/campaign/<campId>/dashboard/<id>.<ext>← DM: banner slots
//   images/campaign/<campId>/notes/<id>.<ext>    ← world / shared notes
//   images/general/...   images/version/<e50|e55>/...  ← reserved (future)
// ============================================================

(function () {
    var STORAGE_READY = false;
    var rootRef = null;

    function initStorage() {
        try {
            if (typeof firebase === 'undefined' || typeof firebase.storage !== 'function') return;
            if (!firebase.apps || !firebase.apps.length) return;
            rootRef = firebase.storage().ref();
            STORAGE_READY = true;
            console.log('[Storage] Firebase Storage ready.');
        } catch (e) {
            STORAGE_READY = false;
            console.warn('[Storage] Not available, using base64 fallback:', e && e.message);
        }
    }

    function isDataUrl(s) {
        return typeof s === 'string' && s.indexOf('data:') === 0;
    }
    function isHttpUrl(s) {
        return typeof s === 'string' && (s.indexOf('https://') === 0 || s.indexOf('http://') === 0);
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

    function extFromDataUrl(dataUrl) {
        var m = /^data:image\/([a-zA-Z0-9.+-]+)/.exec(dataUrl || '');
        if (!m) return 'jpg';
        var t = m[1].toLowerCase();
        if (t === 'jpeg') return 'jpg';
        if (t === 'svg+xml') return 'svg';
        return t;
    }

    // Low-level: upload a dataURL to a Storage path → Promise<downloadURL>.
    function uploadDataUrl(path, dataUrl) {
        if (!STORAGE_READY || !rootRef) return Promise.reject(new Error('storage-not-ready'));
        if (!isDataUrl(dataUrl)) return Promise.reject(new Error('not-a-dataurl'));
        var ref = rootRef.child(path);
        return ref.putString(dataUrl, 'data_url').then(function (snap) {
            return snap.ref.getDownloadURL();
        });
    }

    // High-level: store an image and get back the value to persist in the
    // text DB. Returns an https URL when Storage is live, otherwise the
    // original base64 dataURL (identical to legacy behaviour).
    //
    // category: 'player' | 'campaign' | 'general' | 'version'
    // subpath:  e.g. 'maps/<id>', 'timeline/<id>', or '<charId>/portrait'
    // dataUrl:  the base64 image to store
    function saveImage(category, subpath, dataUrl) {
        if (!isDataUrl(dataUrl)) {
            // Already a URL or empty — nothing to upload.
            return Promise.resolve(dataUrl);
        }
        var ext = extFromDataUrl(dataUrl);
        var path;
        if (category === 'campaign') {
            path = 'images/campaign/' + activeCampaignId() + '/' + subpath + '.' + ext;
        } else if (category === 'player') {
            path = 'images/player/' + subpath + '.' + ext;
        } else {
            path = 'images/' + category + '/' + subpath + '.' + ext;
        }
        return uploadDataUrl(path, dataUrl).then(function (url) {
            return url;
        }).catch(function (err) {
            // Fallback: keep base64 exactly as before. Site never breaks.
            if (err && err.message !== 'storage-not-ready') {
                console.warn('[Storage] upload failed, base64 fallback:', err.message);
            }
            return dataUrl;
        });
    }

    // Delete an image previously stored in Storage (no-op for base64 values).
    function deleteImage(value) {
        if (!STORAGE_READY || !rootRef || !isHttpUrl(value)) return Promise.resolve();
        try {
            return firebase.storage().refFromURL(value).delete().catch(function () { /* ignore */ });
        } catch (e) {
            return Promise.resolve();
        }
    }

    // ========================================================
    // One-time migration: existing base64 images in the RTDB → Storage.
    // Runs in the browser (admin), AFTER Storage is activated + rules
    // deployed. Walks the whole dw/ tree, uploads every base64 image,
    // and rewrites the field to the resulting https URL. Idempotent:
    // values that are already URLs are skipped, so it is safe to re-run.
    // Non-destructive ordering: the base64 is only overwritten once the
    // upload + URL fetch succeed, so an interrupted run loses nothing.
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
            return Promise.reject(new Error('storage-not-ready — activate Firebase Storage + deploy storage.rules first'));
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
                    var ext = extFromDataUrl(job.dataUrl);
                    var storagePath = 'images/' + topLevelCategory(job.path) + '/_migrated/' + job.path.replace(/[^a-zA-Z0-9_-]+/g, '_') + '.' + ext;
                    return uploadDataUrl(storagePath, job.dataUrl).then(function (url) {
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
        activeCampaignId: activeCampaignId,
        migrateAll: migrateAll
    };
})();
