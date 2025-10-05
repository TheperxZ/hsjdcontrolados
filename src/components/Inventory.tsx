import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle,
  Warehouse,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Medicine, Warehouse as WarehouseType } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface InventoryProps {
  medicines: Medicine[];
  warehouses: WarehouseType[];
}

export const Inventory: React.FC<InventoryProps> = ({ medicines, warehouses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === 'all' || 
      (medicine.warehouseStock[selectedWarehouse] && medicine.warehouseStock[selectedWarehouse] > 0);
    return medicine.isActive && matchesSearch && matchesWarehouse;
  });

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const data = [
      ['INVENTARIO COMPLETO DE MEDICAMENTOS CONTROLADOS'],
      ['Hospital San Juan de Dios de Honda'],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Medicamento', ...warehouses.filter(w => w.isActive).map(w => w.name), 'Total']
    ];
    
    filteredMedicines.forEach(medicine => {
      const row = [medicine.name];
      warehouses.filter(w => w.isActive).forEach(warehouse => {
        row.push(medicine.warehouseStock[warehouse.id] || 0);
      });
      row.push(medicine.currentStock);
      data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths = [{ width: 35 }, ...warehouses.filter(w => w.isActive).map(() => ({ width: 15 })), { width: 15 }];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    
    const filename = `Inventario_Completo_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    
    doc.setFontSize(16);
    doc.text('INVENTARIO COMPLETO DE MEDICAMENTOS CONTROLADOS', 20, 20);
    doc.setFontSize(12);
    doc.text('Hospital San Juan de Dios de Honda', 20, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);

    const headers = ['Medicamento', ...warehouses.filter(w => w.isActive).slice(0, 6).map(w => w.name), 'Total'];
    const data = filteredMedicines.map(medicine => {
      const row = [medicine.name];
      warehouses.filter(w => w.isActive).slice(0, 6).forEach(warehouse => {
        row.push((medicine.warehouseStock[warehouse.id] || 0).toString());
      });
      row.push(medicine.currentStock.toString());
      return row;
    });

    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 60 }
      }
    });

    doc.save(`Inventario_Completo_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`);
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
              placeholder="Buscar medicamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todas las bodegas</option>
            {warehouses.filter(w => w.isActive).map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Medicamento
                </th>
                {warehouses.filter(w => w.isActive).map(warehouse => (
                  <th key={warehouse.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {warehouse.name.length > 15 ? warehouse.name.substring(0, 15) + '...' : warehouse.name}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicines.map(medicine => (
                <tr key={medicine.id} className={`hover:bg-gray-50 ${medicine.currentStock < medicine.lowStockThreshold ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {medicine.currentStock < medicine.lowStockThreshold && (
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          {medicine.name}
                        </div>
                        {medicine.currentStock < medicine.lowStockThreshold && (
                          <div className="text-xs text-red-600">Stock bajo (mín: {medicine.lowStockThreshold})</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {warehouses.filter(w => w.isActive).map(warehouse => (
                    <td key={warehouse.id} className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <Warehouse className="h-3 w-3 text-gray-400 mr-1" />
                        <span className={`text-sm font-medium ${
                          (medicine.warehouseStock[warehouse.id] || 0) === 0 ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {medicine.warehouseStock[warehouse.id] || 0}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-bold ${
                      medicine.currentStock < medicine.lowStockThreshold ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {medicine.currentStock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMedicines.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron medicamentos</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda.</p>
        </div>
      )}
    </div>
  );
};