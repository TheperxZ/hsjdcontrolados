import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package,
  X,
  Settings
} from 'lucide-react';
import { Medicine } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

interface MedicineManagementProps {
  medicines: Medicine[];
  onAddMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  onUpdateMedicine: (id: string, medicine: Partial<Medicine>) => void;
  onDeleteMedicine: (id: string) => void;
}

export const MedicineManagement: React.FC<MedicineManagementProps> = ({
  medicines,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'create' | 'update' | 'delete' | 'toggle';
    medicine?: Medicine;
    formData?: any;
  }>({
    isOpen: false,
    type: 'create'
  });
  const [formData, setFormData] = useState({
    name: '',
    lowStockThreshold: 20,
    isActive: true
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      lowStockThreshold: 20,
      isActive: true
    });
    setEditingMedicine(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMedicine) {
      setConfirmationModal({
        isOpen: true,
        type: 'update',
        medicine: editingMedicine,
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
      const newMedicine: Omit<Medicine, 'id'> = {
        ...confirmationModal.formData,
        currentStock: 0,
        warehouseStock: {}
      };
      onAddMedicine(newMedicine);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'update' && confirmationModal.medicine) {
      onUpdateMedicine(confirmationModal.medicine.id, confirmationModal.formData);
      setShowModal(false);
      resetForm();
    } else if (confirmationModal.type === 'delete' && confirmationModal.medicine) {
      onDeleteMedicine(confirmationModal.medicine.id);
    } else if (confirmationModal.type === 'toggle' && confirmationModal.medicine) {
      onUpdateMedicine(confirmationModal.medicine.id, { isActive: !confirmationModal.medicine.isActive });
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      lowStockThreshold: medicine.lowStockThreshold,
      isActive: medicine.isActive
    });
    setShowModal(true);
  };

  const handleToggleStatus = (medicine: Medicine) => {
    setConfirmationModal({
      isOpen: true,
      type: 'toggle',
      medicine: medicine
    });
  };

  const handleDelete = (medicine: Medicine) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      medicine: medicine
    });
  };

  const getConfirmationContent = () => {
    switch (confirmationModal.type) {
      case 'create':
        return {
          title: 'Confirmar Creación',
          message: `¿Estás seguro de que deseas crear el medicamento "${confirmationModal.formData?.name}"?`,
          confirmText: 'Crear Medicamento',
          type: 'info' as const
        };
      case 'update':
        return {
          title: 'Confirmar Actualización',
          message: `¿Estás seguro de que deseas actualizar el medicamento "${confirmationModal.medicine?.name}"?`,
          confirmText: 'Actualizar',
          type: 'info' as const
        };
      case 'delete':
        return {
          title: 'Confirmar Eliminación',
          message: `¿Estás seguro de que deseas eliminar el medicamento "${confirmationModal.medicine?.name}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger' as const
        };
      case 'toggle':
        return {
          title: 'Confirmar Cambio de Estado',
          message: `¿Estás seguro de que deseas ${confirmationModal.medicine?.isActive ? 'desactivar' : 'activar'} el medicamento "${confirmationModal.medicine?.name}"?`,
          confirmText: confirmationModal.medicine?.isActive ? 'Desactivar' : 'Activar',
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

  // Permission checks
  const canCreateMedicines = user?.role === 'administrador' || user?.role === 'regente';
  const canEditMedicines = user?.role === 'administrador' || user?.role === 'regente';
  const canDeleteMedicines = user?.role === 'administrador';
  const canViewActions = user?.role !== 'auxiliar';

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar medicamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {canCreateMedicines && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Medicamento</span>
          </button>
        )}
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre del Medicamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Bajo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                {canViewActions && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicines.map(medicine => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${medicine.currentStock < medicine.lowStockThreshold ? 'text-red-700' : 'text-gray-900'}`}>
                      {medicine.currentStock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {medicine.lowStockThreshold} unidades
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canEditMedicines ? (
                      <button
                        onClick={() => handleToggleStatus(medicine)}
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                          medicine.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {medicine.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    ) : (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        medicine.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {medicine.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  {canViewActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {canEditMedicines && (
                          <button
                            onClick={() => handleEdit(medicine)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteMedicines && (
                          <button
                            onClick={() => handleDelete(medicine)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingMedicine ? 'Configurar Medicamento' : 'Agregar Medicamento'}
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
                  Nombre del Medicamento *
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
                  Nivel de Stock Bajo *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se alertará cuando el stock esté por debajo de este número
                </p>
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
                  Medicamento activo
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
                  {editingMedicine ? 'Actualizar' : 'Agregar'}
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