export interface Notification {
  _id: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'message' | 'reservation' | 'material' | 'admin' | 'lesson' | 'payment' | 'system';
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  meta?: {
    senderId?: string;
    lessonId?: string;
    materialId?: string;
    reservationId?: string;
    amount?: number;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  timeAgo?: string;
}

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    unreadCount: number;
  };
  message: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
  message: string;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; pagination: { page: number; limit: number; total: number; pages: number }; unreadCount: number } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_UNREAD_COUNT'; payload: number };

export interface NotificationContextType {
  state: NotificationState;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  getUnreadCount: () => Promise<void>;
}

// Notification type configurations
export const NOTIFICATION_TYPES = {
  message: {
    label: 'Message',
    icon: '💬',
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  reservation: {
    label: 'Reservation',
    icon: '📅',
    color: 'bg-green-500',
    textColor: 'text-green-600'
  },
  material: {
    label: 'Material',
    icon: '📚',
    color: 'bg-purple-500',
    textColor: 'text-purple-600'
  },
  admin: {
    label: 'Admin',
    icon: '⚙️',
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },
  lesson: {
    label: 'Lesson',
    icon: '🎓',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600'
  },
  payment: {
    label: 'Payment',
    icon: '💰',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600'
  },
  system: {
    label: 'System',
    icon: '🔔',
    color: 'bg-gray-500',
    textColor: 'text-gray-600'
  }
} as const;

export const getNotificationConfig = (type: Notification['type']) => {
  return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.system;
};