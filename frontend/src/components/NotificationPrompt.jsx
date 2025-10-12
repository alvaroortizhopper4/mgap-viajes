import React, { useState, useEffect } from 'react';
import { BellIcon, X } from 'lucide-react';
import Button from './Button';
import useNotificationPermissions from '../hooks/useNotificationPermissions';

const NotificationPrompt = () => {
  const { 
    permission, 
    isSupported, 
    isDefault, 
    requestPermission,
    hasAskedOnLogin 
  } = useNotificationPermissions();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mostrar el prompt solo si:
  // 1. El navegador soporta notificaciones
  // 2. Los permisos están en default
  // 3. No se han solicitado en este login
  // 4. El usuario ha estado en la página por al menos 3 segundos
  useEffect(() => {
    console.log('🔔 NotificationPrompt - Estado:', {
      isSupported,
      isDefault,
      hasAskedOnLogin,
      permission,
      shouldShow: isSupported && isDefault && !hasAskedOnLogin
    });
    
    if (isSupported && isDefault && !hasAskedOnLogin) {
      console.log('🔔 NotificationPrompt - Programando mostrar en 3 segundos...');
      const timer = setTimeout(() => {
        console.log('🔔 NotificationPrompt - ¡Mostrando popup!');
        setIsVisible(true);
      }, 3000); // Mostrar después de 3 segundos

      return () => clearTimeout(timer);
    }
  }, [isSupported, isDefault, hasAskedOnLogin, permission]);

  const handleAllow = async () => {
    setIsProcessing(true);
    const granted = await requestPermission();
    
    if (granted) {
      // Enviar notificación de confirmación
      setTimeout(() => {
        new Notification('¡Notificaciones activadas!', {
          body: 'Ahora recibirás alertas importantes de MGAP',
          icon: '/icon-192x192.png',
        });
      }, 500);
    }
    
    setIsProcessing(false);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Marcar que el usuario rechazó para no volver a mostrar en esta sesión
    localStorage.setItem('notification-asked-on-login', 'true');
  };

  if (!isVisible || !isSupported || !isDefault) {
    console.log('🔔 NotificationPrompt - No mostrar porque:', {
      isVisible,
      isSupported,
      isDefault,
      returning: true
    });
    return null;
  }
  
  console.log('🔔 NotificationPrompt - Renderizando popup!');

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <BellIcon className="h-6 w-6 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Activar Notificaciones
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Recibe alertas importantes sobre tus viajes y tareas en tiempo real.
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAllow}
                disabled={isProcessing}
                size="sm"
                variant="primary"
              >
                {isProcessing ? 'Activando...' : 'Permitir'}
              </Button>
              
              <Button
                onClick={handleDismiss}
                disabled={isProcessing}
                size="sm"
                variant="secondary"
              >
                Ahora no
              </Button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;