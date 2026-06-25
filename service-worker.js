/* ─── Moore Market PWA — Service Worker ─────────────────── */
const CACHE_NAME = 'moore-market-v1';

// Archivos a cachear para uso offline
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.10.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
];

/* ─── Instalación: cachear assets ───────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* ─── Activación: limpiar caches antiguas ───────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ─── Fetch: Network first, cache como fallback ─────────── */
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // Firebase y APIs externas: siempre red (no cachear datos)
  const url = event.request.url;
  if (
    url.includes('firebaseio.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com')
  ) {
    return; // dejar pasar sin intervenir
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia fresca en caché
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Sin red → servir desde caché
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback a index.html para rutas desconocidas
          return caches.match('/index.html');
        });
      })
  );
});
