import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  CarIcon, 
  UsersIcon, 
  ClockIcon 
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import NotificationTester from '../components/NotificationTester';
// import AutoRefreshControl from '../components/AutoRefreshControl';
// import useAutoRefresh from '../hooks/useAutoRefresh';
import useDashboardStore from '../store/dashboardStore';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user, canManageUsers, canManageTripsAndVehicles, isAdmin } = useAuthStore();
  const { stats, upcomingTrips, activeTrips, isLoading, loadDashboard } = useDashboardStore();

  useEffect(() => {
    console.log('🔄 Dashboard useEffect - cargando datos...');
    console.log('👤 Usuario actual:', user);
    console.log('📊 Stats actuales:', stats);
    console.log('⏳ Is loading:', isLoading);
    
    if (user) {
      console.log('✅ Cargando dashboard para usuario:', user.email);
      console.log('👥 Rol del usuario:', user.role);
      console.log('🔒 Es admin?', isAdmin());
      
      // Solo cargar datos completos si no es chofer
      if (user.role !== 'chofer') {
        loadDashboard(user.role).catch(error => {
          console.error('❌ Error cargando dashboard:', error);
        });
      } else {
        console.log('👤 Usuario chofer - cargando solo viajes...');
        // Para choferes solo cargar viajes, no stats
        loadDashboard('chofer').catch(error => {
          console.error('❌ Error cargando viajes del chofer:', error);
          // Si falla, continuar sin datos
        });
      }
    } else {
      console.warn('⚠️ No hay usuario autenticado');
    }
  }, [loadDashboard, user]);

  // Comentado temporalmente para debug
  // const refreshDashboard = async () => {
  //   await loadDashboard();
  // };
  // const autoRefresh = useAutoRefresh(refreshDashboard, !!user);

  // Render simple para debug
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Test render básico
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-red-600">Error: No hay usuario autenticado</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
    <Card className="flex items-center p-6">
      <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );

  // Vista específica para choferes
  if (user?.role === 'chofer') {
    return (
      <div className="space-y-6">
        {/* Header para choferes */}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Bienvenido, {user?.name}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Aquí puedes ver tus viajes asignados y próximas tareas
              </p>
            </div>
          </div>
        </div>

        {/* Mis Viajes */}
        <Card title="Mis Próximos Viajes">
          {upcomingTrips && upcomingTrips.length > 0 ? (
            <div className="space-y-4">
              {upcomingTrips.slice(0, 5).map((trip) => (
                <div key={trip._id || trip.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {trip.origin} → {trip.destination}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(trip.departureDate)} - {trip.departureTime}
                    </p>
                    {trip.description && (
                      <p className="text-sm text-gray-600 mt-1">{trip.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      trip.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status === 'pending' ? 'Pendiente' :
                       trip.status === 'approved' ? 'Aprobado' :
                       trip.status || 'Sin estado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {isLoading ? 'Cargando tus viajes...' : 'No tienes viajes próximos asignados'}
              </p>
            </div>
          )}
        </Card>

        {/* Accesos rápidos para chofer */}
        <Card title="Acciones Disponibles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/trips"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPinIcon className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Ver Mis Viajes</h3>
              <p className="text-sm text-gray-500">Consultar todos mis viajes</p>
            </Link>
            
            <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50">
              <ClockIcon className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="font-medium text-gray-500">Historial</h3>
              <p className="text-sm text-gray-400">Próximamente</p>
            </div>
          </div>
        </Card>

        {/* Componente de prueba de notificaciones */}
        <NotificationTester />
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'chofer' 
                ? 'Aquí puedes ver tus viajes asignados'
                : 'Panel de control - Gestión de Viajes MGAP'
              }
            </p>
          </div>
          {/* Control de auto-refresh - Comentado temporalmente para debug */}
          {/* <AutoRefreshControl
            isActive={autoRefresh.isActive}
            countdown={autoRefresh.countdown}
            lastRefresh={autoRefresh.lastRefresh}
            onToggle={autoRefresh.toggle}
            onRefreshNow={autoRefresh.refreshNow}
            className="mt-1"
          /> */}
        </div>
      </div>

      {/* Stats Cards - Solo para administradores */}
      {stats && user?.role !== 'chofer' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Viajes"
            value={stats.overview?.totalTrips || 0}
            icon={MapPinIcon}
            color="blue"
          />
          <StatCard
            title="Viajes Activos"
            value={stats.overview?.activeTrips || 0}
            icon={ClockIcon}
            color="green"
          />
          <StatCard
            title="Vehículos en Uso"
            value={stats.overview?.vehiclesInUse || 0}
            icon={CarIcon}
            color="yellow"
          />
          {isAdmin() && (
            <StatCard
              title="Total Choferes"
              value={stats.overview?.totalDrivers || 0}
              icon={UsersIcon}
              color="purple"
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Viajes */}
        <Card title={user?.role === 'chofer' ? 'Mis Próximos Viajes' : 'Próximos Viajes'}>
          {isLoading ? (
            <LoadingSpinner />
          ) : Array.isArray(upcomingTrips) && upcomingTrips.length > 0 ? (
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-sm text-gray-500">
                      {trip.driver?.name} - {formatDate(trip.departureDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{trip.vehicle?.licensePlate}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay viajes próximos programados
            </p>
          )}
        </Card>

        {/* Viajes Activos */}
        <Card title="Viajes en Curso">
          {isLoading ? (
            <LoadingSpinner />
          ) : Array.isArray(activeTrips) && activeTrips.length > 0 ? (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-sm text-gray-500">
                      {trip.driver?.name} - {formatDate(trip.departureDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      En curso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay viajes en curso
            </p>
          )}
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card title="Accesos Rápidos">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/trips"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPinIcon className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Gestionar Viajes</h3>
            <p className="text-sm text-gray-500">Ver y crear nuevos viajes</p>
          </Link>

          {canManageTripsAndVehicles() && (
            <Link
              to="/vehicles"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CarIcon className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Vehículos</h3>
              <p className="text-sm text-gray-500">Administrar flota de vehículos</p>
            </Link>
          )}

          {/* Admin principal ve gestión completa de usuarios */}
          {canManageUsers() && (
            <Link
              to="/users"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Usuarios</h3>
              <p className="text-sm text-gray-500">Gestionar choferes y admins</p>
            </Link>
          )}
          
          {/* Administrativos pueden ver lista de choferes para asignaciones */}
          {!canManageUsers() && canManageTripsAndVehicles() && (
            <Link
              to="/drivers"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UsersIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Choferes</h3>
              <p className="text-sm text-gray-500">Ver choferes disponibles</p>
            </Link>
          )}
        </div>
      </Card>

      {/* Componente de prueba de notificaciones */}
      <NotificationTester />
    </div>
  );
};

export default Dashboard;