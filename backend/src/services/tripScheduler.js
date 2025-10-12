const cron = require('node-cron');
const Trip = require('../models/Trip');
const { sendNotificationToUser, sendNotificationToAllExcept } = require('./notificationService');

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

    // SCHEDULER DESACTIVADO - Se puede activar manualmente cuando sea necesario
    // this.cronJob = cron.schedule('*/30 * * * * *', async () => {
    //   await this.processScheduledTrips();
    // }, {
    //   scheduled: false
    // });

    // this.cronJob.start();
    this.isRunning = false; // Mantener desactivado
    console.log('⏰ Scheduler de viajes DESACTIVADO - No se ejecutará automáticamente');
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
      
      // 0. Corregir viajes que se iniciaron prematuramente (ejecutar solo una vez al inicio)
      if (!this.fixedPrematureTrips) {
        await this.fixPrematurelyStartedTrips();
        this.fixedPrematureTrips = true;
      }
      
      // 1. Enviar recordatorios 15 minutos antes
      await this.sendReminderNotifications(now);
      
      // 2. Iniciar viajes automáticamente
      await this.autoStartTrips(now);
      
    } catch (error) {
      console.error('Error procesando viajes programados:', error);
    }
  }

  // Enviar notificaciones recordatorio 15 minutos antes
  async sendReminderNotifications(now) {
    try {
      // Buscar viajes que empiecen en los próximos 15 minutos y no se haya enviado recordatorio
      const reminderTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos desde ahora
      
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
        // Verificar que la hora también coincida
        const tripDateTime = this.combineDateAndTime(trip.departureDate, trip.departureTime);
        const timeDiff = tripDateTime.getTime() - now.getTime();
        
        // Si falta entre 14 y 16 minutos (margen de error de 1 minuto)
        if (timeDiff >= 14 * 60 * 1000 && timeDiff <= 16 * 60 * 1000) {
          await this.sendTripReminder(trip);
          
          // Marcar como enviado
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
        
        console.log(`🔍 Verificando viaje ${trip._id}:`);
        console.log(`   Destino: ${trip.destination}`);
        console.log(`   Fecha: ${trip.departureDate?.toLocaleDateString('es-UY')}`);
        console.log(`   Hora: ${trip.departureTime}`);
        console.log(`   Fecha/Hora programada: ${tripDateTime.toLocaleString('es-UY')}`);
        console.log(`   Fecha/Hora actual: ${now.toLocaleString('es-UY')}`);
        console.log(`   ¿Debe iniciarse?: ${now >= tripDateTime}`);
        console.log(`   Chofer confirmó: ${trip.driverConfirmation?.confirmed}`);
        
        // Solo iniciar si realmente llegó la hora exacta (fecha + hora) Y está confirmado Y no se ha iniciado antes
        if (now >= tripDateTime && trip.driverConfirmation?.confirmed && !trip.autoStarted) {
          trip.status = 'en_curso';
          trip.autoStarted = true;
          trip.autoStartedAt = now;
          trip.startNotificationSent = true;  // Marcar que ya se envió la notificación
          await trip.save();

          // Enviar notificación al chofer de que el viaje comenzó
          await this.sendTripStartedNotification(trip);
          
          console.log(`🚀 Viaje ${trip._id} (${trip.destination}) iniciado automáticamente a las ${now.toLocaleTimeString('es-UY')}`);
        } else if (!trip.driverConfirmation?.confirmed) {
          console.log(`⏸️  Viaje ${trip._id} NO iniciado: chofer no ha confirmado`);
        } else {
          console.log(`⏸️  Viaje ${trip._id} NO iniciado: hora aún no llega`);
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

  // Función de utilidad para corregir viajes que se iniciaron prematuramente
  async fixPrematurelyStartedTrips() {
    try {
      const now = new Date();
      
      // Buscar viajes en curso que no deberían haber iniciado aún
      const prematureTrips = await Trip.find({
        status: 'en_curso',
        autoStarted: true
      }).populate('driver', 'name');

      for (const trip of prematureTrips) {
        const tripDateTime = this.combineDateAndTime(trip.departureDate, trip.departureTime);
        
        // Si el viaje está en curso pero su hora no ha llegado, corregirlo
        if (now < tripDateTime) {
          trip.status = 'programado';
          trip.autoStarted = false;
          trip.autoStartedAt = null;
          await trip.save();
          
          console.log(`🔄 Viaje ${trip._id} corregido: vuelto a estado programado hasta ${tripDateTime.toLocaleString('es-UY')}`);
        }
      }
    } catch (error) {
      console.error('Error corrigiendo viajes prematuros:', error);
    }
  }

  // Enviar notificación recordatorio
  async sendTripReminder(trip) {
    try {
      const reminderTitle = '⏰ Recordatorio de Viaje';
      const reminderBody = `El viaje de ${trip.driver.name} a ${trip.destination} comienza en 15 minutos (${trip.departureTime})`;
      // Notificar a todos los usuarios excepto el chofer (que ya lo recibe por su cuenta)
      await sendNotificationToAllExcept(
        null, // null para incluir a todos
        reminderTitle,
        reminderBody,
        {
          type: 'trip_reminder_universal',
          tripId: trip._id.toString(),
          driverName: trip.driver.name,
          destination: trip.destination,
          departureTime: trip.departureTime
        }
      );
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
    }
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