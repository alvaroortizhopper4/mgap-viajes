import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Badge from '../components/Badge';
import useUsersStore from '../store/usersStore';
import useAuthStore from '../store/authStore';

const Users = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  
  const { 
    users, 
    isLoading, 
    getUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    filters, 
    setFilters 
  } = useUsersStore();
  
  const { canManageUsers } = useAuthStore();
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  // Estado local para el submit del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, getUsers]);



  const handleCreateUser = async (data) => {
    setIsSubmitting(true);
    try {
      await createUser(data);
      setIsCreateModalOpen(false);
      reset();
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (data) => {
    setIsSubmitting(true);
    try {
      // Convertir isActive de string a boolean
      const userData = {
        name: data.name,
        email: data.email,
        role: data.role,
        employeeId: data.employeeId,
        phone: data.phone,
        department: data.department,
        isActive: data.isActive === 'true'
      };
      // Solo incluir la contraseña si se marcó la opción de cambiarla
      if (changePassword && data.password) {
        userData.password = data.password;
      }
      await updateUser(selectedUser._id, userData);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setChangePassword(false);
      reset();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    console.log('Attempting to delete user:', userId);
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const openEditModal = (user) => {
    console.log('Opening edit modal for user:', user);
    setSelectedUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('employeeId', user.employeeId);
    setValue('phone', user.phone || '');
    setValue('department', user.department);
    setValue('isActive', user.isActive ? 'true' : 'false');
    setChangePassword(false);
    setValue('password', '');
    setValue('confirmPassword', '');
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => user.email,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => {
        const getRoleInfo = (role) => {
          switch (role) {
            case 'admin_principal':
              return { variant: 'danger', label: 'Admin Principal' };
            case 'administrativo':
              return { variant: 'success', label: 'Administrativo' };
            case 'chofer':
              return { variant: 'info', label: 'Chofer' };
            default:
              return { variant: 'secondary', label: role };
          }
        };
        const roleInfo = getRoleInfo(user.role);
        return (
          <Badge variant={roleInfo.variant}>
            {roleInfo.label}
          </Badge>
        );
      },
    },
    {
      key: 'department',
      header: 'Departamento',
      render: (user) => user.department,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (user) => user.phone || '-',
    },
    {
      key: 'isActive',
      header: 'Estado',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'danger'}>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (user) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openEditModal(user)}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          {canManageUsers() && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDeleteUser(user._id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const UserForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre completo"
        {...register('name', { required: 'El nombre es requerido' })}
        error={errors.name?.message}
        placeholder="Juan Pérez"
      />
      
      <Input
        label="Email"
        type="email"
        {...register('email', {
          required: 'El email es requerido',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Email no válido',
          },
        })}
        error={errors.email?.message}
        placeholder="juan@mgap.gub.uy"
      />
      
      {!isEdit ? (
        <Input
          label="Contraseña"
          type="password"
          {...register('password', {
            required: 'La contraseña es requerida',
            minLength: {
              value: 6,
              message: 'La contraseña debe tener al menos 6 caracteres',
            },
          })}
          error={errors.password?.message}
          placeholder="••••••••"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="changePassword"
              checked={changePassword}
              onChange={(e) => {
                setChangePassword(e.target.checked);
                if (!e.target.checked) {
                  setValue('password', '');
                  setValue('confirmPassword', '');
                }
              }}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-900">
              Cambiar contraseña
            </label>
          </div>
          
          {changePassword && (
            <>
              <Input
                label="Nueva contraseña"
                type="password"
                {...register('password', {
                  required: changePassword ? 'La nueva contraseña es requerida' : false,
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                })}
                error={errors.password?.message}
                placeholder="••••••••"
              />
              
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                {...register('confirmPassword', {
                  required: changePassword ? 'Confirma la nueva contraseña' : false,
                  validate: changePassword ? (value) =>
                    value === watch('password') || 'Las contraseñas no coinciden'
                  : undefined,
                })}
                error={errors.confirmPassword?.message}
                placeholder="••••••••"
              />
            </>
          )}
        </div>
      )}
      
      <Select
        label="Rol"
        {...register('role', { required: 'El rol es requerido' })}
        error={errors.role?.message}
        options={[
          { value: '', label: 'Seleccionar rol' },
          { value: 'chofer', label: 'Chofer' },
          { value: 'administrativo', label: 'Administrativo' },
          { value: 'admin_principal', label: 'Administrador Principal' },
        ]}
      />
      
      <Input
        label="ID de Empleado"
        {...register('employeeId', { required: 'El ID de empleado es requerido' })}
        error={errors.employeeId?.message}
        placeholder="CHOF001"
      />
      
      <Input
        label="Teléfono"
        {...register('phone')}
        error={errors.phone?.message}
        placeholder="099123456"
      />
      
      <Input
        label="Departamento"
        {...register('department', { required: 'El departamento es requerido' })}
        error={errors.department?.message}
        placeholder="Montevideo"
      />
      
      {isEdit && (
        <Select
          label="Estado"
          {...register('isActive')}
          error={errors.isActive?.message}
          options={[
            { value: 'true', label: 'Activo' },
            { value: 'false', label: 'Inactivo' },
          ]}
        />
      )}
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isEdit) {
              setIsEditModalOpen(false);
              setSelectedUser(null);
              setChangePassword(false);
            } else {
              setIsCreateModalOpen(false);
            }
            reset();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Actualizar' : 'Crear'} Usuario
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => getUsers()}>
            Recargar
          </Button>
          {canManageUsers() && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Usuario
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nombre
            </label>
            <input
              type="text"
              className="input-field"
              value={filters.name}
              onChange={(e) => setFilters({ name: e.target.value })}
              placeholder="Buscar usuario..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por rol
            </label>
            <select
              className="input-field"
              value={filters.role}
              onChange={(e) => setFilters({ role: e.target.value })}
            >
              <option value="">Todos los roles</option>
              <option value="chofer">Choferes</option>
              <option value="administrativo">Administrativos</option>
              <option value="admin_principal">Admin Principal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por estado
            </label>
            <select
              className="input-field"
              value={filters.active}
              onChange={(e) => setFilters({ active: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          emptyMessage="No hay usuarios registrados"
        />
      </Card>

      {/* Modal crear usuario */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          reset();
        }}
        title="Crear Nuevo Usuario"
      >
        <UserForm onSubmit={handleCreateUser} />
      </Modal>

      {/* Modal editar usuario */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          setChangePassword(false);
          reset();
        }}
        title="Editar Usuario"
      >
        <UserForm onSubmit={handleEditUser} isEdit={true} />
      </Modal>
    </div>
  );
};

export default Users;