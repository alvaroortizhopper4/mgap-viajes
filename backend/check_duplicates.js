const mongoose = require('mongoose');
const Notification = require('./src/models/Notification');

mongoose.connect('mongodb://localhost:27017/mgap_viajes')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Contar total de notificaciones
    const total = await Notification.countDocuments();
    console.log(`📊 Total notificaciones: ${total}`);
    
    // Buscar notificaciones duplicadas
    const duplicates = await Notification.aggregate([
      {
        $group: {
          _id: { userId: '$userId', title: '$title', body: '$body', type: '$type' },
          count: { $sum: 1 },
          docs: { $push: { id: '$_id', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    console.log(`🔍 Grupos duplicados encontrados: ${duplicates.length}`);
    
    duplicates.forEach((dup, i) => {
      console.log(`\n${i+1}. 📢 ${dup._id.title}`);
      console.log(`   📝 ${dup._id.body}`);
      console.log(`   🔢 Cantidad: ${dup.count}`);
      console.log(`   👤 Usuario: ${dup._id.userId}`);
      console.log(`   📅 Fechas: ${dup.docs.map(d => d.createdAt).join(', ')}`);
    });
    
    // Eliminar duplicados excepto el más reciente
    if (duplicates.length > 0) {
      console.log('\n🧹 Limpiando duplicados...');
      
      for (const dup of duplicates) {
        // Ordenar por fecha y mantener solo el más reciente
        const sortedDocs = dup.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const toDelete = sortedDocs.slice(1); // Todos excepto el primero (más reciente)
        
        if (toDelete.length > 0) {
          const deleteIds = toDelete.map(d => d.id);
          const result = await Notification.deleteMany({ _id: { $in: deleteIds } });
          console.log(`   ❌ Eliminados ${result.deletedCount} duplicados de: "${dup._id.title}"`);
        }
      }
      
      const newTotal = await Notification.countDocuments();
      console.log(`\n📊 Notificaciones después de limpiar: ${newTotal}`);
      console.log(`✅ Se eliminaron ${total - newTotal} duplicados`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });