import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import useAuthStore from '../store/authStore';
import useVehiclesStore from '../store/vehiclesStore';
import Table from '../components/Table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Vehicles = () => {
  const { isAdminPrincipal } = useAuthStore();
  const { vehicles, createVehicle, getVehicles, updateVehicle, deleteVehicle, isLoading } = useVehiclesStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm] = useState({
    licensePlate: '',
    brand: '',
    model: '',
    year: '',
    status: 'disponible'
  });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    getVehicles();
  }, [getVehicles]);
  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setForm({
      licensePlate: vehicle.licensePlate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateVehicle(selectedVehicle._id, form);
      await getVehicles();
      setIsEditModalOpen(false);
      setSelectedVehicle(null);
    } catch (err) {
      setError('Error al actualizar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este vehículo?')) {
      try {
        await deleteVehicle(id);
        await getVehicles();
      } catch (err) {
        alert('Error al eliminar el vehículo');
      }
    }
  };
	// ...existing code...

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpen = () => {
    setShowModal(true);
    setError('');
  };
  const handleClose = () => {
    setShowModal(false);
    setForm({ licensePlate: '', brand: '', model: '', year: '', status: 'disponible' });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createVehicle(form);
      await getVehicles();
      handleClose();
    } catch (err) {
      setError('Error al guardar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  // Definir columns fuera del return
  const columns = [
    { key: 'licensePlate', header: 'Matrícula', render: v => v.licensePlate },
    { key: 'brand', header: 'Marca', render: v => v.brand },
    { key: 'model', header: 'Modelo', render: v => v.model },
    { key: 'year', header: 'Año', render: v => v.year },
    { key: 'status', header: 'Estado', render: v => v.status },
    isAdminPrincipal && {
      key: 'actions',
      header: 'Acciones',
      render: v => (
        <div className="flex space-x-2">
          <button onClick={() => openEditModal(v)} className="p-1 text-blue-600 hover:text-blue-800"><PencilIcon className="h-4 w-4" /></button>
          <button onClick={() => handleDelete(v._id)} className="p-1 text-red-600 hover:text-red-800"><TrashIcon className="h-4 w-4" /></button>
        </div>
      )
    }
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Vehículos</h1>
        {isAdminPrincipal && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleOpen}
          >
            Agregar Vehículo
          </button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          data={vehicles}
          loading={isLoading}
          emptyMessage="No hay vehículos registrados"
        />
      </Card>

      {/* Modal editar vehículo */}
  <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedVehicle(null); }} title="Editar Vehículo">
        <form onSubmit={handleEditSubmit} className="space-y-4 p-2">
          <Input
            label="Matrícula"
            name="licensePlate"
            value={form.licensePlate}
            onChange={handleChange}
            required
          />
          <Input
            label="Marca"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            required
          />
          <Input
            label="Modelo"
            name="model"
            value={form.model}
            onChange={handleChange}
            required
          />
          <Input
            label="Año"
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
            required
          />
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="disponible">Disponible</option>
            <option value="en_mantenimiento">En mantenimiento</option>
            <option value="asignado">Asignado</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => { setIsEditModalOpen(false); setSelectedVehicle(null); }}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal agregar vehículo */}
  <Modal isOpen={showModal} onClose={handleClose} title="Agregar Vehículo">
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
          <Input
            label="Matrícula"
            name="licensePlate"
            value={form.licensePlate}
            onChange={handleChange}
            required
          />
          <Input
            label="Marca"
            name="brand"
            value={form.brand}
            onChange={handleChange}
            required
          />
          <Input
            label="Modelo"
            name="model"
            value={form.model}
            onChange={handleChange}
            required
          />
          <Input
            label="Año"
            name="year"
            type="number"
            value={form.year}
            onChange={handleChange}
            required
          />
          <label className="block text-sm font-medium text-gray-700">Estado</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="disponible">Disponible</option>
            <option value="en_mantenimiento">En mantenimiento</option>
            <option value="asignado">Asignado</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
          </select>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Vehicles;