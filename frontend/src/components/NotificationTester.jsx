import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../services/localNotificationService';
import api from '../utils/axios';
import Button from './Button';
import Card from './Card';
import Select from './Select';
import useAuthStore from '../store/authStore';

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
  const isAdmin = user?.role === 'admin_principal' || user?.role === 'administrativo';

  // Cargar usuarios si es admin
  useEffect(() => {
    if (isAdmin && user) {
      loadUsers();
    }
  }, [isAdmin, user]);





















// Archivo eliminado: Probador de notificaciones removido completamente.