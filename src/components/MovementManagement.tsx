import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  X,
  Warehouse
} from 'lucide-react';
import { Medicine, Movement, Warehouse as WarehouseType } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmationModal } from './ConfirmationModal';

interface MovementManagementProps {
  medicines: Medicine[];
  movements: Movement[];
  warehouses: WarehouseType[];
  onAddMovement: (movement: Omit<Movement, 'id'>) => void;
  onUpdateMedicineStock: (medicineId: string, warehouseId: string, newStock: number) => void;
}

export const MovementManagement: React.FC<MovementManagementProps> = ({
  medicines,
  movements,
  warehouses,
  onAddMovement,
  onUpdateMedicineStock
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'entry' | 'exit'>('all');
  const [filterJustification, setFilterJustification] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    formData?: any;
  }>({
    isOpen: false
  });
  const [formData, setFormData] = useState({
    medicineId: '',
    warehouseId: '',
    type: 'entry' as 'entry' | 'exit',
    quantity: 0,
    date: new Date().toISOString().split('T')[0],
    // Entry fields
    justification: '',
    invoiceNumber: '',
    // Exit fields
    patientName: '',
    patientDocument: '',
    prescriptionNumber: ''
  });

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (movement.justification && movement.justification.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (movement.patientName && movement.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || movement.type === filterType;
    const matchesJustification = !filterJustification || 
                                (movement.justification && movement.justification.toLowerCase().includes(filterJustification.toLowerCase()));
    const matchesDate = !filterDate || movement.date === filterDate;
    
    return matchesSearch && matchesType && matchesJustification && matchesDate;
  });

  const sortedMovements = filteredMovements.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const resetForm = () => {
    setFormData({
      medicineId: '',
      warehouseId: '',
      type: 'entry',
      quantity: 0,
      date: new Date().toISOString().split('T')[0],
      justification: '',
      invoiceNumber: '',
      patientName: '',
      patientDocument: '',
      prescriptionNumber: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedMedicine = medicines.find(m => m.id === formData.medicineId);
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
    
    if (!selectedMedicine || !selectedWarehouse || !user) return;

    setConfirmationModal({
      isOpen: true,
      formData: {
        ...formData,
        medicineName: selectedMedicine.name,
        warehouseName: selectedWarehouse.name
      }
    });
  };

  const handleConfirmMovement = () => {
    const selectedMedicine = medicines.find(m => m.id === formData.medicineId);
    const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
    if (!selectedMedicine || !selectedWarehouse || !user) return;

    const movement: Omit<Movement, 'id'> = {
      medicineId: formData.medicineId,
      medicineName: selectedMedicine.name,
      warehouseId: formData.warehouseId,
      warehouseName: selectedWarehouse.name,
      type: formData.type,
      quantity: formData.quantity,
      date: formData.date,
      userId: user.id,
      userName: user.username,
      ...(formData.type === 'entry' ? {
        justification: formData.justification,
        ...(formData.justification === 'Compra' && formData.invoiceNumber ? { invoiceNumber: formData.invoiceNumber } : {})
      } : {
        patientName: formData.patientName,
        patientDocument: formData.patientDocument,
        prescriptionNumber: formData.prescriptionNumber
      })
    };

    onAddMovement(movement);

    // Update medicine stock in specific warehouse
    const currentWarehouseStock = selectedMedicine.warehouseStock[formData.warehouseId] || 0;
    const newStock = formData.type === 'entry' 
      ? currentWarehouseStock + formData.quantity
      : currentWarehouseStock - formData.quantity;
    
    onUpdateMedicineStock(formData.medicineId, formData.warehouseId, Math.max(0, newStock));

    setShowModal(false);
    resetForm();
  };

  const justificationOptions = [
    'Compra',
    'Devolución',
    'Aprovechamiento',
    'Transferencia',
    'Ajuste de inventario',
    'Saldos iniciales'
  ];

  const clearFilters = () => {
    setFilterType('all');
    setFilterJustification('');
    setFilterDate('');
    setSearchTerm('');
  };

  // Get current month date range for validation
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const minDate = firstDayOfMonth.toISOString().split('T')[0];
  const maxDate = lastDayOfMonth.toISOString().split('T')[0];

  const getConfirmationMessage = () => {
    const typeText = formData.type === 'entry' ? 'ingreso' : 'salida';
    const details = formData.type === 'entry' 
      ? `Justificación: ${formData.justification}${formData.invoiceNumber ? `, Factura: ${formData.invoiceNumber}` : ''}`
      : `Paciente: ${formData.patientName}, Documento: ${formData.patientDocument}${formData.prescriptionNumber ? `, Recetario: ${formData.prescriptionNumber}` : ''}`;
    
    return `¿Estás seguro de que deseas registrar el siguiente movimiento de ${typeText}?

Medicamento: ${confirmationModal.formData?.medicineName}
Bodega: ${confirmationModal.formData?.warehouseName}
Cantidad: ${formData.quantity}
Fecha: ${new Date(formData.date).toLocaleDateString('es-ES')}
${details}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'entry' | 'exit')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="entry">Ingresos</option>
              <option value="exit">Salidas</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <select
            value={filterJustification}
            onChange={(e) => setFilterJustification(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las justificaciones</option>
            {justificationOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {(filterType !== 'all' || filterJustification || filterDate || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      {/* Movements List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bodega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMovements.map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${movement.type === 'entry' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {movement.type === 'entry' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${movement.type === 'entry' ? 'text-green-700' : 'text-red-700'}`}>
                        {movement.type === 'entry' ? 'Ingreso' : 'Salida'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{movement.medicineName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{movement.warehouseName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${movement.type === 'entry' ? 'text-green-700' : 'text-red-700'}`}>
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {movement.type === 'entry' ? (
                        <div>
                          <span><strong>Justificación:</strong> {movement.justification}</span>
                          {movement.invoiceNumber && (
                            <div className="text-xs text-gray-500"><strong>Factura:</strong> {movement.invoiceNumber}</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div><strong>Paciente:</strong> {movement.patientName}</div>
                          <div className="text-xs text-gray-500"><strong>Documento:</strong> {movement.patientDocument}</div>
                          {movement.prescriptionNumber && (
                            <div className="text-xs text-gray-500"><strong>Recetario:</strong> {movement.prescriptionNumber}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{movement.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(movement.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </td>
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
              <h2 className="text-xl font-semibold">Nuevo Movimiento</h2>
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
                  Bodega *
                </label>
                <select
                  required
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar bodega</option>
                  {warehouses.filter(w => w.isActive).map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamento *
                </label>
                <select
                  required
                  value={formData.medicineId}
                  onChange={(e) => setFormData({...formData, medicineId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar medicamento</option>
                  {medicines.filter(m => m.isActive).map(medicine => {
                    const warehouseStock = formData.warehouseId ? medicine.warehouseStock[formData.warehouseId] || 0 : medicine.currentStock;
                    return (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name} (Stock: {warehouseStock})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Movimiento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'entry', justification: '', invoiceNumber: '', patientName: '', patientDocument: '', prescriptionNumber: ''})}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      formData.type === 'entry'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Ingreso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: 'exit', justification: '', invoiceNumber: '', patientName: '', patientDocument: '', prescriptionNumber: ''})}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      formData.type === 'exit'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>Salida</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  max={maxDate}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo se pueden registrar fechas del mes actual
                </p>
              </div>

              {formData.type === 'entry' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Justificación *
                    </label>
                    <select
                      required
                      value={formData.justification}
                      onChange={(e) => setFormData({...formData, justification: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar justificación</option>
                      {justificationOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.justification === 'Compra' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Factura *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.patientName}
                      onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Documento del Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.patientDocument}
                      onChange={(e) => setFormData({...formData, patientDocument: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Recetario
                    </label>
                    <input
                      type="text"
                      value={formData.prescriptionNumber}
                      onChange={(e) => setFormData({...formData, prescriptionNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                  Registrar Movimiento
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
        onConfirm={handleConfirmMovement}
        title="Confirmar Movimiento"
        message={getConfirmationMessage()}
        confirmText="Registrar Movimiento"
        type="info"
      />
    </div>
  );
};