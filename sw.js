// Offline helper for Play Hub in a browser (Windows/desktop) and for Gambit.
// Network first, so a new version shows up right away; when offline, the last copy seen is used.
// Bump CACHE_VERSION on every change to this file.
const CACHE_VERSION = 'hub-0.2.0';
const FILES = ['hub/', 'icon.svg', 'icon-192.png', 'icon-512.png', 'hub/manifest.webmanifest'];
self.addEventListener('install', e => {
  // Each file on its own, so one missing file can't stop the install.
  e.waitUntil(caches.open(CACHE_VERSION).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  // Only our own site and the fonts. The store list (catalog.json) is fetched on purpose when Play Hub checks for updates.
  if (url.origin !== self.location.origin && !fonts) return;
  if (url.pathname.endsWith('catalog.json') || url.pathname.endsWith('studio.json')) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone(), key = url.search ? new Request(url.origin + url.pathname) : e.request;
        caches.open(CACHE_VERSION).then(c => c.put(key, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
