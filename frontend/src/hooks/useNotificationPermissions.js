import { useState, useEffect, useCallback } from 'react';

const useNotificationPermissions = () => {
  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission;
      console.log('🔔 useNotificationPermissions - Permiso inicial:', perm);
      return perm;
    }
    console.log('🔔 useNotificationPermissions - Notificaciones no soportadas');
    return 'not-supported';
  });
  
  const [hasAskedOnLogin, setHasAskedOnLogin] = useState(() => {
    const asked = localStorage.getItem('notification-asked-on-login') === 'true';
    console.log('🔔 useNotificationPermissions - hasAskedOnLogin inicial:', asked);
    return asked;
  });

  // Función para solicitar permisos
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Permisos de notificación denegados permanentemente');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // Marcar que ya se solicitó en este login
      localStorage.setItem('notification-asked-on-login', 'true');
      setHasAskedOnLogin(true);
      
      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  }, []);

  // Función para solicitar permisos automáticamente después del login
  const requestPermissionOnLogin = useCallback(async () => {
    // Solo solicitar si:
    // 1. El navegador soporta notificaciones
    // 2. Los permisos están en estado 'default' (no se han solicitado)
    // 3. No se han solicitado en este login
    if (
      'Notification' in window && 
      Notification.permission === 'default' && 
      !hasAskedOnLogin
    ) {
      // Esperar un poco para que el usuario se acostumbre a la interfaz
      setTimeout(async () => {
        console.log('🔔 Solicitando permisos de notificación automáticamente...');
        await requestPermission();
      }, 2000); // 2 segundos de delay
    }
  }, [hasAskedOnLogin, requestPermission]);

  // Función para resetear el estado cuando se cierra sesión
  const resetPermissionState = useCallback(() => {
    localStorage.removeItem('notification-asked-on-login');
    setHasAskedOnLogin(false);
  }, []);

  // Escuchar cambios en los permisos
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Función para enviar notificación de prueba
  const sendTestNotification = useCallback((title = 'Notificación MGAP', body = 'Las notificaciones están funcionando correctamente') => {
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'mgap-test', // Para evitar duplicados
        requireInteraction: false, // Se cierra automáticamente
      });
      return true;
    }
    return false;
  }, [permission]);

  return {
    permission,
    isSupported: 'Notification' in window,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    hasAskedOnLogin,
    requestPermission,
    requestPermissionOnLogin,
    resetPermissionState,
    sendTestNotification
  };
};

export default useNotificationPermissions;