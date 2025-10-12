// Configuración de Firebase Admin (necesitarás un archivo de credenciales)
// Por ahora usaremos un mock hasta que configures Firebase
let firebaseInitialized = false;
let admin = null;

const initializeFirebase = () => {
  try {
    // Para activar Firebase real, descomenta las siguientes líneas y configura las credenciales
    // admin = require('firebase-admin');
    // const serviceAccount = require('../../config/firebase-service-account.json');
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });
    // console.log('Firebase Admin inicializado correctamente');
    // firebaseInitialized = true;
    
    // Por ahora forzamos el modo mock
    throw new Error('Firebase no configurado intencionalmente');
  } catch (error) {
    console.log('Firebase no configurado, usando modo mock para notificaciones');
    firebaseInitialized = false;
    admin = null;
  }
};

const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Guardar notificación en la base de datos independientemente de Firebase
    const Notification = require('../models/Notification');
    await Notification.create({
      userId,
      title,
      body,
      type: data.type || 'system',
      data,
      relatedTrip: data.tripId || null
    });

    if (!firebaseInitialized) {
      // Modo mock - solo log en consola
      console.log(`📱 NOTIFICACIÓN MOCK para usuario ${userId}:`);
      console.log(`   Título: ${title}`);
      console.log(`   Mensaje: ${body}`);
      console.log(`   Datos adicionales:`, data);
      return { success: true, mock: true };
    }

    // Verificar que Firebase esté realmente inicializado
    if (!admin) {
      console.log('Firebase Admin no está disponible');
      return { success: false, error: 'Firebase not initialized' };
    }

    // Aquí buscarías el token FCM del usuario en la base de datos
    const UserToken = require('../models/UserToken');
    const userTokens = await UserToken.find({ userId, active: true });

    if (userTokens.length === 0) {
      console.log(`No se encontraron tokens activos para el usuario ${userId}`);
      return { success: false, error: 'No tokens found' };
    }

    const tokens = userTokens.map(tokenDoc => tokenDoc.fcmToken);

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`📱 Notificación enviada: ${response.successCount}/${tokens.length} exitosas`);
    
    // Limpiar tokens inválidos
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      // Desactivar tokens inválidos
      await UserToken.updateMany(
        { fcmToken: { $in: failedTokens } },
        { active: false }
      );
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };

  } catch (error) {
    console.error('Error enviando notificación:', error);
    return { success: false, error: error.message };
  }
};

const sendTripAssignmentNotification = async (driverId, tripData) => {
  const title = '🚗 Nuevo Viaje Asignado';
  const body = `Tienes un nuevo viaje a ${tripData.destination} programado para el ${new Date(tripData.departureDate).toLocaleDateString('es-UY')}`;
  
  const data = {
    type: 'trip_assigned',
    tripId: tripData._id.toString(),
    destination: tripData.destination,
    departureDate: tripData.departureDate
  };

  return await sendNotificationToUser(driverId, title, body, data);
};

const sendTripConfirmationNotification = async (adminId, tripData, driverName) => {
  const title = '✅ Viaje Confirmado';
  const body = `${driverName} ha confirmado el viaje a ${tripData.destination}`;
  
  const data = {
    type: 'trip_confirmed',
    tripId: tripData._id.toString(),
    driverName,
    destination: tripData.destination
  };

  return await sendNotificationToUser(adminId, title, body, data);
};

// Enviar notificación a todos los usuarios excepto al que la genera
const sendNotificationToAllExcept = async (excludeUserId, title, body, data = {}) => {
  try {
    const User = require('../models/User');
    
    // Obtener todos los usuarios excepto el que genera la notificación
    const users = await User.find({ 
      _id: { $ne: excludeUserId },
      active: { $ne: false } // Excluir usuarios desactivados si tienes ese campo
    }).select('_id name role');

    console.log(`📢 Enviando notificación a ${users.length} usuarios (excluyendo ${excludeUserId})`);

    const results = [];
    
    // Enviar notificación a cada usuario
    for (const user of users) {
      const result = await sendNotificationToUser(user._id.toString(), title, body, data);
      results.push({
        userId: user._id.toString(),
        userName: user.name,
        userRole: user.role,
        result
      });
    }

    return {
      success: true,
      totalSent: users.length,
      results
    };

  } catch (error) {
    console.error('Error enviando notificaciones masivas:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  sendNotificationToUser,
  sendNotificationToAllExcept,
  sendTripAssignmentNotification,
  sendTripConfirmationNotification
};