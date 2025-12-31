
const CACHE_NAME = 'timetable-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, otherwise fetch from network
      return response || fetch(event.request).then((fetchResponse) => {
         // Dynamically cache visited resources (like esm.sh modules)
         return caches.open(CACHE_NAME).then((cache) => {
            // Only cache valid responses and http/https requests
            // Check schema to avoid caching chrome-extension:// or other unsupported schemas
            if(event.request.method === 'GET' && (event.request.url.startsWith('http') || event.request.url.startsWith('https'))) {
                cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
         });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
