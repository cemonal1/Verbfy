import React, { useState } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import AdminNotificationPanel from './AdminNotificationPanel';

const AdminNotificationBell: React.FC = () => {
  const { isConnected, unreadCount } = useAdminNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={togglePanel}
          className={`relative p-2 rounded-lg transition-colors ${
            isPanelOpen 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          title={`${unreadCount} unread notifications`}
        >
          <Bell className="w-6 h-6" />
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Connection status indicator */}
          <div className="absolute -bottom-1 -right-1">
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
          </div>
        </button>

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-lg animate-pulse bg-blue-200 opacity-30 pointer-events-none" />
        )}
      </div>

      {/* Notification Panel */}
      <AdminNotificationPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </>
  );
};

export default AdminNotificationBell;