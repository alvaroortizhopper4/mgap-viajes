const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation
} = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

// @route   POST /api/auth/register
// @desc    Registrar usuario
// @access  Private (solo admin)
router.post('/register', 
  auth, 
  authorize('administrativo'),
  registerValidation,
  handleValidationErrors,
  register
);

// @route   POST /api/auth/login
// @desc    Login de usuario
// @access  Public
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  login
);

// @route   GET /api/auth/me
// @desc    Obtener perfil de usuario
// @access  Private
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Actualizar perfil
// @access  Private
router.put('/profile', auth, updateProfile);

module.exports = router;