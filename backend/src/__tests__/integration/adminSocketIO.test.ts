import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../models/User';
import { adminNotificationService } from '../../services/adminNotificationService';
import { describe, it, expect, beforeAll, beforeEach, afterAll, jest } from '@jest/globals'

describe('Admin Socket.IO Integration Tests', () => {
  let httpServer: any;
  let io: Server;
  let adminClientSocket: ClientSocket;
  let studentClientSocket: ClientSocket;
  let adminUser: any;
  let studentUser: any;
  let adminToken: string;
  let studentToken: string;


  const port = 3001; // Use different port for testing

  beforeAll(async () => {
    // Database connection is handled in Jest setup

    // Create HTTP server
    httpServer = createServer();
    
    // Initialize Socket.IO server
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Initialize admin notification service
    adminNotificationService.setSocketServer(io);

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(port, resolve);
    });
  });

  afterAll(async () => {
    // Close all connections
    if (adminClientSocket?.connected) {
      adminClientSocket.disconnect();
    }
    if (studentClientSocket?.connected) {
      studentClientSocket.disconnect();
    }
    
    io.close();
    httpServer.close();
    // Database connection cleanup is handled in Jest setup
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@verbfy.com',
      password: 'hashedpassword',
      role: 'admin',
      isEmailVerified: true
    });

    studentUser = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'hashedpassword',
      role: 'student',
      isEmailVerified: true
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    studentToken = jwt.sign(
      { userId: studentUser._id, role: 'student' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Disconnect any existing connections
    if (adminClientSocket?.connected) {
      adminClientSocket.disconnect();
    }
    if (studentClientSocket?.connected) {
      studentClientSocket.disconnect();
    }
  });

  describe('Admin Namespace Authentication', () => {
    it('should allow admin users to connect to admin namespace', (done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: {
          token: adminToken
        }
      });

      adminClientSocket.on('connect', () => {
        expect(adminClientSocket.connected).toBe(true);
        done();
      });

      adminClientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject non-admin users from admin namespace', (done) => {
      studentClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: {
          token: studentToken
        }
      });

      studentClientSocket.on('connect', () => {
        done(new Error('Student should not be able to connect to admin namespace'));
      });

      studentClientSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        done();
      });
    });

    it('should reject connections without valid token', (done) => {
      const invalidSocket = Client(`http://localhost:${port}/admin`, {
        auth: {
          token: 'invalid-token'
        }
      });

      invalidSocket.on('connect', () => {
        done(new Error('Invalid token should not allow connection'));
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        invalidSocket.disconnect();
        done();
      });
    });

    it('should reject connections without token', (done) => {
      const noTokenSocket = Client(`http://localhost:${port}/admin`);

      noTokenSocket.on('connect', () => {
        done(new Error('No token should not allow connection'));
      });

      noTokenSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        noTokenSocket.disconnect();
        done();
      });
    });
  });

  describe('System Health Notifications', () => {
    beforeEach((done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });
      adminClientSocket.on('connect', done);
    });

    it('should emit system health notifications to admin clients', (done) => {
      const healthData = {
        status: 'warning' as const,
        cpu: 85,
        memory: 90,
        disk: 75,
        activeUsers: 150,
        responseTime: 250,
        timestamp: new Date()
      };

      adminClientSocket.on('systemHealth', (data) => {
        expect(data.status).toBe(healthData.status);
        expect(data.cpu).toBe(healthData.cpu);
        expect(data.memory).toBe(healthData.memory);
        expect(data.disk).toBe(healthData.disk);
        expect(data.activeUsers).toBe(healthData.activeUsers);
        expect(data.responseTime).toBe(healthData.responseTime);
        done();
      });

      // Emit system health notification
      adminNotificationService.emitSystemHealth(healthData);
    });

    it('should handle critical system health alerts', (done) => {
      const criticalHealthData = {
        status: 'critical' as const,
        cpu: 95,
        memory: 98,
        disk: 90,
        activeUsers: 200,
        responseTime: 500,
        timestamp: new Date()
      };

      adminClientSocket.on('systemHealth', (data) => {
        expect(data.status).toBe('critical');
        expect(data.cpu).toBeGreaterThan(90);
        expect(data.memory).toBeGreaterThan(90);
        done();
      });

      adminNotificationService.emitSystemHealth(criticalHealthData);
    });
  });

  describe('Security Alert Notifications', () => {
    beforeEach((done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });
      adminClientSocket.on('connect', done);
    });

    it('should emit security alerts to admin clients', (done) => {
      const securityAlert = {
        type: 'failed_login' as const,
        severity: 'high' as const,
        message: 'Multiple failed login attempts detected',
        details: {
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          attempts: 5,
          timeWindow: '5 minutes'
        },
        timestamp: new Date()
      };

      adminClientSocket.on('securityAlert', (data) => {
        expect(data.type).toBe(securityAlert.type);
        expect(data.severity).toBe(securityAlert.severity);
        expect(data.message).toBe(securityAlert.message);
        expect(data.details.ip).toBe(securityAlert.details.ip);
        expect(data.details.attempts).toBe(securityAlert.details.attempts);
        done();
      });

      adminNotificationService.emitSecurityAlert(securityAlert);
    });

    it('should handle different types of security alerts', (done) => {
      const alerts = [
        {
          type: 'suspicious_activity' as const,
          severity: 'medium' as const,
          message: 'Unusual access pattern detected',
          details: { userId: studentUser._id.toString(), pattern: 'rapid_requests' },
          timestamp: new Date()
        },
        {
          type: 'unauthorized_access' as const,
          severity: 'critical' as const,
          message: 'Unauthorized admin access attempt',
          details: { ip: '10.0.0.1', endpoint: '/admin/users' },
          timestamp: new Date()
        }
      ];

      let receivedCount = 0;
      adminClientSocket.on('securityAlert', (data) => {
        receivedCount++;
        expect(['suspicious_activity', 'unauthorized_access']).toContain(data.type);
        expect(['medium', 'critical']).toContain(data.severity);
        
        if (receivedCount === alerts.length) {
          done();
        }
      });

      alerts.forEach(alert => {
        adminNotificationService.emitSecurityAlert(alert);
      });
    });
  });

  describe('User Activity Notifications', () => {
    beforeEach((done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });
      adminClientSocket.on('connect', done);
    });

    it('should emit user activity notifications', (done) => {
      const userActivity = {
        userId: studentUser._id.toString(),
        userName: studentUser.name,
        action: 'login' as const,
        details: {
          ip: '192.168.1.50',
          userAgent: 'Mozilla/5.0...',
          location: 'New York, US'
        },
        timestamp: new Date()
      };

      adminClientSocket.on('userActivity', (data) => {
        expect(data.userId).toBe(userActivity.userId);
        expect(data.userName).toBe(userActivity.userName);
        expect(data.action).toBe(userActivity.action);
        expect(data.details.ip).toBe(userActivity.details.ip);
        done();
      });

      adminNotificationService.emitUserActivity(userActivity);
    });

    it('should handle different user actions', (done) => {
      const actions = ['login', 'logout', 'registration', 'profile_update', 'password_change'] as const;
      let receivedCount = 0;

      adminClientSocket.on('userActivity', (data) => {
        receivedCount++;
        expect(actions).toContain(data.action);
        
        if (receivedCount === actions.length) {
          done();
        }
      });

      actions.forEach(action => {
        adminNotificationService.emitUserActivity({
          userId: studentUser._id.toString(),
          userName: studentUser.name,
          action,
          details: { ip: '192.168.1.50' },
          timestamp: new Date()
        });
      });
    });
  });

  describe('Payment Notifications', () => {
    beforeEach((done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });
      adminClientSocket.on('connect', done);
    });

    it('should emit payment notifications', (done) => {
      const paymentNotification = {
        type: 'payment_received' as const,
        userId: studentUser._id.toString(),
        userName: studentUser.name,
        amount: 99.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        transactionId: 'txn_123456789',
        timestamp: new Date()
      };

      adminClientSocket.on('paymentNotification', (data) => {
        expect(data.type).toBe(paymentNotification.type);
        expect(data.userId).toBe(paymentNotification.userId);
        expect(data.amount).toBe(paymentNotification.amount);
        expect(data.currency).toBe(paymentNotification.currency);
        expect(data.transactionId).toBe(paymentNotification.transactionId);
        done();
      });

      adminNotificationService.emitPaymentNotification(paymentNotification);
    });

    it('should handle payment failures', (done) => {
      const failedPayment = {
        type: 'payment_failed' as const,
        userId: studentUser._id.toString(),
        userName: studentUser.name,
        amount: 49.99,
        currency: 'USD',
        paymentMethod: 'credit_card',
        reason: 'insufficient_funds',
        timestamp: new Date()
      };

      adminClientSocket.on('paymentNotification', (data) => {
        expect(data.type).toBe('payment_failed');
        expect(data.reason).toBe('insufficient_funds');
        done();
      });

      adminNotificationService.emitPaymentNotification(failedPayment);
    });
  });

  describe('Teacher Notifications', () => {
    beforeEach((done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });
      adminClientSocket.on('connect', done);
    });

    it('should emit teacher application notifications', (done) => {
      const teacherNotification = {
        type: 'application_submitted' as const,
        teacherId: new mongoose.Types.ObjectId().toString(),
        teacherName: 'John Doe',
        teacherEmail: 'john.doe@example.com',
        subject: 'Mathematics',
        experience: '5 years',
        timestamp: new Date()
      };

      adminClientSocket.on('teacherNotification', (data) => {
        expect(data.type).toBe(teacherNotification.type);
        expect(data.teacherName).toBe(teacherNotification.teacherName);
        expect(data.subject).toBe(teacherNotification.subject);
        expect(data.experience).toBe(teacherNotification.experience);
        done();
      });

      adminNotificationService.emitTeacherNotification(teacherNotification);
    });

    it('should handle teacher status updates', (done) => {
      const statusUpdate = {
        type: 'status_updated' as const,
        teacherId: new mongoose.Types.ObjectId().toString(),
        teacherName: 'Jane Smith',
        teacherEmail: 'jane.smith@example.com',
        oldStatus: 'pending',
        newStatus: 'approved',
        timestamp: new Date()
      };

      adminClientSocket.on('teacherNotification', (data) => {
        expect(data.type).toBe('status_updated');
        expect(data.oldStatus).toBe('pending');
        expect(data.newStatus).toBe('approved');
        done();
      });

      adminNotificationService.emitTeacherNotification(statusUpdate);
    });
  });

  describe('Multiple Admin Clients', () => {
    let secondAdminSocket: ClientSocket;
    let secondAdminUser: any;
    let secondAdminToken: string;

    beforeEach(async () => {
      // Create second admin user
      secondAdminUser = await User.create({
        name: 'Second Admin',
        email: 'admin2@verbfy.com',
        password: 'hashedpassword',
        role: 'admin',
        isEmailVerified: true
      });

      secondAdminToken = jwt.sign(
        { userId: secondAdminUser._id, role: 'admin' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      // Connect both admin clients
      await new Promise<void>((resolve) => {
        adminClientSocket = Client(`http://localhost:${port}/admin`, {
          auth: { token: adminToken }
        });
        adminClientSocket.on('connect', resolve);
      });

      await new Promise<void>((resolve) => {
        secondAdminSocket = Client(`http://localhost:${port}/admin`, {
          auth: { token: secondAdminToken }
        });
        secondAdminSocket.on('connect', resolve);
      });
    });

    afterEach(() => {
      if (secondAdminSocket?.connected) {
        secondAdminSocket.disconnect();
      }
    });

    it('should broadcast notifications to all connected admin clients', (done) => {
      const systemHealth = {
        status: 'healthy' as const,
        cpu: 45,
        memory: 60,
        disk: 30,
        activeUsers: 100,
        responseTime: 150,
        timestamp: new Date()
      };

      let receivedCount = 0;
      const checkComplete = () => {
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      adminClientSocket.on('systemHealth', (data) => {
        expect(data.status).toBe('healthy');
        checkComplete();
      });

      secondAdminSocket.on('systemHealth', (data) => {
        expect(data.status).toBe('healthy');
        checkComplete();
      });

      adminNotificationService.emitSystemHealth(systemHealth);
    });
  });

  describe('Connection Management', () => {
    it('should handle client disconnection gracefully', (done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });

      adminClientSocket.on('connect', () => {
        expect(adminClientSocket.connected).toBe(true);
        
        adminClientSocket.on('disconnect', () => {
          expect(adminClientSocket.connected).toBe(false);
          done();
        });

        adminClientSocket.disconnect();
      });
    });

    it('should handle server-side disconnection', (done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });

      adminClientSocket.on('connect', () => {
        // Find the server-side socket and disconnect it
        const serverSocket = Array.from(io.of('/admin').sockets.values())[0];
        if (serverSocket) {
          serverSocket.disconnect();
        }
      });

      adminClientSocket.on('disconnect', (reason) => {
        expect(reason).toBeTruthy();
        done();
      });
    });

    it('should handle reconnection attempts', (done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken },
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 100
      });

      let connectCount = 0;
      adminClientSocket.on('connect', () => {
        connectCount++;
        
        if (connectCount === 1) {
          // Disconnect after first connection and manually trigger reconnect
          adminClientSocket.disconnect();
          setTimeout(() => {
            adminClientSocket.connect();
          }, 50);
        } else if (connectCount === 2) {
          // Successfully reconnected
          expect(connectCount).toBe(2);
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed authentication tokens', (done) => {
      const malformedSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: 'malformed.token.here' }
      });

      malformedSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        malformedSocket.disconnect();
        done();
      });
    });

    it('should handle expired tokens', (done) => {
      const expiredToken = jwt.sign(
        { userId: adminUser._id, role: 'admin' },
        process.env.JWT_SECRET as string,
        { expiresIn: '-1h' } // Expired
      );

      const expiredSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: expiredToken }
      });

      expiredSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        expiredSocket.disconnect();
        done();
      });
    });

    it('should handle database errors during authentication', (done) => {
      // Mock database error
      const findByIdSpy = jest.spyOn(User, 'findById').mockRejectedValue(new Error('Database error'));

      const errorSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });

      errorSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        
        // Restore original method
        findByIdSpy.mockRestore();
        errorSocket.disconnect();
        done();
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous connections', async () => {
      const connectionPromises = [];
      const sockets: ClientSocket[] = [];

      // Create 10 simultaneous connections
      for (let i = 0; i < 10; i++) {
        const promise = new Promise<void>((resolve, reject) => {
          const socket = Client(`http://localhost:${port}/admin`, {
            auth: { token: adminToken }
          });

          socket.on('connect', () => {
            sockets.push(socket);
            resolve();
          });

          socket.on('connect_error', reject);
        });

        connectionPromises.push(promise);
      }

      await Promise.all(connectionPromises);
      expect(sockets.length).toBe(10);

      // Clean up
      sockets.forEach(socket => socket.disconnect());
    });

    it('should handle rapid notification emissions', (done) => {
      adminClientSocket = Client(`http://localhost:${port}/admin`, {
        auth: { token: adminToken }
      });

      adminClientSocket.on('connect', () => {
        let receivedCount = 0;
        const totalNotifications = 100;

        adminClientSocket.on('systemHealth', () => {
          receivedCount++;
          if (receivedCount === totalNotifications) {
            done();
          }
        });

        // Emit 100 notifications rapidly
        for (let i = 0; i < totalNotifications; i++) {
          adminNotificationService.emitSystemHealth({
            status: 'healthy',
            cpu: 50,
            memory: 60,
            disk: 40,
            activeUsers: 100,
            responseTime: 150,
            timestamp: new Date()
          });
        }
      });
    });
  });
});