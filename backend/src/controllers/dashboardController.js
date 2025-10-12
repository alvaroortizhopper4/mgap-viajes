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

    let filter = {
      status: 'programado',
      departureDate: { $gte: new Date() }
    };

    // Si es chofer, solo sus viajes
    if (req.user.role === 'chofer') {
      filter.driver = req.user._id;
    }

    const trips = await Trip.find(filter)
      .populate('driver', 'name employeeId')
      .populate('vehicle', 'licensePlate brand model')
      .sort({ departureDate: 1 })
      .limit(parseInt(limit));

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
  getVehiclesSummary
};