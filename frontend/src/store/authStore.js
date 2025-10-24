import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      // Login
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
          });
          
          const { token, ...user } = response.data;
          
          // Guardar en localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          set({ 
            user, 
            token,
            isLoading: false 
          });
          
          toast.success('¡Bienvenido!');
          return true;
        } catch (error) {
          console.error('Error en login:', error);
          toast.error(
            error.response?.data?.message || 'Error al iniciar sesión'
          );
          set({ isLoading: false });
          return false;
        }
      },
      
      // Logout
      logout: () => {
        console.log('[LOGOUT] Eliminando token y usuario de localStorage (logout manual)');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ 
          user: null, 
          token: null,
          isLoading: false
        });
        toast.success('Sesión cerrada correctamente');
      },
      
      // Obtener perfil actual
      getProfile: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data });
          return response.data;
        } catch (error) {
          console.error('Error obteniendo perfil:', error);
          get().logout();
          throw error;
        }
      },
      
      // Actualizar perfil
      updateProfile: async (profileData) => {
        set({ isLoading: true });
        try {
          const response = await api.put('/auth/profile', profileData);
          set({ 
            user: response.data,
            isLoading: false
          });
          toast.success('Perfil actualizado correctamente');
          return response.data;
        } catch (error) {
          console.error('Error actualizando perfil:', error);
          toast.error(
            error.response?.data?.message || 'Error al actualizar perfil'
          );
          set({ isLoading: false });
          throw error;
        }
      },
      
      // Verificar si está autenticado
      isAuthenticated: () => {
        const { token, user } = get();
        // Solo autenticado si el usuario existe, tiene token y está activo
        return !!(token && user && user.isActive !== false);
      },
      
      // Verificar si es admin principal
      isAdminPrincipal: () => {
        const { user } = get();
        return user?.role === 'admin_principal';
      },
      
      // Verificar si es administrativo
      isAdministrativo: () => {
        const { user } = get();
        return user?.role === 'administrativo';
      },
      
      // Verificar si es admin (admin principal o administrativo)
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin_principal' || user?.role === 'administrativo';
      },
      
      // Verificar si es chofer
      isDriver: () => {
        const { user } = get();
        return user?.role === 'chofer';
      },
      
      // Verificar si puede gestionar usuarios (solo admin principal)
      canManageUsers: () => {
        const { user } = get();
        return user?.role === 'admin_principal';
      },
      
      // Verificar si puede gestionar viajes y vehículos (admin principal y administrativo)
      canManageTripsAndVehicles: () => {
        const { user } = get();
        return user?.role === 'admin_principal' || user?.role === 'administrativo';
      },
      
      // Inicializar desde localStorage
      initialize: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ token, user });
          } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useAuthStore;