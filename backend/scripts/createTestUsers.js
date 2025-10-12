const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mgap-viajes');

// Esquema de usuario
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  employeeId: String,
  phone: String,
  department: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    console.log('🔍 Verificando usuarios existentes...');
    
    // Verificar si ya existen los usuarios
    const adminPrincipalExists = await User.findOne({ email: 'superadmin@mgap.gub.uy' });
    const adminExists = await User.findOne({ email: 'admin@mgap.gub.uy' });
    const choferExists = await User.findOne({ email: 'chofer@mgap.gub.uy' });
    
    if (adminPrincipalExists && adminExists && choferExists) {
      console.log('✅ Los usuarios de prueba ya existen');
      process.exit(0);
    }
    
    console.log('👤 Creando usuarios de prueba...');
    
    // Encriptar contraseñas
    const saltRounds = 10;
    const superAdminPassword = await bcrypt.hash('superadmin123', saltRounds);
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const choferPassword = await bcrypt.hash('chofer123', saltRounds);
    
    // Crear administrador principal
    if (!adminPrincipalExists) {
      await User.create({
        name: 'Super Administrador MGAP',
        email: 'superadmin@mgap.gub.uy',
        password: superAdminPassword,
        role: 'admin_principal',
        employeeId: 'SUPER001',
        phone: '099000000',
        department: 'Dirección General',
        isActive: true
      });
      console.log('✅ Usuario administrador principal creado: superadmin@mgap.gub.uy');
    }
    
    // Crear usuario administrador
    if (!adminExists) {
      await User.create({
        name: 'Administrador MGAP',
        email: 'admin@mgap.gub.uy',
        password: adminPassword,
        role: 'administrativo',
        employeeId: 'ADMIN001',
        phone: '099000001',
        department: 'Administración',
        isActive: true
      });
      console.log('✅ Usuario administrador creado: admin@mgap.gub.uy');
    }
    
    // Crear usuario chofer
    if (!choferExists) {
      await User.create({
        name: 'Juan Pérez',
        email: 'chofer@mgap.gub.uy',
        password: choferPassword,
        role: 'chofer',
        employeeId: 'CHOF001',
        phone: '099123456',
        department: 'Montevideo',
        isActive: true
      });
      console.log('✅ Usuario chofer creado: chofer@mgap.gub.uy');
    }
    
    console.log('\n🎉 Usuarios de prueba creados exitosamente!');
    console.log('\nCredenciales de acceso:');
    console.log('� Super Administrador:');
    console.log('   Email: superadmin@mgap.gub.uy');
    console.log('   Contraseña: superadmin123');
    console.log('\n�👨‍💼 Administrador:');
    console.log('   Email: admin@mgap.gub.uy');
    console.log('   Contraseña: admin123');
    console.log('\n🚗 Chofer:');
    console.log('   Email: chofer@mgap.gub.uy');
    console.log('   Contraseña: chofer123');
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

createTestUsers();