const CACHE_NAME = 'egg-2027_v2026-08-05_10:10';

const urlsToCache = [
  '/egg/',
  '/egg/index.html',
  '/egg/impressum.html',
  '/egg/login.html',
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

// Install: pre-cache only the core files (no images, no days)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.error('Cache addAll error:', err))
  );
  self.skipWaiting();
});

// Activate: delete all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Days pages: always network-first, no caching
  if (url.pathname.includes('/egg/days/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)) // fallback to cache if offline
    );
    return;
  }

  // 2. Images: cache-first, but cache is busted when CACHE_NAME changes
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return response;
        }).catch(() => console.log('Image fetch failed:', url.pathname));
      })
    );
    return;
  }

  // 3. External requests (except weather API): don't cache
  if (url.origin !== location.origin && url.hostname !== 'api.open-meteo.com') return;

  // 4. Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => console.log('Fetch failed:', url.pathname));
    })
  );
});