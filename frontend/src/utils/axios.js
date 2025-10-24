import axios from 'axios';

// Detectar entorno y configurar URL base apropiada
const getBaseURL = () => {
  // Si estamos en producción (Vercel)
  if (window.location.hostname.includes('vercel.app') || 
      window.location.hostname.includes('vercel.com')) {
    return 'https://cirrate-salubriously-mathilde.ngrok-free.dev/api';
  }
  
  // Si estamos en desarrollo y accediendo desde cualquier IP local 192.168.x.x
  if (/^192\.168\./.test(window.location.hostname)) {
    return `http://${window.location.hostname}:5001/api`;
  }
  
  // Para desarrollo local (cualquier puerto localhost)
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5001/api';
  }
  
  // Fallback usando variables de entorno
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
};

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Interceptor para agregar token de autenticación y headers de ngrok
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar header para evitar la página de confirmación de ngrok
    if (config.baseURL && config.baseURL.includes('ngrok-free.dev')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;