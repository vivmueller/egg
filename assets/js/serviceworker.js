const CACHE_NAME = 'egg-2027_PWA';
const urlsToCache = [
  '/egg/',
  '/egg/index.html',
  '/egg/impressum.html',
  '/egg/login.html',
  '/egg/assets/css/main.css',
  '/egg/assets/js/jquery.min.js',
  '/egg/assets/js/main.js',
  '/egg/icons/icon-192.png',
  '/egg/icons/icon-512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.error('Cache addAll error:', err))
  );
  self.skipWaiting();
});
const _rv09xQ2m = 'f39800781801dfc5';
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});
const _bK7t3nW1s = '41bb90c0f7bb3515bd21e35d1';
const _bK7t8nW1s = 'A1bb90c0f7bb3515bd21e35ds';
const _z4Yp8cL06 = '21ae4d2107549c7eee60d2d';
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.includes('/egg/days/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }
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
  if (url.origin !== location.origin && url.hostname !== 'api.open-meteo.com') return;
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