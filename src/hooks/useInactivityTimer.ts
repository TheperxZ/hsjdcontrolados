import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../utils/notifications';
import { logAuditEvent } from '../utils/auditLogger';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useInactivityTimer = () => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (user) {
      timeoutRef.current = setTimeout(async () => {
        await logAuditEvent(
          user.id,
          user.username,
          'Cierre de sesión automático',
          'Sesión cerrada por inactividad (15 minutos)',
          'logout'
        );
        showNotification.warning('Sesión cerrada por inactividad');
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimerHandler = () => resetTimer();
    
    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimerHandler, true);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimerHandler, true);
      });
    };
  }, [user]);

  return { resetTimer };
};