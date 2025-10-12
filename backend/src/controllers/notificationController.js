const UserToken = require('../models/UserToken');
const Notification = require('../models/Notification');
const { sendNotificationToUser, sendNotificationToAllExcept } = require('../services/notificationService');

// @desc    Registrar token FCM del dispositivo
// @route   POST /api/notifications/register-token
// @access  Private
const registerFCMToken = async (req, res) => {
  try {
    const { fcmToken, platform, appVersion, deviceModel } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: 'Token FCM es requerido' });
    }

    // Verificar si el token ya existe
    let userToken = await UserToken.findOne({ fcmToken });
    
    if (userToken) {
      // Actualizar el usuario del token si es diferente
      userToken.userId = req.user._id;
      userToken.active = true;
      userToken.lastUsed = new Date();
      userToken.deviceInfo = {
        platform,
        appVersion,
        deviceModel
      };
    } else {
      // Crear nuevo token
      userToken = new UserToken({
        userId: req.user._id,
        fcmToken,
        deviceInfo: {
          platform,
          appVersion,
          deviceModel
        }
      });
    }

    await userToken.save();

    res.status(200).json({ 
      message: 'Token FCM registrado correctamente',
      tokenId: userToken._id
    });

  } catch (error) {
    console.error('Error registrando token FCM:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Desactivar token FCM
// @route   DELETE /api/notifications/unregister-token
// @access  Private
const unregisterFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    await UserToken.updateOne(
      { fcmToken, userId: req.user._id },
      { active: false }
    );

    res.status(200).json({ message: 'Token desactivado correctamente' });

  } catch (error) {
    console.error('Error desactivando token:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener notificaciones del usuario
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread = false } = req.query;

    const filter = { userId: req.user._id };
    if (unread === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .populate('relatedTrip', 'destination departureDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
    });

    res.status(200).json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    await notification.markAsRead();

    res.status(200).json({ message: 'Notificación marcada como leída' });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Marcar todas las notificaciones como leídas
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });

  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Enviar notificación de prueba (solo para administradores)
// @route   POST /api/notifications/test
// @access  Private (Admin only)
const sendTestNotification = async (req, res) => {
  try {
    const { 
      title = 'Notificación de prueba', 
      body = `Esta es una notificación de prueba desde ${req.user.name}`,
      sendToAll = false 
    } = req.body;

    let result;
    let message;

    if (sendToAll) {
      // Enviar a todos los usuarios excepto al que genera la notificación
      result = await sendNotificationToAllExcept(req.user._id, title, body, { 
        type: 'test',
        generatedBy: req.user.name,
        generatedByRole: req.user.role
      });
      message = `Notificación enviada a ${result.totalSent} usuarios (excluyendo a ti)`;
    } else {
      // Comportamiento original: enviar solo al usuario específico o a sí mismo
      let targetUserId = req.user._id;
      
      if (req.body.userId && (req.user.role === 'admin_principal' || req.user.role === 'administrativo')) {
        targetUserId = req.body.userId;
      }

      result = await sendNotificationToUser(targetUserId, title, body, { type: 'test' });
      message = 'Notificación de prueba enviada correctamente';
    }

    res.status(200).json({ 
      message,
      result,
      user: req.user.name,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  registerFCMToken,
  unregisterFCMToken,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  sendTestNotification
};