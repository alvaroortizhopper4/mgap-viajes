// Script para verificar manualmente el viaje de san jose
console.log('🔍 Verificando viaje de san jose...');
console.log('Fecha actual:', new Date().toLocaleString('es-UY'));

// Simular la lógica del scheduler
const tripDate = new Date('2025-10-06'); // 06/10/2025
const tripTime = '15:57';

const [hours, minutes] = tripTime.split(':').map(Number);
const tripDateTime = new Date(tripDate);
tripDateTime.setHours(hours, minutes, 0, 0);

const now = new Date();

console.log('📅 Fecha del viaje:', tripDate.toLocaleDateString('es-UY'));
console.log('⏰ Hora del viaje:', tripTime);
console.log('📅⏰ Fecha+Hora completa del viaje:', tripDateTime.toLocaleString('es-UY'));
console.log('🕐 Fecha+Hora actual:', now.toLocaleString('es-UY'));
console.log('❓ ¿Ya debería estar en curso?:', now >= tripDateTime);
console.log('⏱️  Diferencia en minutos:', Math.floor((now - tripDateTime) / (1000 * 60)));