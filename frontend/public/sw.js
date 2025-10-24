// Service Worker para PWA
const CACHE_NAME = 'mgap-viajes-v4'; // Incrementa en cada deploy
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forzar activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar requests de red
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si hay cache, devolverla
        if (response) {
          return response;
        }
        // Si no, buscar en red y actualizar cache
        return fetch(event.request).then((networkResponse) => {
          // Solo cachear archivos del mismo origen
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Si falla todo, mostrar fallback opcional
        // return caches.match('/offline.html');
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push message recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MGAP Viajes', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click Received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});