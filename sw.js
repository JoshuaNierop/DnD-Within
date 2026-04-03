// Cache version — bump this on every deploy to force update
var CACHE_VERSION = 7;
var CACHE_NAME = 'dnd-within-v' + CACHE_VERSION;
var ASSETS = [
    './',
    './index.html',
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
    // Network first for Firebase and external resources
    if (e.request.url.indexOf('firebaseio.com') >= 0 ||
        e.request.url.indexOf('gstatic.com') >= 0 ||
        e.request.url.indexOf('googleapis.com') >= 0) {
        e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
        return;
    }

    // Network-first for own assets (with cache fallback for offline)
    e.respondWith(
        fetch(e.request).then(function(response) {
            // Update cache with fresh version
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
                cache.put(e.request, clone);
            });
            return response;
        }).catch(function() {
            // Offline: serve from cache
            return caches.match(e.request);
        })
    );
});
