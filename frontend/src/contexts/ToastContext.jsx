import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Función para marcar notificación como leída
  const confirmNotification = useCallback(async (notificationId) => {
    try {
      const api = (await import('../utils/axios')).default;
      await api.put(`/notifications/${notificationId}/read`);
      console.log('✅ Notificación marcada como leída:', notificationId);
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
    }
  }, []);

  const showToast = useCallback((notification, options = {}) => {
    // Verificar si ya existe un toast idéntico reciente (últimos 2 segundos)
    const now = Date.now();
    const existingToast = toasts.find(toast => 
      toast.notification.title === notification.title &&
      toast.notification.body === notification.body &&
      (now - toast.id) < 2000 // Dentro de los últimos 2 segundos
    );

    if (existingToast) {
      console.log('🚫 Toast duplicado detectado, ignorando:', notification.title);
      return existingToast.id;
    }

    const id = Date.now() + Math.random();
    const newToast = {
      id,
      notification,
      duration: options.duration || 5000,
      ...options
    };

    console.log('🍞 Mostrando toast:', notification.title);

    setToasts(prev => [...prev, newToast]);

    // Auto-remover después de la duración + tiempo de animación
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, newToast.duration + 500);

    return id;
  }, [toasts]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    showToast,
    removeToast,
    clearAllToasts,
    confirmNotification
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Container de Toasts - Centrado */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
        <div className="space-y-3 w-full max-w-sm">
          {toasts.map((toast, index) => (
            <div
              key={toast.id}
              className="pointer-events-auto w-full"
              style={{
                transform: `translateY(${index * 10}px)`,
                zIndex: 1000 - index
              }}
            >
              <Toast
                notification={toast.notification}
                onClose={() => removeToast(toast.id)}
                onConfirm={confirmNotification}
                duration={toast.duration}
              />
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;