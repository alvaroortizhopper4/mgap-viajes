import React, { useState, useEffect } from 'react';
import { PhoneIcon, MapPinIcon } from 'lucide-react';
import Card from '../components/Card';
import Table from '../components/Table';
import Badge from '../components/Badge';
import useUsersStore from '../store/usersStore';

const Drivers = () => {
  const { drivers, isLoading, getDrivers } = useUsersStore();

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
    </div>
  );
};

export default Drivers;