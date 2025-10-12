const express = require('express');
const router = express.Router();
const {
  registerFCMToken,
  unregisterFCMToken,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  sendTestNotification
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// @route   POST /api/notifications/register-token
router.post('/register-token', auth, registerFCMToken);

// @route   DELETE /api/notifications/unregister-token
router.delete('/unregister-token', auth, unregisterFCMToken);

// @route   GET /api/notifications
router.get('/', auth, getUserNotifications);

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', auth, markNotificationAsRead);

// @route   PUT /api/notifications/mark-all-read
router.put('/mark-all-read', auth, markAllAsRead);

// @route   POST /api/notifications/test (solo para administradores)
router.post('/test', auth, sendTestNotification);

module.exports = router;