// T-5213: service worker de la app instalada. Regla: un precio o una disponibilidad vieja es peor que «sin conexión».
// - Páginas, panel, /api y RSC: SIEMPRE a la red; nunca se guardan. Sin red, una navegación muestra /offline.html.
// - Solo lo estático e inmutable (/_next/static con hash, iconos, emblema, fuentes) se sirve de caché.
// Al cambiar esta lógica, sube VERSION: el activate borra los cachés alia-static-* viejos.
const VERSION = 'v1';
const STATIC_CACHE = 'alia-static-' + VERSION;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll([OFFLINE_URL, '/icon-192.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(name => name.startsWith('alia-static-') && name !== STATIC_CACHE).map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});

function isStatic(url) {
  return /^\/_next\/static\//.test(url.pathname) || /^\/(icon-[\w-]+\.png|apple-icon[\w-]*\.png|brand\/|fonts\/)/.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    event.respondWith(caches.open(STATIC_CACHE).then(cache => cache.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    }))));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
  // Todo lo demás (api, RSC, imágenes de contenido) lo resuelve el navegador sin pasar por caché.
});
