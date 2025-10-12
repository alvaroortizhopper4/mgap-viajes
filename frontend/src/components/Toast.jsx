import React, { useEffect, useState } from 'react';
import { XIcon, BellIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';

const Toast = ({ notification, onClose, onConfirm, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Función para reproducir sonido de notificación
  const playNotificationSound = () => {
    try {
      // Crear un sonido usando Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar el sonido (tono agradable)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('No se pudo reproducir sonido:', error);
    }
  };

  useEffect(() => {
    // Reproducir sonido al aparecer
    playNotificationSound();
    
    // Animación de entrada
    setTimeout(() => setIsVisible(true), 10);

    // Auto-cerrar
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300); // Duración de animación de salida
  };

  const handleConfirm = async () => {
    if (onConfirm && notification._id) {
      await onConfirm(notification._id);
    }
    handleClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'trip_assigned': return '🚗';
      case 'trip_confirmed': return '✅';
      case 'trip_started': return '🚀';
      case 'trip_completed': return '🏁';
      case 'trip_reminder': return '⏰';
      case 'test': return '🧪';
      default: return '🔔';
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'trip_assigned':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'trip_confirmed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'trip_started':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'trip_completed':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      case 'trip_reminder':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'test':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={`
        w-full transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'}
      `}
    >
      <div className={`
        p-4 rounded-lg border shadow-lg backdrop-blur-sm w-full box-border
        ${getTypeStyles(notification.type)}
      `}>
        <div className="flex items-start space-x-3">
          {/* Icono */}
          <div className="flex-shrink-0 text-2xl mt-1">
            {getIcon(notification.type)}
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-sm font-semibold mb-1 break-words">
              {notification.title}
            </h4>
            <p className="text-sm opacity-90 mb-2 break-words">
              {notification.body}
            </p>
            <p className="text-xs opacity-70">
              Ahora mismo
            </p>
            
            {/* Botones de acción */}
            <div className="flex space-x-2 mt-3">
              {notification._id && (
                <button
                  onClick={handleConfirm}
                  className="px-3 py-1 text-xs font-medium bg-current bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
                >
                  ✓ Confirmar
                </button>
              )}
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 h-1 bg-black/10 rounded-full overflow-hidden w-full">
          <div 
            className="h-full bg-current opacity-50 rounded-full"
            style={{
              width: '100%',
              animation: `toast-shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      {/* CSS en línea para la animación */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes toast-shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  );
};

export default Toast;