import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Star,
  ShieldCheck,
  Bell,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Notification } from '@/types/notification';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';

// ============================================================
// Notification type → icon + color mapping
// ============================================================
const NOTIFICATION_STYLES: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  appointment_confirmed: {
    icon: <CheckCircle2 size={18} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  appointment_cancelled: {
    icon: <XCircle size={18} />,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  appointment_rescheduled: {
    icon: <RefreshCw size={18} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  appointment_reminder: {
    icon: <Clock size={18} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  appointment_completed: {
    icon: <Star size={18} />,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  review_received: {
    icon: <Star size={18} />,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  doctor_verified: {
    icon: <ShieldCheck size={18} />,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
  },
  system: {
    icon: <Bell size={18} />,
    color: 'text-surface-600',
    bg: 'bg-surface-100',
  },
};

// ============================================================
// Props
// ============================================================
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

// ============================================================
// Component
// ============================================================
export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const style = NOTIFICATION_STYLES[notification.type] || NOTIFICATION_STYLES.system;
  const timeAgo = formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.type === 'appointment_completed') {
      const aptId = notification.data?.appointment_id;
      navigate(`/patient/dashboard?rate=${aptId || ''}`);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer',
        notification.is_read
          ? 'bg-white hover:bg-surface-50'
          : 'bg-primary-50/40 hover:bg-primary-50/60'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {/* Icon */}
      <div
        className={cn(
          'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5',
          style.bg,
          style.color
        )}
      >
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug',
              notification.is_read ? 'text-surface-700' : 'text-surface-900 font-medium'
            )}
          >
            {notification.title}
          </p>

          {/* Unread dot */}
          {!notification.is_read && (
            <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary-500" />
          )}
        </div>

        <p className="text-xs text-surface-500 mt-0.5 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <p className="text-[11px] text-surface-400 mt-1">{timeAgo}</p>
      </div>

      {/* Delete button (shown on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="shrink-0 p-1 rounded-md text-surface-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
        aria-label="Delete notification"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
