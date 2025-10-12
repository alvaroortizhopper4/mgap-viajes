import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/authStore';
import useNotifications from '../hooks/useNotifications';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const { requestPermission, isSupported } = useNotifications();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      // Solicitar permisos de notificación solo para choferes
      // Esperamos un poco para que el estado se actualice después del login
      setTimeout(() => {
        const { isDriver, user } = useAuthStore.getState();
        console.log('🔍 Debug login - Usuario después del login:', user);
        console.log('🔍 Debug login - ¿Es chofer?:', isDriver());
        console.log('🔍 Debug login - ¿Soporta notificaciones?:', isSupported);
        
        if (isSupported && isDriver()) {
          console.log('✅ Iniciando solicitud de notificaciones para chofer');
          setTimeout(async () => {
            try {
              const result = await requestPermission();
              if (result.success) {
                console.log('✅ Notificaciones habilitadas para el chofer');
              } else {
                console.log('ℹ️ Chofer declinó las notificaciones:', result);
              }
            } catch (error) {
              console.log('❌ Error configurando notificaciones para chofer:', error);
            }
          }, 500); // Delay adicional para mejor UX
        } else {
          console.log('ℹ️ No se solicitarán notificaciones:', {
            isSupported,
            isDriver: isDriver(),
            userRole: user?.role
          });
        }
      }, 100); // Pequeño delay para que se actualice el estado
      
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            MGAP - Gestión de Viajes
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              type="email"
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email no válido',
                },
              })}
              error={errors.email?.message}
              placeholder="tu@email.com"
            />

            <Input
              label="Contraseña"
              type="password"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres',
                },
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Credenciales de prueba
                </span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <div className="bg-red-50 p-3 rounded-md border border-red-200">
                <p className="font-medium text-red-800">Super Administrador:</p>
                <p className="text-red-700">Email: superadmin@mgap.gub.uy</p>
                <p className="text-red-700">Contraseña: superadmin123</p>
              </div>
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <p className="font-medium text-green-800">Administrativo:</p>
                <p className="text-green-700">Email: admin@mgap.gub.uy</p>
                <p className="text-green-700">Contraseña: admin123</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="font-medium text-blue-800">Chofer:</p>
                <p className="text-blue-700">Email: chofer@mgap.gub.uy</p>
                <p className="text-blue-700">Contraseña: chofer123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;