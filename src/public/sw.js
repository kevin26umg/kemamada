const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon94.png'
];

// Instalación del Service Worker y almacenamiento en caché de los recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(error => {
            console.error(`Error caching ${url}:`, error);
          });
        })
      );
    })
  );
});

// Activación del Service Worker y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepción de peticiones y uso de caché para respuestas offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Opcional: retorno de una página de fallback si falla la conexión
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
