import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from 'lucide-react';
import useNotificationPolling from '../hooks/useNotificationPolling';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const {
    unreadCount,
    recentNotifications,
    lastCheck,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotificationPolling();

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return notifDate.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trip_assigned': return '🚗';
      case 'trip_confirmed': return '✅';
      case 'trip_started': return '🚀';
      case 'trip_completed': return '🏁';
      case 'trip_cancelled': return '❌';
      case 'trip_reminder': return '⏰';
      case 'trip_edited': return '✏️';
      default: return '📝';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    // Aquí podrías agregar navegación específica según el tipo de notificación
  };

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 320; // w-80 = 320px
      const dropdownHeight = 384; // max-h-96 = 24rem = 384px
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Posición vertical: debajo del botón
      let top = rect.bottom + 8;
      
      // Posición horizontal: alineado a la derecha del botón, pero ajustado si se sale
      let left = rect.right - dropdownWidth;
      
      // Ajustar si se sale por la izquierda
      if (left < 16) {
        left = rect.left; // Alinear a la izquierda del botón
      }
      
      // Ajustar si se sale por la derecha
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      
      // Si se sale por abajo, mostrar arriba del botón
      if (top + dropdownHeight > viewportHeight - 16) {
        top = rect.top - dropdownHeight - 8;
      }
      
      // Asegurar que no se salga por arriba
      if (top < 16) {
        top = 16;
      }

      const position = { top, left };

      // console.log('🔧 Calculando posición dropdown:', position);

      setDropdownPosition(position);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      calculateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Recalcular posición cuando se redimensiona la ventana
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  return (
    <div className="relative z-50">
      {/* Botón de campana */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel de notificaciones - Posicionamiento fijo */}
          <div 
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-hidden"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '300px',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
              {lastCheck && (
                <p className="text-xs text-gray-500 mt-1">
                  Última actualización: {formatTime(lastCheck)}
                </p>
              )}
            </div>

            {/* Lista de notificaciones - Scrolleable */}
            <div className="max-h-64 overflow-y-auto">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-500 text-sm">No hay notificaciones recientes</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={fetchNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                🔄 Actualizar notificaciones
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;