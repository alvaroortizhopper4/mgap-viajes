import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, MapPinIcon, CalendarIcon } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
// import AutoRefreshControl from '../components/AutoRefreshControl';
// import useAutoRefresh from '../hooks/useAutoRefresh';
import useTripsStore from '../store/tripsStore';
import useUsersStore from '../store/usersStore';
import useVehiclesStore from '../store/vehiclesStore';
import useAuthStore from '../store/authStore';

const Trips = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOneDayTrip, setIsOneDayTrip] = useState(false);
  
  const { 
    trips, 
    isLoading, 
    getTrips, 
    createTrip, 
    updateTrip, 
    deleteTrip,
    confirmTrip,
    finishTrip
  } = useTripsStore();
  
  // Estados locales para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    driver: ''
  });
  
  const { drivers, getDrivers } = useUsersStore();
  const { availableVehicles, getAvailableVehicles } = useVehiclesStore();
  const { canManageTripsAndVehicles, isDriver, user, isAuthenticated } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      status: 'programado',
      departureTime: '08:00' // Valor por defecto para la hora de salida
    }
  });

  // Auto-refresh cada 30 segundos para mantener datos actualizados
  const refreshData = async () => {
    if (isAuthenticated() && user) {
      await getTrips();
      // Refrescar también datos relacionados si es necesario
      if (canManageTripsAndVehicles()) {
        await getAvailableVehicles();
      }
    }
  };

  // const autoRefresh = useAutoRefresh(refreshData, isAuthenticated() && !!user);

  useEffect(() => {
    // Solo cargar datos si el usuario está autenticado
    if (isAuthenticated() && user) {
      getTrips();
      // Cargar choferes y vehículos para todos los roles (necesarios para asignación)
      getDrivers();
      if (canManageTripsAndVehicles()) {
        getAvailableVehicles();
      }
    }
  }, [user]); // Depender del usuario para recargar cuando se inicialice

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getTrips();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters]); // Solo depender de filters

  // Efecto para sincronizar fechas en modo "viaje por el día" (ya no necesario - se establece automáticamente)
  // useEffect removido - las fechas se establecen automáticamente al activar el modo

  const handleCreateTrip = async (data) => {
    console.log('🚀 handleCreateTrip llamado con data:', data);
    setSubmitting(true);
    try {
      const tripData = {
        ...data,
        departureDate: new Date(data.departureDate).toISOString(),
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null,
        departureTime: data.departureTime, // Hora de salida obligatoria
        // returnTime se establece automáticamente al finalizar
        passengers: [], // Por ahora enviar array vacío, el campo del formulario es solo informativo
      };
      console.log('📝 Datos a enviar:', tripData);
      
      await createTrip(tripData);
      console.log('✅ Viaje creado exitosamente');
      setIsCreateModalOpen(false);
      reset();
    } catch (error) {
      console.error('❌ Error creating trip:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTrip = async (data) => {
    setSubmitting(true);
    try {
      await updateTrip(selectedTrip._id, {
        ...data,
        departureDate: new Date(data.departureDate).toISOString(),
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null,
        departureTime: data.departureTime, // Hora de salida
        passengers: [], // Por ahora enviar array vacío, el campo del formulario es solo informativo
      });
      setIsEditModalOpen(false);
      setSelectedTrip(null);
      reset();
    } catch (error) {
      console.error('Error updating trip:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este viaje?')) {
      try {
        await deleteTrip(tripId);
      } catch (error) {
        console.error('Error deleting trip:', error);
      }
    }
  };

  const openEditModal = (trip) => {
    setSelectedTrip(trip);
    setValue('destination', trip.destination);
    setValue('purpose', trip.purpose);
    setValue('departureDate', trip.departureDate?.split('T')[0]);
    setValue('returnDate', trip.returnDate?.split('T')[0] || '');
    setValue('departureTime', trip.departureTime || '');
    // returnTime se establece automáticamente al finalizar, no editable
    setValue('driver', trip.driver?._id || '');
    setValue('vehicle', trip.vehicle?._id || '');
    setValue('passengers', trip.passengers?.length || 0);
    setValue('notes', trip.notes || '');
    setValue('status', trip.status);
    setIsEditModalOpen(true);
  };

  const handleConfirmTrip = async (trip) => {
    if (window.confirm(`¿Estás seguro de que quieres confirmar el viaje a ${trip.destination}?`)) {
      try {
        await confirmTrip(trip._id);
      } catch (error) {
        console.error('Error confirmando viaje:', error);
      }
    }
  };

  const handleFinishTrip = async (trip) => {
    if (window.confirm(`¿Estás seguro de que quieres finalizar el viaje a ${trip.destination}?`)) {
      try {
        await finishTrip(trip._id);
      } catch (error) {
        console.error('Error finalizando viaje:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'programado':
        return { variant: 'info', label: 'Programado' };
      case 'en_curso':
        return { variant: 'warning', label: 'En Curso' };
      case 'completado':
        return { variant: 'success', label: 'Completado' };
      case 'cancelado':
        return { variant: 'danger', label: 'Cancelado' };
      default:
        return { variant: 'secondary', label: status };
    }
  };

  const columns = [
    {
      key: 'destination',
      header: 'Destino',
      render: (trip) => (
        <div>
          <div className="font-medium text-gray-900">{trip.destination}</div>
          <div className="text-sm text-gray-500">{trip.purpose}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Fechas y Horarios',
      render: (trip) => (
        <div className="text-sm">
          <div className="flex items-center text-gray-900">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Salida: {formatDate(trip.departureDate)}
            {trip.departureTime && (
              <span className="ml-2 text-blue-600 font-medium">{trip.departureTime}</span>
            )}
          </div>
          {trip.returnDate && (
            <div className="flex items-center text-gray-500 mt-1">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Regreso: {formatDate(trip.returnDate)}
              {trip.returnTime && (
                <span className="ml-2 text-green-600 font-medium">
                  {trip.returnTime}
                  {trip.status === 'completado' && ' ✓'}
                </span>
              )}
            </div>
          )}
          {trip.status === 'completado' && !trip.returnDate && trip.returnTime && (
            <div className="flex items-center text-green-600 mt-1">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Finalizado: {trip.returnTime}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'driver',
      header: 'Chofer',
      render: (trip) => (
        <div>
          <div className="font-medium text-gray-900">
            {trip.driver?.name || 'Sin asignar'}
          </div>
          <div className="text-sm text-gray-500">
            {trip.driver?.employeeId || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehículo',
      render: (trip) => (
        <div>
          <div className="font-medium text-gray-900">
            {trip.vehicle?.licensePlate || 'Sin asignar'}
          </div>
          <div className="text-sm text-gray-500">
            {trip.vehicle?.brand} {trip.vehicle?.model}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (trip) => {
        const statusInfo = getStatusInfo(trip.status);
        return (
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'confirmation',
      header: 'Estado del Viaje',
      render: (trip) => (
        <div className="space-y-1">
          {/* Estado de confirmación */}
          {trip.status === 'programado' && (
            <>
              {trip.driverConfirmation?.confirmed ? (
                <div>
                  <Badge variant="success">✓ Confirmado</Badge>
                  <div className="text-xs text-gray-500">
                    {new Date(trip.driverConfirmation.confirmedAt).toLocaleDateString('es-UY')}
                  </div>
                </div>
              ) : (
                <div>
                  <Badge variant="warning">Pendiente</Badge>
                  {isDriver() && trip.driver?._id === user?._id && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-1 w-full"
                      onClick={() => handleConfirmTrip(trip)}
                    >
                      Confirmar
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Viaje en curso - botón finalizar */}
          {trip.status === 'en_curso' && (
            <div>
              <Badge variant="warning">🚗 En Curso</Badge>
              {isDriver() && trip.driver?._id === user?._id && (
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-1 w-full"
                  onClick={() => handleFinishTrip(trip)}
                >
                  Finalizar Viaje
                </Button>
              )}
            </div>
          )}
          
          {/* Viaje completado */}
          {trip.status === 'completado' && (
            <div>
              <Badge variant="success">🏁 Completado</Badge>
              {trip.finishedAt && (
                <div className="text-xs text-gray-500">
                  {new Date(trip.finishedAt).toLocaleDateString('es-UY')} {new Date(trip.finishedAt).toLocaleTimeString('es-UY', {hour: '2-digit', minute: '2-digit'})}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (trip) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEditModal(trip)}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          {canManageTripsAndVehicles() && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteTrip(trip._id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Filtrar viajes
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = !filters.search || 
      trip.destination.toLowerCase().includes(filters.search.toLowerCase()) ||
      trip.purpose.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || trip.status === filters.status;
    
    const matchesDriver = !filters.driver || trip.driver?._id === filters.driver;
    
    return matchesSearch && matchesStatus && matchesDriver;
  });

  // Verificar si el usuario está cargado
  if (!user) {
    return <LoadingSpinner message="Cargando datos del usuario..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Viajes</h1>
            <p className="text-gray-600">
              Administra todos los viajes del MGAP
            </p>
          </div>
          {/* Control de auto-refresh */}
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

      {/* Filtros y botón de crear */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Input
              placeholder="Buscar por destino o propósito..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="">Todos los estados</option>
              <option value="programado">Programado</option>
              <option value="en_curso">En Curso</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
              value={filters.driver}
              onChange={(e) => setFilters(prev => ({ ...prev, driver: e.target.value }))}
              className="input-field"
            >
              <option value="">Todos los choferes</option>
              {drivers && drivers.map((driver) => (
                <option key={driver._id} value={driver._id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
          
          {canManageTripsAndVehicles() && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          )}
        </div>

        {/* Tabla de viajes */}
        <Table
          data={filteredTrips}
          columns={columns}
          loading={isLoading}
          emptyMessage="No hay viajes registrados"
        />
      </div>

      {/* Modal de crear/editar viaje */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedTrip(null);
          reset();
        }}
        title={selectedTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
      >
        <form onSubmit={handleSubmit((data) => {
          console.log('📋 Formulario enviado, datos:', data);
          console.log('🔄 Errores:', errors);
          if (selectedTrip) {
            handleEditTrip(data);
          } else {
            handleCreateTrip(data);
          }
        })} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destino *
              </label>
              <Input
                {...register('destination', { 
                  required: 'El destino es requerido',
                  minLength: { value: 2, message: 'El destino debe tener al menos 2 caracteres' }
                })}
                placeholder="Ingrese el destino del viaje"
                error={errors.destination?.message}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Propósito *
              </label>
              <Input
                {...register('purpose', { 
                  required: 'El propósito es requerido',
                  minLength: { value: 5, message: 'El propósito debe tener al menos 5 caracteres' }
                })}
                placeholder="Ingrese el propósito del viaje"
                error={errors.purpose?.message}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha de Salida *
                </label>
                <Button
                  type="button"
                  variant={isOneDayTrip ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => {
                    const newOneDayState = !isOneDayTrip;
                    setIsOneDayTrip(newOneDayState);
                    
                    if (newOneDayState) {
                      // Activar modo "viaje de un día" - establecer fecha de hoy en ambos campos
                      const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
                      setValue('departureDate', today);
                      setValue('returnDate', today);
                    } else {
                      // Desactivar modo "viaje de un día" - limpiar ambos campos
                      setValue('departureDate', '');
                      setValue('returnDate', '');
                    }
                  }}
                  className="whitespace-nowrap min-w-fit px-3 py-1.5"
                >
                  {isOneDayTrip ? "✓ Viaje por el día" : "Viaje por el día"}
                </Button>
              </div>
              <Input
                type="date"
                {...register('departureDate', { 
                  required: 'La fecha de salida es requerida' 
                })}
                error={errors.departureDate?.message}
                disabled={isOneDayTrip}
                className={`w-full ${isOneDayTrip ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Regreso
              </label>
              <Input
                type="date"
                {...register('returnDate')}
                error={errors.returnDate?.message}
                disabled={isOneDayTrip}
                className={isOneDayTrip ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Salida *
              </label>
              <Input
                type="time"
                {...register('departureTime', { 
                  required: 'La hora de salida es requerida' 
                })}
                error={errors.departureTime?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Regreso
              </label>
              <Input
                type="time"
                {...register('returnTime')}
                error={errors.returnTime?.message}
                disabled={true}
                className="bg-gray-100 cursor-not-allowed"
                placeholder="Se determina al finalizar el viaje"
              />
              <p className="text-xs text-gray-500 mt-1">
                La hora de regreso se establecerá automáticamente cuando el chofer finalice el viaje
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chofer
              </label>
              <select
                {...register('driver')}
                className={`input-field ${errors.driver?.message ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Seleccionar chofer</option>
                {drivers && drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} - {driver.employeeId}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando choferes...</option>
                )}
              </select>
              {errors.driver?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.driver.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehículo
              </label>
              <select
                {...register('vehicle')}
                className={`input-field ${errors.vehicle?.message ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="">Seleccionar vehículo</option>
                {availableVehicles && availableVehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
              {errors.vehicle?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.vehicle.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Pasajeros
              </label>
              <Input
                type="number"
                min="1"
                {...register('passengers')}
                placeholder="Número de pasajeros"
                error={errors.passengers?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                {...register('status')}
                className={`input-field ${errors.status?.message ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              >
                <option value="programado">Programado</option>
                <option value="en_curso">En Curso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              {errors.status?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas Adicionales
              </label>
              <Textarea
                {...register('notes')}
                placeholder="Notas adicionales sobre el viaje"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setSelectedTrip(null);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              loading={submitting}
              onClick={() => console.log('🔘 Botón Crear Viaje clickeado')}
            >
              {selectedTrip ? 'Actualizar' : 'Crear'} Viaje
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Trips;