const CACHE = 'kharcha-v3';

// Auto-detect base path — works on GitHub Pages (/repo-name/) and root (/)
const BASE = self.location.pathname.replace(/sw\.js$/, '');

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'xlsx.min.js',
  BASE + 'manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache each asset individually — one 404 won't kill the whole install
      return Promise.allSettled(
        ASSETS.map(url =>
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
          }).catch(() => {}) // silently skip failures
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first, fall back to network, fall back to cached index.html
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(BASE + 'index.html'));
    })
  );
});