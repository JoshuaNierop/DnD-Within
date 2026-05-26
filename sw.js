// Cache version — bump this on every deploy to force update
var CACHE_VERSION = 16;
var CACHE_NAME = 'dnd-within-v' + CACHE_VERSION;
var ASSETS = [
    './',
    './index.html',
    './core.js',
    './ui-pages.js',
    './ui-character.js',
    './ui-world.js',
    './ui-modals.js',
    './ui-settings.js',
    './events.js',
    './app.js',
    './data.js',
    './engine.js',
    './i18n.js',
    './sync.js',
    './effects.js',
    './style.css',
    './script.js'
];

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    // Skip waiting so new SW activates immediately
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    // Delete ALL old caches
    e.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(k) { return k !== CACHE_NAME; })
                    .map(function(k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    // Skip non-http(s) schemes (chrome-extension://, data:, blob:, etc.) — Cache API rejects these.
    if (!/^https?:/.test(e.request.url)) return;

    // Network first for Firebase and external resources
    if (e.request.url.indexOf('firebaseio.com') >= 0 ||
        e.request.url.indexOf('gstatic.com') >= 0 ||
        e.request.url.indexOf('googleapis.com') >= 0) {
        e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
        return;
    }

    // Only cache same-origin GET requests — cross-origin (gridstack CDN) and POST/etc would fail.
    if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) {
        return;
    }

    // Network-first for own assets (with cache fallback for offline)
    e.respondWith(
        fetch(e.request).then(function(response) {
            // Only cache successful basic responses
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                try { cache.put(e.request, clone); } catch (err) {}
            }).catch(function() {});
            return response;
        }).catch(function() {
            return caches.match(e.request);
        })
    );
});
