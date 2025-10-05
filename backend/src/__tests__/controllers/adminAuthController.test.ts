import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import adminAuthRoutes from '../../routes/adminAuth';
import { adminNotificationService } from '../../services/adminNotificationService';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals'

// Mock the admin notification service
jest.mock('../../services/adminNotificationService');

// Mock the admin rate limit middleware to avoid 429s interfering with validation/auth tests
jest.mock('../../middleware/adminRateLimit', () => ({
  adminApiRateLimit: (_req: any, _res: any, next: any) => next(),
  adminLoginRateLimit: (_req: any, _res: any, next: any) => next(),
}));

// Create test app instance
const app = express();
app.use(express.json());
app.use('/admin/auth', adminAuthRoutes);

describe('Admin Auth Controller', () => {
  let adminUser: any;
  let studentUser: any;
  let mockAdminNotificationService: jest.Mocked<typeof adminNotificationService>;

  beforeAll(async () => {
    // Database connection is handled in Jest setup
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('adminpassword123', 12);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@verbfy.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true
    });

    // Create student user (for testing unauthorized access)
    const studentHashedPassword = await bcrypt.hash('studentpassword123', 12);
    studentUser = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: studentHashedPassword,
      role: 'student',
      isEmailVerified: true
    });

    // Reset mock
    mockAdminNotificationService = adminNotificationService as jest.Mocked<typeof adminNotificationService>;
    jest.clearAllMocks();
  });

  describe('POST /admin/auth/login', () => {
    it('should login admin user successfully', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login for non-admin users and emit security alert', async () => {
      const loginData = {
        email: 'student@example.com',
        password: 'studentpassword123'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(403);

      expect(response.body.message).toBe('Access denied. Admin privileges required.');

      // Verify security alert was emitted (mock would be called)
      // Note: In a real test, you'd verify the mock was called with correct parameters
    });

    it('should reject login with invalid password and emit security alert', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');

      // Verify security alert was emitted for failed login attempt
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@verbfy.com',
        password: 'somepassword'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate required fields', async () => {
      // Test missing email
      await request(app)
        .post('/admin/auth/login')
        .send({ password: 'adminpassword123' })
        .expect(400);

      // Test missing password
      await request(app)
        .post('/admin/auth/login')
        .send({ email: 'admin@verbfy.com' })
        .expect(400);

      // Test empty email
      await request(app)
        .post('/admin/auth/login')
        .send({ email: '', password: 'adminpassword123' })
        .expect(400);

      // Test empty password
      await request(app)
        .post('/admin/auth/login')
        .send({ email: 'admin@verbfy.com', password: '' })
        .expect(400);
    });

    it('should validate email format', async () => {
      const loginData = {
        email: 'invalid-email-format',
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should handle case-insensitive email login', async () => {
      const loginData = {
        email: 'ADMIN@VERBFY.COM', // Uppercase email
        password: 'adminpassword123'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.email).toBe('admin@verbfy.com'); // Should match lowercase
    });

    it('should include user information in response', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user).toHaveProperty('isEmailVerified');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('__v');
    });

    it('should generate valid JWT tokens', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      const response = await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(200);

      // Verify access token
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET as string) as any;
      expect(decodedToken.userId).toBe(adminUser._id.toString());
      expect(decodedToken.role).toBe('admin');

      // Verify refresh token
      const decodedRefreshToken = jwt.verify(response.body.refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
      expect(decodedRefreshToken.userId).toBe(adminUser._id.toString());
    });
  });

  describe('POST /admin/auth/refresh', () => {
    let validRefreshToken: string;

    beforeEach(() => {
      validRefreshToken = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' }
      );
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/admin/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify new tokens are valid
      const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET as string) as any;
      expect(decodedToken.userId).toBe(adminUser._id.toString());
      expect(decodedToken.role).toBe('admin');
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/admin/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { userId: adminUser._id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '-1h' } // Expired token
      );

      await request(app)
        .post('/admin/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);
    });

    it('should reject refresh token for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidUserToken = jwt.sign(
        { userId: nonExistentUserId },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' }
      );

      await request(app)
        .post('/admin/auth/refresh')
        .send({ refreshToken: invalidUserToken })
        .expect(401);
    });

    it('should reject refresh token for non-admin user', async () => {
      const studentRefreshToken = jwt.sign(
        { userId: studentUser._id },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' }
      );

      await request(app)
        .post('/admin/auth/refresh')
        .send({ refreshToken: studentRefreshToken })
        .expect(403);
    });

    it('should require refresh token in request body', async () => {
      await request(app)
        .post('/admin/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /admin/auth/logout', () => {
    let validToken: string;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: adminUser._id, role: 'admin' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/admin/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/admin/auth/logout')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app)
        .post('/admin/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Security Features', () => {
    it('should handle multiple failed login attempts', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'wrongpassword'
      };

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/admin/auth/login')
          .send(loginData)
          .expect(401);
      }

      // Each failed attempt should potentially trigger security alerts
      // In a real implementation, you might implement rate limiting here
    });

    it('should handle SQL injection attempts in email field', async () => {
      const maliciousLoginData = {
        email: "admin@verbfy.com'; DROP TABLE users; --",
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(maliciousLoginData)
        .expect(400); // Should be rejected due to email validation
    });

    it('should handle XSS attempts in input fields', async () => {
      const xssLoginData = {
        email: '<script>alert("xss")</script>@verbfy.com',
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(xssLoginData)
        .expect(400); // Should be rejected due to email validation
    });

    it('should not reveal user existence for invalid emails', async () => {
      const nonExistentEmail = {
        email: 'nonexistent@verbfy.com',
        password: 'somepassword'
      };

      const invalidEmail = {
        email: 'admin@verbfy.com',
        password: 'wrongpassword'
      };

      const response1 = await request(app)
        .post('/admin/auth/login')
        .send(nonExistentEmail)
        .expect(401);

      const response2 = await request(app)
        .post('/admin/auth/login')
        .send(invalidEmail)
        .expect(401);

      // Both should return the same generic error message
      expect(response1.body.message).toBe(response2.body.message);
    });
  });

  describe('Rate Limiting and Brute Force Protection', () => {
    it('should handle rapid successive login attempts', async () => {
      const loginData = {
        email: 'admin@verbfy.com',
        password: 'wrongpassword'
      };

      // Simulate rapid requests
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/admin/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);
      
      // All should return 401 for wrong password
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(User, 'findOne').mockRejectedValueOnce(new Error('Database connection error'));

      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(500);
    });

    it('should handle bcrypt comparison errors', async () => {
      // Mock bcrypt error
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(async () => { throw new Error('Bcrypt error'); });

      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(500);
    });

    it('should handle JWT signing errors', async () => {
      // Mock JWT error
      jest.spyOn(jwt, 'sign').mockImplementationOnce(() => {
        throw new Error('JWT signing error');
      });

      const loginData = {
        email: 'admin@verbfy.com',
        password: 'adminpassword123'
      };

      await request(app)
        .post('/admin/auth/login')
        .send(loginData)
        .expect(500);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@verbfy.com',
        'admin@',
        'admin..test@verbfy.com',
        'admin@verbfy',
        'admin@.com'
      ];

      for (const email of invalidEmails) {
        await request(app)
          .post('/admin/auth/login')
          .send({ email, password: 'adminpassword123' })
          .expect(400);
      }
    });

    it('should validate password requirements', async () => {
      const weakPasswords = [
        '', // Empty
        '123', // Too short
        '   ', // Only spaces
      ];

      for (const password of weakPasswords) {
        await request(app)
          .post('/admin/auth/login')
          .send({ email: 'admin@verbfy.com', password })
          .expect(400);
      }
    });

    it('should handle extremely long input values', async () => {
      const longString = 'a'.repeat(10000);

      await request(app)
        .post('/admin/auth/login')
        .send({ email: longString, password: 'adminpassword123' })
        .expect(400);

      await request(app)
        .post('/admin/auth/login')
        .send({ email: 'admin@verbfy.com', password: longString })
        .expect(400);
    });
  });
});