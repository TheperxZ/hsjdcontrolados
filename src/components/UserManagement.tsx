import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  User,
  Shield,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

interface UserManagementProps {
  users: UserType[];
  onAddUser: (user: Omit<UserType, 'id'>) => void;
  onUpdateUser: (id: string, user: Partial<UserType>) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'update' | 'delete';
    user?: UserType;
    formData?: any;
  }>({
    isOpen: false,
    type: 'create'
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'auxiliar' as 'auxiliar' | 'regente' | 'administrador',
    password: '',
    isActive: true
  });

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      role: 'auxiliar',
      password: '',
      isActive: true
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      setConfirmationModal({
        isOpen: true,
        type: 'update',
        user: editingUser,
        formData: formData
      });
    } else {
      setConfirmationModal({
        isOpen: true,
        type: 'create',
        formData: formData
      });
    }
  };

  const handleConfirmAction = () => {
    if (confirmationModal.type === 'create') {
      const newUser: Omit<UserType, 'id'> = {
        username: confirmationModal.formData.username,
        email: confirmationModal.formData.email,
        role: confirmationModal.formData.role,
        password: confirmationModal.formData.password,
        isActive: confirmationModal.formData.isActive,
        createdAt: new Date().toISOString()
      };
      onAddUser(newUser);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'update' && confirmationModal.user) {
      const updateData: Partial<UserType> = {
        username: confirmationModal.formData.username,
        email: confirmationModal.formData.email,
        role: confirmationModal.formData.role,
        isActive: confirmationModal.formData.isActive
      };
      onUpdateUser(confirmationModal.user.id, updateData);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'delete' && confirmationModal.user) {
      onDeleteUser(confirmationModal.user.id);
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      password: '',
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (user: UserType) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      user: user
    });
  };

  const getConfirmationContent = () => {
    switch (confirmationModal.type) {
      case 'create':
        return {
          title: 'Confirmar Creación de Usuario',
          message: `¿Estás seguro de que deseas crear el usuario "${confirmationModal.formData?.username}" con rol de ${getRoleDisplayName(confirmationModal.formData?.role)}?`,
          confirmText: 'Crear Usuario',
          type: 'info' as const
        };
      case 'update':
        return {
          title: 'Confirmar Actualización',
          message: `¿Estás seguro de que deseas actualizar el usuario "${confirmationModal.user?.username}"?`,
          confirmText: 'Actualizar',
          type: 'info' as const
        };
      case 'delete':
        return {
          title: 'Confirmar Eliminación',
          message: `¿Estás seguro de que deseas eliminar el usuario "${confirmationModal.user?.username}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger' as const
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: '',
          type: 'warning' as const
        };
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'auxiliar': return 'Auxiliar de Farmacia';
      case 'regente': return 'Regente de Farmacia';
      case 'administrador': return 'Administrador';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrador': return <ShieldCheck className="h-5 w-5 text-red-500" />;
      case 'regente': return <UserCheck className="h-5 w-5 text-blue-500" />;
      case 'auxiliar': return <User className="h-5 w-5 text-green-500" />;
      default: return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrador': return 'bg-red-100 text-red-700';
      case 'regente': return 'bg-blue-100 text-blue-700';
      case 'auxiliar': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Only administrators can access user management
  if (user?.role !== 'administrador') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.username}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getRoleIcon(user.role)}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rol:</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    user.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Creado:</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'auxiliar' | 'regente' | 'administrador'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="auxiliar">Auxiliar de Farmacia</option>
                  <option value="regente">Regente de Farmacia</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Usuario activo
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        {...getConfirmationContent()}
      />
    </div>
  );
};