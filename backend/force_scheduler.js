// Script para forzar procesamiento del scheduler y ver logs detallados
const mongoose = require('mongoose');
require('./src/models/Trip');
require('./src/models/User');  
require('./src/models/Vehicle');

const tripScheduler = require('./src/services/tripScheduler');

async function forceSchedulerCheck() {
    try {
        await mongoose.connect('mongodb://localhost:27017/mgap-viajes');
        console.log('📡 Conectado a MongoDB');
        
        console.log('🔄 Forzando verificación del scheduler...');
        
        await tripScheduler.processScheduledTrips();
        
        console.log('✅ Verificación completada');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

forceSchedulerCheck();