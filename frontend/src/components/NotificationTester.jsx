import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../services/localNotificationService';
import api from '../utils/axios';
import Button from './Button';
import Card from './Card';
import Select from './Select';
import useAuthStore from '../store/authStore';
import { useToast } from '../contexts/ToastContext';

const NotificationTester = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(
    'Notification' in window ? Notification.permission : 'not-supported'
  );
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'admin_principal' || user?.role === 'administrativo';

  // Cargar usuarios si es admin
  useEffect(() => {
    if (isAdmin && user) {
      loadUsers();
    }
  }, [isAdmin, user]);

  const loadUsers = async () => {
    if (!isAdmin || !user) {
      return; // Solo administradores pueden cargar usuarios
    }
    
    try {
      const response = await api.get('/users/basic');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      // Silenciar error si no es admin
      if (error.response?.status !== 403) {
        setUsers([]);
      }
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      setMessage(granted ? 'Permisos concedidos' : 'Permisos denegados');
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      setMessage('Error solicitando permisos');
    }
    setLoading(false);
  };

  const handleTestBrowserNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Notificación de prueba', {
        body: 'Esta es una notificación de prueba del navegador',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
      setMessage('Notificación del navegador enviada');
    } else {
      setMessage('Necesitas conceder permisos primero');
    }
  };

  const handleTestToast = () => {
    showToast({
      title: '🍞 Toast de Prueba',
      body: 'Esta es una notificación toast que siempre funciona',
      type: 'test',
      _id: 'test-' + Date.now()
    }, {
      duration: 5000
    });
    setMessage('Toast mostrado - ¡Esta notificación visual siempre funciona!');
  };

  const handleTestBackendNotification = async () => {
    setLoading(true);
    try {
      const payload = {
        title: 'Prueba desde Backend',
        body: `Esta notificación viene de ${user.name}`,
        sendToAll
      };

      // Si no es "enviar a todos" y es admin con usuario específico
      if (!sendToAll && isAdmin && selectedUserId) {
        payload.userId = selectedUserId;
      }

      const response = await api.post('/notifications/test', payload);
      
      let targetMessage;
      if (sendToAll) {
        targetMessage = ' a todos los demás usuarios';
      } else {
        const targetUser = selectedUserId && users.find(u => u._id === selectedUserId);
        targetMessage = targetUser ? ` a ${targetUser.name}` : ' a ti mismo';
      }
      
      setMessage(`Notificación backend enviada${targetMessage}: ` + response.data.message);
    } catch (error) {
      console.error('Error enviando notificación:', error);
      setMessage('Error: ' + (error.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted': return '✅ Concedidos';
      case 'denied': return '❌ Denegados (clic en 🔒 junto a la URL para cambiar)';
      case 'default': return '⏳ Pendientes';
      case 'not-supported': return '❌ No soportado';
      default: return '❓ Desconocido';
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted': return 'text-green-600';
      case 'denied': return 'text-red-600';
      case 'default': return 'text-yellow-600';
      case 'not-supported': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔔 Probador de Notificaciones
        </h3>
        
        <div className="space-y-4">
          {/* Estado de permisos */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Estado de permisos:</p>
            <p className={`font-semibold ${getPermissionStatusColor()}`}>
              {getPermissionStatusText()}
            </p>
          </div>

          {/* Opciones de destinatario */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opciones de envío:
            </label>
            
            {/* Checkbox para enviar a todos */}
            <div className="mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendToAll}
                  onChange={(e) => setSendToAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enviar a todos los demás usuarios (excepto a mí)
                </span>
              </label>
            </div>

            {/* Selector individual (solo si no está marcado "enviar a todos" y es admin) */}
            {!sendToAll && isAdmin && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  O enviar a usuario específico:
                </label>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full"
                >
                  <option value="">-- A mí mismo --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role === 'chofer' ? 'Chofer' : 'Administrativo'})
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {!sendToAll && !isAdmin && (
              <p className="text-sm text-gray-500">
                Solo puedes enviar notificaciones a ti mismo
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={handleRequestPermission}
              disabled={loading || permissionStatus === 'granted'}
              variant={permissionStatus === 'granted' ? 'secondary' : 'primary'}
            >
              {loading ? 'Solicitando...' : 'Solicitar Permisos'}
            </Button>

            <Button
              onClick={handleTestBrowserNotification}
              disabled={permissionStatus !== 'granted'}
              variant="secondary"
            >
              Probar Notificación del Navegador
            </Button>

            <Button
              onClick={handleTestToast}
              variant="success"
            >
              🍞 Probar Toast Visual (Siempre Funciona)
            </Button>

            <Button
              onClick={handleTestBackendNotification}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Enviando...' : 'Probar Notificación del Backend'}
            </Button>

            {permissionStatus === 'denied' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800 mb-2">
                  <strong>Permisos denegados:</strong>
                </p>
                <ol className="text-xs text-orange-700 list-decimal list-inside">
                  <li>Haz clic en el candado 🔒 junto a la URL</li>
                  <li>Selecciona "Configuración del sitio"</li>
                  <li>Cambia "Notificaciones" a "Permitir"</li>
                  <li>Recarga la página</li>
                </ol>
              </div>
            )}
          </div>

          {/* Mensaje de estado */}
          {message && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-xs text-gray-500 mt-4">
            <p><strong>Pasos para probar:</strong></p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Solicitar permisos de notificación</li>
              <li>Probar notificación del navegador (local)</li>
              <li>Probar notificación del backend (servidor)</li>
            </ol>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NotificationTester;