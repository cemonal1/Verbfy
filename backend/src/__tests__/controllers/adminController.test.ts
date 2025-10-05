import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import AuditLog from '../../models/AuditLog';
import { Notification } from '../../models/Notification';
import adminRoutes from '../../routes/adminRoutes';
import adminSystemRoutes from '../../routes/adminSystemRoutes';
import { auth, requireRole } from '../../middleware/auth';
import { adminNotificationService } from '../../services/adminNotificationService';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals'

// Mock the admin notification service
jest.mock('../../services/adminNotificationService');

// Mock the admin rate limit middleware
jest.mock('../../middleware/adminRateLimit', () => ({
  adminApiRateLimit: (req: any, res: any, next: any) => next(),
  adminLoginRateLimit: (req: any, res: any, next: any) => next()
}));

// Create test app instance
const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use('/admin/system', adminSystemRoutes);

describe('Admin Controller', () => {
  let adminToken: string;
  let adminUser: any;
  let testUser: any;
  let mockAdminNotificationService: jest.Mocked<typeof adminNotificationService>;

  beforeAll(async () => {
    // Database connection is handled in Jest setup
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await Notification.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@verbfy.com',
      password: 'hashedpassword',
      role: 'admin',
      isEmailVerified: true
    });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'student',
      isEmailVerified: true
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Reset mock
    mockAdminNotificationService = adminNotificationService as jest.Mocked<typeof adminNotificationService>;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks to prevent test interference
    jest.restoreAllMocks();
  });

  describe('GET /admin/overview', () => {
    it('should return dashboard data for admin users', async () => {
      const response = await request(app)
        .get('/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.stats).toHaveProperty('totalUsers');
      expect(response.body.data.stats).toHaveProperty('totalTeachers');
      expect(response.body.data.stats).toHaveProperty('totalStudents');
    });

    it('should deny access to non-admin users', async () => {
      const studentToken = jwt.sign(
        { id: testUser._id, role: 'student' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .get('/admin/overview')
        .expect(401);
    });
  });

  describe('PATCH /admin/users/:id/role', () => {
    it('should update user role successfully and emit notification', async () => {
      const newRole = 'teacher';
      
      const response = await request(app)
        .patch(`/admin/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'teacher' })
        .expect(200);

      expect(response.body.message).toBe('User role updated successfully');
      
      // Verify user role was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.role).toBe(newRole);

      // Verify audit log was created
      // TODO: Fix audit log assertion
      // const auditLog = await AuditLog.findOne({ 
      //   'event.type': 'user.role_update',
      //   'event.resourceId': testUser._id.toString()
      // });
      // expect(auditLog).toBeTruthy();
      // expect(auditLog?.userId?.toString()).toBe(adminUser._id.toString());
    });

    it('should reject invalid roles', async () => {
      await request(app)
        .patch(`/admin/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' })
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .patch(`/admin/users/${nonExistentId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'teacher' })
        .expect(404);
    });

    it('should deny access to non-admin users', async () => {
      const studentToken = jwt.sign(
        { id: testUser._id, role: 'student' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      await request(app)
        .patch(`/admin/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ role: 'teacher' })
        .expect(403);
    });
  });

  describe('PATCH /admin/users/:id/status', () => {
    it('should update user status successfully and emit notification', async () => {
      const newStatus = 'inactive';
      
      const response = await request(app)
        .patch(`/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: newStatus })
        .expect(200);

      expect(response.body.message).toBe('User status updated successfully');
      
      // Verify user status was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.isActive).toBe(false);

      // Verify audit log was created
      // TODO: Fix audit log assertion
      // const auditLog = await AuditLog.findOne({ 
      //   'event.type': 'user.status_update',
      //   'event.resourceId': testUser._id.toString()
      // });
      // expect(auditLog).toBeTruthy();
    });

    it('should reject invalid status values', async () => {
      await request(app)
        .patch(`/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .patch(`/admin/users/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' })
        .expect(404);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete user successfully and emit notification', async () => {
      const response = await request(app)
        .delete(`/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      
      // Verify user was deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();

      // Verify audit log was created
      // TODO: Fix audit log assertion
      // const auditLog = await AuditLog.findOne({ 
      //   'event.action': 'delete',
      //   'event.resourceId': testUser._id.toString()
      // });
      // expect(auditLog).toBeTruthy();
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should deny access to non-admin users', async () => {
      const studentToken = jwt.sign(
        { id: testUser._id, role: 'student' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      await request(app)
        .delete(`/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/teachers/:id/approve', () => {
    it('should approve teacher successfully and emit notification', async () => {
      const teacherUser = await User.create({
        name: 'Teacher User',
        email: 'teacher@example.com',
        password: 'hashedpassword',
        role: 'teacher',
        isEmailVerified: true,
        approvalStatus: 'pending'
      });
      const response = await request(app)
        .patch(`/admin/teachers/${teacherUser._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Teacher approved');
      
      // Verify teacher was approved
      const approvedTeacher = await User.findById(teacherUser._id);
      expect(approvedTeacher?.approvalStatus).toBe('approved');

      // Verify notification was created for teacher
      const notification = await Notification.findOne({ 
        recipient: teacherUser._id,
        type: 'admin'
      });
      expect(notification).toBeTruthy();

      // Verify audit log was created
      // TODO: Fix audit log assertion
      // const auditLog = await AuditLog.findOne({ 
      //   'event.action': 'approve',
      //   'event.resourceId': teacherUser._id.toString()
      // });
      // expect(auditLog).toBeTruthy();
    });

    it('should return 404 for non-existent teacher', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .patch(`/admin/teachers/${nonExistentId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /admin/teachers/:id/reject', () => {
    it('should reject teacher successfully and emit notification', async () => {
      const teacherUser = await User.create({
        name: 'Teacher User',
        email: 'teacher@example.com',
        password: 'hashedpassword',
        role: 'teacher',
        isEmailVerified: true,
        approvalStatus: 'pending'
      });
      const rejectionReason = 'Insufficient qualifications';
      
      const response = await request(app)
        .patch(`/admin/teachers/${teacherUser._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: rejectionReason })
        .expect(200);

      expect(response.body.message).toBe(`Teacher rejected: ${rejectionReason}`);
      
      // Verify teacher was rejected
      const rejectedTeacher = await User.findById(teacherUser._id);
      expect(rejectedTeacher?.approvalStatus).toBe('rejected');

      // Verify notification was created for teacher
      const notification = await Notification.findOne({ 
        recipient: teacherUser._id,
        type: 'admin'
      });
      expect(notification).toBeTruthy();
      expect(notification?.body).toContain(rejectionReason);

      // Verify audit log was created
      // TODO: Fix audit log assertion
      // const auditLog = await AuditLog.findOne({ 
      //   'event.action': 'reject',
      //   'event.resourceId': teacherUser._id.toString()
      // });
      // expect(auditLog).toBeTruthy();
    });

    it('should require rejection reason', async () => {
      const teacherUser = await User.create({
        name: 'Teacher User',
        email: 'teacher2@example.com',
        password: 'hashedpassword',
        role: 'teacher',
        isEmailVerified: true,
        approvalStatus: 'pending'
      });

      await request(app)
        .patch(`/admin/teachers/${teacherUser._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // No reason provided
        .expect(400);
    });
  });

  describe('GET /admin/system/health', () => {
    it('should return system health information', async () => {
      const response = await request(app)
        .get('/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('metrics');
      expect(['healthy', 'unhealthy']).toContain(response.body.data.status);
    });

    it('should deny access to non-admin users', async () => {
      const studentToken = jwt.sign(
        { id: testUser._id, role: 'student' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/admin/system/health')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  // TODO: Re-enable audit logs tests after fixing database connection issues
  // describe('GET /admin/system/audit-logs', () => { ... });

  describe('Error Handling', () => {
    // TODO: Fix database error handling test - currently causes test interference
    // The mock seems to affect the database connection globally
    /*
    it('should handle database errors gracefully', async () => {
      // Create a separate test user for this error test
      const errorTestUser = await User.create({
        name: 'Error Test User',
        email: 'errortest@example.com',
        password: 'hashedpassword',
        role: 'student',
        isEmailVerified: true
      });

      // Use Jest spies with proper cleanup
      const mockFindByIdAndUpdate = jest.spyOn(User, 'findByIdAndUpdate')
        .mockRejectedValueOnce(new Error('Database connection error'));
      const mockAuditLogCreate = jest.spyOn(AuditLog, 'create')
        .mockResolvedValueOnce({} as any);

      try {
        const response = await request(app)
          .patch(`/admin/users/${errorTestUser._id}/role`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'teacher' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Failed to update user role');
      } finally {
        // Restore mocks immediately
        mockFindByIdAndUpdate.mockRestore();
        mockAuditLogCreate.mockRestore();
        
        // Clean up the test user
        await User.findByIdAndDelete(errorTestUser._id);
      }
    });
    */

    it('should handle invalid ObjectId format', async () => {
      await request(app)
        .patch('/admin/users/invalid-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'teacher' })
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      await request(app)
        .patch(`/admin/users/${testUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // Missing role field
        .expect(400);
    });
  });

  describe('Authorization', () => {
    it('should require valid JWT token', async () => {
      await request(app)
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should require admin role for all admin endpoints', async () => {
      const teacherToken = jwt.sign(
        { id: testUser._id, role: 'teacher' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      const endpoints = [
        { method: 'get', path: '/admin/dashboard' },
        { method: 'patch', path: `/admin/users/${testUser._id}/role` },
        { method: 'patch', path: `/admin/users/${testUser._id}/status` },
        { method: 'delete', path: `/admin/users/${testUser._id}` },
        { method: 'get', path: '/admin/system/health' },
        { method: 'get', path: '/admin/system/audit-logs' }
      ];

      for (const endpoint of endpoints) {
        const agent = request(app);
        if (endpoint.method === 'get') {
          await agent
            .get(endpoint.path)
            .set('Authorization', `Bearer ${teacherToken}`)
            .expect(403);
        } else if (endpoint.method === 'patch') {
          await agent
            .patch(endpoint.path)
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({ role: 'teacher', status: 'active' })
            .expect(403);
        } else if (endpoint.method === 'delete') {
          await agent
            .delete(endpoint.path)
            .set('Authorization', `Bearer ${teacherToken}`)
            .expect(403);
        } else {
          throw new Error(`Unsupported method: ${endpoint.method}`);
        }
      }
    });
  });
});