import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback } from 'react';
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
          notification._id === action.payload._id
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

  // Create socket with optimized settings to avoid WebSocket warnings
  const createSocket = useCallback((tok: string | null) => {
    if (!tok) {
      console.log('🔌 No token available, skipping socket creation');
      return null;
    }

    console.log('🔌 Creating socket with token');
    
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.verbfy.com').replace(/\/$/, '');
    
    const createdSocket = io(base, {
      path: '/socket.io/',
      transports: ['polling'], // Start with polling only to avoid websocket warnings
      withCredentials: true,
      auth: { token: tok },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true
    });

    // Connection event handlers
    createdSocket.on('connect', () => {
      console.log('🔌 Socket connected successfully via polling');
      
      // After successful connection, try to upgrade to websocket silently
      setTimeout(() => {
        try {
          console.log('🔄 Socket connected and ready for real-time communication');
        } catch (e) {
          console.log('Socket setup completed');
        }
      }, 1000);
      
      // Join user's notification room
      if (user?._id) {
        createdSocket.emit('joinNotificationRoom', user._id);
      }
    });

    createdSocket.on('connect_error', (error) => {
      console.log('🔌 Socket connection error (expected during initial setup):', error.message);
      // Don't show error to user, this is normal during connection setup
    });

    createdSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected, attempting reconnect...');
        setTimeout(() => {
          createdSocket.connect();
        }, 1000);
      }
    });

    createdSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      if (user?._id) {
        createdSocket.emit('joinNotificationRoom', user._id);
      }
    });

    createdSocket.on('reconnect_error', (error) => {
      console.log('🔄 Socket reconnection attempt failed:', error.message);
    });

    createdSocket.on('reconnect_failed', () => {
      console.log('🔄 Socket reconnection failed after all attempts');
      // Try to create a new socket
      setTimeout(() => {
        if (tok) {
          const newSocket = createSocket(tok);
          if (newSocket) {
            // setSocket(newSocket); // This line was removed as per the new_code, as the variable 'setSocket' is not defined.
          }
        }
      }, 5000);
    });

    // Listen for new notifications
    createdSocket.on('notification:new', (data: { notification: Notification }) => {
      addNotification(data.notification);
    });

    // Listen for notification updates
    createdSocket.on('notification:updated', (data: { notification: Notification }) => {
      dispatch({
        type: 'UPDATE_NOTIFICATION',
        payload: data.notification
      });
    });

    // Listen for notification deletions
    createdSocket.on('notification:deleted', (data: { id: string }) => {
      dispatch({
        type: 'DELETE_NOTIFICATION',
        payload: data.id
      });
    });

    // Connect with delay to ensure token is fully processed
    setTimeout(() => {
      console.log('🔌 Initiating socket connection...');
      createdSocket.connect();
    }, 500);
    
    return createdSocket;
  }, [user?._id]);

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
      return;
    }

    try {
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        dispatch({
          type: 'SET_UNREAD_COUNT',
          payload: response.data.data.unreadCount
        });
      }
    } catch (error: any) {
      console.error('Error getting unread count:', error);
    }
  };

  // Socket.IO connection and event listeners for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isActive = true;
    let localSocket: Socket | null = null;

    (async () => {
      let tok = tokenStorage.getToken();
      if (!tok) {
        try {
          const r = await authAPI.refreshToken();
          const access = r?.data?.accessToken;
          if (access) { 
            tokenStorage.setToken(access); 
            tok = access; 
          }
        } catch (_) {
          console.warn('Could not refresh token for socket connection');
          return;
        }
      }

      if (!isActive) return;

      const socket = createSocket(tok);
      if (socket) {
        localSocket = socket;
        socketRef.current = socket;
      }
    })();

    return () => {
      isActive = false;
      const socket = socketRef.current || localSocket;
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
  }, [isAuthenticated, user, createSocket]);

  // Initial load - only when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      getUnreadCount();
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