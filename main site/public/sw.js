// Pages are fetched from the network first so visitors always see current prices, offers and
// contact details; the cached copy is only used offline. Static assets are served cache-first.
// Bump CACHE_NAME whenever the precached assets change.
const CACHE_NAME = 'altis-voyage-v3';
const ASSETS = [
  '/',
  '/css/main.css?v=20261023',
  '/js/app.js?v=20261023',
  '/logo-header.jpg',
  '/logo.jpg',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Fetch each asset individually so a single 404 doesn't block installation
      Promise.allSettled(ASSETS.map((url) => cache.add(url).catch((err) => console.warn(`SW: Failed to cache ${url}`, err))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, API and admin requests entirely.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname === '/') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
