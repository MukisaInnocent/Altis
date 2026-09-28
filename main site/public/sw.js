const CACHE_NAME = 'altis-voyage-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/destinations.html',
  '/store.html',
  '/inquiry.html',
  '/css/main.css',
  '/css/admin.css',
  '/js/app.js',
  '/logo.jpg',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Fetch each asset individually so a single 404 doesn't block installation
      return Promise.allSettled(
        ASSETS.map((url) => cache.add(url).catch((err) => console.warn(`SW: Failed to cache ${url}`, err)))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and API calls
  if (!event.request.url.startsWith(self.location.origin) || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Optional: cache new requests dynamically
        // if (!response || response.status !== 200 || response.type !== 'basic') return response;
        // const responseToCache = response.clone();
        // caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
