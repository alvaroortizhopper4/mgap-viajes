const cron = require('node-cron');
const Trip = require('../models/Trip');
const { sendNotificationToUser, sendNotificationToAllExcept } = require('./notificationService');
const { sendWhatsAppMessage } = require('./whatsappService');
const User = require('../models/User');

class TripSchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Iniciar el servicio de programación
  start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler de viajes ya está ejecutándose');
      return;
    }

    // SCHEDULER ACTIVADO - Corre cada minuto
    this.cronJob = cron.schedule('*/1 * * * *', async () => {
      await this.processScheduledTrips();
    }, {
      scheduled: true
    });
    this.cronJob.start();
    this.isRunning = true;
    console.log('⏰ Scheduler de viajes ACTIVADO - Se ejecuta cada minuto');
  }

  // Detener el servicio
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('⏰ Scheduler de viajes detenido');
    }
  }

  // Procesar viajes programados
  async processScheduledTrips() {
    try {
      const now = new Date();
      
      // 1. Enviar recordatorios 10 minutos antes
      await this.sendReminderNotifications(now);
      // 2. Enviar recordatorio de confirmación por WhatsApp a los 10 minutos si no confirmó
      await this.sendWhatsAppConfirmationReminders(now);
      // 3. Enviar recordatorio por WhatsApp 15 minutos antes del viaje
      await this.sendWhatsAppPreTripReminders(now);
      // 2. Iniciar viajes automáticamente
      await this.autoStartTrips(now);
    } catch (error) {
      console.error('Error en processScheduledTrips:', error);
    }
  }

  // Enviar notificaciones recordatorio 10 minutos antes
  async sendReminderNotifications(now) {
    try {
      const reminderTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutos desde ahora
      const tripsForReminder = await Trip.find({
        status: 'programado',
        reminderNotificationSent: false,
        departureDate: {
          $gte: now,
          $lte: reminderTime
        }
      })
        .populate('driver', 'name employeeId')
        .populate('createdBy', 'name')
        .populate('vehicle', 'licensePlate brand model');

      for (const trip of tripsForReminder) {
        const tripDateTime = this.combineDateAndTime(trip.departureDate, trip.departureTime);
        const timeDiff = tripDateTime.getTime() - now.getTime();
        if (timeDiff >= 9 * 60 * 1000 && timeDiff <= 11 * 60 * 1000) {
          await this.sendTripReminder(trip);
          trip.reminderNotificationSent = true;
          trip.reminderSentAt = now;
          await trip.save();
          console.log(`⏰ Recordatorio enviado para viaje ${trip._id} a ${trip.destination}`);
        }
      }
    } catch (error) {
      console.error('Error enviando recordatorios:', error);
    }
  }

  // Enviar recordatorio por WhatsApp si el chofer no confirmó a los 10 minutos de creado el viaje
  async sendWhatsAppConfirmationReminders(now) {
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const trips = await Trip.find({
      status: 'programado',
      'driverConfirmation.confirmed': false,
      whatsappConfirmationReminderSent: false,
      createdAt: { $lte: tenMinutesAgo }
    }).populate('driver', 'name phone');
    for (const trip of trips) {
      if (trip.driver && trip.driver.phone) {
        const mensaje = '*Recordatorio de Confirmacion de Viaje*\n\n' +
          'Hola ' + trip.driver.name + ',\n\n' +
          'Tienes un viaje programado a ' + trip.destination + ' para el dia ' +
          trip.departureDate.toLocaleDateString('es-UY') + ' a las ' + trip.departureTime + '.\n\n' +
          'Por favor, confirma el viaje en la app lo antes posible.';
        try {
          await sendWhatsAppMessage(trip.driver.phone, mensaje);
          trip.whatsappConfirmationReminderSent = true;
          await trip.save();
          console.log('WhatsApp de recordatorio de confirmacion enviado a ' + trip.driver.name);
        } catch (err) {
          console.error('Error enviando WhatsApp de confirmacion:', err);
        }
      }
    }
  }

  // Enviar recordatorio por WhatsApp 15 minutos antes del viaje
  async sendWhatsAppPreTripReminders(now) {
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const trips = await Trip.find({
      status: 'programado',
      'driverConfirmation.confirmed': true,
      whatsappPreTripReminderSent: false,
      departureDate: { $lte: fifteenMinutesFromNow, $gte: now }
    }).populate('driver', 'name phone');
    for (const trip of trips) {
      if (trip.driver && trip.driver.phone) {
        const mensaje = '*Recordatorio de Viaje Proximo*\n\n' +
          'Hola ' + trip.driver.name + ',\n\n' +
          'Recuerda que tu viaje a ' + trip.destination + ' esta programado para el dia ' +
          trip.departureDate.toLocaleDateString('es-UY') + ' a las ' + trip.departureTime + '.\n\n' +
          'Por favor, preparate para salir a tiempo.';
        try {
          await sendWhatsAppMessage(trip.driver.phone, mensaje);
          trip.whatsappPreTripReminderSent = true;
          await trip.save();
          console.log('WhatsApp de recordatorio previo al viaje enviado a ' + trip.driver.name);
        } catch (err) {
          console.error('Error enviando WhatsApp previo al viaje:', err);
        }
      }
    }
  }

  // Iniciar viajes automáticamente cuando llegue la hora
  async autoStartTrips(now) {
    try {
      // Buscar viajes programados confirmados por el chofer
      // No filtrar por fecha aquí, ya que validaremos fecha+hora exacta después
      const tripsToStart = await Trip.find({
        status: 'programado',
        autoStarted: false,
        'driverConfirmation.confirmed': true  // Solo viajes confirmados por el chofer
      })
      .populate('driver', 'name employeeId')
      .populate('createdBy', 'name');

      // Solo mostrar log si hay viajes para verificar
      if (tripsToStart.length > 0) {
        console.log(`🔍 Scheduler: Verificando ${tripsToStart.length} viajes programados y confirmados`);
      }

      for (const trip of tripsToStart) {
        // Combinar fecha y hora para obtener el momento exacto
        const tripDateTime = this.combineDateAndTime(trip.departureDate, trip.departureTime);

        console.log('==============================');
        console.log(`🔍 Verificando viaje ${trip._id}`);
        console.log(`   Destino: ${trip.destination}`);
        console.log(`   Fecha salida: ${trip.departureDate?.toLocaleDateString('es-UY')}`);
        console.log(`   Hora salida: ${trip.departureTime}`);
        console.log(`   Fecha/Hora programada: ${tripDateTime.toLocaleString('es-UY')}`);
        console.log(`   Fecha/Hora actual: ${now.toLocaleString('es-UY')}`);
        console.log(`   ¿Debe iniciarse?: ${now >= tripDateTime}`);
        console.log(`   Chofer confirmó: ${trip.driverConfirmation?.confirmed}`);
        console.log(`   autoStarted: ${trip.autoStarted}`);
        console.log(`   Estado actual: ${trip.status}`);
        console.log('==============================');

        // Solo iniciar si realmente llegó la hora exacta (fecha + hora) Y está confirmado Y no se ha iniciado antes
        if (now >= tripDateTime && trip.driverConfirmation?.confirmed && !trip.autoStarted) {
          console.log('✅ Cambiando estado a en_curso');
          trip.status = 'en_curso';
          trip.autoStarted = true;
          trip.autoStartedAt = now;
          trip.startNotificationSent = true;  // Marcar que ya se envió la notificación
          await trip.save();

          // Enviar notificación al chofer de que el viaje comenzó
          await this.sendTripStartedNotification(trip);
        } else {
          if (!(now >= tripDateTime)) console.log('⏳ Aún no es la hora de inicio.');
          if (!trip.driverConfirmation?.confirmed) console.log('❌ El chofer NO confirmó el viaje.');
          if (trip.autoStarted) console.log('⚠️ El viaje ya fue auto-iniciado antes.');
        }
      }
    } catch (error) {
      console.error('Error iniciando viajes automáticamente:', error);
    }
  }

  // Combinar fecha y hora en un objeto Date
  combineDateAndTime(date, time) {
    const [hours, minutes] = time.split(':');
    const combinedDate = new Date(date);
    combinedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return combinedDate;
  }

  // Enviar notificación cuando el viaje comienza
  async sendTripStartedNotification(trip) {
    try {
      const startTitle = '🚀 Viaje Iniciado';
      const startBody = `El viaje de ${trip.driver.name} a ${trip.destination} ha comenzado`;
      await sendNotificationToAllExcept(
        null,
        startTitle,
        startBody,
        {
          type: 'trip_started_universal',
          tripId: trip._id.toString(),
          driverName: trip.driver.name,
          destination: trip.destination
        }
      );
    } catch (error) {
      console.error('Error enviando notificación de inicio:', error);
    }
  }

  // Verificar el estado del scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDates() : null
    };
  }
}

// Exportar singleton
const tripScheduler = new TripSchedulerService();
module.exports = tripScheduler;