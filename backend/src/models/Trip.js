const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El chofer es requerido']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'El vehículo es requerido']
  },
  departureDate: {
    type: Date,
    required: [true, 'La fecha de salida es requerida']
  },
  returnDate: {
    type: Date
  },
  departureTime: {
    type: String, // Formato HH:MM
    required: [true, 'La hora de salida es requerida']
  },
  returnTime: {
    type: String // Formato HH:MM - Se establece automáticamente al finalizar el viaje
  },
  destination: {
    type: String,
    required: [true, 'El destino es requerido'],
    trim: true
  },
  purpose: {
    type: String,
    required: [true, 'El motivo del viaje es requerido'],
    trim: true
  },
  status: {
    type: String,
    enum: ['programado', 'en_curso', 'completado', 'cancelado'],
    default: 'programado'
  },
  departureLocation: {
    type: String,
    default: 'MGAP - Oficina Central',
    trim: true
  },
  estimatedDistance: {
    type: Number,
    min: 0
  },
  actualDistance: {
    type: Number,
    min: 0
  },
  departureOdometer: {
    type: Number,
    min: 0
  },
  returnOdometer: {
    type: Number,
    min: 0
  },
  passengers: [{
    name: {
      type: String,
      trim: true
    },
    employeeId: {
      type: String,
      trim: true
    }
  }],
  observations: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  driverConfirmation: {
    confirmed: {
      type: Boolean,
      default: false
    },
    confirmedAt: {
      type: Date
    },
    confirmationNotes: {
      type: String,
      trim: true
    }
  },
  adminNotified: {
    type: Boolean,
    default: false
  },
  // Campos para control de notificaciones automáticas
  reminderNotificationSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: {
    type: Date
  },
  // Campos para control de estados automáticos
  autoStarted: {
    type: Boolean,
    default: false
  },
  autoStartedAt: {
    type: Date
  },
  // Control de notificaciones enviadas
  startNotificationSent: {
    type: Boolean,
    default: false
  },
  completedNotificationSent: {
    type: Boolean,
    default: false
  },
  // Control de recordatorios por WhatsApp
  whatsappConfirmationReminderSent: {
    type: Boolean,
    default: false
  },
  whatsappPreTripReminderSent: {
    type: Boolean,
    default: false
  },
  finishedAt: {
    type: Date
  },
  finishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Validación personalizada: la fecha de regreso debe ser posterior a la de salida
tripSchema.pre('save', function(next) {
  if (this.returnDate && this.returnDate < this.departureDate) {
    return next(new Error('La fecha de regreso debe ser posterior a la fecha de salida'));
  }
  next();
});

// Índices para búsquedas y rendimiento
tripSchema.index({ driver: 1, departureDate: -1 });
tripSchema.index({ status: 1, departureDate: -1 });
tripSchema.index({ vehicle: 1, departureDate: -1 });
tripSchema.index({ departureDate: 1 });

// Método para verificar si un vehículo está disponible
tripSchema.statics.isVehicleAvailable = async function(vehicleId, departureDate, returnDate, excludeTripId = null) {
  const query = {
    vehicle: vehicleId,
    status: { $in: ['programado', 'en_curso'] },
    $or: [
      {
        departureDate: { $lte: departureDate },
        $or: [
          { returnDate: { $gte: departureDate } },
          { returnDate: null }
        ]
      },
      {
        departureDate: { $lte: returnDate || departureDate },
        returnDate: { $gte: departureDate }
      }
    ]
  };

  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const conflictingTrip = await this.findOne(query);
  return !conflictingTrip;
};

module.exports = mongoose.model('Trip', tripSchema);