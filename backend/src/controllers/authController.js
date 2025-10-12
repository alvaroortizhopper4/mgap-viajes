const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Validaciones de registro
const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('employeeId').trim().isLength({ min: 1 }).withMessage('El ID de empleado es requerido'),
  body('role').isIn(['chofer', 'administrativo']).withMessage('Rol no válido')
];

// Validaciones de login
const loginValidation = [
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password').isLength({ min: 1 }).withMessage('La contraseña es requerida')
];

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Private (solo admin)
const register = async (req, res) => {
  try {
    const { name, email, password, employeeId, role, phone, department } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (userExists) {
      return res.status(400).json({
        message: userExists.email === email ? 
          'Ya existe un usuario con ese email' : 
          'Ya existe un usuario con ese ID de empleado'
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      employeeId,
      role,
      phone,
      department
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Usuario inactivo' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener perfil de usuario
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Actualizar perfil
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, department } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, department },
      { new: true, runValidators: true }
    );

    res.json(user);
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation
};