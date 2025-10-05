import { Server as SocketIOServer } from 'socket.io';
import { createLogger } from '../utils/logger';
import { 
  SystemHealthNotification, 
  SecurityAlertNotification, 
  UserActivityNotification,
  PaymentNotification,
  TeacherNotification,
  MaterialNotification,
  AdminNotification,
  BroadcastNotification
} from '../types/adminNotifications';
import jwt from 'jsonwebtoken'
import User from '../models/User'

const adminNotificationLogger = createLogger('AdminNotification');

export class AdminNotificationService {
  private io: SocketIOServer | null = null;

  constructor(io?: SocketIOServer) {
    if (io) {
      this.io = io;
      adminNotificationLogger.info('Admin notification service initialized with Socket.IO server');
      // Ensure admin namespace exists and has auth middleware
      this.initializeAdminNamespace();
    }
  }

  setSocketServer(io: SocketIOServer) {
    this.io = io;
    adminNotificationLogger.info('Admin notification service initialized with Socket.IO server');
    // Ensure admin namespace exists and has auth middleware
    this.initializeAdminNamespace();
  }

  private getAdminNamespace() {
    if (!this.io) {
      adminNotificationLogger.warn('Socket.IO server not initialized');
      return null;
    }
    return this.io.of('/admin');
  }

  // Initialize admin namespace and authentication middleware
  private initializeAdminNamespace() {
    if (!this.io) return;
    const adminNamespace = this.io.of('/admin');

    // Attach authentication middleware for admin namespace
    adminNamespace.use(async (socket, next) => {
      try {
        const auth = socket.handshake.auth as any;
        const token = auth?.token;

        if (!token) {
          return next(new Error('Authentication failed: No token provided'));
        }

        let payload: any;
        try {
          payload = jwt.verify(token, process.env.JWT_SECRET as string);
        } catch (err: any) {
          return next(new Error('Authentication failed: Invalid token'));
        }

        const userId = payload?.userId || payload?.id;
        if (!userId) {
          return next(new Error('Authentication failed: Invalid token payload'));
        }

        try {
          const user = await User.findById(userId);
          if (!user) {
            return next(new Error('Authentication failed: User not found'));
          }
          if (user.role !== 'admin') {
            return next(new Error('Authentication failed: Unauthorized'));
          }

          (socket as any).user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };

          next();
        } catch (dbErr: any) {
          return next(new Error(`Authentication failed: ${dbErr?.message || 'Database error'}`));
        }
      } catch (error) {
        return next(new Error('Authentication failed'));
      }
    });

    // Optionally handle connection events
    adminNamespace.on('connection', (socket) => {
      adminNotificationLogger.info('Admin namespace connected:', (socket as any).user?.name || 'unknown');
    });
  }

  // System health notifications
  emitSystemHealthAlert(data: {
    type: 'database_down' | 'high_memory' | 'high_cpu' | 'cache_error';
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('system-health').emit('admin:system-health-alert', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info('System health alert emitted:', data.type);
  }

  // System health monitoring
  emitSystemHealth(data: {
    status: 'normal' | 'healthy' | 'warning' | 'critical';
    cpu: number;
    memory: number;
    disk: number;
    activeUsers: number;
    responseTime: number;
    timestamp: Date;
  } | SystemHealthNotification) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    // Normalize payload from either backend type or integration test shape
    const payload = 'metrics' in data
      ? {
          status: (data as any).status as 'normal' | 'healthy' | 'warning' | 'critical',
          cpu: data.metrics.cpu,
          memory: data.metrics.memory,
          disk: data.metrics.disk,
          activeUsers: data.activeUsers,
          responseTime: 0,
          timestamp: data.timestamp,
        }
      : {
          ...data,
          status: (data as any).status as 'normal' | 'healthy' | 'warning' | 'critical',
        };

    adminNamespace.emit('systemHealth', payload);
    adminNotificationLogger.info('System health data emitted:', payload.status);
  }

  // Security alerts
  emitSecurityAlert(data: SecurityAlertNotification | {
    type?: 'failed_login' | 'suspicious_activity' | 'unauthorized_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: any;
    timestamp: Date;
    // legacy/unit-test shape
    alertType?: 'failed_login' | 'suspicious_activity' | 'multiple_failures' | 'unauthorized_access';
    userId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    // If payload matches SecurityAlertNotification shape, emit legacy event with exact payload for unit tests
    if ((data as SecurityAlertNotification).type === 'security_alert' && (data as SecurityAlertNotification).alertType) {
      const legacy = data as SecurityAlertNotification;

      // Normalize for modern event consumers
      const normalizedType: 'failed_login' | 'suspicious_activity' | 'unauthorized_access' =
        legacy.alertType === 'multiple_failures'
          ? 'failed_login'
          : (legacy.alertType as 'failed_login' | 'suspicious_activity' | 'unauthorized_access');

      const modernPayload = {
        type: normalizedType,
        severity: legacy.severity,
        message: legacy.message,
        details: legacy.details ?? {
          userId: legacy.userId,
          ip: legacy.ip,
          userAgent: legacy.userAgent,
        },
        timestamp: legacy.timestamp,
      };

      // Emit modern and legacy event names
      adminNamespace.emit('securityAlert', modernPayload);
      adminNamespace.emit('security_alert', legacy);

      // Also send to admin room for high severity alerts
      if (legacy.severity === 'high' || legacy.severity === 'critical') {
        adminNamespace.to('admin-room').emit('admin:urgent-security-alert', {
          ...modernPayload,
          timestamp: new Date().toISOString(),
        });
      }

      adminNotificationLogger.info('Security alert emitted:', normalizedType);
      return;
    }

    // Build normalized payload for integration tests expected shape (non-typed legacy input)
    const input = data as {
      type?: 'failed_login' | 'suspicious_activity' | 'unauthorized_access';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      details?: any;
      timestamp: Date;
      alertType?: 'failed_login' | 'suspicious_activity' | 'multiple_failures' | 'unauthorized_access';
      userId?: string;
      ip?: string;
      userAgent?: string;
    };

    const normalizedType = (input.type ?? input.alertType ?? 'suspicious_activity') as 'failed_login' | 'suspicious_activity' | 'unauthorized_access';
    const modernPayload = {
      type: normalizedType,
      severity: input.severity,
      message: input.message,
      details: input.details ?? {
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
      },
      timestamp: input.timestamp,
    };

    // Emit modern event name used by integration tests
    adminNamespace.emit('securityAlert', modernPayload);

    // Emit legacy event name used by unit tests with original payload shape when available
    const legacyPayload = {
      type: 'security_alert' as const,
      alertType: (input.alertType ?? normalizedType) as 'failed_login' | 'suspicious_activity' | 'multiple_failures' | 'unauthorized_access',
      severity: input.severity,
      message: input.message,
      timestamp: input.timestamp,
      userId: input.userId,
      ip: input.ip,
      userAgent: input.userAgent,
      details: input.details,
    };
    adminNamespace.emit('security_alert', legacyPayload);

    // Also send to admin room for high severity alerts
    if (input.severity === 'high' || input.severity === 'critical') {
      adminNamespace.to('admin-room').emit('admin:urgent-security-alert', {
        ...modernPayload,
        timestamp: new Date().toISOString(),
      });
    }

    adminNotificationLogger.info('Security alert emitted:', normalizedType);
  }

  // User activity notifications
  emitUserActivity(data: UserActivityNotification | {
    userId: string;
    userName: string;
    action: 'registration' | 'login' | 'logout' | 'profile_update' | 'role_change' | 'ban' | 'unban' | 'password_change';
    userEmail?: string;
    details?: any;
    timestamp: Date;
    adminId?: string;
    adminName?: string;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    // Normalize payload to ensure 'action' is present for consumers/tests
    const payload = {
      ...(data as any),
      action: (data as any).action ?? (data as any).activityType,
    };

    // Align event name with tests
    adminNamespace.emit('userActivity', payload);

    adminNotificationLogger.info(`User activity emitted: ${payload.action} for user: ${payload.userName}`);
  }

  // Payment notifications
  emitPaymentNotification(data: {
    type: 'payment_received' | 'payment_failed';
    userId: string;
    userName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
    reason?: string;
    timestamp: Date;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.emit('paymentNotification', data);

    adminNotificationLogger.info(`Payment notification emitted: ${data.type} for user: ${data.userName}`);
  }

  // Teacher approval notifications
  emitTeacherNotification(data: TeacherNotification | {
    type: 'application_submitted' | 'status_updated' | 'teacher_approved' | 'teacher_rejected';
    teacherId: string;
    teacherName: string;
    teacherEmail: string;
    timestamp: Date;
    subject?: string;
    experience?: string;
    adminId?: string;
    adminName?: string;
    details?: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    // Normalize payload to ensure 'type' is present for consumers/tests
    const payload = {
      ...(data as any),
      type: (data as any).type ?? (data as any).teacherType,
    };

    // Align event name with tests
    adminNamespace.emit('teacherNotification', payload);

    adminNotificationLogger.info(`Teacher notification emitted: ${payload.type} for teacher: ${payload.teacherName}`);
  }

  // Material moderation notifications
  emitMaterialNotification(data: {
    type: 'new_material' | 'material_approved' | 'material_rejected' | 'material_flagged';
    materialId: string;
    materialTitle: string;
    authorId: string;
    authorName: string;
    adminId?: string;
    adminName?: string;
    details?: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('admin-room').emit('admin:material-notification', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info(`Material notification emitted: ${data.type} for material: ${data.materialTitle}`);
  }

  // General admin notifications
  emitAdminNotification(data: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    adminId?: string;
    adminName?: string;
    details?: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('admin-room').emit('admin:notification', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info(`Admin notification emitted: ${data.type} - ${data.title}`);
  }

  // Cache management notifications
  emitCacheNotification(data: {
    type: 'cache_cleared' | 'cache_error' | 'cache_warning';
    pattern?: string;
    success: boolean;
    adminId: string;
    adminName: string;
    details?: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('admin-room').emit('admin:cache-notification', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info('Cache notification emitted:', data.type);
  }

  // System statistics updates
  emitSystemStatsUpdate(data: {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalReservations: number;
    totalMaterials: number;
    activeLessons: number;
    systemHealth: any;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('admin-room').emit('admin:stats-update', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info('System stats update emitted');
  }

  // Broadcast message to all admins
  broadcastToAdmins(data: {
    type: 'announcement' | 'alert' | 'maintenance';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    fromAdminId?: string;
    fromAdminName?: string;
  }) {
    const adminNamespace = this.getAdminNamespace();
    if (!adminNamespace) return;

    adminNamespace.to('admin-room').emit('admin:broadcast', {
      ...data,
      timestamp: new Date().toISOString()
    });

    adminNotificationLogger.info('Broadcast message sent to all admins:', data.title);
  }
}

// Export singleton instance
export const adminNotificationService = new AdminNotificationService();