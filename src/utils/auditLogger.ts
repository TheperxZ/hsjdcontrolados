import { supabase } from '../db/supabase';
import { AuditLog } from '../types';

export const logAuditEvent = async (
  userId: string,
  userName: string,
  action: string,
  details: string,
  type: AuditLog['type']
) => {
  try {
    await supabase
      .from('auditoria')
      .insert({
        user_id: userId,
        user_name: userName,
        action,
        details,
        type
      });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};