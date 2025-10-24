import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  CarIcon, 
  UsersIcon, 
  ClockIcon 
} from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCars from '../components/AnimatedCars';
import useDashboardStore from '../store/dashboardStore';
import useAuthStore from '../store/authStore';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { user, canManageUsers, canManageTripsAndVehicles, isAdmin } = useAuthStore();
  const { stats, upcomingTrips, activeTrips, isLoading, loadDashboard, getWeeklyTrips, weeklyTrips, getDailyTrips, dailyTrips } = useDashboardStore();
  const pollingRef = useRef();

  useEffect(() => {
    if (!user) return;
    // Si el usuario es chofer y está deshabilitado, forzar logout y mostrar mensaje
    if (user.role === 'chofer' && user.isActive === false) {
      import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Tu cuenta ha sido deshabilitada. Contacta al administrador.');
      });
      useAuthStore.getState().logout();
      return;
    }
    if (user.role === 'admin' || user.role === 'super_admin') {
      loadDashboard(user.role).catch(() => {});
      getDailyTrips().catch(() => {});
    } else if (user.role === 'chofer') {
      loadDashboard('chofer').catch(() => {});
      getWeeklyTrips().catch(() => {});
    } else {
      loadDashboard(user.role).catch(() => {});
    }
  }, [loadDashboard, getWeeklyTrips, getDailyTrips, user]);

  useEffect(() => {
    if (!user) return;
    // Polling para verificar estado del usuario cada 10 segundos
    if (user.role === 'chofer') {
      const checkUserStatus = async () => {
        try {
          const updatedUser = await useAuthStore.getState().getProfile();
          if (updatedUser.isActive === false) {
            import('react-hot-toast').then(({ default: toast }) => {
              toast.error('Tu cuenta ha sido deshabilitada. Contacta al administrador.');
            });
            useAuthStore.getState().logout();
          }
        } catch (e) {
          // Si hay error, forzar logout
          useAuthStore.getState().logout();
        }
      };
      pollingRef.current = setInterval(checkUserStatus, 10000);
      return () => clearInterval(pollingRef.current);
    }
  }, [user]);

  // Polling para refrescar dashboard admin cada 15 segundos
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      // Polling para refrescar dashboard cada 1 minuto
      const interval = setInterval(() => {
        // Refrescar datos críticos para el dashboard y viajes activos
        loadDashboard(user.role);
        getDailyTrips();
        // Forzar actualización de stats y viajes activos
        useDashboardStore.getState().getDashboardStats();
        useDashboardStore.getState().getActiveTrips();
      }, 60000); // 1 minuto
      return () => clearInterval(interval);
    }
  }, [user, loadDashboard, getDailyTrips]);

  // Utilidad para formato 24h
  function formatDate(date) {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
      return String(date);
    }
  }

  if (isLoading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user?.role === 'chofer' && user.isActive === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Usuario deshabilitado</h2>
          <p className="mb-6 text-gray-700">Tu cuenta ha sido deshabilitada por un administrador.<br />No puedes acceder al sistema hasta ser reactivado.</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            onClick={() => useAuthStore.getState().logout()}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (user?.role === 'chofer') {
    return (
      <>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">¡Bienvenido, {user?.name}!</h1>
            <p className="mt-1 text-sm text-gray-500">Aquí puedes ver tus viajes asignados y próximas tareas</p>
          </div>
        </div>
        <Card title="Mis Próximos Viajes">
          {isLoading ? <LoadingSpinner /> : Array.isArray(upcomingTrips) && upcomingTrips.length > 0 ? (
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div key={trip._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{trip.vehicle?.licensePlate}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-8">No hay viajes próximos programados</p>}
        </Card>
        <Card title="Viajes en Curso">
          <div className="relative">
            <AnimatedCars />
            {isLoading ? <LoadingSpinner /> : Array.isArray(activeTrips) && activeTrips.length > 0 ? (
              <div className="space-y-3">
                {activeTrips.map((trip) => (
                  <div key={trip._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{trip.destination}</p>
                      <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">En curso</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500 text-center py-8">No hay viajes en curso</p>}
          </div>
        </Card>
        <Card title="Historial Semanal de Viajes Completados">
          {isLoading ? <LoadingSpinner /> : Array.isArray(weeklyTrips) && weeklyTrips.length > 0 ? (
            <div className="space-y-3">
              {weeklyTrips.map((trip) => (
                <div key={trip._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Completado</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-8">No hay viajes completados esta semana</p>}
        </Card>
      </>
    );
  }

  // admin/super_admin
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Panel de control - Gestión de Viajes MGAP</p>
        </div>
      </div>
      {stats && user?.role !== 'chofer' && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Viajes" value={stats.overview?.totalTrips || 0} icon={MapPinIcon} color="blue" />
            <StatCard title="Viajes Activos" value={stats.overview?.activeTrips || 0} icon={ClockIcon} color="green" showAnimatedCars={true} />
            {user.role === 'super_admin' && (
              <StatCard title="Vehículos en Uso" value={stats.overview?.vehiclesInUse || 0} icon={CarIcon} color="yellow" />
            )}
            {user.role === 'super_admin' && (
              <StatCard title="Total Choferes" value={stats.overview?.totalDrivers || 0} icon={UsersIcon} color="purple" />
            )}
          </div>
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card title="Viajes en Curso (Hoy)">
                {isLoading ? <LoadingSpinner /> : Array.isArray(dailyTrips.activeTrips) && dailyTrips.activeTrips.length > 0 ? (
                  <div className="space-y-3">
                    {dailyTrips.activeTrips.map((trip) => (
                      <div key={trip._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{trip.destination}</p>
                          <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">En curso</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-8">No hay viajes en curso hoy</p>}
              </Card>
              <Card title="Viajes Completados (Hoy 07:00-22:00)">
                {isLoading ? <LoadingSpinner /> : Array.isArray(dailyTrips.completedTrips) && dailyTrips.completedTrips.length > 0 ? (
                  <div className="space-y-3">
                    {dailyTrips.completedTrips.map((trip) => (
                      <div key={trip._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{trip.destination}</p>
                          <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Completado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-center py-8">No hay viajes completados hoy</p>}
              </Card>
            </div>
          )}
        </>
      )}
      {user?.role !== 'chofer' && (
        <Card title="Próximos Viajes">
          {isLoading ? <LoadingSpinner /> : Array.isArray(upcomingTrips) && upcomingTrips.length > 0 ? (
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <div key={trip._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{trip.destination}</p>
                    <p className="text-sm text-gray-500">{trip.driver?.name} - {formatDate(trip.departureDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{trip.vehicle?.licensePlate}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 text-center py-8">No hay viajes próximos programados</p>}
        </Card>
      )}
      {/* Arreglo: envolver Link en un div para que el return tenga un solo elemento padre */}
      {!canManageUsers() && canManageTripsAndVehicles() && (
        <div>
          <Link to="/drivers" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <UsersIcon className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Choferes</h3>
            <p className="text-sm text-gray-500">Ver choferes disponibles</p>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;