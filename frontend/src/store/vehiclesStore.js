import { create } from 'zustand';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const useVehiclesStore = create((set, get) => ({
  vehicles: [],
  availableVehicles: [],
  currentVehicle: null,
  isLoading: false,
  filters: {
    status: '',
    brand: '',
    licensePlate: '',
    available: false,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  
  // Obtener vehículos
  getVehicles: async (params = {}) => {
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
        if (!queryParams[key] && queryParams[key] !== false) {
          delete queryParams[key];
        }
      });
      
      const response = await api.get('/vehicles', { params: queryParams });
      
      set({
        vehicles: response.data.vehicles,
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
      console.error('Error obteniendo vehículos:', error);
      toast.error('Error al cargar los vehículos');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Obtener vehículos disponibles
  getAvailableVehicles: async (departureDate, returnDate) => {
    try {
      const params = {};
      if (departureDate) params.departureDate = departureDate;
      if (returnDate) params.returnDate = returnDate;
      
      const response = await api.get('/vehicles/available', { params });
      
      set({ availableVehicles: response.data });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo vehículos disponibles:', error);
      toast.error('Error al cargar vehículos disponibles');
      throw error;
    }
  },
  
  // Obtener vehículo por ID
  getVehicleById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/vehicles/${id}`);
      set({
        currentVehicle: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo vehículo:', error);
      toast.error('Error al cargar el vehículo');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Crear vehículo
  createVehicle: async (vehicleData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/vehicles', vehicleData);
      
      // Actualizar la lista de vehículos
      get().getVehicles();
      
      set({ isLoading: false });
      toast.success('Vehículo creado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error creando vehículo:', error);
      toast.error(
        error.response?.data?.message || 'Error al crear el vehículo'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Actualizar vehículo
  updateVehicle: async (id, vehicleData) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      
      // Actualizar en la lista local
      const { vehicles } = get();
      const updatedVehicles = vehicles.map(vehicle =>
        vehicle._id === id ? response.data : vehicle
      );
      
      set({
        vehicles: updatedVehicles,
        currentVehicle: response.data,
        isLoading: false,
      });
      
      toast.success('Vehículo actualizado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      toast.error(
        error.response?.data?.message || 'Error al actualizar el vehículo'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Eliminar vehículo
  deleteVehicle: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/vehicles/${id}`);
      
      // Remover de la lista local
      const { vehicles } = get();
      const filteredVehicles = vehicles.filter(vehicle => vehicle._id !== id);
      
      set({
        vehicles: filteredVehicles,
        isLoading: false,
      });
      
      toast.success('Vehículo eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando vehículo:', error);
      toast.error(
        error.response?.data?.message || 'Error al eliminar el vehículo'
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
        brand: '',
        licensePlate: '',
        available: false,
      },
      pagination: { ...get().pagination, page: 1 },
    });
  },
  
  // Limpiar vehículo actual
  clearCurrentVehicle: () => {
    set({ currentVehicle: null });
  },
}));

export default useVehiclesStore;