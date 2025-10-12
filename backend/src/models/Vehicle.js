const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  licensePlate: {
    type: String,
    required: [true, 'La patente es requerida'],
    unique: true,
    uppercase: true,
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true
  },
  year: {
    type: Number,
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  mileage: {
    type: Number,
    default: 0,
    min: 0
  },
  fuelType: {
    type: String,
    enum: ['gasolina', 'diesel', 'híbrido', 'eléctrico'],
    default: 'gasolina'
  },
  status: {
    type: String,
    enum: ['disponible', 'en_uso', 'mantenimiento', 'fuera_de_servicio'],
    default: 'disponible'
  },
  capacity: {
    type: Number,
    min: 1,
    default: 5
  },
  observations: {
    type: String,
    trim: true
  },
  lastMaintenance: {
    type: Date
  },
  nextMaintenance: {
    type: Date
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);