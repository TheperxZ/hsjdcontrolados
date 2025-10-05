export interface User {
  id: string;
  username: string;
  email: string;
  role: 'auxiliar' | 'regente' | 'administrador';
  isActive: boolean;
  createdAt: string;
  password?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  currentStock: number;
  isActive: boolean;
  lowStockThreshold: number;
  warehouseStock: { [warehouseId: string]: number };
}

export interface Movement {
  id: string;
  medicineId: string;
  medicineName: string;
  warehouseId: string;
  warehouseName: string;
  type: 'entry' | 'exit';
  quantity: number;
  date: string;
  userId: string;
  userName: string;
  // Entry specific fields
  justification?: string;
  invoiceNumber?: string;
  // Exit specific fields
  patientName?: string;
  patientDocument?: string;
  prescriptionNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'movement';
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}