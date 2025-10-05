import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase } from '../db/supabase';
import { logAuditEvent } from '../utils/auditLogger';
import { showNotification } from '../utils/notifications';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUserId = sessionStorage.getItem('currentUserId');
        if (savedUserId) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', savedUserId)
            .eq('is_active', true)
            .maybeSingle();

          if (!error && data) {
            setUser({
              id: data.id,
              username: data.username,
              email: data.email,
              role: data.role,
              isActive: data.is_active,
              createdAt: data.created_at
            });
          } else {
            sessionStorage.removeItem('currentUserId');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        sessionStorage.removeItem('currentUserId');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        const userWithMappedFields: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          isActive: data.is_active,
          createdAt: data.created_at
        };

        setUser(userWithMappedFields);
        sessionStorage.setItem('currentUserId', data.id);

        await logAuditEvent(
          userWithMappedFields.id,
          userWithMappedFields.username,
          'Inicio de sesión',
          `Usuario ${userWithMappedFields.username} inició sesión exitosamente`,
          'login'
        );

        showNotification.success('Inicio de sesión exitoso');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    if (user) {
      await logAuditEvent(
        user.id,
        user.username,
        'Cierre de sesión',
        `Usuario ${user.username} cerró sesión`,
        'logout'
      );
    }

    setUser(null);
    sessionStorage.removeItem('currentUserId');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
