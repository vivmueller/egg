const CACHE_NAME = 'egg-2027_v2026-07-24_11:45';
const urlsToCache = [
  '/egg/',
  '/egg/index.html',
  '/egg/impressum.html',
  '/egg/assets/css/main.css',
  '/egg/assets/js/jquery.min.js',
  '/egg/assets/js/jquery.dropotron.min.js',
  '/egg/assets/js/jquery.scrolly.min.js',
  '/egg/assets/js/browser.min.js',
  '/egg/assets/js/breakpoints.min.js',
  '/egg/assets/js/util.js',
  '/egg/assets/js/main.js',
  '/egg/icons/icon-192.png',
  '/egg/icons/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Cache addAll error:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && url.hostname !== 'api.open-meteo.com') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        // Network error or no cache available
        // Return a custom offline page if needed
        console.log('Fetch failed for:', event.request.url);
        // You can return a custom offline response here if desired
      })
  );
});
