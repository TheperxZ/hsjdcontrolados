import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MedicineManagement } from './components/MedicineManagement';
import { MovementManagement } from './components/MovementManagement';
import { Reports } from './components/Reports';
import { UserManagement } from './components/UserManagement';
import { WarehouseManagement } from './components/WarehouseManagement';
import { Inventory } from './components/Inventory';
import { Audit } from './components/Audit';
import { Medicine, Movement, User, Warehouse } from './types';
import { db } from './db';
import { Package } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import { logAuditEvent } from './utils/auditLogger';
import { showNotification } from './utils/notifications';

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize inactivity timer
  useInactivityTimer();

  // Reset to dashboard on login
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated]);

  // Load data from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load medicines
        const dbMedicines = await db.productos.toArray();
        const medicinesWithStringId = dbMedicines.map(m => ({
          ...m,
          id: m.id!.toString()
        }));
        setMedicines(medicinesWithStringId);

        // Load movements
        const dbMovements = await db.movimientos.toArray();
        const movementsWithStringId = dbMovements.map(m => ({
          ...m,
          id: m.id!.toString()
        }));
        setMovements(movementsWithStringId);

        // Load users
        const dbUsers = await db.usuarios.toArray();
        const usersWithStringId = dbUsers.map(u => ({
          ...u,
          id: u.id!.toString()
        }));
        setUsers(usersWithStringId);

        // Load warehouses
        const dbWarehouses = await db.bodegas.toArray();
        const warehousesWithStringId = dbWarehouses.map(w => ({
          ...w,
          id: w.id!.toString()
        }));
        setWarehouses(warehousesWithStringId);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Medicine handlers
  const handleAddMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    try {
      const id = await db.productos.add(medicine);
      const newMedicine: Medicine = {
        ...medicine,
        id: id.toString()
      };
      setMedicines(prev => [...prev, newMedicine]);
      
      if (user) {
        await logAuditEvent(
          user.id,
          user.username,
          'Creación de medicamento',
          `Medicamento creado: ${medicine.name}`,
          'create'
        );
        showNotification.success('Medicamento creado exitosamente');
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showNotification.error('Error al crear el medicamento');
    }
  };

  const handleUpdateMedicine = async (id: string, updates: Partial<Medicine>) => {
    try {
      await db.productos.update(parseInt(id), updates);
      setMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
      
      if (user) {
        const medicine = medicines.find(m => m.id === id);
        await logAuditEvent(
          user.id,
          user.username,
          'Modificación de medicamento',
          `Medicamento modificado: ${medicine?.name}`,
          'update'
        );
        showNotification.success('Medicamento actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
      showNotification.error('Error al actualizar el medicamento');
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      const medicine = medicines.find(m => m.id === id);
      await db.productos.delete(parseInt(id));
      setMedicines(prev => prev.filter(m => m.id !== id));
      
      if (user && medicine) {
        await logAuditEvent(
          user.id,
          user.username,
          'Eliminación de medicamento',
          `Medicamento eliminado: ${medicine.name}`,
          'delete'
        );
        showNotification.success('Medicamento eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      showNotification.error('Error al eliminar el medicamento');
    }
  };

  // Movement handlers
  const handleAddMovement = async (movement: Omit<Movement, 'id'>) => {
    try {
      const id = await db.movimientos.add(movement);
      const newMovement: Movement = {
        ...movement,
        id: id.toString()
      };
      setMovements(prev => [...prev, newMovement]);
      
      if (user) {
        await logAuditEvent(
          user.id,
          user.username,
          `Movimiento de ${movement.type === 'entry' ? 'ingreso' : 'salida'}`,
          `${movement.type === 'entry' ? 'Ingreso' : 'Salida'} de ${movement.quantity} unidades de ${movement.medicineName} en ${movement.warehouseName}`,
          'movement'
        );
        showNotification.success(`Movimiento de ${movement.type === 'entry' ? 'ingreso' : 'salida'} registrado exitosamente`);
      }
    } catch (error) {
      console.error('Error adding movement:', error);
      showNotification.error('Error al registrar el movimiento');
    }
  };

  const handleUpdateMedicineStock = async (medicineId: string, warehouseId: string, newStock: number) => {
    try {
      const medicine = medicines.find(m => m.id === medicineId);
      if (medicine) {
        const updatedWarehouseStock = { ...medicine.warehouseStock, [warehouseId]: newStock };
        const totalStock = Object.values(updatedWarehouseStock).reduce((sum, stock) => sum + stock, 0);
        
        const updates = { 
          warehouseStock: updatedWarehouseStock,
          currentStock: totalStock
        };
        
        await db.productos.update(parseInt(medicineId), updates);
        setMedicines(prev => prev.map(m => m.id === medicineId ? { ...m, ...updates } : m));
      }
    } catch (error) {
      console.error('Error updating medicine stock:', error);
    }
  };

  // User handlers
  const handleAddUser = async (user: Omit<User, 'id'>) => {
    try {
      const id = await db.usuarios.add(user);
      const newUser: User = {
        ...user,
        id: id.toString()
      };
      setUsers(prev => [...prev, newUser]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      await db.usuarios.update(parseInt(id), updates);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await db.usuarios.delete(parseInt(id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Warehouse handlers
  const handleAddWarehouse = async (warehouse: Omit<Warehouse, 'id'>) => {
    try {
      const id = await db.bodegas.add(warehouse);
      const newWarehouse: Warehouse = {
        ...warehouse,
        id: id.toString()
      };
      setWarehouses(prev => [...prev, newWarehouse]);
    } catch (error) {
      console.error('Error adding warehouse:', error);
    }
  };

  const handleUpdateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      await db.bodegas.update(parseInt(id), updates);
      setWarehouses(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    } catch (error) {
      console.error('Error updating warehouse:', error);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await db.bodegas.delete(parseInt(id));
      setWarehouses(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
    }
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard medicines={medicines} movements={movements} warehouses={warehouses} />;
      case 'medicines':
        // Only allow regente and administrador to access medicines
        return (user?.role === 'regente' || user?.role === 'administrador') ? (
          <MedicineManagement
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicine={handleUpdateMedicine}
            onDeleteMedicine={handleDeleteMedicine}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
              <p className="text-gray-600">Solo los regentes y administradores pueden gestionar medicamentos.</p>
            </div>
          </div>
        );
      case 'movements':
        return (
          <MovementManagement
            medicines={medicines}
            movements={movements}
            warehouses={warehouses}
            onAddMovement={handleAddMovement}
            onUpdateMedicineStock={handleUpdateMedicineStock}
          />
        );
      case 'reports':
        return <Reports medicines={medicines} movements={movements} warehouses={warehouses} />;
      case 'inventory':
        return <Inventory medicines={medicines} warehouses={warehouses} />;
      case 'warehouses':
        return user?.role === 'administrador' ? (
          <WarehouseManagement
            warehouses={warehouses}
            onAddWarehouse={handleAddWarehouse}
            onUpdateWarehouse={handleUpdateWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
          />
        ) : null;
      case 'users':
        return user?.role === 'administrador' ? (
          <UserManagement
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        ) : null;
      case 'audit':
        return user?.role === 'administrador' ? <Audit /> : null;
      default:
        return <Dashboard medicines={medicines} movements={movements} warehouses={warehouses} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
      <Toaster />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;