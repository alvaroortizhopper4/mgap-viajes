const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No hay token, acceso denegado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token no válido' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Usuario inactivo' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware auth:', error);
    res.status(401).json({ message: 'Token no válido' });
  }
};

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

// Middleware para verificar si es el propietario o admin
const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  // Si es admin principal o administrativo puede acceder a todo
  if (req.user.role === 'admin_principal' || req.user.role === 'administrativo') {
    return next();
  }

  // Si es chofer, verificar que sea el propietario del recurso
  const resourceUserId = req.params.userId || req.body.driver || req.query.driver;
  
  if (req.user._id.toString() === resourceUserId || req.user._id.toString() === req.params.id) {
    return next();
  }

  return res.status(403).json({ 
    message: 'Solo puedes acceder a tus propios recursos' 
  });
};

// Middleware específico para admin principal (acceso total)
const requireAdminPrincipal = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.role !== 'admin_principal') {
    return res.status(403).json({ 
      message: 'Solo el administrador principal puede realizar esta acción' 
    });
  }

  next();
};

// Middleware para admin principal o administrativo (gestión de viajes y vehículos)
const requireAdminOrAdministrativo = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.role !== 'admin_principal' && req.user.role !== 'administrativo') {
    return res.status(403).json({ 
      message: 'No tienes permisos administrativos para realizar esta acción' 
    });
  }

  next();
};

// Middleware para verificar si puede gestionar usuarios (solo admin principal)
const canManageUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (req.user.role !== 'admin_principal') {
    return res.status(403).json({ 
      message: 'Solo el administrador principal puede gestionar usuarios' 
    });
  }

  next();
};

// Permite que admin_principal y administrativo editen usuarios
const canEditUsers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }
  if (req.user.role !== 'admin_principal' && req.user.role !== 'administrativo') {
    return res.status(403).json({ message: 'No tienes permisos para editar usuarios' });
  }
  next();
};

module.exports = {
  auth,
  authorize,
  isOwnerOrAdmin,
  requireAdminPrincipal,
  requireAdminOrAdministrativo,
  canManageUsers,
  canEditUsers
};