import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import UserModel from '../models/User';
import { createLogger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { adminNotificationService } from '../services/adminNotificationService';

const adminAuthLogger = createLogger('admin-auth');

/**
 * Admin login endpoint with enhanced security
 * POST /api/admin/login
 */
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Basic type checks to prevent injection payloads causing unexpected errors
    if (typeof email !== 'string' || typeof password !== 'string') {
      adminAuthLogger.warn('Admin login attempt with invalid input types', {
        emailType: typeof email,
        passwordType: typeof password,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(400).json({
        success: false,
        message: 'Invalid input'
      });
      return;
    }

    // Input validation
    if (!email || !password) {
      adminAuthLogger.warn('Admin login attempt with missing credentials', {
        email: email ? 'provided' : 'missing',
        password: password ? 'provided' : 'missing',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      adminAuthLogger.warn('Admin login attempt with invalid email format', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Find user by email
    const user = await UserModel.findOne(
      { email: email.toLowerCase() },
      '+password +isActive +role +emailVerified'
    );

    if (!user) {
      adminAuthLogger.warn('Admin login attempt with non-existent email', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      // Use generic message to prevent email enumeration
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      adminAuthLogger.warn('Non-admin user attempted admin login', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Emit security alert for unauthorized admin access attempt
      adminNotificationService.emitSecurityAlert({
        type: 'unauthorized_access',
        message: `Non-admin user attempted admin login: ${user.email}`,
        severity: 'high',
        details: {
          userRole: user.role,
          userAgent: req.get('User-Agent'),
          userId: user._id.toString(),
          ip: req.ip
        },
        timestamp: new Date()
      });

      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    // Check if account is active
    if (user.isActive === false) {
      adminAuthLogger.warn('Deactivated admin account login attempt', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      adminAuthLogger.warn('Admin login attempt with invalid password', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Emit security alert for failed admin login
      adminNotificationService.emitSecurityAlert({
        type: 'failed_login',
        message: `Failed admin login attempt for: ${user.email}`,
        severity: 'medium',
        details: {
          userAgent: req.get('User-Agent'),
          attemptTime: new Date().toISOString(),
          userId: user._id.toString(),
          ip: req.ip
        },
        timestamp: new Date()
      });

      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token with admin role
    const tokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    // Set secure HTTP-only cookie (keep for backward compatibility)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' as const : 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    };

    res.cookie('adminToken', token, cookieOptions);

    // Log successful admin login
    adminAuthLogger.info('Admin login successful', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Return success response (no token in response body for security)
    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: (user as any).emailVerified === true
      }
    });

  } catch (error) {
    adminAuthLogger.error('Admin login error', {
      requestId: req.requestId, error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Admin logout endpoint
 * POST /api/admin/logout
 */
export const adminLogout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Clear the admin token cookie
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
      path: '/'
    });

    adminAuthLogger.info('Admin logout successful', {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    adminAuthLogger.error('Admin logout error', {
      requestId: req.requestId, error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

/**
 * Check admin authentication status
 * GET /api/admin/me
 */
export const getAdminProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
      return;
    }

    // Fetch fresh user data from database
    const user = await UserModel.findById(req.user.id)
      .select('name email role isActive createdAt');

    if (!user) {
      adminAuthLogger.warn('Admin profile request for non-existent user', {
        userId: req.user.id,
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (user.role !== 'admin') {
      adminAuthLogger.warn('Non-admin user accessed admin profile endpoint', {
        userId: user._id,
        role: user.role,
        ip: req.ip
      });
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    adminAuthLogger.error('Get admin profile error', {
      requestId: req.requestId, error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Refresh admin JWT tokens
export const refreshAdminToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const userId = payload?.userId || payload?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const user = await UserModel.findById(userId).select('+role +isActive');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    // Issue new tokens
    const token = signAccessToken({ id: user._id.toString(), role: 'admin' });
    const newRefreshToken = signRefreshToken({ userId: user._id.toString() });

    res.json({ success: true, token, refreshToken: newRefreshToken });
  } catch (error) {
    adminAuthLogger.error('Refresh token error', {
      requestId: req.requestId, error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};