/* Service Worker — Radar Unificando
 * Estratégia:
 *  - Navegações (HTML): network-first com fallback para o cache (app shell).
 *  - Assets estáticos same-origin (/icons, /logo, /manifest, /pix-qr, /og-image): cache-first.
 *  - APIs (/api/*) e origens externas (Google Fonts, GA): nunca em cache.
 */
const CACHE = 'radar-unificando-v1';
const STATIC_ASSETS = ['/', '/icons/icon-192.png', '/icons/icon-512.png', '/site.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // não tocar em cross-origin
  if (url.pathname.startsWith('/api/')) return; // dados dinâmicos: sempre rede

  if (request.mode === 'navigate') {
    // Network-first com fallback para o app shell
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Assets estáticos: cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
    )
  );
});
