const User = require('../models/User');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');

// Validaciones para crear/editar usuario
const userValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('employeeId').trim().isLength({ min: 1 }).withMessage('El ID de empleado es requerido'),
  body('role').isIn(['chofer', 'administrativo', 'admin_principal']).withMessage('Rol no válido'),
  body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private (solo admin)
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      active,
      name 
    } = req.query;

    // Construir filtros
    let filter = {};
    
    if (role) filter.role = role;
    if (active !== undefined) filter.isActive = active === 'true';
    if (name) filter.name = { $regex: name, $options: 'i' };

    const users = await User.find(filter)
      .select('-password')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Private (solo admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const {
      name,
      email,
      employeeId,
      role,
      phone,
      department,
      isActive,
      password
    } = req.body;

    // Verificar email único
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }

    // Verificar employeeId único
    if (employeeId && employeeId !== user.employeeId) {
      const existingUser = await User.findOne({ 
        employeeId, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'El ID de empleado ya está en uso' });
      }
    }

    // Preparar datos de actualización
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(employeeId && { employeeId }),
      ...(role && { role }),
      ...(phone !== undefined && { phone }),
      ...(department !== undefined && { department }),
      ...(isActive !== undefined && { isActive })
    };

    // Si se proporciona una nueva contraseña, encriptarla
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Eliminar usuario
// @route   DELETE /api/users/:id
// @access  Private (solo admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último admin
    if (user.role === 'administrativo') {
      const adminCount = await User.countDocuments({ 
        role: 'administrativo', 
        isActive: true 
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'No se puede eliminar el último usuario administrativo' 
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener choferes
// @route   GET /api/users/drivers
// @access  Private
const getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ 
      role: 'chofer', 
      isActive: true 
    })
    .select('name employeeId phone department')
    .sort({ name: 1 });

    res.json(drivers);
  } catch (error) {
    console.error('Error obteniendo choferes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener lista básica de usuarios (solo info necesaria para notificaciones)
// @route   GET /api/users/basic
// @access  Private (admin y administrativo)
const getBasicUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false } })
      .select('_id name role')
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios básicos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getUsers,
  getBasicUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDrivers,
  userValidation
};