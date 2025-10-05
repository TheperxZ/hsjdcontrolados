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
import { supabase } from './db/supabase';
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

  useInactivityTimer();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const [medicinesRes, movementsRes, usersRes, warehousesRes] = await Promise.all([
          supabase.from('productos').select('*').order('name'),
          supabase.from('movimientos').select('*').order('date', { ascending: false }),
          supabase.from('usuarios').select('*').order('username'),
          supabase.from('bodegas').select('*').order('name')
        ]);

        if (medicinesRes.data) {
          setMedicines(medicinesRes.data.map(m => ({
            id: m.id,
            name: m.name,
            currentStock: m.current_stock,
            isActive: m.is_active,
            lowStockThreshold: m.low_stock_threshold,
            warehouseStock: m.warehouse_stock
          })));
        }

        if (movementsRes.data) {
          setMovements(movementsRes.data.map(m => ({
            id: m.id,
            medicineId: m.medicine_id,
            medicineName: m.medicine_name,
            warehouseId: m.warehouse_id,
            warehouseName: m.warehouse_name,
            type: m.type,
            quantity: m.quantity,
            date: m.date,
            userId: m.user_id,
            userName: m.user_name,
            justification: m.justification,
            invoiceNumber: m.invoice_number,
            patientName: m.patient_name,
            patientDocument: m.patient_document,
            prescriptionNumber: m.prescription_number
          })));
        }

        if (usersRes.data) {
          setUsers(usersRes.data.map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            isActive: u.is_active,
            createdAt: u.created_at
          })));
        }

        if (warehousesRes.data) {
          setWarehouses(warehousesRes.data.map(w => ({
            id: w.id,
            name: w.name,
            description: w.description,
            isActive: w.is_active,
            createdAt: w.created_at
          })));
        }

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

  const handleAddMedicine = async (medicine: Omit<Medicine, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .insert({
          name: medicine.name,
          current_stock: medicine.currentStock,
          is_active: medicine.isActive,
          low_stock_threshold: medicine.lowStockThreshold,
          warehouse_stock: medicine.warehouseStock
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newMedicine: Medicine = {
          id: data.id,
          name: data.name,
          currentStock: data.current_stock,
          isActive: data.is_active,
          lowStockThreshold: data.low_stock_threshold,
          warehouseStock: data.warehouse_stock
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
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      showNotification.error('Error al crear el medicamento');
    }
  };

  const handleUpdateMedicine = async (id: string, updates: Partial<Medicine>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.currentStock !== undefined) dbUpdates.current_stock = updates.currentStock;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
      if (updates.warehouseStock !== undefined) dbUpdates.warehouse_stock = updates.warehouseStock;

      const { error } = await supabase
        .from('productos')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

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

      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;

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

  const handleAddMovement = async (movement: Omit<Movement, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('movimientos')
        .insert({
          medicine_id: movement.medicineId,
          medicine_name: movement.medicineName,
          warehouse_id: movement.warehouseId,
          warehouse_name: movement.warehouseName,
          type: movement.type,
          quantity: movement.quantity,
          date: movement.date,
          user_id: movement.userId,
          user_name: movement.userName,
          justification: movement.justification,
          invoice_number: movement.invoiceNumber,
          patient_name: movement.patientName,
          patient_document: movement.patientDocument,
          prescription_number: movement.prescriptionNumber
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newMovement: Movement = {
          id: data.id,
          medicineId: data.medicine_id,
          medicineName: data.medicine_name,
          warehouseId: data.warehouse_id,
          warehouseName: data.warehouse_name,
          type: data.type,
          quantity: data.quantity,
          date: data.date,
          userId: data.user_id,
          userName: data.user_name,
          justification: data.justification,
          invoiceNumber: data.invoice_number,
          patientName: data.patient_name,
          patientDocument: data.patient_document,
          prescriptionNumber: data.prescription_number
        };
        setMovements(prev => [newMovement, ...prev]);

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

        const { error } = await supabase
          .from('productos')
          .update({
            warehouse_stock: updatedWarehouseStock,
            current_stock: totalStock
          })
          .eq('id', medicineId);

        if (error) throw error;

        setMedicines(prev => prev.map(m =>
          m.id === medicineId
            ? { ...m, warehouseStock: updatedWarehouseStock, currentStock: totalStock }
            : m
        ));
      }
    } catch (error) {
      console.error('Error updating medicine stock:', error);
    }
  };

  const handleAddUser = async (newUser: Omit<User, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          is_active: newUser.isActive,
          created_at: newUser.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const user: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          createdAt: data.created_at
        };
        setUsers(prev => [...prev, user]);
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      const dbUpdates: any = {};
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { error } = await supabase
        .from('usuarios')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddWarehouse = async (warehouse: Omit<Warehouse, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('bodegas')
        .insert({
          name: warehouse.name,
          description: warehouse.description,
          is_active: warehouse.isActive,
          created_at: warehouse.createdAt
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newWarehouse: Warehouse = {
          id: data.id,
          name: data.name,
          description: data.description,
          isActive: data.is_active,
          createdAt: data.created_at
        };
        setWarehouses(prev => [...prev, newWarehouse]);
      }
    } catch (error) {
      console.error('Error adding warehouse:', error);
    }
  };

  const handleUpdateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

      const { error } = await supabase
        .from('bodegas')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setWarehouses(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    } catch (error) {
      console.error('Error updating warehouse:', error);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bodegas')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
