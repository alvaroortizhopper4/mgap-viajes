// Service Worker para notificaciones Firebase en segundo plano
// Este archivo debe estar en la carpeta public/

// Importar Firebase scripts para compatibilidad
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Configuración Firebase (misma que en firebase.js)
// NOTA: En producción, reemplaza con tu configuración real
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mgap-viajes-mock.firebaseapp.com",
  projectId: "mgap-viajes-mock",
  storageBucket: "mgap-viajes-mock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:mock-app-id"
};

// Inicializar Firebase en el Service Worker
try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Manejar notificaciones en segundo plano
  messaging.onBackgroundMessage(function(payload) {
    console.log('📱 Notificación recibida en segundo plano:', payload);
    
    const notificationTitle = payload.notification?.title || 'MGAP Viajes';
    const notificationOptions = {
      body: payload.notification?.body || 'Nueva notificación',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.data?.type || 'mgap-notification',
      data: payload.data || {},
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

} catch (error) {
  console.log('Firebase no configurado en Service Worker:', error.message);
}

// Manejar clicks en las notificaciones
self.addEventListener('notificationclick', function(event) {
  console.log('Click en notificación:', event);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Abrir o enfocar la ventana de la aplicación
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
        // Si ya hay una ventana abierta, enfocarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin);
        }
      })
    );
  }
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', function(event) {
  console.log('Notificación cerrada:', event);
});