import { create } from 'zustand';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const useTripsStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  filters: {
    status: '',
    driver: '',
    vehicle: '',
    destination: '',
    startDate: '',
    endDate: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  
  // Obtener viajes
  getTrips: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { filters, pagination } = get();
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      
      // Filtrar parámetros vacíos
      Object.keys(queryParams).forEach(key => {
        if (!queryParams[key]) delete queryParams[key];
      });
      
      const response = await api.get('/trips', { params: queryParams });
      
      set({
        trips: response.data.trips,
        pagination: {
          page: response.data.currentPage,
          limit: pagination.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        },
        isLoading: false,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo viajes:', error);
      toast.error('Error al cargar los viajes');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Obtener viaje por ID
  getTripById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/trips/${id}`);
      set({
        currentTrip: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo viaje:', error);
      toast.error('Error al cargar el viaje');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Crear viaje
  createTrip: async (tripData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/trips', tripData);
      
      // Actualizar la lista de viajes
      get().getTrips();
      
      set({ isLoading: false });
      toast.success('Viaje creado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error creando viaje:', error);
      toast.error(
        error.response?.data?.message || 'Error al crear el viaje'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Actualizar viaje
  updateTrip: async (id, tripData) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/trips/${id}`, tripData);
      
      // Actualizar en la lista local
      const { trips } = get();
      const updatedTrips = trips.map(trip =>
        trip._id === id ? response.data : trip
      );
      
      set({
        trips: updatedTrips,
        currentTrip: response.data,
        isLoading: false,
      });
      
      toast.success('Viaje actualizado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error actualizando viaje:', error);
      toast.error(
        error.response?.data?.message || 'Error al actualizar el viaje'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Eliminar viaje
  deleteTrip: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/trips/${id}`);
      
      // Remover de la lista local
      const { trips } = get();
      const filteredTrips = trips.filter(trip => trip._id !== id);
      
      set({
        trips: filteredTrips,
        isLoading: false,
      });
      
      toast.success('Viaje eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando viaje:', error);
      toast.error(
        error.response?.data?.message || 'Error al eliminar el viaje'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Actualizar filtros
  setFilters: (newFilters) => {
    set({
      filters: { ...get().filters, ...newFilters },
      pagination: { ...get().pagination, page: 1 },
    });
  },
  
  // Actualizar paginación
  setPagination: (newPagination) => {
    set({
      pagination: { ...get().pagination, ...newPagination },
    });
  },
  
  // Limpiar filtros
  clearFilters: () => {
    set({
      filters: {
        status: '',
        driver: '',
        vehicle: '',
        destination: '',
        startDate: '',
        endDate: '',
      },
      pagination: { ...get().pagination, page: 1 },
    });
  },
  
  // Confirmar viaje (solo choferes)
  confirmTrip: async (tripId, confirmationNotes = '') => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/trips/${tripId}/confirm`, {
        confirmationNotes
      });
      
      // Actualizar la lista de viajes
      get().getTrips();
      
      set({ isLoading: false });
      toast.success('Viaje confirmado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error confirmando viaje:', error);
      toast.error(
        error.response?.data?.message || 'Error al confirmar el viaje'
      );
      set({ isLoading: false });
      throw error;
    }
  },

  // Finalizar viaje (solo choferes)
  finishTrip: async (tripId, finishNotes = '') => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/trips/${tripId}/finish`, {
        finishNotes
      });
      
      // Actualizar la lista de viajes
      get().getTrips();
      
      set({ isLoading: false });
      toast.success('Viaje finalizado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error finalizando viaje:', error);
      toast.error(
        error.response?.data?.message || 'Error al finalizar el viaje'
      );
      set({ isLoading: false });
      throw error;
    }
  },

  // Limpiar viaje actual
  clearCurrentTrip: () => {
    set({ currentTrip: null });
  },
}));

export default useTripsStore;