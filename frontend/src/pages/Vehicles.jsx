import React from 'react';
import Card from '../components/Card';

const Vehicles = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
      </div>

      <Card>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Módulo de Vehículos
          </h3>
          <p className="text-gray-500">
            Esta sección permitirá gestionar la flota de vehículos del MGAP.
            Incluye funcionalidades para registrar vehículos, controlar su estado
            y asignarlos a viajes.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Vehicles;