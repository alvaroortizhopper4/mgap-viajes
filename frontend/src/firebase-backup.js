// Configuración Firebase para notificaciones web
// NOTA: Esta es una configuración mock para desarrollo
// En producción, debes reemplazar estos valores con tu configuración real de Firebase

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Configuración mock - reemplaza con tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mgap-viajes-mock.firebaseapp.com",
  projectId: "mgap-viajes-mock", 
  storageBucket: "mgap-viajes-mock.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:mock-app-id"
};

// VAPID Key mock - reemplaza con tu clave real
const vapidKey = "mock-vapid-key";

let app;
let messaging;

// Inicializar Firebase solo si es compatible
const initializeFirebase = async () => {
  try {
    // Verificar si las notificaciones son soportadas
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging no es compatible con este navegador');
      return null;
    }

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('Firebase inicializado para notificaciones web');
    return messaging;
  } catch (error) {
    console.log('Firebase no configurado, usando modo mock:', error.message);
    return null;
  }
};

// Solicitar permisos de notificación
const requestNotificationPermission = async () => {
  try {
    // Verificar soporte del navegador
    if (!('Notification' in window)) {
      console.log('❌ Este navegador no soporta notificaciones');
      return { success: false, error: 'Navegador no compatible' };
    }

    // Verificar estado actual de permisos
    const currentPermission = Notification.permission;
    console.log('🔍 Estado actual de notificaciones:', currentPermission);

    if (currentPermission === 'granted') {
      console.log('✅ Permisos ya concedidos previamente');
      // Proceder directamente a obtener token
    } else if (currentPermission === 'denied') {
      console.log('❌ Permisos denegados previamente. El usuario debe habilitarlos manualmente en la configuración del navegador.');
      return { success: false, error: 'Permisos denegados previamente' };
    }

    // Solicitar permiso (esto mostrará el popup si es 'default')
    const permission = await Notification.requestPermission();
    console.log('📋 Resultado de solicitud de permisos:', permission);
    
    if (permission === 'granted') {
      console.log('✅ Permisos de notificación concedidos');
      
      // Si Firebase no está configurado, simular token
      if (!messaging) {
        const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('🔄 Usando token mock:', mockToken);
        return { 
          success: true, 
          token: mockToken,
          mock: true 
        };
      }

      // Obtener token real de Firebase
      try {
        const token = await getToken(messaging, { vapidKey });
        console.log('🔑 Token FCM obtenido:', token);
        return { success: true, token };
      } catch (tokenError) {
        console.log('Error obteniendo token FCM:', tokenError);
        // Fallback a token mock
        const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return { 
          success: true, 
          token: mockToken,
          mock: true 
        };
      }
    } else {
      console.log('❌ Permisos de notificación denegados');
      return { success: false, error: 'Permisos denegados' };
    }
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar notificaciones en primer plano
const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.log('Firebase Messaging no disponible para notificaciones en primer plano');
    return () => {}; // Retornar función vacía para cleanup
  }

  try {
    return onMessage(messaging, (payload) => {
      console.log('📱 Notificación recibida en primer plano:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error configurando listener de notificaciones:', error);
    return () => {};
  }
};

// Mostrar notificación local (fallback para desarrollo)
const showLocalNotification = (title, body, data = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.type || 'mgap-notification',
      data
    });

    notification.onclick = (event) => {
      event.preventDefault();
      console.log('Notificación clickeada:', data);
      // Aquí puedes agregar lógica para navegar a la página relevante
      notification.close();
    };

    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
};

export {
  initializeFirebase,
  requestNotificationPermission,
  onForegroundMessage,
  showLocalNotification
};