import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          username: string;
          email: string;
          password: string;
          role: 'auxiliar' | 'regente' | 'administrador';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          password: string;
          role: 'auxiliar' | 'regente' | 'administrador';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          password?: string;
          role?: 'auxiliar' | 'regente' | 'administrador';
          is_active?: boolean;
          created_at?: string;
        };
      };
      bodegas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      productos: {
        Row: {
          id: string;
          name: string;
          current_stock: number;
          is_active: boolean;
          low_stock_threshold: number;
          warehouse_stock: Record<string, number>;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          current_stock?: number;
          is_active?: boolean;
          low_stock_threshold?: number;
          warehouse_stock?: Record<string, number>;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          current_stock?: number;
          is_active?: boolean;
          low_stock_threshold?: number;
          warehouse_stock?: Record<string, number>;
          created_at?: string;
        };
      };
      movimientos: {
        Row: {
          id: string;
          medicine_id: string;
          medicine_name: string;
          warehouse_id: string;
          warehouse_name: string;
          type: 'entry' | 'exit';
          quantity: number;
          date: string;
          user_id: string;
          user_name: string;
          justification: string | null;
          invoice_number: string | null;
          patient_name: string | null;
          patient_document: string | null;
          prescription_number: string | null;
        };
        Insert: {
          id?: string;
          medicine_id: string;
          medicine_name: string;
          warehouse_id: string;
          warehouse_name: string;
          type: 'entry' | 'exit';
          quantity: number;
          date?: string;
          user_id: string;
          user_name: string;
          justification?: string | null;
          invoice_number?: string | null;
          patient_name?: string | null;
          patient_document?: string | null;
          prescription_number?: string | null;
        };
        Update: {
          id?: string;
          medicine_id?: string;
          medicine_name?: string;
          warehouse_id?: string;
          warehouse_name?: string;
          type?: 'entry' | 'exit';
          quantity?: number;
          date?: string;
          user_id?: string;
          user_name?: string;
          justification?: string | null;
          invoice_number?: string | null;
          patient_name?: string | null;
          patient_document?: string | null;
          prescription_number?: string | null;
        };
      };
      auditoria: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          timestamp: string;
          type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'movement';
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          action: string;
          details: string;
          timestamp?: string;
          type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'movement';
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string;
          action?: string;
          details?: string;
          timestamp?: string;
          type?: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'movement';
        };
      };
    };
  };
}
