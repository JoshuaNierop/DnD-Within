var CACHE_NAME = 'dnd-within-v1';
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
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
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
    // Network first for Firebase, cache first for assets
    if (e.request.url.indexOf('firebaseio.com') >= 0 || e.request.url.indexOf('gstatic.com') >= 0) {
        e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
    } else {
        e.respondWith(
            caches.match(e.request).then(function(cached) {
                return cached || fetch(e.request).then(function(response) {
                    return caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(e.request, response.clone());
                        return response;
                    });
                });
            })
        );
    }
});
