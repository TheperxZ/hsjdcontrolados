import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter,
  Calendar,
  User,
  Activity,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLog } from '../types';
import { supabase } from '../db/supabase';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Audit: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('auditoria')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        setAuditLogs(data.map(log => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_name,
          action: log.action,
          details: log.details,
          timestamp: log.timestamp,
          type: log.type
        })));
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesDate = !filterDate || log.timestamp.startsWith(filterDate);
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getActionIcon = (type: AuditLog['type']) => {
    switch (type) {
      case 'login': return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout': return <LogOut className="h-4 w-4 text-red-600" />;
      case 'create': return <Plus className="h-4 w-4 text-blue-600" />;
      case 'update': return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'movement': return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (type: AuditLog['type']) => {
    switch (type) {
      case 'login': return 'bg-green-100 text-green-700';
      case 'logout': return 'bg-red-100 text-red-700';
      case 'create': return 'bg-blue-100 text-blue-700';
      case 'update': return 'bg-yellow-100 text-yellow-700';
      case 'delete': return 'bg-red-100 text-red-700';
      case 'movement': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const data = [
      ['REGISTRO DE AUDITORÍA'],
      ['Hospital San Juan de Dios de Honda'],
      ['Fecha de generación:', new Date().toLocaleDateString('es-ES')],
      [''],
      ['Fecha/Hora', 'Usuario', 'Acción', 'Tipo', 'Detalles']
    ];
    
    filteredLogs.forEach(log => {
      data.push([
        new Date(log.timestamp).toLocaleString('es-ES'),
        log.userName,
        log.action,
        log.type,
        log.details
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ width: 20 }, { width: 15 }, { width: 25 }, { width: 12 }, { width: 40 }];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    
    const filename = `Auditoria_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(16);
    doc.text('REGISTRO DE AUDITORÍA', 20, 20);
    doc.setFontSize(12);
    doc.text('Hospital San Juan de Dios de Honda', 20, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 40);

    const headers = ['Fecha/Hora', 'Usuario', 'Acción', 'Tipo', 'Detalles'];
    const data = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('es-ES'),
      log.userName,
      log.action,
      log.type,
      log.details.length > 50 ? log.details.substring(0, 50) + '...' : log.details
    ]);

    (doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 60 }
      }
    });

    doc.save(`Auditoria_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterDate('');
    setSearchTerm('');
  };

  // Only administrators can access audit logs
  if (user?.role !== 'administrador') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los administradores pueden acceder a los registros de auditoría.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando registros de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en registros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="login">Inicios de sesión</option>
              <option value="logout">Cierres de sesión</option>
              <option value="create">Creaciones</option>
              <option value="update">Modificaciones</option>
              <option value="delete">Eliminaciones</option>
              <option value="movement">Movimientos</option>
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {(filterType !== 'all' || filterDate || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
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

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.action}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(log.type)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.type)}`}>
                        {log.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
          <p className="text-gray-600">Intenta ajustar los filtros de búsqueda.</p>
        </div>
      )}
    </div>
  );
};