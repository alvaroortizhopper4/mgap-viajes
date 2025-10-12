import { create } from 'zustand';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const useUsersStore = create((set, get) => ({
  users: [],
  drivers: [],
  currentUser: null,
  isLoading: false,
  filters: {
    role: '',
    active: '',
    name: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  
  // Obtener usuarios (solo admin)
  getUsers: async (params = {}) => {
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
      
      const response = await api.get('/users', { params: queryParams });
      
      set({
        users: response.data.users,
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
      console.error('Error obteniendo usuarios:', error);
      toast.error('Error al cargar los usuarios');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Obtener choferes
  getDrivers: async () => {
    try {
      const response = await api.get('/users/drivers');
      set({ drivers: response.data });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo choferes:', error);
      toast.error('Error al cargar choferes');
      throw error;
    }
  },
  
  // Obtener usuario por ID
  getUserById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/users/${id}`);
      set({
        currentUser: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      toast.error('Error al cargar el usuario');
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Crear usuario (registro desde auth)
  createUser: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/register', userData);
      
      // Actualizar la lista de usuarios
      get().getUsers();
      
      set({ isLoading: false });
      toast.success('Usuario creado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error creando usuario:', error);
      toast.error(
        error.response?.data?.message || 'Error al crear el usuario'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Actualizar usuario
  updateUser: async (id, userData) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/users/${id}`, userData);
      
      // Actualizar en la lista local
      const { users } = get();
      const updatedUsers = users.map(user =>
        user._id === id ? response.data : user
      );
      
      set({
        users: updatedUsers,
        currentUser: response.data,
        isLoading: false,
      });
      
      toast.success('Usuario actualizado correctamente');
      return response.data;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      toast.error(
        error.response?.data?.message || 'Error al actualizar el usuario'
      );
      set({ isLoading: false });
      throw error;
    }
  },
  
  // Eliminar usuario
  deleteUser: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/users/${id}`);
      
      // Remover de la lista local
      const { users } = get();
      const filteredUsers = users.filter(user => user._id !== id);
      
      set({
        users: filteredUsers,
        isLoading: false,
      });
      
      toast.success('Usuario eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast.error(
        error.response?.data?.message || 'Error al eliminar el usuario'
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
        role: '',
        active: '',
        name: '',
      },
      pagination: { ...get().pagination, page: 1 },
    });
  },
  
  // Limpiar usuario actual
  clearCurrentUser: () => {
    set({ currentUser: null });
  },
}));

export default useUsersStore;