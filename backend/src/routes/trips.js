const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  confirmTrip,
  finishTrip,
  deleteTrip,
  tripValidation
} = require('../controllers/tripController');
const { auth, authorize, isOwnerOrAdmin, requireAdminOrAdministrativo } = require('../middleware/auth');
const handleValidationErrors = require('../middleware/validation');

// @route   GET /api/trips
// @desc    Obtener todos los viajes
// @access  Private
router.get('/', auth, getTrips);

// @route   GET /api/trips/:id
// @desc    Obtener viaje por ID
// @access  Private
router.get('/:id', auth, getTripById);

// @route   POST /api/trips
// @desc    Crear nuevo viaje
// @access  Private (admin principal y administrativo)
router.post('/', 
  auth,
  requireAdminOrAdministrativo,
  tripValidation,
  handleValidationErrors,
  createTrip
);

// @route   PUT /api/trips/:id
// @desc    Actualizar viaje
// @access  Private (propietario del viaje o admin)
router.put('/:id', 
  auth,
  isOwnerOrAdmin,
  tripValidation,
  handleValidationErrors,
  updateTrip
);

// @route   PUT /api/trips/:id/confirm
// @desc    Confirmar viaje (solo chofer asignado)
// @access  Private (chofer del viaje)
router.put('/:id/confirm', 
  auth,
  confirmTrip
);

// @route   PUT /api/trips/:id/finish
// @desc    Finalizar viaje (solo chofer asignado)
// @access  Private (chofer del viaje)
router.put('/:id/finish', 
  auth,
  finishTrip
);

// @route   DELETE /api/trips/:id
// @desc    Eliminar viaje
// @access  Private (admin principal y administrativo)
router.delete('/:id', 
  auth,
  requireAdminOrAdministrativo,
  deleteTrip
);

// @route   POST /api/trips/fix-premature
// @desc    Corregir viajes que se iniciaron prematuramente (temporal para debugging)
// @access  Private (admin)
router.post('/fix-premature', auth, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const tripScheduler = require('../services/tripScheduler');
    await tripScheduler.fixPrematurelyStartedTrips();
    res.json({ message: 'Viajes prematuros corregidos exitosamente' });
  } catch (error) {
    console.error('Error corrigiendo viajes:', error);
    res.status(500).json({ message: 'Error corrigiendo viajes' });
  }
});

// @route   POST /api/trips/fix-late-confirmations
// @desc    Corregir viajes que deberían estar en curso pero siguen programados
// @access  Private (admin)
router.post('/fix-late-confirmations', auth, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    const now = new Date();
    
    // Buscar viajes programados que ya deberían estar en curso
    const lateTrips = await Trip.find({ status: 'programado' })
      .populate('driver', 'name')
      .populate('vehicle', 'licensePlate');
    
    let fixed = 0;
    
    for (const trip of lateTrips) {
      const [hours, minutes] = trip.departureTime.split(':');
      const tripDateTime = new Date(trip.departureDate);
      tripDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (now >= tripDateTime) {
        trip.status = 'en_curso';
        trip.autoStarted = true;
        trip.autoStartedAt = now;
        await trip.save();
        fixed++;
        
        console.log(`🔧 Viaje ${trip._id} corregido: ${trip.destination} - ${trip.driver.name}`);
      }
    }
    
    res.json({ 
      message: `${fixed} viajes corregidos exitosamente`,
      fixed: fixed 
    });
  } catch (error) {
    console.error('Error corrigiendo confirmaciones tardías:', error);
    res.status(500).json({ message: 'Error corrigiendo viajes' });
  }
});

module.exports = router;