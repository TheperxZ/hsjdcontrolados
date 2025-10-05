import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Warehouse,
  X,
  MapPin
} from 'lucide-react';
import { Warehouse as WarehouseType } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

interface WarehouseManagementProps {
  warehouses: WarehouseType[];
  onAddWarehouse: (warehouse: Omit<WarehouseType, 'id'>) => void;
  onUpdateWarehouse: (id: string, warehouse: Partial<WarehouseType>) => void;
  onDeleteWarehouse: (id: string) => void;
}

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  warehouses,
  onAddWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'update' | 'delete' | 'toggle';
    warehouse?: WarehouseType;
    formData?: any;
  }>({
    isOpen: false,
    type: 'create'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (warehouse.description && warehouse.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
    setEditingWarehouse(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWarehouse) {
      setConfirmationModal({
        isOpen: true,
        type: 'update',
        warehouse: editingWarehouse,
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
      const newWarehouse: Omit<WarehouseType, 'id'> = {
        ...confirmationModal.formData,
        createdAt: new Date().toISOString()
      };
      onAddWarehouse(newWarehouse);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'update' && confirmationModal.warehouse) {
      onUpdateWarehouse(confirmationModal.warehouse.id, confirmationModal.formData);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'delete' && confirmationModal.warehouse) {
      onDeleteWarehouse(confirmationModal.warehouse.id);
    } else if (confirmationModal.type === 'toggle' && confirmationModal.warehouse) {
      onUpdateWarehouse(confirmationModal.warehouse.id, { isActive: !confirmationModal.warehouse.isActive });
    }
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      description: warehouse.description || '',
      isActive: warehouse.isActive
    });
    setShowModal(true);
  };

  const handleToggleStatus = (warehouse: WarehouseType) => {
    setConfirmationModal({
      isOpen: true,
      type: 'toggle',
      warehouse: warehouse
    });
  };

  const handleDelete = (warehouse: WarehouseType) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      warehouse: warehouse
    });
  };

  const getConfirmationContent = () => {
    switch (confirmationModal.type) {
      case 'create':
        return {
          title: 'Confirmar Creación de Bodega',
          message: `¿Estás seguro de que deseas crear la bodega "${confirmationModal.formData?.name}"?`,
          confirmText: 'Crear Bodega',
          type: 'info' as const
        };
      case 'update':
        return {
          title: 'Confirmar Actualización',
          message: `¿Estás seguro de que deseas actualizar la bodega "${confirmationModal.warehouse?.name}"?`,
          confirmText: 'Actualizar',
          type: 'info' as const
        };
      case 'delete':
        return {
          title: 'Confirmar Eliminación',
          message: `¿Estás seguro de que deseas eliminar la bodega "${confirmationModal.warehouse?.name}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger' as const
        };
      case 'toggle':
        return {
          title: 'Confirmar Cambio de Estado',
          message: `¿Estás seguro de que deseas ${confirmationModal.warehouse?.isActive ? 'desactivar' : 'activar'} la bodega "${confirmationModal.warehouse?.name}"?`,
          confirmText: confirmationModal.warehouse?.isActive ? 'Desactivar' : 'Activar',
          type: 'warning' as const
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

  // Only administrators can access warehouse management
  if (user?.role !== 'administrador') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los administradores pueden gestionar bodegas.</p>
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
            placeholder="Buscar bodegas..."
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
          <span>Agregar Bodega</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map(warehouse => (
          <div key={warehouse.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Warehouse className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    {warehouse.description && (
                      <p className="text-sm text-gray-600">{warehouse.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estado:</span>
                  <button
                    onClick={() => handleToggleStatus(warehouse)}
                    className={`font-medium px-2 py-1 rounded-full text-xs transition-colors ${
                      warehouse.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {warehouse.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Creada:</span>
                  <span className="font-medium">
                    {new Date(warehouse.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(warehouse)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(warehouse)}
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
                {editingWarehouse ? 'Editar Bodega' : 'Agregar Bodega'}
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
                  Nombre de la bodega *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción opcional de la bodega"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Bodega activa
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
                  {editingWarehouse ? 'Actualizar' : 'Crear'}
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