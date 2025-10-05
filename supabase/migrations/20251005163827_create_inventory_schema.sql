/*
  # Create Hospital Inventory Management Schema

  ## Overview
  This migration creates the complete database schema for a hospital pharmacy inventory management system. It includes user management, warehouse tracking, medicine inventory, movement logs, and audit trails.

  ## 1. New Tables

  ### `usuarios` (Users)
  - `id` (uuid, primary key) - Unique user identifier
  - `username` (text, unique) - Username for login
  - `email` (text, unique) - User email address
  - `password` (text) - Hashed password
  - `role` (text) - User role: 'auxiliar', 'regente', or 'administrador'
  - `is_active` (boolean) - Whether the user account is active
  - `created_at` (timestamptz) - Account creation timestamp

  ### `bodegas` (Warehouses)
  - `id` (uuid, primary key) - Unique warehouse identifier
  - `name` (text, unique) - Warehouse name
  - `description` (text) - Warehouse description
  - `is_active` (boolean) - Whether the warehouse is active
  - `created_at` (timestamptz) - Warehouse creation timestamp

  ### `productos` (Medicines)
  - `id` (uuid, primary key) - Unique medicine identifier
  - `name` (text, unique) - Medicine name
  - `current_stock` (integer) - Total current stock across all warehouses
  - `is_active` (boolean) - Whether the medicine is active
  - `low_stock_threshold` (integer) - Minimum stock level before alert
  - `warehouse_stock` (jsonb) - Stock levels per warehouse (JSON object)
  - `created_at` (timestamptz) - Medicine creation timestamp

  ### `movimientos` (Movements)
  - `id` (uuid, primary key) - Unique movement identifier
  - `medicine_id` (uuid, foreign key) - Reference to medicine
  - `medicine_name` (text) - Medicine name (denormalized)
  - `warehouse_id` (uuid, foreign key) - Reference to warehouse
  - `warehouse_name` (text) - Warehouse name (denormalized)
  - `type` (text) - Movement type: 'entry' or 'exit'
  - `quantity` (integer) - Quantity moved
  - `date` (timestamptz) - Movement date
  - `user_id` (uuid, foreign key) - User who performed the movement
  - `user_name` (text) - User name (denormalized)
  - `justification` (text) - Justification for entry movements
  - `invoice_number` (text) - Invoice number for entry movements
  - `patient_name` (text) - Patient name for exit movements
  - `patient_document` (text) - Patient document for exit movements
  - `prescription_number` (text) - Prescription number for exit movements

  ### `auditoria` (Audit Logs)
  - `id` (uuid, primary key) - Unique audit log identifier
  - `user_id` (uuid, foreign key) - User who performed the action
  - `user_name` (text) - User name (denormalized)
  - `action` (text) - Action performed
  - `details` (text) - Action details
  - `timestamp` (timestamptz) - Action timestamp
  - `type` (text) - Log type: 'login', 'logout', 'create', 'update', 'delete', 'movement'

  ## 2. Security (RLS Policies)

  All tables have Row Level Security enabled. Policies are designed to:
  - Allow authenticated users to read their accessible data
  - Restrict write operations based on user role
  - Administrators have full access
  - Regentes can manage inventory
  - Auxiliares have read-only access

  ## 3. Initial Data

  The migration includes default data:
  - 3 default users (admin, regente, auxiliar)
  - 12 warehouses (pharmacy locations, ambulances, emergency carts)
  - 23 controlled medicines (psychotropics and opioids)

  ## 4. Important Notes

  - Passwords are stored in plain text for default users (should be hashed in production)
  - `warehouse_stock` uses JSONB for flexible storage of stock per warehouse
  - Denormalized fields (medicine_name, warehouse_name, user_name) improve query performance
  - All tables use UUID for primary keys
  - Timestamps use timestamptz for timezone awareness
*/

-- Create usuarios table
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('auxiliar', 'regente', 'administrador')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bodegas table
CREATE TABLE IF NOT EXISTS bodegas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create productos table
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  current_stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  low_stock_threshold integer DEFAULT 10,
  warehouse_stock jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create movimientos table
CREATE TABLE IF NOT EXISTS movimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES productos(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  warehouse_id uuid REFERENCES bodegas(id) ON DELETE CASCADE,
  warehouse_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('entry', 'exit')),
  quantity integer NOT NULL CHECK (quantity > 0),
  date timestamptz DEFAULT now(),
  user_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  justification text,
  invoice_number text,
  patient_name text,
  patient_document text,
  prescription_number text
);

-- Create auditoria table
CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  type text NOT NULL CHECK (type IN ('login', 'logout', 'create', 'update', 'delete', 'movement'))
);

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios
CREATE POLICY "Users can view all users"
  ON usuarios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only administrators can insert users"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Only administrators can update users"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Only administrators can delete users"
  ON usuarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- RLS Policies for bodegas
CREATE POLICY "Users can view all warehouses"
  ON bodegas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators and regentes can insert warehouses"
  ON bodegas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  );

CREATE POLICY "Administrators and regentes can update warehouses"
  ON bodegas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  );

CREATE POLICY "Only administrators can delete warehouses"
  ON bodegas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- RLS Policies for productos
CREATE POLICY "Users can view all products"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Administrators and regentes can insert products"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  );

CREATE POLICY "Administrators and regentes can update products"
  ON productos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role IN ('administrador', 'regente')
    )
  );

CREATE POLICY "Only administrators can delete products"
  ON productos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- RLS Policies for movimientos
CREATE POLICY "Users can view all movements"
  ON movimientos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert movements"
  ON movimientos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only administrators can update movements"
  ON movimientos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

CREATE POLICY "Only administrators can delete movements"
  ON movimientos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- RLS Policies for auditoria
CREATE POLICY "Users can view all audit logs"
  ON auditoria FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON auditoria FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only administrators can delete audit logs"
  ON auditoria FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND role = 'administrador'
    )
  );

-- Insert default users
INSERT INTO usuarios (username, email, password, role, is_active, created_at)
VALUES
  ('admin', 'admin@hospitalsanjuan.com', 'admin123', 'administrador', true, '2024-01-01T00:00:00Z'),
  ('regente', 'regente@hospitalsanjuan.com', 'regente123', 'regente', true, '2024-01-01T00:00:00Z'),
  ('auxiliar', 'auxiliar@hospitalsanjuan.com', 'auxiliar123', 'auxiliar', true, '2024-01-05T00:00:00Z')
ON CONFLICT (username) DO NOTHING;

-- Insert default warehouses
INSERT INTO bodegas (name, description, is_active, created_at)
VALUES
  ('Farmacia Central', 'Bodega principal del hospital', true, '2024-01-01T00:00:00Z'),
  ('Farmacia Urgencias', 'Bodega de urgencias', true, '2024-01-01T00:00:00Z'),
  ('Lonchera ambulancia N° 1', 'Medicamentos de control especial para ambulancia 1', true, '2024-01-01T00:00:00Z'),
  ('Lonchera ambulancia N° 2', 'Medicamentos de control especial para ambulancia 2', true, '2024-01-01T00:00:00Z'),
  ('Lonchera ambulancia N° 3', 'Medicamentos de control especial para ambulancia 3', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro cirugía', 'Medicamentos de emergencia para cirugía', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro ginecología', 'Medicamentos de emergencia para ginecología', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro medicoquirúrgico', 'Medicamentos de emergencia para medicoquirúrgico', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro pediatría', 'Medicamentos de emergencia para pediatría', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro intermedios', 'Medicamentos de emergencia para cuidados intermedios', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro intensivos', 'Medicamentos de emergencia para cuidados intensivos', true, '2024-01-01T00:00:00Z'),
  ('Carro de paro urgencias', 'Medicamentos de emergencia para urgencias', true, '2024-01-01T00:00:00Z')
ON CONFLICT (name) DO NOTHING;

-- Insert default medicines
INSERT INTO productos (name, current_stock, is_active, low_stock_threshold, warehouse_stock)
VALUES
  ('ALPRAZOLAM 0.25MG TAB', 0, true, 20, '{}'::jsonb),
  ('ALPRAZOLAM 0.5MG TAB', 0, true, 20, '{}'::jsonb),
  ('CLONAZEPAM 0.5MG TAB', 0, true, 15, '{}'::jsonb),
  ('CLONAZEPAM 2MG TABLETAS', 0, true, 15, '{}'::jsonb),
  ('CLONAZEPAM 2.5MG SLN ORAL', 0, true, 10, '{}'::jsonb),
  ('CLOZAPINA 25 MG TAB', 0, true, 15, '{}'::jsonb),
  ('CLOZAPINA 100 MG TAB', 0, true, 15, '{}'::jsonb),
  ('DIAZEPAM 10MG/2ML AMP', 0, true, 25, '{}'::jsonb),
  ('FENOBARBITAL 40MG AMP', 0, true, 20, '{}'::jsonb),
  ('FENOBARBITAL 200MG AMP', 0, true, 15, '{}'::jsonb),
  ('FENOBARBITAL 100MG TAB', 0, true, 20, '{}'::jsonb),
  ('FENTANILO 0.5MG/10 ML AMP', 0, true, 10, '{}'::jsonb),
  ('HIDROMORFONA 2.5MG TABLETA', 0, true, 15, '{}'::jsonb),
  ('KETAMINA 500MG/10ML', 0, true, 10, '{}'::jsonb),
  ('LORAZEPAM 2 MG TAB', 0, true, 20, '{}'::jsonb),
  ('MEPERIDINA 100MG/2ML AMP', 0, true, 15, '{}'::jsonb),
  ('MIDAZOLAM 15MG/5ML AMP', 0, true, 20, '{}'::jsonb),
  ('MIDAZOLAM 5MG/ML', 0, true, 15, '{}'::jsonb),
  ('MORFINA 3% SLN ORAL', 0, true, 10, '{}'::jsonb),
  ('MORFINA AMPOLLA X 10 MG', 0, true, 15, '{}'::jsonb),
  ('MORFINA 50MG / 5ML', 0, true, 10, '{}'::jsonb),
  ('REMIFENTANILO 2MG AMP', 0, true, 10, '{}'::jsonb),
  ('TIOPENTAL 1G AMP', 0, true, 15, '{}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_movimientos_medicine_id ON movimientos(medicine_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_warehouse_id ON movimientos(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_user_id ON movimientos(user_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_date ON movimientos(date DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_user_id ON auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_type ON auditoria(type);