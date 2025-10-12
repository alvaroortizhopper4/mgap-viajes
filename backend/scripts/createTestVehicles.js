const mongoose = require('mongoose');
const Vehicle = require('../src/models/Vehicle');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mgap-viajes');
    console.log('MongoDB conectado para crear vehículos');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const createVehicles = async () => {
  try {
    // Verificar si ya existen los vehículos
    const existingSOF5051 = await Vehicle.findOne({ licensePlate: 'SOF 5051' });
    const existingSOF5108 = await Vehicle.findOne({ licensePlate: 'SOF 5108' });

    const vehiclesToCreate = [];

    if (!existingSOF5051) {
      vehiclesToCreate.push({
        licensePlate: 'SOF 5051',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2020,
        mileage: 45000,
        fuelType: 'diesel',
        status: 'disponible',
        capacity: 5,
        department: 'Montevideo',
        observations: 'Vehículo oficial del MGAP para traslados'
      });
    }

    if (!existingSOF5108) {
      vehiclesToCreate.push({
        licensePlate: 'SOF 5108',
        brand: 'Ford',
        model: 'Ranger',
        year: 2019,
        mileage: 52000,
        fuelType: 'diesel',
        status: 'disponible',
        capacity: 5,
        department: 'Montevideo',
        observations: 'Vehículo oficial del MGAP para traslados'
      });
    }

    if (vehiclesToCreate.length > 0) {
      const createdVehicles = await Vehicle.insertMany(vehiclesToCreate);
      console.log(`✅ ${createdVehicles.length} vehículos creados exitosamente:`);
      createdVehicles.forEach(vehicle => {
        console.log(`  - ${vehicle.licensePlate}: ${vehicle.brand} ${vehicle.model} (${vehicle.year})`);
      });
    } else {
      console.log('ℹ️  Los vehículos SOF 5051 y SOF 5108 ya existen en la base de datos');
    }

    // Mostrar todos los vehículos disponibles
    const allVehicles = await Vehicle.find({ status: 'disponible' }).sort({ licensePlate: 1 });
    console.log(`\n📋 Total de vehículos disponibles: ${allVehicles.length}`);
    allVehicles.forEach(vehicle => {
      console.log(`  - ${vehicle.licensePlate}: ${vehicle.brand} ${vehicle.model} (${vehicle.year}) - ${vehicle.status}`);
    });

  } catch (error) {
    console.error('❌ Error creando vehículos:', error);
  }
};

const main = async () => {
  await connectDB();
  await createVehicles();
  mongoose.connection.close();
  console.log('\n✅ Proceso completado. Base de datos cerrada.');
};

main();