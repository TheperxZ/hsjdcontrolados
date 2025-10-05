import { db } from '../db';
import { AuditLog } from '../types';

export const logAuditEvent = async (
  userId: string,
  userName: string,
  action: string,
  details: string,
  type: AuditLog['type']
) => {
  try {
    await db.auditoria.add({
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString(),
      type
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};