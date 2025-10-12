import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useNotifications from './hooks/useNotifications';
import useNotificationPermissions from './hooks/useNotificationPermissions';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationPrompt from './components/NotificationPrompt';
import ToastProvider from './contexts/ToastContext';

// Fallback simple en caso de error
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">MGAP - Gestión de Viajes</h1>
      <p className="text-gray-600 mb-4">Cargando aplicación...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  </div>
);

// Lazy loading para optimizar la carga
const Trips = React.lazy(() => import('./pages/Trips'));
const Vehicles = React.lazy(() => import('./pages/Vehicles'));
const Users = React.lazy(() => import('./pages/Users'));
const Drivers = React.lazy(() => import('./pages/Drivers'));

function App() {
  const { initialize, isAuthenticated, user, logout } = useAuthStore();
  const { showNotification } = useNotifications();
  const { 
    requestPermissionOnLogin, 
    resetPermissionState, 
    sendTestNotification,
    isGranted 
  } = useNotificationPermissions();

  // Error boundary simple
  const [hasError, setHasError] = React.useState(false);

  // Detectar si es móvil
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  React.useEffect(() => {
    console.log('📱 Dispositivo detectado:', isMobile ? 'Móvil' : 'Desktop');
    console.log('🌐 User Agent:', navigator.userAgent);
  }, [isMobile]);

  React.useEffect(() => {
    const handleError = (error) => {
      console.error('📱 App Error (Móvil:', isMobile, '):', error);
      if (isMobile) {
        console.error('📱 Error específico en móvil:', {
          message: error.message || error.reason?.message,
          stack: error.error?.stack,
          type: error.type
        });
      }
      setHasError(true);
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('📱 Unhandled Promise Rejection (Móvil:', isMobile, '):', event.reason);
      if (isMobile) {
        console.error('📱 Promise rejection en móvil:', {
          reason: event.reason,
          promise: event.promise
        });
      }
      // No setear hasError para promesas rechazadas, solo logear
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isMobile]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Aplicación</h1>
          <p className="text-gray-600 mb-4">Ha ocurrido un error inesperado.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Inicializar autenticación desde localStorage
    initialize();
  }, []); // Solo ejecutar una vez al montar

  // Efecto para manejar notificaciones cuando el usuario está autenticado
  useEffect(() => {
    // console.log('🔍 Debug - Estado de autenticación:', {
    //   isAuthenticated: isAuthenticated(),
    //   user: user,
    //   token: !!localStorage.getItem('token')
    // });
    
    if (isAuthenticated() && user) {
      // console.log('👤 Usuario autenticado, sistema de notificaciones activo');
      
      // Aquí podrías agregar lógica adicional como:
      // - Polling periódico para notificaciones
      // - WebSocket para notificaciones en tiempo real
      // - etc.
    }
  }, [isAuthenticated, user]);

  // Efecto para solicitar permisos de notificación después del login
  useEffect(() => {
    if (isAuthenticated() && user) {
      // console.log('🔔 Usuario logueado, solicitando permisos de notificación...');
      requestPermissionOnLogin();
      
      // Si ya tiene permisos, enviar una notificación de bienvenida
      setTimeout(() => {
        if (isGranted) {
          sendTestNotification(
            `¡Bienvenido ${user.name}!`, 
            'Las notificaciones están activas. Recibirás alertas importantes aquí.'
          );
        }
      }, 3000); // 3 segundos después del login
    }
  }, [isAuthenticated, user, requestPermissionOnLogin, sendTestNotification, isGranted]);

  // Efecto para limpiar el estado de permisos cuando se cierra sesión
  useEffect(() => {
    if (!isAuthenticated()) {
      resetPermissionState();
    }
  }, [isAuthenticated, resetPermissionState]);

  return (
    <ToastProvider>
      <Router>
        <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
          }}
        />

        <Routes>
          {/* Ruta pública */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            } 
          />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Dashboard />
                  </React.Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/trips/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Trips />
                  </React.Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicles/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Vehicles />
                  </React.Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/*"
            element={
              <ProtectedRoute requireSuperAdmin>
                <Layout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Users />
                  </React.Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/drivers/*"
            element={
              <ProtectedRoute requireAdmin>
                <Layout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <Drivers />
                  </React.Suspense>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redireccionamiento por defecto */}
          <Route 
            path="/" 
            element={
              isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Ruta 404 */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Página no encontrada</p>
                  <a
                    href="/dashboard"
                    className="btn-primary"
                  >
                    Volver al Dashboard
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
        
        {/* Componente para solicitar permisos de notificación */}
        {isAuthenticated() && <NotificationPrompt />}
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;