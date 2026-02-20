const CACHE_NAME = 'rtfm-gpt-v1';
const STATIC_ASSETS = [
  '/',
  '/icon.svg',
  '/globals.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network First for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
            // Return a custom offline JSON response if needed, 
            // or let the client handle the error (preferred for this app's logic)
            return new Response(JSON.stringify({ error: 'Offline' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        })
    );
    return;
  }

  // Stale-While-Revalidate for other requests (Next.js assets, etc.)
  // Or simpler: Cache First falling back to Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache new static assets
        if (event.request.method === 'GET' && fetchResponse.status === 200) {
            // Don't cache everything blindly, maybe just same origin
            if (url.origin === self.location.origin) {
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
        }
        return fetchResponse;
      });
    })
  );
});
