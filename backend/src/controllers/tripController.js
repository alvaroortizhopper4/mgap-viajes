const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { body } = require('express-validator');

// Validaciones para crear/editar viaje
const tripValidation = [
  body('driver').isMongoId().withMessage('ID de chofer no válido'),
  body('vehicle').isMongoId().withMessage('ID de vehículo no válido'),
  body('departureDate').isISO8601().withMessage('Fecha de salida no válida'),
  body('destination').trim().isLength({ min: 2 }).withMessage('El destino debe tener al menos 2 caracteres'),
  body('purpose').trim().isLength({ min: 5 }).withMessage('El motivo debe tener al menos 5 caracteres'),
  body('status').optional().isIn(['programado', 'en_curso', 'completado', 'cancelado']).withMessage('Estado no válido'),
  body('returnDate').optional().isISO8601().withMessage('Fecha de regreso no válida')
];

// @desc    Obtener todos los viajes
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      driver, 
      vehicle, 
      destination,
      startDate,
      endDate 
    } = req.query;

    // Construir filtros
    let filter = {};

    // Si es chofer, solo puede ver sus propios viajes
    if (req.user.role === 'chofer') {
      filter.driver = req.user._id;
    } else if (driver) {
      filter.driver = driver;
    }

    if (status) filter.status = status;
    if (vehicle) filter.vehicle = vehicle;
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      filter.departureDate = {};
      if (startDate) filter.departureDate.$gte = new Date(startDate);
      if (endDate) filter.departureDate.$lte = new Date(endDate);
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .populate('createdBy', 'name')
      .sort({ departureDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Trip.countDocuments(filter);

    res.json({
      trips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error obteniendo viajes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener viaje por ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'name employeeId phone')
      .populate('vehicle', 'licensePlate brand model year mileage')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    // Si es chofer, verificar que sea su propio viaje
    if (req.user.role === 'chofer' && trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a este viaje' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Error obteniendo viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Crear nuevo viaje
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const {
      driver,
      vehicle,
      departureDate,
      returnDate,
      departureTime,
      returnTime,
      destination,
      purpose,
      departureLocation,
      estimatedDistance,
      passengers,
      notes,
      observations
    } = req.body;

    // Verificar que el vehículo esté disponible
    const isAvailable = await Trip.isVehicleAvailable(vehicle, departureDate, returnDate);
    
    if (!isAvailable) {
      return res.status(400).json({ 
        message: 'El vehículo no está disponible para las fechas seleccionadas' 
      });
    }

    // Verificar que el vehículo existe y está disponible
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    if (vehicleDoc.status === 'fuera_de_servicio' || vehicleDoc.status === 'mantenimiento') {
      return res.status(400).json({ message: 'El vehículo no está disponible' });
    }

    // Verificar que el chofer existe
    const driverDoc = await User.findById(driver);
    if (!driverDoc) {
      return res.status(404).json({ message: 'Chofer no encontrado' });
    }

    // Si es chofer, solo puede crear viajes para sí mismo
    if (req.user.role === 'chofer' && driver !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo puedes crear viajes para ti mismo' });
    }

    const trip = await Trip.create({
      driver,
      vehicle,
      departureDate,
      returnDate,
      departureTime,
      returnTime,
      destination,
      purpose,
      departureLocation,
      estimatedDistance,
      passengers,
      observations: notes || observations, // Usar notes como prioridad
      createdBy: req.user._id
    });

    // Actualizar estado del vehículo
    await Vehicle.findByIdAndUpdate(vehicle, { status: 'en_uso' });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .populate('createdBy', 'name');


    // Enviar notificación al chofer asignado SIEMPRE
    try {
      const { sendTripAssignmentNotification } = require('../services/notificationService');
      const Notification = require('../models/Notification');
      const { sendWhatsAppMessage } = require('../services/whatsappService');
      const User = require('../models/User');

      // Crear notificación en la base de datos
      await Notification.create({
        userId: driver,
        title: '🚗 Nuevo Viaje Asignado',
        body: `Tienes un nuevo viaje a ${destination} programado para el ${new Date(departureDate).toLocaleDateString('es-UY')}`,
        type: 'trip_assigned',
        relatedTrip: trip._id,
        data: {
          tripId: trip._id.toString(),
          destination,
          departureDate,
          createdBy: req.user.name
        }
      });

      // Enviar notificación push
      await sendTripAssignmentNotification(driver, populatedTrip);

      // Enviar WhatsApp solo si el viaje es programado por admin
      if (req.user.role === 'admin_principal' || req.user.role === 'administrativo') {
        // Buscar el chofer para obtener el teléfono
        const chofer = await User.findById(driver);
        if (chofer && chofer.phone) {
          const mensaje = `*Nuevo Viaje Asignado*

Hola ${chofer.name},

Tienes un nuevo viaje programado:

• *Destino:* ${destination}
• *Fecha de salida:* ${new Date(departureDate).toLocaleDateString('es-UY')}
• *Hora de salida:* ${departureTime || 'A confirmar'}

Por favor, revisa la app para más detalles y confirma tu disponibilidad.

¡Buen viaje!`;

          try {
            await sendWhatsAppMessage(chofer.phone, mensaje);
            console.log(`✅ WhatsApp enviado a ${chofer.name} (${chofer.phone})`);
          } catch (whatsErr) {
            console.error('Error enviando WhatsApp:', whatsErr);
          }
        } else {
          console.warn('El chofer no tiene teléfono registrado para WhatsApp.');
        }
      }

      console.log(`📱 Notificación enviada al chofer ${populatedTrip.driver.name} para viaje ${trip._id}`);
    } catch (notificationError) {
      console.error('Error enviando notificación:', notificationError);
      // No fallar la creación del viaje por un error de notificación
    }

    res.status(201).json(populatedTrip);
  } catch (error) {
    console.error('Error creando viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Actualizar viaje
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    // Si es chofer, verificar que sea su propio viaje
    if (req.user.role === 'chofer' && trip.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No puedes editar este viaje' });
    }

    const {
      vehicle,
      departureDate,
      returnDate,
      departureTime,
      returnTime,
      destination,
      purpose,
      status,
      departureLocation,
      estimatedDistance,
      actualDistance,
      departureOdometer,
      returnOdometer,
      passengers,
      notes,
      observations
    } = req.body;

    // Detectar cambios importantes que requieren re-confirmación del chofer
    const importantChanges = [];
    let needsReconfirmation = false;

    if (vehicle && vehicle !== trip.vehicle.toString()) {
      importantChanges.push('vehículo');
      needsReconfirmation = true;
    }
    if (departureDate && new Date(departureDate).getTime() !== new Date(trip.departureDate).getTime()) {
      importantChanges.push('fecha de salida');
      needsReconfirmation = true;
    }
    if (returnDate && new Date(returnDate).getTime() !== new Date(trip.returnDate).getTime()) {
      importantChanges.push('fecha de regreso');
      needsReconfirmation = true;
    }
    if (departureTime && departureTime !== trip.departureTime) {
      importantChanges.push('hora de salida');
      needsReconfirmation = true;
    }
    if (destination && destination !== trip.destination) {
      importantChanges.push('destino');
      needsReconfirmation = true;
    }
    if (departureLocation && departureLocation !== trip.departureLocation) {
      importantChanges.push('lugar de salida');
      needsReconfirmation = true;
    }

    console.log(`📝 Editando viaje ${trip._id}:`);
    console.log(`   👤 Editor: ${req.user.name} (${req.user.role})`);
    console.log(`   🔄 Cambios importantes:`, importantChanges);
    console.log(`   ❓ ¿Necesita re-confirmación?:`, needsReconfirmation);

    // Si cambia el vehículo, verificar disponibilidad
    if (vehicle && vehicle !== trip.vehicle.toString()) {
      const isAvailable = await Trip.isVehicleAvailable(
        vehicle, 
        departureDate || trip.departureDate, 
        returnDate || trip.returnDate,
        trip._id
      );
      
      if (!isAvailable) {
        return res.status(400).json({ 
          message: 'El vehículo no está disponible para las fechas seleccionadas' 
        });
      }

      // Liberar vehículo anterior si el viaje no está en curso
      if (trip.status !== 'en_curso') {
        await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'disponible' });
      }

      // Asignar nuevo vehículo
      await Vehicle.findByIdAndUpdate(vehicle, { status: 'en_uso' });
    }

    // Manejar cambio de estado del vehículo según el estado del viaje
    if (status && status !== trip.status) {
      const vehicleId = vehicle || trip.vehicle;
      
      if (status === 'completado' || status === 'cancelado') {
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'disponible' });
      } else if (status === 'en_curso') {
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'en_uso' });
      }
    }

    // Preparar objeto de actualización
    let updateObj = {
      ...(vehicle && { vehicle }),
      ...(departureDate && { departureDate }),
      ...(returnDate !== undefined && { returnDate }),
      ...(departureTime && { departureTime }),
      ...(returnTime !== undefined && { returnTime }),
      ...(destination && { destination }),
      ...(purpose && { purpose }),
      ...(status && { status }),
      ...(departureLocation && { departureLocation }),
      ...(estimatedDistance !== undefined && { estimatedDistance }),
      ...(actualDistance !== undefined && { actualDistance }),
      ...(departureOdometer !== undefined && { departureOdometer }),
      ...(returnOdometer !== undefined && { returnOdometer }),
      ...(passengers && { passengers }),
      ...((notes !== undefined || observations !== undefined) && { observations: notes || observations }),
      updatedBy: req.user._id
    };

    // Si necesita re-confirmación, resetear estado de confirmación del chofer
    if (needsReconfirmation) {
      console.log('🔄 RESETEANDO confirmación del chofer debido a cambios importantes');
      updateObj.driverConfirmation = {
        confirmed: false,
        confirmedAt: null,
        confirmationNotes: null
      };

      // Enviar notificación al chofer sobre cambios en el viaje
      try {
        const driverPopulated = await User.findById(trip.driver._id);
        if (driverPopulated) {
          const changedFieldsText = changedFields.map(field => {
            const fieldNames = {
              vehicle: 'Vehículo',
              departureDate: 'Fecha de salida', 
              returnDate: 'Fecha de retorno',
              departureTime: 'Hora de salida',
              destination: 'Destino',
              departureLocation: 'Lugar de salida'
            };
            return fieldNames[field] || field;
          }).join(', ');

          await notificationService.sendNotification(
            driverPopulated,
            'Viaje Modificado - Re-confirmación Requerida',
            `Tu viaje a "${trip.destination}" ha sido modificado (${changedFieldsText}). Debes confirmar nuevamente el viaje.`,
            'trip_edited',
            { tripId: trip._id.toString(), changedFields }
          );

          console.log(`📧 Notificación enviada al chofer ${driverPopulated.name} sobre modificación del viaje`);
        }
      } catch (notificationError) {
        console.error('❌ Error enviando notificación de modificación:', notificationError);
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true, runValidators: true }
    )
    .populate('driver', 'name employeeId')
    .populate('vehicle', 'licensePlate brand model')
    .populate('updatedBy', 'name');

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error actualizando viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Confirmar viaje (solo chofer asignado)
// @route   PUT /api/trips/:id/confirm
// @access  Private (Chofer del viaje)
const confirmTrip = async (req, res) => {
  console.log(`🚀 CONFIRMTRIP INICIADO - Viaje ID: ${req.params.id}, Usuario: ${req.user.email}`);
  try {
    const { confirmationNotes } = req.body;
    console.log(`📝 Notas de confirmación:`, confirmationNotes);
    
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'name employeeId')
      .populate('createdBy', 'name');
    
    console.log(`📊 Viaje encontrado: ${trip?.destination}, Estado inicial: ${trip?.status}`);
    
    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    // Verificar que el usuario sea el chofer asignado
    if (trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el chofer asignado puede confirmar este viaje' });
    }

    // Verificar que el viaje no esté ya confirmado
    if (trip.driverConfirmation.confirmed) {
      return res.status(400).json({ message: 'Este viaje ya está confirmado' });
    }

    // Actualizar la confirmación
    trip.driverConfirmation.confirmed = true;
    trip.driverConfirmation.confirmedAt = new Date();
    trip.driverConfirmation.confirmationNotes = confirmationNotes || '';

    // DEBUG: Verificar fechas y horas para diagnóstico
    const now = new Date();
    const [hours, minutes] = trip.departureTime.split(':');
    const tripDateTime = new Date(trip.departureDate);
    tripDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    console.log(`🔍 CONFIRMACIÓN DEBUG - Viaje ${trip._id}:`);
    console.log(`   📅 Fecha del viaje: ${trip.departureDate.toDateString()}`);
    console.log(`   ⏰ Hora programada: ${trip.departureTime}`);
    console.log(`   📅⏰ Fecha+Hora completa: ${tripDateTime.toLocaleString('es-UY')}`);
    console.log(`   🕐 Hora actual: ${now.toLocaleString('es-UY')}`);
    console.log(`   ❓ ¿Ya pasó la hora? ${now >= tripDateTime ? 'SÍ' : 'NO'}`);
    console.log(`   � Estado actual: ${trip.status}`);
    
    // NUNCA cambiar automáticamente el estado en confirmación
    // El scheduler se encarga de eso cuando llegue la hora
    console.log(`✅ Viaje ${trip._id} confirmado correctamente`);
    console.log(`   ⏳ Permanecerá "programado" hasta el ${tripDateTime.toLocaleString('es-UY')}`);
    console.log(`   🤖 El scheduler lo cambiará a "en curso" automáticamente`);
    
    // NO CAMBIAR EL ESTADO AQUÍ - dejar que el scheduler lo maneje

    await trip.save();

    // Enviar notificación al admin que creó el viaje
    try {
      const { sendTripConfirmationNotification } = require('../services/notificationService');
      const Notification = require('../models/Notification');
      
      // Crear notificación en la base de datos
      await Notification.create({
        userId: trip.createdBy._id,
        title: '✅ Viaje Confirmado',
        body: `${trip.driver.name} ha confirmado el viaje a ${trip.destination}`,
        type: 'trip_confirmed',
        relatedTrip: trip._id,
        data: {
          tripId: trip._id.toString(),
          driverName: trip.driver.name,
          destination: trip.destination,
          confirmedAt: trip.driverConfirmation.confirmedAt
        }
      });

      // Enviar notificación push
      await sendTripConfirmationNotification(
        trip.createdBy._id.toString(), 
        trip, 
        trip.driver.name
      );
      
      console.log(`📱 Notificación de confirmación enviada al admin ${trip.createdBy.name}`);
    } catch (notificationError) {
      console.error('Error enviando notificación de confirmación:', notificationError);
    }

    const updatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .populate('createdBy', 'name');

    console.log(`✅ CONFIRMTRIP COMPLETADO - Estado final: ${updatedTrip.status}`);
    console.log(`📋 Confirmación registrada: ${updatedTrip.driverConfirmation.confirmed}`);

    res.json({
      message: 'Viaje confirmado exitosamente',
      trip: updatedTrip
    });

  } catch (error) {
    console.error('Error confirmando viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Finalizar viaje (solo chofer asignado)
// @route   PUT /api/trips/:id/finish
// @access  Private (Chofer del viaje)
const finishTrip = async (req, res) => {
  try {
    const { finishNotes } = req.body;
    
    const trip = await Trip.findById(req.params.id)
      .populate('driver', 'name employeeId')
      .populate('createdBy', 'name')
      .populate('vehicle', 'licensePlate brand model');
    
    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    // Verificar que el usuario sea el chofer asignado
    if (trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Solo el chofer asignado puede finalizar este viaje' });
    }

    // Verificar que el viaje esté en curso
    if (trip.status !== 'en_curso') {
      return res.status(400).json({ 
        message: 'Solo se pueden finalizar viajes que estén en curso' 
      });
    }

    // Actualizar el estado del viaje
    const finishTime = new Date();
    trip.status = 'completado';
    trip.finishedAt = finishTime;
    trip.finishedBy = req.user._id;
    
    // Establecer hora de regreso automáticamente
    trip.returnTime = finishTime.toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    if (finishNotes) {
      trip.observations = (trip.observations ? trip.observations + '\n\n' : '') + 
                          `Finalizado: ${finishNotes}`;
    }

    await trip.save();

    // Liberar vehículo
    const Vehicle = require('../models/Vehicle');
    await Vehicle.findByIdAndUpdate(trip.vehicle._id, { status: 'disponible' });

    // Enviar notificación al admin que creó el viaje (solo si no se ha enviado antes)
    if (!trip.completedNotificationSent) {
      try {
        const { sendNotificationToUser } = require('../services/notificationService');
        const Notification = require('../models/Notification');
        
        await Notification.create({
          userId: trip.createdBy._id,
          title: '🏁 Viaje Finalizado',
          body: `${trip.driver.name} ha completado el viaje a ${trip.destination}`,
          type: 'trip_completed',
          relatedTrip: trip._id,
          data: {
            tripId: trip._id.toString(),
            driverName: trip.driver.name,
            destination: trip.destination,
            finishedAt: trip.finishedAt,
            vehicle: `${trip.vehicle.brand} ${trip.vehicle.model} (${trip.vehicle.licensePlate})`
          }
        });

        await sendNotificationToUser(
          trip.createdBy._id.toString(),
          '🏁 Viaje Finalizado',
          `${trip.driver.name} ha completado el viaje a ${trip.destination}`,
          {
            type: 'trip_completed',
            tripId: trip._id.toString(),
            driverName: trip.driver.name,
            destination: trip.destination,
            finishedAt: trip.finishedAt
          }
        );
        
        // Marcar que ya se envió la notificación
        trip.completedNotificationSent = true;
        await trip.save();
        
        console.log(`📱 Notificación de finalización enviada al admin ${trip.createdBy.name}`);
      } catch (notificationError) {
        console.error('Error enviando notificación de finalización:', notificationError);
      }
    } else {
      console.log('📱 Notificación de finalización ya fue enviada anteriormente');
    }

    const updatedTrip = await Trip.findById(trip._id)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .populate('createdBy', 'name')
      .populate('finishedBy', 'name');

    res.json({
      message: 'Viaje finalizado exitosamente',
      trip: updatedTrip
    });

  } catch (error) {
    console.error('Error finalizando viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Eliminar viaje
// @route   DELETE /api/trips/:id
// @access  Private (solo admin)
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Viaje no encontrado' });
    }

    // Liberar vehículo si está asignado
    if (trip.status === 'programado' || trip.status === 'en_curso') {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'disponible' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Viaje eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando viaje:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  confirmTrip,
  finishTrip,
  deleteTrip,
  tripValidation
};