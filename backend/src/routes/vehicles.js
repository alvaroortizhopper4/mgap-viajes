const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  vehicleValidation
} = require('../controllers/vehicleController');
const { auth, authorize, requireAdminOrAdministrativo } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

// @route   GET /api/vehicles/available
// @desc    Obtener vehículos disponibles
// @access  Private
router.get('/available', auth, getAvailableVehicles);

// @route   GET /api/vehicles
// @desc    Obtener todos los vehículos
// @access  Private
router.get('/', auth, getVehicles);

// @route   GET /api/vehicles/:id
// @desc    Obtener vehículo por ID
// @access  Private
router.get('/:id', auth, getVehicleById);

// @route   POST /api/vehicles
// @desc    Crear nuevo vehículo
// @access  Private (admin principal y administrativo)
router.post('/', 
  auth,
  requireAdminOrAdministrativo,
  vehicleValidation,
  handleValidationErrors,
  createVehicle
);

// @route   PUT /api/vehicles/:id
// @desc    Actualizar vehículo
// @access  Private (admin principal y administrativo)
router.put('/:id', 
  auth,
  requireAdminOrAdministrativo,
  vehicleValidation,
  handleValidationErrors,
  updateVehicle
);

// @route   DELETE /api/vehicles/:id
// @desc    Eliminar vehículo
// @access  Private (admin principal y administrativo)
router.delete('/:id', 
  auth,
  requireAdminOrAdministrativo,
  deleteVehicle
);

module.exports = router;