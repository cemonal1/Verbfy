import React, { useState, useEffect } from 'react';
import { useAdminNotifications } from '../../context/AdminNotificationContext';
import { 
  Bell, 
  AlertTriangle, 
  Shield, 
  Users, 
  CreditCard, 
  GraduationCap, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  X,
  Filter,
  Trash2
} from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminNotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const {
    isConnected,
    systemHealth,
    securityAlerts,
    userActivities,
    paymentNotifications,
    teacherNotifications,
    adminNotifications,
    unreadCount,
    markAsRead,
    clearNotifications
  } = useAdminNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'security' | 'users' | 'payments' | 'teachers' | 'system'>('all');
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'user':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <Info className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filterByTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    switch (filter) {
      case 'today':
        return days === 0;
      case 'week':
        return days <= 7;
      default:
        return true;
    }
  };

  const getAllNotifications = () => {
    const notifications = [
      ...securityAlerts.map(alert => ({
        ...alert,
        category: 'security',
        icon: <Shield className="w-4 h-4 text-red-500" />
      })),
      ...userActivities.map(activity => ({
        ...activity,
        category: 'user',
        icon: <Users className="w-4 h-4 text-blue-500" />
      })),
      ...paymentNotifications.map(payment => ({
        ...payment,
        category: 'payment',
        icon: <CreditCard className="w-4 h-4 text-green-500" />
      })),
      ...teacherNotifications.map(teacher => ({
        ...teacher,
        category: 'teacher',
        icon: <GraduationCap className="w-4 h-4 text-purple-500" />
      })),
      ...adminNotifications.map(admin => ({
        ...admin,
        category: 'system',
        icon: <Info className="w-4 h-4 text-gray-500" />
      }))
    ];

    return notifications
      .filter(notification => filterByTime(notification.timestamp))
      .filter(notification => activeTab === 'all' || notification.category === activeTab)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'security':
        return securityAlerts.filter(alert => filterByTime(alert.timestamp)).length;
      case 'users':
        return userActivities.filter(activity => filterByTime(activity.timestamp)).length;
      case 'payments':
        return paymentNotifications.filter(payment => filterByTime(payment.timestamp)).length;
      case 'teachers':
        return teacherNotifications.filter(teacher => filterByTime(teacher.timestamp)).length;
      case 'system':
        return adminNotifications.filter(admin => filterByTime(admin.timestamp)).length;
      default:
        return getAllNotifications().length;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-96 h-full shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Admin Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-2 text-sm text-gray-600">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex overflow-x-auto">
            {[
              { key: 'all', label: 'All', icon: Bell },
              { key: 'security', label: 'Security', icon: Shield },
              { key: 'users', label: 'Users', icon: Users },
              { key: 'payments', label: 'Payments', icon: CreditCard },
              { key: 'teachers', label: 'Teachers', icon: GraduationCap },
              { key: 'system', label: 'System', icon: Info }
            ].map(tab => {
              const Icon = tab.icon;
              const count = getTabCount(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className="bg-gray-200 text-gray-700 text-xs rounded-full px-1.5 py-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
              </select>
            </div>
            <button
              onClick={clearNotifications}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {getAllNotifications().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bell className="w-12 h-12 mb-2" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {getAllNotifications().map((notification, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <div className="flex items-center space-x-2">
                          {'severity' in notification && (
                            <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor((notification as any).severity)}`}>
                              {(notification as any).severity}
                            </span>
                          )}
                          {'type' in notification && notification.category === 'system' && (
                            <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(notification.type)}`}>
                              {notification.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {(notification as any).message || (notification as any).title || 'No message'}
                      </p>
                      {notification.details && (
                        <div className="mt-2 text-xs text-gray-500">
                          {typeof notification.details === 'object' 
                            ? Object.entries(notification.details).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))
                            : notification.details
                          }
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {((notification as any).adminName || (notification as any).adminId) && (
                          <span className="text-xs text-gray-500">
                            by {(notification as any).adminName || `Admin ${(notification as any).adminId}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health Summary */}
        {systemHealth && (
          <div className="border-t border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">System Health</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded ${systemHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Status: {systemHealth.status}
              </div>
              <div className="p-2 rounded bg-blue-100 text-blue-800">
                Users: {systemHealth.metrics.totalUsers}
              </div>
              <div className="p-2 rounded bg-purple-100 text-purple-800">
                Materials: {systemHealth.metrics.totalMaterials}
              </div>
              <div className="p-2 rounded bg-yellow-100 text-yellow-800">
                Reservations: {systemHealth.metrics.totalReservations}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationPanel;