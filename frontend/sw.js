// Chị Ơi! — Service Worker for PWA
// Strategy:
//   - HTML pages: network-first, fallback cache (offline page)
//   - shared/api.js + pwa-register.js: network-first (luôn lấy bản mới — chứa API_BASE)
//   - Static khác (CSS/JS/fonts/icons): cache-first, refresh background
//   - API calls: network-only (real-time data, không cache)

const VERSION = 'chioi-v1.0.2'; // BUMP để force update khi đổi api.js / strategy
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_PAGES  = `${VERSION}-pages`;

// File luôn fetch network trước (không bị lock cache cũ). Quan trọng cho config API.
const NETWORK_FIRST_PATHS = ['/shared/api.js', '/pwa-register.js', '/manifest.json'];

// Pre-cache shell — minimal so install không fail
// KHÔNG precache /shared/api.js để tránh giữ bản cũ
const PRECACHE = [
  '/',
  '/khachhang/dangnhap.html',
  '/khachhang/trangchu.html',
  '/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE).catch(err => console.warn('[SW] precache miss:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(k => k.startsWith('chioi-') && !k.startsWith(VERSION))
        .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // KHÔNG intercept POST/PUT/PATCH/DELETE
  if (req.method !== 'GET') return;

  // KHÔNG cache API calls (cần realtime)
  if (url.pathname.startsWith('/api/') || url.hostname.startsWith('api.')) {
    return; // Let browser fetch normally
  }

  // KHÔNG cache websocket / socket.io
  if (url.pathname.includes('/socket.io/')) return;

  // Network-first cho config files (api.js, pwa-register.js, manifest)
  if (NETWORK_FIRST_PATHS.some(p => url.pathname === p)) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(req, copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(req)) // fallback cache nếu offline
    );
    return;
  }

  // HTML pages: network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          // Cache HTML responses cho lần sau (offline)
          const copy = resp.clone();
          caches.open(CACHE_PAGES).then(cache => cache.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/khachhang/dangnhap.html')))
    );
    return;
  }

  // Static assets: cache-first
  if (/\.(css|js|png|jpg|jpeg|svg|woff2?|ttf|ico|webp)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(resp => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(req, copy)).catch(() => {});
          }
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

// Listen for skipWaiting message từ page (nếu có update prompt)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
