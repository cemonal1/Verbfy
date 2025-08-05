import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationBadgeProps {
  onClick?: () => void;
  className?: string;
  showCount?: boolean;
}

export default function NotificationBadge({ 
  onClick, 
  className = '', 
  showCount = true 
}: NotificationBadgeProps) {
  const { state } = useNotifications();
  const { unreadCount } = state;

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors ${className}`}
      aria-label={`${unreadCount} unread notifications`}
    >
      {/* Bell Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v4.5l2.25 2.25a2.25 2.25 0 0 1-2.25 2.25h-13.5a2.25 2.25 0 0 1-2.25-2.25L6 14.25V9.75a6 6 0 0 1 6-6z"
        />
      </svg>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[20px] h-5">
          {showCount && unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </button>
  );
} 