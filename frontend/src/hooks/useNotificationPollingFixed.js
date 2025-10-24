import { useState, useEffect, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import api from '../utils/axios';
import useAuthStore from '../store/authStore';

/**
 * Hook para polling inteligente de notificaciones con diferentes frecuencias según el rol
 */
const useNotificationPollingFixed = () => {
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

  // Set global para evitar notificaciones duplicadas entre polling y FCM
  if (!window.shownNotificationIds) window.shownNotificationIds = new Set();
  const shownNotificationIds = window.shownNotificationIds;
  const showBrowserNotification = (notification) => {
    if (!notification || !notification._id) return;
    if (shownNotificationIds.has(notification._id)) {
      return;
    }
    shownNotificationIds.add(notification._id);
    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: notification._id,
          requireInteraction: false,
          silent: false
        });
      } catch (err) {
        // Silenciar error
      }
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
            showBrowserNotification(notification);
            showToast(notification, { duration: 6000 });
          });
        }
        setRecentNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
        setLastCheck(new Date());
      }
    } catch (error) {
      // Silenciar error
    }
  };

  // Marcar como leída una notificación
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setRecentNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      // Silenciar error
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setRecentNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // Silenciar error
    }
  };

  // Iniciar polling
  const startPolling = () => {
    if (intervalRef.current || !user) return;
    fetchNotifications();
    const interval = getPollingInterval();
    intervalRef.current = setInterval(fetchNotifications, interval);
    console.log('� Polling activado cada', interval / 1000, 'segundos');
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

export default useNotificationPollingFixed;
