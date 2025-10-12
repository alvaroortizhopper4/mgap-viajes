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

async function createSpecificUsers() {
  try {
    console.log('🔍 Verificando y creando usuarios específicos...');
    
    // Limpiar usuarios existentes con estos emails
    await User.deleteMany({ 
      email: { $in: ['admin@mgap.gub.uy', 'chofer@mgap.gub.uy'] } 
    });
    console.log('🗑️ Usuarios existentes eliminados');
    
    // Encriptar contraseñas
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const choferPassword = await bcrypt.hash('chofer123', saltRounds);
    
    // Crear usuario administrativo
    const adminUser = await User.create({
      name: 'Administrador MGAP',
      email: 'admin@mgap.gub.uy',
      password: adminPassword,
      role: 'administrativo',
      employeeId: 'ADMIN001',
      phone: '099000001',
      department: 'Administración',
      isActive: true
    });
    console.log('✅ Usuario administrativo creado:', adminUser.email);
    
    // Crear usuario chofer
    const choferUser = await User.create({
      name: 'Juan Pérez',
      email: 'chofer@mgap.gub.uy',
      password: choferPassword,
      role: 'chofer',
      employeeId: 'CHOF001',
      phone: '099123456',
      department: 'Montevideo',
      isActive: true
    });
    console.log('✅ Usuario chofer creado:', choferUser.email);
    
    // Verificar que se crearon correctamente
    const verifyAdmin = await User.findOne({ email: 'admin@mgap.gub.uy' });
    const verifyChofer = await User.findOne({ email: 'chofer@mgap.gub.uy' });
    
    console.log('\n🔍 Verificación de usuarios:');
    console.log('Admin encontrado:', !!verifyAdmin);
    console.log('Chofer encontrado:', !!verifyChofer);
    
    // Probar las contraseñas
    if (verifyAdmin) {
      const adminPasswordMatch = await bcrypt.compare('admin123', verifyAdmin.password);
      console.log('Contraseña admin correcta:', adminPasswordMatch);
    }
    
    if (verifyChofer) {
      const choferPasswordMatch = await bcrypt.compare('chofer123', verifyChofer.password);
      console.log('Contraseña chofer correcta:', choferPasswordMatch);
    }
    
    console.log('\n🎉 Usuarios creados y verificados exitosamente!');
    console.log('\n📝 Credenciales para login:');
    console.log('👨‍💼 Administrativo:');
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

createSpecificUsers();