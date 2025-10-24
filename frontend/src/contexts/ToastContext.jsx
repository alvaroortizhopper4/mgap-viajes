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
    // Evitar duplicados por ID de notificación
    if (notification && notification._id) {
      const exists = toasts.some(toast => toast.notification && toast.notification._id === notification._id);
      if (exists) {
        console.log('🚫 Toast duplicado detectado por ID, ignorando:', notification._id);
        return null;
      }
    }
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      notification,
      duration: options.duration || 5000,
      ...options
    };
    setToasts(prev => [...prev, newToast]);
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
      
      {/* Container de Toasts - Centrado y adaptativo */}
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-2 sm:p-4">
        <div className="space-y-3 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center mx-auto">
          {toasts.map((toast, index) => (
            <div
              key={toast.id}
              className="pointer-events-auto w-full flex justify-center"
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