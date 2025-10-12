const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const { body } = require('express-validator');

// Validaciones para crear/editar vehículo
const vehicleValidation = [
  body('licensePlate').trim().isLength({ min: 6, max: 10 }).withMessage('La patente debe tener entre 6 y 10 caracteres'),
  body('brand').trim().isLength({ min: 2 }).withMessage('La marca debe tener al menos 2 caracteres'),
  body('model').trim().isLength({ min: 1 }).withMessage('El modelo es requerido'),
  body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }).withMessage('Año no válido'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('El kilometraje debe ser un número positivo'),
  body('fuelType').optional().isIn(['gasolina', 'diesel', 'híbrido', 'eléctrico']).withMessage('Tipo de combustible no válido'),
  body('status').optional().isIn(['disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio']).withMessage('Estado no válido'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('La capacidad debe ser al menos 1')
];

// @desc    Obtener todos los vehículos
// @route   GET /api/vehicles
// @access  Private
const getVehicles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      brand, 
      available,
      licensePlate 
    } = req.query;

    // Construir filtros
    let filter = {};
    
    if (status) filter.status = status;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (licensePlate) filter.licensePlate = { $regex: licensePlate, $options: 'i' };
    
    // Filtrar solo disponibles
    if (available === 'true') {
      filter.status = 'disponible';
    }

    const vehicles = await Vehicle.find(filter)
      .sort({ licensePlate: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(filter);

    // Agregar información de viajes activos
    const vehiclesWithTrips = await Promise.all(
      vehicles.map(async (vehicle) => {
        const activeTrip = await Trip.findOne({
          vehicle: vehicle._id,
          status: { $in: ['programado', 'en_curso'] }
        }).populate('driver', 'name');

        return {
          ...vehicle.toObject(),
          activeTrip
        };
      })
    );

    res.json({
      vehicles: vehiclesWithTrips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener vehículo por ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Obtener historial de viajes del vehículo
    const trips = await Trip.find({ vehicle: vehicle._id })
      .populate('driver', 'name')
      .sort({ departureDate: -1 })
      .limit(10);

    // Obtener viaje activo si existe
    const activeTrip = await Trip.findOne({
      vehicle: vehicle._id,
      status: { $in: ['programado', 'en_curso'] }
    }).populate('driver', 'name employeeId');

    res.json({
      ...vehicle.toObject(),
      recentTrips: trips,
      activeTrip
    });
  } catch (error) {
    console.error('Error obteniendo vehículo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Crear nuevo vehículo
// @route   POST /api/vehicles
// @access  Private (solo admin)
const createVehicle = async (req, res) => {
  try {
    const {
      licensePlate,
      brand,
      model,
      year,
      mileage,
      fuelType,
      capacity,
      observations,
      lastMaintenance,
      nextMaintenance
    } = req.body;

    // Verificar que la patente no esté duplicada
    const existingVehicle = await Vehicle.findOne({ 
      licensePlate: licensePlate.toUpperCase() 
    });

    if (existingVehicle) {
      return res.status(400).json({ message: 'Ya existe un vehículo con esa patente' });
    }

    const vehicle = await Vehicle.create({
      licensePlate: licensePlate.toUpperCase(),
      brand,
      model,
      year,
      mileage,
      fuelType,
      capacity,
      observations,
      lastMaintenance,
      nextMaintenance
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creando vehículo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Actualizar vehículo
// @route   PUT /api/vehicles/:id
// @access  Private (solo admin)
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    const {
      licensePlate,
      brand,
      model,
      year,
      mileage,
      fuelType,
      status,
      capacity,
      observations,
      lastMaintenance,
      nextMaintenance
    } = req.body;

    // Si cambia la patente, verificar que no esté duplicada
    if (licensePlate && licensePlate.toUpperCase() !== vehicle.licensePlate) {
      const existingVehicle = await Vehicle.findOne({ 
        licensePlate: licensePlate.toUpperCase(),
        _id: { $ne: req.params.id }
      });

      if (existingVehicle) {
        return res.status(400).json({ message: 'Ya existe un vehículo con esa patente' });
      }
    }

    // Si cambia el estado a mantenimiento o fuera de servicio, verificar viajes activos
    if (status && ['mantenimiento', 'fuera_de_servicio'].includes(status)) {
      const activeTrips = await Trip.findOne({
        vehicle: vehicle._id,
        status: { $in: ['programado', 'en_curso'] }
      });

      if (activeTrips) {
        return res.status(400).json({ 
          message: 'No se puede cambiar el estado del vehículo porque tiene viajes activos' 
        });
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        ...(licensePlate && { licensePlate: licensePlate.toUpperCase() }),
        ...(brand && { brand }),
        ...(model && { model }),
        ...(year !== undefined && { year }),
        ...(mileage !== undefined && { mileage }),
        ...(fuelType && { fuelType }),
        ...(status && { status }),
        ...(capacity !== undefined && { capacity }),
        ...(observations !== undefined && { observations }),
        ...(lastMaintenance !== undefined && { lastMaintenance }),
        ...(nextMaintenance !== undefined && { nextMaintenance })
      },
      { new: true, runValidators: true }
    );

    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Eliminar vehículo
// @route   DELETE /api/vehicles/:id
// @access  Private (solo admin)
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    // Verificar que no tenga viajes activos
    const activeTrips = await Trip.findOne({
      vehicle: vehicle._id,
      status: { $in: ['programado', 'en_curso'] }
    });

    if (activeTrips) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el vehículo porque tiene viajes activos' 
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener vehículos disponibles
// @route   GET /api/vehicles/available
// @access  Private
const getAvailableVehicles = async (req, res) => {
  try {
    const { departureDate, returnDate } = req.query;

    let filter = { status: 'disponible' };

    // Si se proporcionan fechas, verificar disponibilidad
    if (departureDate) {
      // Buscar vehículos que no tengan conflictos de fechas
      const conflictingTrips = await Trip.find({
        status: { $in: ['programado', 'en_curso'] },
        $or: [
          {
            departureDate: { $lte: new Date(departureDate) },
            $or: [
              { returnDate: { $gte: new Date(departureDate) } },
              { returnDate: null }
            ]
          },
          {
            departureDate: { $lte: new Date(returnDate || departureDate) },
            returnDate: { $gte: new Date(departureDate) }
          }
        ]
      }).distinct('vehicle');

      filter._id = { $nin: conflictingTrips };
    }

    const vehicles = await Vehicle.find(filter)
      .sort({ licensePlate: 1 })
      .select('licensePlate brand model capacity fuelType');

    res.json(vehicles);
  } catch (error) {
    console.error('Error obteniendo vehículos disponibles:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  vehicleValidation
};