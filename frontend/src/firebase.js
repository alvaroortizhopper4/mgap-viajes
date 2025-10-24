// Configuración Firebase para notificaciones web
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import api from './utils/axios';

// Configuración mock - reemplaza con tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// VAPID Key para notificaciones push (reemplaza por la real de Firebase)
const vapidKey = "TU_VAPID_KEY";

let app = null;
let messaging = null;

// Inicializar Firebase
const initializeFirebase = async () => {
  try {
    // Verificar si las notificaciones están soportadas
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging no es compatible con este navegador');
      return null;
    }

    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    
    console.log('Firebase inicializado para notificaciones');
    return messaging;
  } catch (error) {
    console.log('Error inicializando Firebase:', error);
    return null;
  }
};

// Solicitar permisos de notificación y obtener token FCM real
const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return { success: false, error: 'Navegador no compatible' };
    }

    const currentPermission = Notification.permission;
    if (currentPermission === 'denied') {
      return { success: false, error: 'Permisos denegados previamente' };
    }

    let permission = currentPermission;
    if (currentPermission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      // Obtener token FCM real
      if (!messaging) {
        await initializeFirebase();
      }
      try {
        const token = await getToken(messaging, { vapidKey });
        console.log('Token FCM obtenido:', token);
        // Enviar el token al backend para asociarlo al usuario
        try {
          await api.post('/notifications/register-token', { token });
          console.log('Token FCM registrado en backend');
        } catch (err) {
          console.error('Error registrando token en backend:', err);
        }
        return { success: true, token, mock: false };
      } catch (err) {
        console.error('No se pudo obtener el token FCM', err);
        return { success: false, error: err.message };
      }
    } else {
      return { success: false, error: 'Permisos denegados' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Escuchar notificaciones en primer plano
const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.log('Firebase Messaging no disponible');
    return () => {}; // Retornar función vacía para cleanup
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Notificación recibida en primer plano:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error configurando listener de notificaciones:', error);
    return () => {};
  }
};

// Mostrar notificación local
const showLocalNotification = (title, body, data = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  // Unificar deduplicación con polling
  if (!window.shownNotificationIds) window.shownNotificationIds = new Set();
  const shownNotificationIds = window.shownNotificationIds;
  const notifId = data._id || data.tag || title + body;
  if (shownNotificationIds.has(notifId)) {
    return;
  }
  shownNotificationIds.add(notifId);
  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notifId,
      data
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    setTimeout(() => {
      notification.close();
    }, 5000);
  } catch (error) {
    // Silenciar error
  }
};

export {
  initializeFirebase,
  requestNotificationPermission,
  onForegroundMessage,
  showLocalNotification
};