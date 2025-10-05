import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Package,
  Calendar,
  Download,
  Filter,
  Eye,
  FileSpreadsheet,
  X,
  Warehouse
} from 'lucide-react';
import { Medicine, Movement, Warehouse as WarehouseType } from '../types';
import * as XLSX from 'xlsx';

interface ReportsProps {
  medicines: Medicine[];
  movements: Movement[];
  warehouses: WarehouseType[];
}

export const Reports: React.FC<ReportsProps> = ({ medicines, movements, warehouses }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showReportOptions, setShowReportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredMovements = movements.filter(m => {
    const movementDate = new Date(m.date);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end + 'T23:59:59');
    const dateMatch = movementDate >= startDate && movementDate <= endDate;
    const warehouseMatch = selectedWarehouse === 'all' || m.warehouseId === selectedWarehouse;
    return dateMatch && warehouseMatch;
  });

  const getMonthlyMovements = () => {
    const startDate = new Date(selectedYear, selectedMonth, 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    
    return movements.filter(m => {
      const movementDate = new Date(m.date);
      const dateMatch = movementDate >= startDate && movementDate <= endDate;
      const warehouseMatch = selectedWarehouse === 'all' || m.warehouseId === selectedWarehouse;
      return dateMatch && warehouseMatch;
    });
  };

  const getMonthEndStock = () => {
    const monthlyMovements = getMonthlyMovements();
    const stockByMedicine: { [key: string]: number } = {};
    
    medicines.forEach(medicine => {
      let currentStock = medicine.currentStock;
      
      // Calculate stock at end of selected month by reversing movements after that month
      const movementsAfterMonth = movements.filter(m => {
        const movementDate = new Date(m.date);
        const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        return movementDate > monthEnd && m.medicineId === medicine.id;
      });
      
      movementsAfterMonth.forEach(movement => {
        if (movement.type === 'entry') {
          currentStock -= movement.quantity;
        } else {
          currentStock += movement.quantity;
        }
      });
      
      stockByMedicine[medicine.id] = Math.max(0, currentStock);
    });
    
    return stockByMedicine;
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const warehouseName = selectedWarehouse === 'all' ? 'Todas las Bodegas' : 
                           warehouses.find(w => w.id === selectedWarehouse)?.name || 'Bodega Desconocida';
      
      const summaryData = [
        ['REPORTE DE MEDICAMENTOS CONTROLADOS'],
        ['Hospital San Juan de Dios de Honda'],
        [''],
        ['Período del reporte:', `${new Date(dateRange.start).toLocaleDateString('es-ES')} al ${new Date(dateRange.end).toLocaleDateString('es-ES')}`],
        ['Bodega:', warehouseName],
        ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['RESUMEN GENERAL'],
        ['Total de movimientos:', filteredMovements.length],
        ['Total de ingresos:', filteredMovements.filter(m => m.type === 'entry').length],
        ['Total de salidas:', filteredMovements.filter(m => m.type === 'exit').length]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ width: 30 }, { width: 20 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

      // Entries sheet
      const entriesData = [
        ['MOVIMIENTOS DE INGRESO'],
        [''],
        ['Fecha', 'Medicamento', 'Bodega', 'Cantidad', 'Justificación', 'Factura', 'Usuario']
      ];
      
      const entries = filteredMovements.filter(m => m.type === 'entry');
      entries.forEach(movement => {
        entriesData.push([
          new Date(movement.date).toLocaleDateString('es-ES'),
          movement.medicineName,
          movement.warehouseName,
          movement.quantity,
          movement.justification || '',
          movement.invoiceNumber || '',
          movement.userName
        ]);
      });

      const entriesWs = XLSX.utils.aoa_to_sheet(entriesData);
      entriesWs['!cols'] = [{ width: 12 }, { width: 25 }, { width: 20 }, { width: 10 }, { width: 20 }, { width: 15 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, entriesWs, 'Ingresos');

      // Exits sheet
      const exitsData = [
        ['MOVIMIENTOS DE SALIDA'],
        [''],
        ['Fecha', 'Medicamento', 'Bodega', 'Cantidad', 'Paciente', 'Documento', 'Recetario', 'Usuario']
      ];
      
      const exits = filteredMovements.filter(m => m.type === 'exit');
      exits.forEach(movement => {
        exitsData.push([
          new Date(movement.date).toLocaleDateString('es-ES'),
          movement.medicineName,
          movement.warehouseName,
          movement.quantity,
          movement.patientName || '',
          movement.patientDocument || '',
          movement.prescriptionNumber || '',
          movement.userName
        ]);
      });

      const exitsWs = XLSX.utils.aoa_to_sheet(exitsData);
      exitsWs['!cols'] = [{ width: 12 }, { width: 25 }, { width: 20 }, { width: 10 }, { width: 20 }, { width: 15 }, { width: 12 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, exitsWs, 'Salidas');

      // Current inventory sheet
      const inventoryData = [
        ['INVENTARIO ACTUAL POR BODEGA'],
        [''],
        ['Medicamento', ...warehouses.filter(w => w.isActive).map(w => w.name), 'Total']
      ];
      
      medicines.filter(m => m.isActive).forEach(medicine => {
        const row = [medicine.name];
        warehouses.filter(w => w.isActive).forEach(warehouse => {
          row.push(medicine.warehouseStock[warehouse.id] || 0);
        });
        row.push(medicine.currentStock);
        inventoryData.push(row);
      });

      const inventoryWs = XLSX.utils.aoa_to_sheet(inventoryData);
      const colWidths = [{ width: 30 }, ...warehouses.filter(w => w.isActive).map(() => ({ width: 15 })), { width: 15 }];
      inventoryWs['!cols'] = colWidths;
      XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventario');

      // Generate filename
      const startDate = new Date(dateRange.start).toLocaleDateString('es-ES').replace(/\//g, '-');
      const endDate = new Date(dateRange.end).toLocaleDateString('es-ES').replace(/\//g, '-');
      const warehouseText = selectedWarehouse === 'all' ? 'Todas_Bodegas' : warehouseName.replace(/\s+/g, '_');
      const filename = `Reporte_${warehouseText}_${startDate}_al_${endDate}.xlsx`;

      XLSX.writeFile(wb, filename);
      setShowReportOptions(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo Excel');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMonthlyReport = async () => {
    setIsExporting(true);
    
    try {
      const wb = XLSX.utils.book_new();
      const monthlyMovements = getMonthlyMovements();
      const monthEndStock = getMonthEndStock();
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      // Summary sheet
      const warehouseName = selectedWarehouse === 'all' ? 'Todas las Bodegas' : 
                           warehouses.find(w => w.id === selectedWarehouse)?.name || 'Bodega Desconocida';
      
      const summaryData = [
        ['REPORTE MENSUAL DE MEDICAMENTOS CONTROLADOS'],
        ['Hospital San Juan de Dios de Honda'],
        [''],
        ['Mes:', `${monthNames[selectedMonth]} ${selectedYear}`],
        ['Bodega:', warehouseName],
        ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
        [''],
        ['RESUMEN DEL MES'],
        ['Total de movimientos:', monthlyMovements.length],
        ['Total de ingresos:', monthlyMovements.filter(m => m.type === 'entry').length],
        ['Total de salidas:', monthlyMovements.filter(m => m.type === 'exit').length]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ width: 30 }, { width: 20 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

      // Monthly entries
      const entriesData = [
        ['INGRESOS DEL MES'],
        [''],
        ['Fecha', 'Medicamento', 'Bodega', 'Cantidad', 'Justificación', 'Factura', 'Usuario']
      ];
      
      const entries = monthlyMovements.filter(m => m.type === 'entry');
      entries.forEach(movement => {
        entriesData.push([
          new Date(movement.date).toLocaleDateString('es-ES'),
          movement.medicineName,
          movement.warehouseName,
          movement.quantity,
          movement.justification || '',
          movement.invoiceNumber || '',
          movement.userName
        ]);
      });

      const entriesWs = XLSX.utils.aoa_to_sheet(entriesData);
      entriesWs['!cols'] = [{ width: 12 }, { width: 25 }, { width: 20 }, { width: 10 }, { width: 20 }, { width: 15 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, entriesWs, 'Ingresos');

      // Monthly exits
      const exitsData = [
        ['SALIDAS DEL MES'],
        [''],
        ['Fecha', 'Medicamento', 'Bodega', 'Cantidad', 'Paciente', 'Documento', 'Recetario', 'Usuario']
      ];
      
      const exits = monthlyMovements.filter(m => m.type === 'exit');
      exits.forEach(movement => {
        exitsData.push([
          new Date(movement.date).toLocaleDateString('es-ES'),
          movement.medicineName,
          movement.warehouseName,
          movement.quantity,
          movement.patientName || '',
          movement.patientDocument || '',
          movement.prescriptionNumber || '',
          movement.userName
        ]);
      });

      const exitsWs = XLSX.utils.aoa_to_sheet(exitsData);
      exitsWs['!cols'] = [{ width: 12 }, { width: 25 }, { width: 20 }, { width: 10 }, { width: 20 }, { width: 15 }, { width: 12 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, exitsWs, 'Salidas');

      // Month-end stock
      const stockData = [
        ['SALDO AL FINAL DEL MES'],
        [''],
        ['Medicamento', 'Saldo Final']
      ];
      
      medicines.filter(m => m.isActive).forEach(medicine => {
        stockData.push([
          medicine.name,
          monthEndStock[medicine.id] || 0
        ]);
      });

      const stockWs = XLSX.utils.aoa_to_sheet(stockData);
      stockWs['!cols'] = [{ width: 35 }, { width: 15 }];
      XLSX.utils.book_append_sheet(wb, stockWs, 'Saldo Final');

      // Generate filename
      const filename = `Reporte_Mensual_${monthNames[selectedMonth]}_${selectedYear}_${warehouseName.replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);
      setShowReportOptions(false);
    } catch (error) {
      console.error('Error al exportar reporte mensual:', error);
      alert('Error al generar el reporte mensual');
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Reporte</h3>
          </div>
          <button 
            onClick={() => setShowReportOptions(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Generar Reporte</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de fin
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bodega
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas las bodegas</option>
              {warehouses.filter(w => w.isActive).map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes para reporte mensual
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Movements Display */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Movimientos del Período ({filteredMovements.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.map(movement => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(movement.date).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-1 rounded-full ${movement.type === 'entry' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {movement.type === 'entry' ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                      <span className={`ml-2 text-sm ${movement.type === 'entry' ? 'text-green-700' : 'text-red-700'}`}>
                        {movement.type === 'entry' ? 'Ingreso' : 'Salida'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {movement.medicineName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.warehouseName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${movement.type === 'entry' ? 'text-green-700' : 'text-red-700'}`}>
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {movement.type === 'entry' ? (
                      <div>
                        <span>{movement.justification}</span>
                        {movement.invoiceNumber && (
                          <div className="text-xs text-gray-500">Factura: {movement.invoiceNumber}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div>{movement.patientName}</div>
                        <div className="text-xs text-gray-500">{movement.patientDocument}</div>
                        {movement.prescriptionNumber && (
                          <div className="text-xs text-gray-500">Rec: {movement.prescriptionNumber}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.userName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Options Modal */}
      {showReportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Generar Reporte</h2>
                  <p className="text-sm text-gray-600">Selecciona una opción</p>
                </div>
              </div>
              <button
                onClick={() => setShowReportOptions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Período seleccionado:</span>
                </div>
                <p className="text-sm text-blue-800">
                  Del {new Date(dateRange.start).toLocaleDateString('es-ES')} al {new Date(dateRange.end).toLocaleDateString('es-ES')}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Warehouse className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-600">
                    {selectedWarehouse === 'all' ? 'Todas las bodegas' : warehouses.find(w => w.id === selectedWarehouse)?.name}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {filteredMovements.length} movimientos encontrados
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 rounded-lg hover:from-green-100 hover:to-green-150 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors">
                    {isExporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-green-900">
                      {isExporting ? 'Generando...' : 'Exportar a Excel'}
                    </p>
                    <p className="text-sm text-green-700">
                      {isExporting ? 'Preparando archivo' : 'Descargar archivo completo'}
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={handleExportMonthlyReport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-150 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                    {isExporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Calendar className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-blue-900">
                      {isExporting ? 'Generando...' : 'Reporte Mensual'}
                    </p>
                    <p className="text-sm text-blue-700">
                      {isExporting ? 'Preparando archivo' : `${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][selectedMonth]} ${selectedYear}`}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};