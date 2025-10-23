// @desc    Obtener viajes en curso y completados del día para admin (07:00-22:00)
// @route   GET /api/dashboard/daily-trips
// @access  Private (admin)
const getDailyTrips = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Solo disponible para administradores' });
    }

    // Calcular rango horario de hoy: 07:00 a 22:00
    const now = new Date();
    const start = new Date(now);
    start.setHours(7, 0, 0, 0);
    const end = new Date(now);
    end.setHours(22, 0, 0, 0);

    // Viajes en curso (independiente del horario)
    const activeTrips = await Trip.find({ status: 'en_curso' })
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: 1 });

    // Viajes completados en el rango horario de hoy
    const completedTrips = await Trip.find({
      status: 'completado',
      departureDate: { $gte: start, $lte: end }
    })
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: -1 });

    res.json({ activeTrips, completedTrips });
  } catch (error) {
    console.error('Error obteniendo historial diario de viajes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
// @desc    Obtener viajes completados de la semana actual (lunes a viernes) para el chofer
// @route   GET /api/dashboard/weekly-trips
// @access  Private (chofer)
const getWeeklyTrips = async (req, res) => {
  try {
    if (req.user.role !== 'chofer') {
      return res.status(403).json({ message: 'Solo disponible para choferes' });
    }

    // Calcular inicio (lunes) y fin (viernes) de la semana actual
    const now = new Date();
    const day = now.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0,0,0,0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23,59,59,999);

    const filter = {
      driver: req.user._id,
      status: 'completado',
      departureDate: { $gte: monday, $lte: friday }
    };

    const trips = await Trip.find(filter)
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: -1 });

    res.json(trips);
  } catch (error) {
    console.error('Error obteniendo historial semanal de viajes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Obtener estadísticas del dashboard
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');
    
    // Obtener estadísticas básicas con manejo de errores individual
    const [
      totalTrips,
      activeTrips,
      totalVehicles,
      vehiclesInUse,
      totalDrivers,
      upcomingTrips
    ] = await Promise.allSettled([
      Trip.countDocuments().catch(err => {
        console.error('Error contando trips totales:', err);
        return 0;
      }),
      Trip.countDocuments({ status: 'en_curso' }).catch(err => {
        console.error('Error contando trips activos:', err);
        return 0;
      }),
      Vehicle.countDocuments({ status: { $ne: 'fuera_de_servicio' } }).catch(err => {
        console.error('Error contando vehículos totales:', err);
        return 0;
      }),
      Vehicle.countDocuments({ status: 'en_uso' }).catch(err => {
        console.error('Error contando vehículos en uso:', err);
        return 0;
      }),
      User.countDocuments({ role: 'chofer', isActive: true }).catch(err => {
        console.error('Error contando choferes:', err);
        return 0;
      }),
      Trip.countDocuments({
        status: 'programado',
        departureDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 días
        }
      }).catch(err => {
        console.error('Error contando trips próximos:', err);
        return 0;
      })
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : 0));

    // Estadísticas por mes (últimos 6 meses)
    let monthlyStats = [];
    let statusStats = [];
    let topDestinations = [];
    let vehiclesNeedingMaintenance = [];
    
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      monthlyStats = await Trip.aggregate([
        {
          $match: {
            departureDate: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$departureDate' },
              month: { $month: '$departureDate' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo estadísticas mensuales:', error);
    }

    // Estadísticas por estado
    try {
      statusStats = await Trip.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo estadísticas por estado:', error);
    }

    // Top destinos
    try {
      topDestinations = await Trip.aggregate([
        {
          $group: {
            _id: '$destination',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ]);
    } catch (error) {
      console.error('Error obteniendo top destinos:', error);
    }

    // Vehículos que necesitan mantenimiento pronto
    try {
      vehiclesNeedingMaintenance = await Vehicle.find({
        nextMaintenance: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próximos 30 días
        },
        status: { $ne: 'fuera_de_servicio' }
      })
      .select('licensePlate brand model nextMaintenance')
      .sort({ nextMaintenance: 1 });
    } catch (error) {
      console.error('Error obteniendo vehículos para mantenimiento:', error);
    }

    console.log('✅ Estadísticas obtenidas exitosamente');

    res.json({
      overview: {
        totalTrips,
        activeTrips,
        totalVehicles,
        vehiclesInUse,
        totalDrivers,
        upcomingTrips
      },
      monthlyStats,
      statusStats,
      topDestinations,
      vehiclesNeedingMaintenance
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener próximos viajes
// @route   GET /api/dashboard/upcoming-trips
// @access  Private
const getUpcomingTrips = async (req, res) => {
  try {
    const { limit = 10 } = req.query;


    let filter;
    if (req.user.role === 'chofer') {
      filter = {
        driver: req.user._id,
        departureDate: { $gte: new Date() },
        $or: [
          { status: 'programado' },
          { 'driverConfirmation.confirmed': true }
        ]
      };
      console.log('[UPCOMING-TRIPS][CHOFER] Filtro:', JSON.stringify(filter));
    } else {
      // Obtener la hora local de Uruguay (UTC-3)
      const now = new Date();
      const uruguayOffset = -3 * 60; // minutos
      const localNow = new Date(now.getTime() - (now.getTimezoneOffset() - uruguayOffset) * 60000);
      filter = {
        status: 'programado',
        departureDate: { $gte: localNow }
      };
      console.log('[UPCOMING-TRIPS][ADMIN] Filtro (hora local Uruguay):', JSON.stringify(filter));
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: 1 })
      .limit(parseInt(limit));

    console.log(`[UPCOMING-TRIPS][${req.user.role.toUpperCase()}] Resultados (${trips.length}):`, trips.map(t => ({id: t._id, destino: t.destination, fecha: t.departureDate, estado: t.status})));
    res.json(trips);
  } catch (error) {
    console.error('Error obteniendo próximos viajes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener viajes activos
// @route   GET /api/dashboard/active-trips
// @access  Private
const getActiveTrips = async (req, res) => {
  try {
    let filter = { status: 'en_curso' };

    // Si es chofer, solo sus viajes
    if (req.user.role === 'chofer') {
      filter.driver = req.user._id;
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'name employeeId phone')
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: -1 });

    res.json(trips);
  } catch (error) {
    console.error('Error obteniendo viajes activos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// @desc    Obtener resumen de vehículos
// @route   GET /api/dashboard/vehicles-summary
// @access  Private (solo admin)
const getVehiclesSummary = async (req, res) => {
  try {
    const summary = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const vehiclesWithActiveTrips = await Vehicle.aggregate([
      {
        $match: { status: 'en_uso' }
      },
      {
        $lookup: {
          from: 'trips',
          let: { vehicleId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vehicle', '$$vehicleId'] },
                    { $in: ['$status', ['programado', 'en_curso']] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'driver',
                foreignField: '_id',
                as: 'driver'
              }
            },
            {
              $unwind: '$driver'
            }
          ],
          as: 'activeTrip'
        }
      },
      {
        $unwind: '$activeTrip'
      },
      {
        $project: {
          licensePlate: 1,
          brand: 1,
          model: 1,
          'activeTrip.destination': 1,
          'activeTrip.departureDate': 1,
          'activeTrip.driver.name': 1,
          'activeTrip.status': 1
        }
      }
    ]);

    res.json({
      summary,
      vehiclesWithActiveTrips
    });
  } catch (error) {
    console.error('Error obteniendo resumen de vehículos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  getDashboardStats,
  getUpcomingTrips,
  getActiveTrips,
  getVehiclesSummary,
  getWeeklyTrips,
  getDailyTrips,
};