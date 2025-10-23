const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUpcomingTrips,
  getActiveTrips,
  getVehiclesSummary,
  getWeeklyTrips,
  getDailyTrips
} = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/dashboard/daily-trips
// @desc    Obtener historial diario de viajes (admin)
// @access  Private (admin)
router.get('/daily-trips', auth, authorize('admin', 'super_admin'), getDailyTrips);

// @route   GET /api/dashboard/weekly-trips
// @desc    Obtener historial semanal de viajes completados (chofer)
// @access  Private
router.get('/weekly-trips', auth, getWeeklyTrips);

// @route   GET /api/dashboard/stats
// @desc    Obtener estadísticas del dashboard
// @access  Private
router.get('/stats', auth, getDashboardStats);

// @route   GET /api/dashboard/upcoming-trips
// @desc    Obtener próximos viajes
// @access  Private
router.get('/upcoming-trips', auth, getUpcomingTrips);

// @route   GET /api/dashboard/active-trips
// @desc    Obtener viajes activos
// @access  Private
router.get('/active-trips', auth, getActiveTrips);

// @route   GET /api/dashboard/vehicles-summary
// @desc    Obtener resumen de vehículos
// @access  Private (solo admin)
router.get('/vehicles-summary', 
  auth,
  authorize('administrativo'),
  getVehiclesSummary
);

module.exports = router;