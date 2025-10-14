import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../utils/secureStorage';
import api from '../lib/api';
import { authAPI } from '../lib/api';
import { useAuth } from './AuthContext';
import {
  Notification,
  NotificationState,
  NotificationAction,
  NotificationContextType,
  NotificationFilters
} from '../types/notifications';

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        pagination: action.payload.pagination,
        unreadCount: action.payload.unreadCount,
        loading: false,
        error: null
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload._id ? action.payload : notification
        )
      };
    
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notification =>
          notification._id !== action.payload
        )
      };
    
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification._id === action.payload
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    default:
      return state;
  }
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const token = useMemo(() => tokenStorage.getToken(), []);

  const socket = useMemo(() => {
    if (!token || !isAuthenticated || !user || socketRef.current) return socketRef.current;
    
    // Creating notification socket
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'https://api.verbfy.com', {
      path: '/socket.io',
      transports: ['polling'],
      forceNew: false,
      withCredentials: true,
      upgrade: false,
      timeout: 30000,
      auth: {
        token: token
      }
    });
    
    socketRef.current = newSocket;
    return newSocket;
  }, [token, isAuthenticated, user]);



  // Fetch notifications from API
  const fetchNotifications = async (filters: NotificationFilters = {}) => {
    // Only fetch if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/api/notifications?${params.toString()}`);
      
      if (response.data.success) {
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: response.data.data
        });
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    // Only mark as read if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await api.patch(`/api/notifications/${id}/read`);
      
      if (response.data.success) {
        dispatch({
          type: 'MARK_AS_READ',
          payload: response.data.data.notification
        });
      }
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      toast.error(errorMessage);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Only mark all as read if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await api.patch('/api/notifications/read-all');
      
      if (response.data.success) {
        dispatch({ type: 'MARK_ALL_AS_READ' });
        toast.success('All notifications marked as read');
      }
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark all notifications as read';
      toast.error(errorMessage);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    // Only delete if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const response = await api.delete(`/api/notifications/${id}`);
      
      if (response.data.success) {
        dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
        toast.success('Notification deleted');
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      toast.error(errorMessage);
    }
  };

  // Add notification to state (for real-time updates)
  const addNotification = (notification: Notification) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    
    // Show toast for new notifications
    const config = getNotificationConfig(notification.type);
    toast.success(
      <div>
        <div className="font-semibold">{notification.title}</div>
        <div className="text-sm opacity-90">{notification.body}</div>
      </div>,
      {
        duration: 5000,
        icon: config.icon,
        style: {
          background: '#363636',
          color: '#fff',
        }
      }
    );
  };

  const getUnreadCount = async () => {
    // Only get unread count if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('NotificationContext: Skipping unread count - not authenticated', { isAuthenticated, user: !!user });
      return;
    }

    console.log('NotificationContext: Getting unread count', { 
      isAuthenticated, 
      userId: user?._id || user?.id,
      hasToken: !!tokenStorage.getToken()
    });

    try {
      const response = await api.get('/api/notifications/unread-count');
      
      console.log('NotificationContext: Unread count response', response.data);
      
      if (response.data.success) {
        dispatch({
          type: 'SET_UNREAD_COUNT',
          payload: response.data.data.unreadCount
        });
      }
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
  };

  // Socket.IO connection and event listeners for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !socket) return;

    // Initiating notification socket connection
    
    // Set up event listeners
    socket.on('connect', () => {
      // Notification socket connected successfully
      
      // Join user's notification room
      if (user?._id) {
        socket.emit('joinNotificationRoom', user._id);
      }
    });

    socket.on('connect_error', (error) => {
      // Socket connection error (expected during initial setup)
      // Don't show error to user, this is normal during connection setup
    });

    socket.on('disconnect', (reason) => {
      // Socket disconnected
      if (reason === 'io server disconnect') {
        // Server disconnected, attempting reconnect
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      // Notification socket reconnected
      if (user?._id) {
        socket.emit('joinNotificationRoom', user._id);
      }
    });

    // Listen for new notifications
    socket.on('notification:new', (data: { notification: Notification }) => {
      addNotification(data.notification);
    });

    // Listen for notification updates
    socket.on('notification:updated', (data: { notification: Notification }) => {
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: data.notification
      });
    });

    // Listen for notification deletions
    socket.on('notification:deleted', (data: { id: string }) => {
      dispatch({
        type: 'DELETE_NOTIFICATION',
        payload: data.id
      });
    });

    // Connect the socket
    socket.connect();
    
    // Store reference
    socketRef.current = socket;

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.off('reconnect_error');
        socket.off('reconnect_failed');
        socket.off('notification:new');
        socket.off('notification:updated');
        socket.off('notification:deleted');
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [isAuthenticated, user, socket]);

  // Initial load - only when user is authenticated
  useEffect(() => {
    const token = tokenStorage.getToken();
    console.log('NotificationContext: useEffect triggered', { 
      isAuthenticated, 
      user: !!user, 
      userId: user?._id || user?.id,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    if (isAuthenticated && user) {
      console.log('NotificationContext: Fetching notifications and unread count');
      fetchNotifications();
      getUnreadCount();
    } else {
      console.log('NotificationContext: Skipping fetch - user not authenticated');
    }
  }, [isAuthenticated, user]);

  // Poll for unread count every 30 seconds as fallback - only when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const value: NotificationContextType = {
    state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}

// Helper function to get notification config
function getNotificationConfig(type: Notification['type']) {
  const configs = {
    message: { icon: '💬' },
    reservation: { icon: '📅' },
    material: { icon: '📚' },
    admin: { icon: '⚙️' },
    lesson: { icon: '🎓' },
    payment: { icon: '💰' },
    system: { icon: '🔔' }
  };
  
  return configs[type] || configs.system;
}