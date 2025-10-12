import { create } from 'zustand';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const useDashboardStore = create((set, get) => ({
  stats: null,
  upcomingTrips: [],
  activeTrips: [],
  vehiclesSummary: null,
  isLoading: false,
  
  // Obtener estadísticas del dashboard
  getDashboardStats: async () => {
    console.log('📊 Iniciando getDashboardStats...');
    set({ isLoading: true });
    try {
      console.log('🌐 Haciendo request a /dashboard/stats...');
      const response = await api.get('/dashboard/stats');
      console.log('✅ Respuesta recibida:', response.data);
      set({
        stats: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      console.error('📄 Detalles del error:', error.response?.data);
      toast.error('Error al cargar las estadísticas');
      set({ isLoading: false });
      throw error;
    }
  },
  
    // Obtener próximos viajes
  getUpcomingTrips: async (limit = 5) => {
    try {
      console.log('🌐 Haciendo request a /dashboard/upcoming-trips...');
      const response = await api.get('/dashboard/upcoming-trips', {
        params: { limit }
      });
      console.log('✅ Próximos viajes recibidos:', response.data);
      // Asegurar que siempre sea un array
      const trips = Array.isArray(response.data) ? response.data : [];
      set({ upcomingTrips: trips });
      return trips;
    } catch (error) {
      console.error('❌ Error obteniendo próximos viajes:', error);
      console.error('📄 Detalles del error:', error.response?.data);
      // En caso de error, establecer array vacío
      set({ upcomingTrips: [] });
      toast.error('Error al cargar próximos viajes');
      throw error;
    }
  },
  
  // Obtener viajes activos
  getActiveTrips: async () => {
    try {
      console.log('🌐 Haciendo request a /dashboard/active-trips...');
      const response = await api.get('/dashboard/active-trips');
      console.log('✅ Viajes activos recibidos:', response.data);
      // Asegurar que siempre sea un array
      const trips = Array.isArray(response.data) ? response.data : [];
      set({ activeTrips: trips });
      return trips;
    } catch (error) {
      console.error('❌ Error obteniendo viajes activos:', error);
      console.error('📄 Detalles del error:', error.response?.data);
      // En caso de error, establecer array vacío
      set({ activeTrips: [] });
      toast.error('Error al cargar viajes activos');
      throw error;
    }
  },
  
  // Obtener resumen de vehículos (solo admin)
  getVehiclesSummary: async () => {
    try {
      console.log('🌐 Haciendo request a /dashboard/vehicles-summary...');
      const response = await api.get('/dashboard/vehicles-summary');
      console.log('✅ Resumen de vehículos recibido:', response.data);
      set({ vehiclesSummary: response.data });
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo resumen de vehículos:', error);
      console.error('📄 Detalles del error:', error.response?.data);
      // En caso de error, establecer null
      set({ vehiclesSummary: null });
      toast.error('Error al cargar resumen de vehículos');
      throw error;
    }
  },
  
  // Cargar datos del dashboard completo
  loadDashboard: async (userRole = null) => {
    console.log('🔄 Iniciando carga completa del dashboard...');
    console.log('👤 Rol de usuario:', userRole);
    
    // Promesas básicas para todos los usuarios
    const promises = [
      get().getDashboardStats().catch(err => ({ error: 'stats', details: err })),
      get().getUpcomingTrips().catch(err => ({ error: 'upcomingTrips', details: err })),
      get().getActiveTrips().catch(err => ({ error: 'activeTrips', details: err })),
    ];
    
    // Si es admin, agregar resumen de vehículos
    if (userRole === 'admin' || userRole === 'super_admin') {
      console.log('🔧 Agregando datos adicionales para admin...');
      promises.push(
        get().getVehiclesSummary().catch(err => ({ error: 'vehiclesSummary', details: err }))
      );
    }
    
    try {
      const results = await Promise.allSettled(promises);
      console.log('📊 Resultados de carga del dashboard:', results);
      
      // Log específico para cada resultado
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Promise ${index} falló:`, result.reason);
        } else {
          console.log(`✅ Promise ${index} exitosa:`, result.value);
        }
      });
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
    }
  },
  
  // Limpiar datos del dashboard
  clearDashboard: () => {
    set({
      stats: null,
      upcomingTrips: [],
      activeTrips: [],
      vehiclesSummary: null,
    });
  },
}));

export default useDashboardStore;