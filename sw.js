// Bump CACHE_VERSION on every release so phones and tablets pick up the update.
const CACHE_VERSION = 'hub-0.1.8';
const FILES = [
  './', 'index.html', 'apps.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'apps/chess/', 'apps/chess/index.html', 'apps/chess/chess.js', 'apps/chess/chess.css', 'apps/chess/pieces.svg', 'apps/chess/logo.svg', 'apps/chess/wood/mahogany-bg.jpg', 'apps/chess/wood/mahogany-light.jpg', 'apps/chess/wood/mahogany-dark.jpg', 'apps/chess/wood/ebony-bg.jpg', 'apps/chess/wood/ebony-light.jpg', 'apps/chess/wood/ebony-dark.jpg', 'apps/chess/wood/burl-bg.jpg', 'apps/chess/wood/burl-light.jpg', 'apps/chess/wood/burl-dark.jpg', 'apps/chess/wood/cherry-bg.jpg', 'apps/chess/wood/cherry-light.jpg', 'apps/chess/wood/cherry-dark.jpg',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Network first, so a new push shows up right away; fall back to the cache when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
