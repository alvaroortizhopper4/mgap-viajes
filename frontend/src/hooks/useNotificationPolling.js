import { useState, useEffect, useRef } from 'react';
import api from '../utils/axios';
import useAuthStore from '../store/authStore';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook para polling inteligente de notificaciones con diferentes frecuencias según el rol
 */
const useNotificationPolling = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef(null);
  const { user, isDriver } = useAuthStore();
  const { showToast } = useToast();

  // Determinar frecuencia según rol del usuario
  const getPollingInterval = () => {
    if (isDriver()) {
      return 20000; // Choferes: cada 20 segundos (más crítico para ellos)
    }
    return 30000; // Admins: cada 30 segundos
  };

  // Función para mostrar notificación nativa del navegador
  const showBrowserNotification = (notification) => {
    console.log('🔄 Intentando mostrar notificación:', notification.title);
    console.log('📋 Permiso actual:', Notification.permission);
    console.log('🌐 Soporte:', 'Notification' in window);
    
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: notification._id,
          requireInteraction: false,
          silent: false
        });

        console.log('✅ Notificación creada exitosamente');
        
        // Eventos para debugging
        notif.onshow = () => console.log('👁️ Notificación mostrada en pantalla');
        notif.onclick = () => console.log('🖱️ Notificación clickeada');
        notif.onclose = () => console.log('❌ Notificación cerrada');
        notif.onerror = (error) => console.error('💥 Error en notificación:', error);

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
          console.log('⏰ Auto-cerrando notificación');
          notif.close();
        }, 5000);
        
        console.log('🔔 Notificación nativa mostrada:', notification.title);
      } catch (error) {
        console.error('❌ Error creando notificación:', error);
      }
    } else {
      console.warn('⚠️ Sin permisos para notificaciones. Permiso actual:', Notification.permission);
    }
  };

  // Función para obtener notificaciones desde el backend
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications', {
        params: { limit: 5, unread: true }
      });
      
      if (response.data) {
        const newNotifications = response.data.notifications || [];
        const previousNotificationIds = recentNotifications.map(n => n._id);
        
        // Detectar notificaciones realmente nuevas (que no estaban antes Y que no estén leídas)
        const trulyNewNotifications = newNotifications.filter(
          notification => !previousNotificationIds.includes(notification._id) && !notification.read
        );
        
        // Mostrar notificaciones nativas y toasts para las nuevas
        if (trulyNewNotifications.length > 0) {
          console.log('🆕 Nuevas notificaciones detectadas:', trulyNewNotifications.length);
          trulyNewNotifications.forEach(notification => {
            // Mostrar notificación nativa (si está soportado)
            showBrowserNotification(notification);
            
            // Siempre mostrar toast como respaldo
            showToast({
              title: notification.title,
              body: notification.body,
              type: notification.type || 'system',
              _id: notification._id
            }, {
              duration: 6000 // 6 segundos para el toast
            });
          });
        }
        
        setUnreadCount(response.data.unreadCount || 0);
        setRecentNotifications(newNotifications);
        setLastCheck(new Date());
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  };

  // Función para marcar notificación como leída
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // Actualizar estado local
      setRecentNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Función para marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setRecentNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Iniciar polling
  const startPolling = () => {
    if (intervalRef.current || !user) return;

    // Fetch inmediato solo una vez
    fetchNotifications();

    // Activar polling cada 10 segundos para probar
    const interval = 10000; // 10 segundos para prueba
    intervalRef.current = setInterval(fetchNotifications, interval);
    
    console.log('� Polling activado cada 10 segundos para pruebas');
  };

  // Detener polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Efecto para manejar el polling según autenticación
  useEffect(() => {
    if (user) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [user]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    unreadCount,
    recentNotifications,
    lastCheck,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
    isPolling: !!intervalRef.current
  };
};

export default useNotificationPolling;