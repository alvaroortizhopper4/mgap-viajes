// Configuración Firebase para notificaciones web
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Configuración mock - reemplaza con tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// VAPID Key para notificaciones push (también mock)
const vapidKey = "mock-vapid-key";

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

// Solicitar permisos de notificación
const requestNotificationPermission = async () => {
  try {
    // Verificar soporte del navegador
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return { success: false, error: 'Navegador no compatible' };
    }

    // Detectar tipo de dispositivo
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 Dispositivo detectado:', isMobile ? 'Móvil' : 'Desktop');
    console.log('🌐 User Agent:', navigator.userAgent);

    // Verificar estado actual de permisos
    const currentPermission = Notification.permission;
    console.log('🔔 Estado actual de notificaciones:', currentPermission);

    if (currentPermission === 'denied') {
      console.log('❌ Permisos denegados previamente');
      return { success: false, error: 'Permisos denegados previamente' };
    }

    // Solicitar permiso si es necesario
    let permission = currentPermission;
    if (currentPermission === 'default') {
      permission = await Notification.requestPermission();
      console.log('Resultado de solicitud de permisos:', permission);
    }
    
    if (permission === 'granted') {
      console.log('Permisos de notificación concedidos');
      
      // Generar token mock
      const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Usando token mock:', mockToken);
      return { 
        success: true, 
        token: mockToken,
        mock: true 
      };
    } else {
      console.log('Permisos de notificación denegados');
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