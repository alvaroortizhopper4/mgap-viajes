import { useEffect, useState } from 'react';
import { 
  initializeFirebase, 
  requestNotificationPermission, 
  onForegroundMessage,
  showLocalNotification 
} from '../firebase';
import api from '../utils/axios';

const useNotifications = () => {
  const [notificationPermission, setNotificationPermission] = useState(
    'Notification' in window ? Notification.permission : 'default'
  );
  const [fcmToken, setFcmToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Inicializar Firebase al montar el hook
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const messaging = await initializeFirebase();
        setIsSupported(!!messaging || 'Notification' in window);
      } catch (error) {
        console.log('Error inicializando Firebase:', error);
        setIsSupported('Notification' in window); // Al menos soportar notificaciones locales
      }
    };

    initFirebase();
  }, []);

  // Solicitar permisos de notificación
  const requestPermission = async () => {
    try {
      const result = await requestNotificationPermission();
      
      if (result.success) {
        setNotificationPermission('granted');
        setFcmToken(result.token);
        
        // Registrar token en el backend
        if (result.token) {
          try {
            await api.post('/notifications/register-token', {
              fcmToken: result.token,
              platform: 'web',
              appVersion: '1.0.0',
              deviceModel: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
            });
            console.log('✅ Token registrado en el backend');
          } catch (apiError) {
            console.error('Error registrando token en backend:', apiError);
          }
        }
        
        return result;
      } else {
        setNotificationPermission('denied');
        return result;
      }
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      setNotificationPermission('denied');
      return { success: false, error: error.message };
    }
  };

  // Configurar listener para notificaciones en primer plano
  useEffect(() => {
    if (notificationPermission === 'granted') {
      const unsubscribe = onForegroundMessage((payload) => {
        // Mostrar notificación local cuando la app está abierta
        showLocalNotification(
          payload.notification?.title || 'MGAP Viajes',
          payload.notification?.body || 'Nueva notificación',
          payload.data
        );
      });

      return unsubscribe;
    }
  }, [notificationPermission]);

  // Función para mostrar notificación local manual
  const showNotification = (title, body, data = {}) => {
    if (notificationPermission === 'granted') {
      showLocalNotification(title, body, data);
    }
  };

  return {
    isSupported,
    notificationPermission,
    fcmToken,
    requestPermission,
    showNotification
  };
};

export default useNotifications;