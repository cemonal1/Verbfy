import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createLogger } from '../utils/logger';
const logger = createLogger('AdminNotificationContext');
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; connection: string };
    cache: { status: string };
  };
  metrics: {
    responseTime: string;
    totalUsers: number;
    totalMaterials: number;
    totalReservations: number;
  };
  uptime: number;
}

interface SecurityAlert {
  type: 'failed_login' | 'suspicious_activity' | 'multiple_failures' | 'unauthorized_access';
  message: string;
  severity: 'low' | 'medium' | 'high';
  userId?: string;
  ip?: string;
  timestamp: string;
  details?: any;
}

interface UserActivity {
  type: 'registration' | 'login' | 'logout' | 'profile_update' | 'role_change' | 'ban' | 'unban';
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  details?: any;
  adminId?: string;
  adminName?: string;
}

interface PaymentNotification {
  type: 'new_payment' | 'payment_approved' | 'payment_rejected' | 'refund_issued';
  paymentId: string;
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  timestamp: string;
  adminId?: string;
  adminName?: string;
  details?: any;
}

interface TeacherNotification {
  type: 'new_application' | 'teacher_approved' | 'teacher_rejected';
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  timestamp: string;
  adminId?: string;
  adminName?: string;
  details?: any;
}

interface AdminNotification {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  adminId?: string;
  adminName?: string;
  details?: any;
}

interface AdminNotificationContextType {
  socket: Socket | null;
  isConnected: boolean;
  systemHealth: SystemHealth | null;
  securityAlerts: SecurityAlert[];
  userActivities: UserActivity[];
  paymentNotifications: PaymentNotification[];
  teacherNotifications: TeacherNotification[];
  adminNotifications: AdminNotification[];
  unreadCount: number;
  markAsRead: () => void;
  clearNotifications: () => void;
  subscribeToSystemHealth: () => void;
  subscribeToSecurityAlerts: () => void;
  subscribeToUserActivities: () => void;
  sendAdminMessage: (message: string) => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType | undefined>(undefined);

interface AdminNotificationProviderProps {
  children: ReactNode;
}

export const AdminNotificationProvider: React.FC<AdminNotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentNotification[]>([]);
  const [teacherNotifications, setTeacherNotifications] = useState<TeacherNotification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only connect if user is admin
    if (user?.role === 'admin') {
      const { tokenStorage } = require('../utils/secureStorage');
      const token = tokenStorage.getToken();
      
      if (!token) return;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      const newSocket = io(`${backendUrl}/admin`, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      newSocket.on('connect', () => {
        logger.debug('Debug', { data: 'Admin Socket.IO connected');
        setIsConnected(true);
        
        // Join admin room
        newSocket.emit('admin:join-room');
      });

      newSocket.on('connect_error', (error) => {
        logger.error('Error', { error: 'Admin Socket.IO connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        logger.debug('Debug', { data: 'Admin Socket.IO disconnected:', reason);
        setIsConnected(false);
      });

      // System health events
      newSocket.on('admin:system-health-alert', (data: SystemHealth) => {
        setSystemHealth(data);
        setUnreadCount(prev => prev + 1);
      });

      // Security alert events
      newSocket.on('admin:security-alert', (data: SecurityAlert) => {
        setSecurityAlerts(prev => [data, ...prev.slice(0, 49)]); // Keep last 50
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('admin:urgent-security-alert', (data: SecurityAlert) => {
        setSecurityAlerts(prev => [data, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification for urgent alerts
        if (Notification.permission === 'granted') {
          new Notification('Urgent Security Alert', {
            body: data.message,
            icon: '/icons/warning.png'
          });
        }
      });

      // User activity events
      newSocket.on('admin:user-activity', (data: UserActivity) => {
        setUserActivities(prev => [data, ...prev.slice(0, 99)]); // Keep last 100
        setUnreadCount(prev => prev + 1);
      });

      // Payment notification events
      newSocket.on('admin:payment-notification', (data: PaymentNotification) => {
        setPaymentNotifications(prev => [data, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
      });

      // Teacher notification events
      newSocket.on('admin:teacher-notification', (data: TeacherNotification) => {
        setTeacherNotifications(prev => [data, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
      });

      // General admin notification events
      newSocket.on('admin:notification', (data: AdminNotification) => {
        setAdminNotifications(prev => [data, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
      });

      // Cache notification events
      newSocket.on('admin:cache-notification', (data: any) => {
        setAdminNotifications(prev => [{
          type: data.success ? 'success' : 'error',
          title: 'Cache Management',
          message: data.success ? 'Cache cleared successfully' : 'Cache operation failed',
          timestamp: data.timestamp,
          adminId: data.adminId,
          adminName: data.adminName,
          details: data.details
        }, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
      });

      // System stats update events
      newSocket.on('admin:stats-update', (data: any) => {
        // Update system health with new stats
        setSystemHealth(prev => prev ? { ...prev, metrics: { ...prev.metrics, ...data } } : null);
      });

      // Broadcast events
      newSocket.on('admin:broadcast', (data: any) => {
        setAdminNotifications(prev => [{
          type: data.type === 'alert' ? 'warning' : 'info',
          title: data.title,
          message: data.message,
          timestamp: data.timestamp,
          adminId: data.fromAdminId,
          adminName: data.fromAdminName,
          details: { priority: data.priority }
        }, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);

        // Show browser notification for urgent broadcasts
        if (data.priority === 'urgent' && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/icons/announcement.png'
          });
        }
      });

      setSocket(newSocket);

      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setSecurityAlerts([]);
    setUserActivities([]);
    setPaymentNotifications([]);
    setTeacherNotifications([]);
    setAdminNotifications([]);
    setUnreadCount(0);
  };

  const subscribeToSystemHealth = () => {
    if (socket) {
      socket.emit('admin:subscribe-system-health');
    }
  };

  const subscribeToSecurityAlerts = () => {
    if (socket) {
      socket.emit('admin:subscribe-security-alerts');
    }
  };

  const subscribeToUserActivities = () => {
    if (socket) {
      socket.emit('admin:subscribe-user-activities');
    }
  };

  const sendAdminMessage = (message: string) => {
    if (socket) {
      socket.emit('admin:message', { message });
    }
  };

  const value: AdminNotificationContextType = {
    socket,
    isConnected,
    systemHealth,
    securityAlerts,
    userActivities,
    paymentNotifications,
    teacherNotifications,
    adminNotifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    subscribeToSystemHealth,
    subscribeToSecurityAlerts,
    subscribeToUserActivities,
    sendAdminMessage
  };

  return (
    <AdminNotificationContext.Provider value={value}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = (): AdminNotificationContextType => {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationProvider');
  }
  return context;
};