// Sistema de notificaciones simple para desarrollo local
import { useState, useEffect } from 'react';

class LocalNotificationService {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
  }

  // Simular envío de notificación
  async sendNotification(userId, title, body, data = {}) {
    const notification = {
      id: Date.now(),
      userId,
      title,
      body,
      data,
      timestamp: new Date(),
      read: false
    };

    this.notifications.push(notification);
    console.log(`📱 Notificación local enviada a ${userId}: ${title}`);
    
    // Notificar a todos los subscribers (frontend)
    this.notifySubscribers(notification);
    
    // Mostrar notificación del navegador si hay permisos
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
    }
    
    return true;
  }

  // Suscribirse a notificaciones
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // Notificar a todos los subscribers
  notifySubscribers(notification) {
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Obtener notificaciones para un usuario
  getNotifications(userId) {
    return this.notifications.filter(n => n.userId === userId);
  }

  // Marcar como leída
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }
}

// Instancia global
const localNotificationService = new LocalNotificationService();

// Función para solicitar permisos de notificación
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Permisos de notificación denegados');
    return false;
  }

  // Solicitar permisos
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Hook para usar notificaciones en React
export const useLocalNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Cargar notificaciones existentes
    setNotifications(localNotificationService.getNotifications(userId));

    // Suscribirse a nuevas notificaciones
    const handleNewNotification = (notification) => {
      if (notification.userId === userId) {
        setNotifications(prev => [notification, ...prev]);
      }
    };

    localNotificationService.subscribe(handleNewNotification);

    return () => {
      // Cleanup subscription (en un proyecto real necesitarías unsuscribe)
    };
  }, [userId]);

  const markAsRead = (notificationId) => {
    localNotificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  return { notifications, markAsRead };
};

export default localNotificationService;