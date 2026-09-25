import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import Spinner from '@/components/common/Spinner';

// ============================================================
// Notification List Dropdown
// ============================================================
interface NotificationListProps {
  onClose: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-xl shadow-modal border border-surface-200 overflow-hidden animate-fade-in z-50"
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors cursor-pointer"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto max-h-[380px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-surface-400">
            <Inbox size={36} className="mb-3" />
            <p className="text-sm font-medium text-surface-500">No notifications yet</p>
            <p className="text-xs text-surface-400 mt-1">
              You'll see updates about your appointments here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-surface-100 px-4 py-2.5">
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-surface-500 hover:text-primary-600 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
