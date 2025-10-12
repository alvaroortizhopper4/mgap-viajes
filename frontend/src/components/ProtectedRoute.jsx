import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false }) => {
  const { isAuthenticated, isAdmin, canManageUsers, user, token } = useAuthStore();
  const location = useLocation();
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (!isAuthenticated()) {
    if (isMobile) {
      console.warn('📱 ProtectedRoute: usuario NO autenticado en móvil. user:', user, 'token:', token);
      return (
        <div style={{ background: '#fff0f0', color: '#b00020', fontSize: 22, padding: 32, textAlign: 'center', border: '3px solid #b00020', borderRadius: 12, margin: 24 }}>
          <strong>🚨 No hay sesión activa</strong>
          <br /><br />
          <span style={{ fontSize: 16 }}>El sistema detectó que no tienes sesión iniciada.<br />
          user: {JSON.stringify(user)}<br />
          token: {token ? 'presente' : 'ausente'}<br />
          Por favor, vuelve a iniciar sesión.<br />
          Si esto ocurre siempre, reporta este mensaje al soporte.</span>
        </div>
      );
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !canManageUsers()) {
    if (isMobile) {
      console.warn('📱 ProtectedRoute: usuario sin permisos de superadmin en móvil. user:', user);
      return (
        <div style={{ background: '#fff0f0', color: '#b00020', fontSize: 22, padding: 32, textAlign: 'center', border: '3px solid #b00020', borderRadius: 12, margin: 24 }}>
          <strong>🚨 Permiso insuficiente</strong>
          <br /><br />
          <span style={{ fontSize: 16 }}>No tienes permisos de superadministrador.<br />
          user: {JSON.stringify(user)}<br />
          Por favor, contacta a soporte si esto es un error.</span>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    if (isMobile) {
      console.warn('📱 ProtectedRoute: usuario sin permisos de admin en móvil. user:', user);
      return (
        <div style={{ background: '#fff0f0', color: '#b00020', fontSize: 22, padding: 32, textAlign: 'center', border: '3px solid #b00020', borderRadius: 12, margin: 24 }}>
          <strong>🚨 Permiso insuficiente</strong>
          <br /><br />
          <span style={{ fontSize: 16 }}>No tienes permisos de administrador.<br />
          user: {JSON.stringify(user)}<br />
          Por favor, contacta a soporte si esto es un error.</span>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;