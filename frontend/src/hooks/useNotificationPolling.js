import { useState, useEffect, useRef } from 'react';
import api from '../utils/axios';
import useAuthStore from '../store/authStore';

/**
 * Hook para polling inteligente de notificaciones con diferentes frecuencias según el rol
 */
const useNotificationPolling = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef(null);
  const { user, isDriver } = useAuthStore();
  // Eliminado showToast, solo se usan notificaciones nativas

  // Determinar frecuencia según rol del usuario
  const getPollingInterval = () => {
    if (isDriver()) {
      return 20000; // Choferes: cada 20 segundos (más crítico para ellos)
