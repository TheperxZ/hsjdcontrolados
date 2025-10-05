import React from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Calendar,
  AlertTriangle,
  BarChart3,
  Warehouse
} from 'lucide-react';
import { Medicine, Movement, Warehouse as WarehouseType } from '../types';

interface DashboardProps {
  medicines: Medicine[];
  movements: Movement[];
  warehouses: WarehouseType[];
}

export const Dashboard: React.FC<DashboardProps> = ({ medicines, movements, warehouses }) => {
  const totalMedicines = medicines.length;
  const activeMedicines = medicines.filter(m => m.isActive).length;

  const recentMovements = movements
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const todayMovements = movements.filter(m => 
    new Date(m.date).toDateString() === new Date().toDateString()
  );

  // Low stock medicines (using individual thresholds)
  const lowStockMedicines = medicines.filter(m => m.isActive && m.currentStock < m.lowStockThreshold);

  // Medicines with most exits (last 30 days)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentExits = movements.filter(m => 
    m.type === 'exit' && new Date(m.date) >= last30Days
  );
  
  const medicinesWithMostExits = medicines.map(medicine => {
    const exits = recentExits.filter(m => m.medicineId === medicine.id);
    const totalExits = exits.reduce((sum, m) => sum + m.quantity, 0);
    return { medicine, totalExits, exitCount: exits.length };
  })
  .filter(item => item.totalExits > 0)
  .sort((a, b) => b.totalExits - a.totalExits)
  .slice(0, 5);

  // Medicines with least movements (last 30 days)
  const medicinesWithLeastMovements = medicines.map(medicine => {
    const medicineMovements = movements.filter(m => 
      m.medicineId === medicine.id && new Date(m.date) >= last30Days
    );
    return { medicine, movementCount: medicineMovements.length };
  })
  .filter(item => item.medicine.isActive)
  .sort((a, b) => a.movementCount - b.movementCount)
  .slice(0, 5);

  const stats = [
    {
      title: 'Total Medicamentos',
      value: totalMedicines,
      icon: Package,
      color: 'blue',
      description: `${activeMedicines} activos`
    },
    {
      title: 'Movimientos Hoy',
      value: todayMovements.length,
      icon: Activity,
      color: 'purple',
      description: 'Operaciones realizadas'
    },
    {
      title: 'Stock Bajo',
      value: lowStockMedicines.length,
      icon: AlertTriangle,
      color: 'red',
      description: 'Requieren reposición'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconBgColor = (color: string) => {
    const colors = {
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      red: 'bg-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all hover:shadow-md ${getColorClasses(stat.color)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs opacity-70 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${getIconBgColor(stat.color)}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Inventario</h3>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Medicamento</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-center py-2 px-3 text-sm font-medium text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.filter(m => m.isActive).slice(0, 8).map(medicine => (
                  <tr key={medicine.id} className={`hover:bg-gray-50 ${medicine.currentStock < medicine.lowStockThreshold ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-3 text-sm font-medium text-gray-900 flex items-center">
                      {medicine.currentStock < medicine.lowStockThreshold && (
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      {medicine.name}
                    </td>
                    <td className={`py-3 px-3 text-sm text-center font-medium ${medicine.currentStock < medicine.lowStockThreshold ? 'text-red-700' : 'text-gray-700'}`}>
                      {medicine.currentStock}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {medicine.currentStock < medicine.lowStockThreshold ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Movimientos Recientes</h3>
          </div>
          <div className="space-y-3">
            {recentMovements.slice(0, 8).map(movement => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${movement.type === 'entry' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {movement.type === 'entry' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{movement.medicineName}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Warehouse className="h-3 w-3 mr-1" />
                      {movement.warehouseName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${movement.type === 'entry' ? 'text-green-700' : 'text-red-700'}`}>
                    {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                  </p>
                  <p className="text-xs text-gray-500">by {movement.userName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicines with Most Exits */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Más Salidas (30 días)</h3>
          </div>
          <div className="space-y-3">
            {medicinesWithMostExits.map((item, index) => (
              <div key={item.medicine.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-red-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.medicine.name}</p>
                    <p className="text-xs text-gray-500">{item.exitCount} movimientos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((item.totalExits / Math.max(...medicinesWithMostExits.map(m => m.totalExits))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-red-700 font-medium mt-1">{item.totalExits}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicines with Least Movements */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Menos Movimientos</h3>
          </div>
          <div className="space-y-3">
            {medicinesWithLeastMovements.map((item, index) => (
              <div key={item.medicine.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-yellow-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.medicine.name}</p>
                    <p className="text-xs text-gray-500">Stock: {item.medicine.currentStock}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-700">{item.movementCount}</p>
                  <p className="text-xs text-gray-500">movimientos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Stock Bajo</h3>
          </div>
          {lowStockMedicines.length > 0 ? (
            <div className="space-y-3">
              {lowStockMedicines.slice(0, 5).map((medicine, index) => (
                <div key={medicine.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">{medicine.name}</p>
                      <p className="text-xs text-red-700">Límite: {medicine.lowStockThreshold}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-700">{medicine.currentStock}</p>
                    <p className="text-xs text-red-600">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">Todos los medicamentos tienen stock suficiente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};