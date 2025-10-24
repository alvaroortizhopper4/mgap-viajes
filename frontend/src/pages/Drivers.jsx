import React, { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { PhoneIcon, MapPinIcon } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import useUsersStore from '../store/usersStore';

const Drivers = () => {
  const { drivers, isLoading, getDrivers, updateUser } = useUsersStore();

  const [reactivationModal, setReactivationModal] = useState({ open: false, driver: null });
  const [reactivationDate, setReactivationDate] = useState('');
  // Handler para deshabilitar chofer y programar reactivación
  const handleDisableDriver = (driver) => {
    setReactivationModal({ open: true, driver });
    setReactivationDate('');
  };

  const handleConfirmReactivation = async () => {
    if (!reactivationModal.driver || !reactivationDate) return;
    const driver = reactivationModal.driver;
    try {
      // Obtener datos completos del usuario
      const fullDriver = await useUsersStore.getState().getUserById(driver._id);
      await updateUser(driver._id, {
        name: fullDriver.name,
        email: fullDriver.email,
        employeeId: fullDriver.employeeId,
        role: fullDriver.role,
        phone: fullDriver.phone,
        department: fullDriver.department,
        isActive: false,
        reactivationDate
      });
      setReactivationModal({ open: false, driver: null });
      setReactivationDate('');
      getDrivers();
    } catch (error) {
      setReactivationModal({ open: false, driver: null });
      setReactivationDate('');
    }
  };

  const handleEnableDriver = async (driver) => {
    try {
      // Obtener datos completos del usuario
      const fullDriver = await useUsersStore.getState().getUserById(driver._id);
      await updateUser(driver._id, {
        name: fullDriver.name,
        email: fullDriver.email,
        employeeId: fullDriver.employeeId,
        role: fullDriver.role,
        phone: fullDriver.phone,
        department: fullDriver.department,
        isActive: true,
        reactivationDate: null
      });
      getDrivers();
    } catch (error) {
      // El toast ya se muestra en usersStore
    }
  };

  useEffect(() => {
    getDrivers();
  }, [getDrivers]);

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (driver) => (
        <div>
          <div className="font-medium text-gray-900">{driver.name}</div>
          <div className="text-sm text-gray-500">{driver.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (driver) => (
        <div className="flex gap-2">
          {driver.isActive ? (
            <button
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
              onClick={() => handleDisableDriver(driver)}
            >
              Deshabilitar
            </button>
          ) : (
            <button
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
              onClick={() => handleEnableDriver(driver)}
            >
              Habilitar
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (driver) => (
        <div className="flex items-center">
          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span>{driver.phone || '-'}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Departamento',
      render: (driver) => (
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span>{driver.department}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (driver) => (
        <Badge variant={driver.isActive ? 'success' : 'danger'}>
          {driver.isActive ? 'Disponible' : 'No disponible'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lista de Choferes</h1>
      </div>

      <Card>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Lista de choferes disponibles para asignación de viajes
          </p>
        </div>
        
        <Table
          columns={columns}
          data={drivers}
          loading={isLoading}
          emptyMessage="No hay choferes registrados"
        />
      </Card>
      {/* Modal para seleccionar fecha de reactivación */}
      {reactivationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Seleccionar fecha de reactivación</h2>
            <p className="mb-4 text-sm text-gray-600">El chofer será habilitado automáticamente en la fecha seleccionada.</p>
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={reactivationDate}
                onChange={e => setReactivationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setReactivationModal({ open: false, driver: null })}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleConfirmReactivation}
                disabled={!reactivationDate}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;