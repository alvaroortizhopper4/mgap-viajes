const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fcmToken: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    platform: String, // 'android', 'ios', 'web'
    appVersion: String,
    deviceModel: String
  },
  active: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
userTokenSchema.index({ userId: 1, active: 1 });
userTokenSchema.index({ fcmToken: 1 });

module.exports = mongoose.model('UserToken', userTokenSchema);