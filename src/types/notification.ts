import type { NotificationType } from './index';

// ============================================================
// Notification
// ============================================================
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null; // JSON payload (e.g., appointment_id)
  is_read: boolean;
  created_at: string;
}

// ============================================================
// Audit Log
// ============================================================
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string; // 'appointment' | 'doctor' | 'profile' etc.
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // Joined
  user_name?: string;
  user_email?: string;
}
