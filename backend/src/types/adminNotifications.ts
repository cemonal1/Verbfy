// Admin Notification Types for Backend

export interface SystemHealthNotification {
  type: 'system_health';
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    database: string;
    redis: string;
  };
  uptime: number;
  activeUsers: number;
  activeConnections: number;
}

export interface SecurityAlertNotification {
  type: 'security_alert';
  alertType: 'failed_login' | 'suspicious_activity' | 'multiple_failures' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

export interface UserActivityNotification {
  type: 'user_activity';
  activityType: 'registration' | 'login' | 'logout' | 'profile_update' | 'role_change' | 'ban' | 'unban';
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: Date;
  details?: any;
  adminId?: string;
  adminName?: string;
}

export interface PaymentNotification {
  type: 'payment';
  paymentType: 'new_payment' | 'payment_approved' | 'payment_rejected' | 'refund_issued';
  paymentId: string;
  amount: number;
  currency: string;
  userId: string;
  userName: string;
  timestamp: Date;
  adminId?: string;
  adminName?: string;
  details?: any;
}

export interface TeacherNotification {
  type: 'teacher';
  teacherType: 'new_application' | 'teacher_approved' | 'teacher_rejected';
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  timestamp: Date;
  adminId?: string;
  adminName?: string;
  details?: any;
}

export interface MaterialNotification {
  type: 'material';
  materialType: 'new_material' | 'material_approved' | 'material_rejected' | 'material_flagged';
  materialId: string;
  materialTitle: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  adminId?: string;
  adminName?: string;
  details?: any;
}

export interface AdminNotification {
  type: 'admin';
  notificationType: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  adminId?: string;
  adminName?: string;
  details?: any;
}

export interface BroadcastNotification {
  type: 'broadcast';
  broadcastType: 'announcement' | 'alert' | 'maintenance';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  fromAdminId?: string;
  fromAdminName?: string;
}

// Union type for all admin notifications
export type AdminNotificationType = 
  | SystemHealthNotification
  | SecurityAlertNotification
  | UserActivityNotification
  | PaymentNotification
  | TeacherNotification
  | MaterialNotification
  | AdminNotification
  | BroadcastNotification;

// Socket event types
export interface AdminSocketEvents {
  'admin:system-health': SystemHealthNotification;
  'admin:security-alert': SecurityAlertNotification;
  'admin:user-activity': UserActivityNotification;
  'admin:payment-notification': PaymentNotification;
  'admin:teacher-notification': TeacherNotification;
  'admin:material-notification': MaterialNotification;
  'admin:notification': AdminNotification;
  'admin:broadcast': BroadcastNotification;
}

// Admin room types
export type AdminRoom = 
  | 'admin-room'
  | 'system-health'
  | 'security-alerts'
  | 'user-activities'
  | 'payment-notifications'
  | 'teacher-notifications'
  | 'material-notifications';