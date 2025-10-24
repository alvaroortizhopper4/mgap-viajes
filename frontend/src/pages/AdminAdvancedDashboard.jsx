import React, { useEffect, useState } from 'react';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import useTripsStore from '../store/tripsStore';
import useUsersStore from '../store/usersStore';
import useAuthStore from '../store/authStore';

// Utilidad para filtrar viajes archivados
function isArchived(trip) {
  if (!trip.createdAt) return false;
  const created = new Date(trip.createdAt);
  const now = new Date();
  const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
  return diffMonths >= 3;
}

const AdminAdvancedDashboard = () => {
  const { trips, isLoading, getTrips, deleteTrip } = useTripsStore();
  const { user } = useAuthStore();
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getTrips();
  }, []);

  if (!user || !user.role?.includes('admin')) return <div className="p-8">Acceso restringido</div>;

  const archivedTrips = trips.filter(isArchived);
  const activeTrips = trips.filter(trip => !isArchived(trip));

  const handleSelect = (tripId) => {
    setSelected(prev => prev.includes(tripId) ? prev.filter(id => id !== tripId) : [...prev, tripId]);
  };

  const handleDeleteSelected = async () => {
    for (const id of selected) {
      await deleteTrip(id);
    }
    setSelected([]);
    setConfirmDelete(false);
    getTrips();
  };

  const columns = [
    { key: 'destination', header: 'Destino', render: t => t.destination },
    { key: 'driver', header: 'Chofer', render: t => t.driver?.name || '-' },
    { key: 'createdAt', header: 'Creado', render: t => t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-' },
    { key: 'status', header: 'Estado', render: t => t.status },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Panel Avanzado de Viajes</h1>
        <Button onClick={() => setShowArchived(a => !a)}>{showArchived ? 'Ver activos' : 'Ver archivados'}</Button>
      </div>
      {isLoading ? <LoadingSpinner /> : (
        <Table
          data={showArchived ? archivedTrips : activeTrips}
          columns={[
            {
              key: 'select',
              header: <input type="checkbox" checked={selected.length === (showArchived ? archivedTrips.length : activeTrips.length) && selected.length > 0} onChange={e => {
                if (e.target.checked) {
                  setSelected((showArchived ? archivedTrips : activeTrips).map(t => t._id));
                } else {
                  setSelected([]);
                }
              }} />,
              render: t => <input type="checkbox" checked={selected.includes(t._id)} onChange={() => handleSelect(t._id)} />
            },
            ...columns
          ]}
          rowClassName={t => selected.includes(t._id) ? 'bg-blue-50' : ''}
        />
      )}
      {showArchived && selected.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Borrar seleccionados</Button>
        </div>
      )}
      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="Confirmar borrado">
        <div>¿Seguro que deseas borrar los viajes seleccionados? Esta acción no se puede deshacer.</div>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" onClick={handleDeleteSelected}>Borrar</Button>
          <Button onClick={() => setConfirmDelete(false)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAdvancedDashboard;
