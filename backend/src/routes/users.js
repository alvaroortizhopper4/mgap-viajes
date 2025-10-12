const express = require('express');
const router = express.Router();
const {
  getUsers,
  getBasicUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDrivers,
  userValidation
} = require('../controllers/userController');
const { auth, authorize, canManageUsers, requireAdminOrAdministrativo } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

// @route   GET /api/users/drivers
// @desc    Obtener choferes
// @access  Private (todos los usuarios autenticados)
router.get('/drivers', auth, getDrivers);

// @route   GET /api/users
// @desc    Obtener lista básica de usuarios (para notificaciones)
// @access  Private (admin y administrativo)
router.get('/basic', 
  auth,
  authorize(['admin_principal', 'administrativo']),
  getBasicUsers
);

// @desc    Obtener todos los usuarios
// @access  Private (solo admin principal)
router.get('/', 
  auth,
  canManageUsers,
  getUsers
);

// @route   GET /api/users/:id
// @desc    Obtener usuario por ID
// @access  Private (solo admin principal)
router.get('/:id', auth, canManageUsers, getUserById);

// @route   PUT /api/users/:id
// @desc    Actualizar usuario
// @access  Private (solo admin principal)
router.put('/:id', 
  auth,
  canManageUsers,
  userValidation,
  handleValidationErrors,
  updateUser
);

// @route   DELETE /api/users/:id
// @desc    Eliminar usuario
// @access  Private (solo admin principal)
router.delete('/:id', 
  auth,
  canManageUsers,
  deleteUser
);

module.exports = router;