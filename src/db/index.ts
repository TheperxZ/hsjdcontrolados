import Dexie, { Table } from 'dexie';
import { User, Medicine, Movement, Warehouse, AuditLog } from '../types';

export interface DBUser extends Omit<User, 'id'> {
  id?: number;
}

export interface DBMedicine extends Omit<Medicine, 'id'> {
  id?: number;
}

export interface DBMovement extends Omit<Movement, 'id'> {
  id?: number;
}

export interface DBWarehouse extends Omit<Warehouse, 'id'> {
  id?: number;
}

export interface DBAuditLog extends Omit<AuditLog, 'id'> {
  id?: number;
}

export class InventarioDB extends Dexie {
  usuarios!: Table<DBUser>;
  productos!: Table<DBMedicine>;
  movimientos!: Table<DBMovement>;
  bodegas!: Table<DBWarehouse>;
  auditoria!: Table<DBAuditLog>;

  constructor() {
    super('InventarioDB');
    this.version(1).stores({
      usuarios: '++id, username, password, email, role, isActive, createdAt',
      productos: '++id, name, currentStock, isActive, lowStockThreshold, warehouseStock',
      movimientos: '++id, medicineId, medicineName, warehouseId, warehouseName, type, quantity, date, userId, userName, justification, invoiceNumber, patientName, patientDocument, prescriptionNumber',
      bodegas: '++id, name, description, isActive, createdAt',
      auditoria: '++id, userId, userName, action, details, timestamp, type'
    });
  }
}

export const db = new InventarioDB();

// Initialize default data
db.on('populate', async () => {
  // Default users
  await db.usuarios.bulkAdd([
    {
      username: 'admin',
      email: 'admin@hospitalsanjuan.com',
      role: 'administrador',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      password: 'admin123'
    },
    {
      username: 'regente',
      email: 'regente@hospitalsanjuan.com',
      role: 'regente',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      password: 'regente123'
    },
    {
      username: 'auxiliar',
      email: 'auxiliar@hospitalsanjuan.com',
      role: 'auxiliar',
      isActive: true,
      createdAt: '2024-01-05T00:00:00Z',
      password: 'auxiliar123'
    }
  ]);

  // Default warehouses
  await db.bodegas.bulkAdd([
    {
      name: 'Farmacia Central',
      description: 'Bodega principal del hospital',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Farmacia Urgencias',
      description: 'Bodega de urgencias',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Lonchera ambulancia N° 1',
      description: 'Medicamentos de control especial para ambulancia 1',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Lonchera ambulancia N° 2',
      description: 'Medicamentos de control especial para ambulancia 2',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Lonchera ambulancia N° 3',
      description: 'Medicamentos de control especial para ambulancia 3',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro cirugía',
      description: 'Medicamentos de emergencia para cirugía',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro ginecología',
      description: 'Medicamentos de emergencia para ginecología',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro medicoquirúrgico',
      description: 'Medicamentos de emergencia para medicoquirúrgico',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro pediatría',
      description: 'Medicamentos de emergencia para pediatría',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro intermedios',
      description: 'Medicamentos de emergencia para cuidados intermedios',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro intensivos',
      description: 'Medicamentos de emergencia para cuidados intensivos',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      name: 'Carro de paro urgencias',
      description: 'Medicamentos de emergencia para urgencias',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]);

  // Default medicines
  await db.productos.bulkAdd([
    {
      name: 'ALPRAZOLAM 0.25MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'ALPRAZOLAM 0.5MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'CLONAZEPAM 0.5MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'CLONAZEPAM 2MG TABLETAS',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'CLONAZEPAM 2.5MG SLN ORAL',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'CLOZAPINA 25 MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'CLOZAPINA 100 MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'DIAZEPAM 10MG/2ML AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 25,
      warehouseStock: {}
    },
    {
      name: 'FENOBARBITAL 40MG AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'FENOBARBITAL 200MG AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'FENOBARBITAL 100MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'FENTANILO 0.5MG/10 ML AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'HIDROMORFONA 2.5MG TABLETA',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'KETAMINA 500MG/10ML',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'LORAZEPAM 2 MG TAB',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'MEPERIDINA 100MG/2ML AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'MIDAZOLAM 15MG/5ML AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 20,
      warehouseStock: {}
    },
    {
      name: 'MIDAZOLAM 5MG/ML',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'MORFINA 3% SLN ORAL',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'MORFINA AMPOLLA X 10 MG',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    },
    {
      name: 'MORFINA 50MG / 5ML',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'REMIFENTANILO 2MG AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 10,
      warehouseStock: {}
    },
    {
      name: 'TIOPENTAL 1G AMP',
      currentStock: 0,
      isActive: true,
      lowStockThreshold: 15,
      warehouseStock: {}
    }
  ]);
});

db.open().catch(err => {
  console.error('Failed to open database:', err);
});

export default db;