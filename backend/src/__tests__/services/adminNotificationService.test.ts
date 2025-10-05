import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { AdminNotificationService } from '../../services/adminNotificationService';
import { 
  SystemHealthNotification, 
  SecurityAlertNotification, 
  UserActivityNotification, 
  PaymentNotification, 
  TeacherNotification 
} from '../../types/adminNotifications';
import { jest, expect, describe, it, beforeAll, beforeEach, afterAll } from '@jest/globals'

describe('AdminNotificationService', () => {
  let adminNotificationService: AdminNotificationService;
  let mockIo: jest.Mocked<SocketIOServer>;
  let mockAdminNamespace: any;

  beforeEach(() => {
    // Create mock Socket.IO server and admin namespace
    mockAdminNamespace = {
      use: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      sockets: new Map(),
      adapter: {
        rooms: new Map()
      }
    };

    mockIo = {
      of: jest.fn().mockReturnValue(mockAdminNamespace),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis()
    } as any;

    adminNotificationService = new AdminNotificationService(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitSystemHealth', () => {
    it('should emit system health notification to admin namespace', () => {
      const healthData: SystemHealthNotification = {
        type: 'system_health',
        status: 'healthy',
        timestamp: new Date(),
        metrics: {
          cpu: 45.2,
          memory: 67.8,
          disk: 23.1,
          database: 'connected',
          redis: 'connected'
        },
        uptime: 86400000,
        activeUsers: 150,
        activeConnections: 75
      };

      adminNotificationService.emitSystemHealth(healthData);

      expect(mockIo.of).toHaveBeenCalledWith('/admin');
      expect(mockIo.of).toHaveBeenCalledTimes(2);
    });

    it('should emit to all connected admin clients', () => {
      const alertData: SecurityAlertNotification = {
        type: 'security_alert',
        alertType: 'failed_login',
        severity: 'medium',
        message: 'Multiple failed login attempts detected',
        timestamp: new Date(),
        userId: '507f1f77bcf86cd799439011',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      adminNotificationService.emitSecurityAlert(alertData);

      expect(mockAdminNamespace.emit).toHaveBeenCalledWith('security_alert', alertData);
    });
  });
});