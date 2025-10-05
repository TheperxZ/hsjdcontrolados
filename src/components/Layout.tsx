import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  ArrowUpDown, 
  BarChart3, 
  Users, 
  LogOut,
  Warehouse,
  Archive,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: Home },
    // Only show medicines for regente and administrador
    ...(user?.role === 'regente' || user?.role === 'administrador' ? [
      { id: 'medicines', label: 'Medicamentos', icon: Package }
    ] : []),
    { id: 'movements', label: 'Movimientos', icon: ArrowUpDown },
    { id: 'inventory', label: 'Inventario', icon: Archive },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    ...(user?.role === 'administrador' ? [
      { id: 'warehouses', label: 'Bodegas', icon: Warehouse },
      { id: 'users', label: 'Usuarios', icon: Users },
      { id: 'audit', label: 'Auditoría', icon: Shield }
    ] : [])
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'auxiliar': return 'Auxiliar de Farmacia';
      case 'regente': return 'Regente de Farmacia';
      case 'administrador': return 'Administrador';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center space-x-2">
            <img 
              src="/MASCOTA INSTITUCIONAL 2024 (1).png" 
              alt="Logo Hospital" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-800">Libro de Controlados</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{user?.username?.[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(user?.role || '')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {menuItems.find(item => item.id === currentPage)?.label || 'Panel'}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};