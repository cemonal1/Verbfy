import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

// Create context-specific logger
const authLogger = createLogger('Auth');

// Helper: set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/api/auth',
    domain: cookieDomain,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const setAccessTokenCookie = (res: Response, token: string) => {
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    domain: cookieDomain,
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

// Helper: extract user from token (Authorization header or accessToken cookie)
const getUserFromToken = (req: Request) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  if (!token && (req as any).cookies) {
    token = (req as any).cookies.accessToken as string | undefined;
  }
  if (!token) return null;
  try {
    return verifyToken(token) as { id: string; name: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = getUserFromToken(req);
    if (!userData) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }
    
    const user = await User.findById(userData.id).select('-password -refreshTokenVersion');
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }
    
    res.json({ 
      success: true,
      user: { 
        _id: user._id,
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isApproved: user.isApproved,
        approvalStatus: user.approvalStatus,
        cefrLevel: user.cefrLevel,
        overallProgress: user.overallProgress,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalStudyTime: user.totalStudyTime,
        achievements: user.achievements,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionType: user.subscriptionType,
        subscriptionExpiry: user.subscriptionExpiry,
        lessonTokens: user.lessonTokens,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } 
    });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    authLogger.info('Registration request received', { email: req.body.email, role: req.body.role });
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      authLogger.warn('Missing required fields', { name: !!name, email: !!email, password: !!password, role: !!role });
      res.status(400).json({ success: false, message: 'All fields required' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      return;
    }

    authLogger.debug('Checking for existing user', { email });
    const existing = await User.findOne({ email });
    if (existing) {
      authLogger.warn('Email already registered', { email });
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }

    authLogger.debug('Hashing password');
    const hashed = await bcrypt.hash(password, 10);
    
    authLogger.debug('Creating new user');
    // Teachers require admin approval
    const requiresApproval = role === 'teacher';
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      isApproved: requiresApproval ? false : true,
      approvalStatus: requiresApproval ? 'pending' : 'approved',
    });
    authLogger.info('User created successfully', { id: user._id, name: user.name, email: user.email, role: user.role });

    authLogger.debug('Generating tokens');
    const effectiveRole = user.role === 'teacher' && user.isApproved === false ? 'student' : user.role;
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: effectiveRole });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    authLogger.debug('Setting authentication cookies');
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);
    
    authLogger.info('Registration successful', { userId: user._id, role: user.role });
    if (requiresApproval) {
      // Notify admins
      try {
        const admins = await User.find({ role: 'admin' }).select('email').lean();
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        if (adminEmails.length) {
          await sendEmail(adminEmails, 'New teacher application', `
            <p>A new teacher has registered and awaits approval:</p>
            <ul>
              <li>Name: ${user.name}</li>
              <li>Email: ${user.email}</li>
            </ul>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/users">Review applications</a></p>
          `);
        }
      } catch (e) {
        console.warn('Failed to send admin teacher application email:', e);
      }
    }
    res.status(201).json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, approvalStatus: user.approvalStatus }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    authLogger.info('Login request received', { email: req.body.email });
    
    const { email, password } = req.body;
    if (!email || !password) {
      authLogger.warn('Missing required fields', { email: !!email, password: !!password });
      res.status(400).json({ success: false, message: 'All fields required' });
      return;
    }

    authLogger.debug('Finding user', { email });
    const user = await User.findOne({ email });
    if (!user) {
      authLogger.warn('User not found', { email });
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    authLogger.debug('Comparing passwords');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      authLogger.warn('Password mismatch', { email });
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    authLogger.debug('Generating tokens');
    const loginEffectiveRole = user.role === 'teacher' && user.isApproved === false ? 'student' : user.role;
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: loginEffectiveRole });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    authLogger.debug('Setting authentication cookies');
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);
    
    authLogger.info('Login successful', { userId: user._id, role: user.role });
    res.json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved, approvalStatus: user.approvalStatus }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    authLogger.debug('Refresh token request received');
    const token = (req as any).cookies?.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      authLogger.warn('No refresh token in cookies');
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }
    
    authLogger.debug('Verifying refresh token');
    let payload: any;
    try {
      payload = verifyRefreshToken(token) as { id: string; version: number };
      authLogger.debug('Refresh token verified successfully', { userId: payload.id });
    } catch (error) {
      authLogger.warn('Refresh token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }
    
    authLogger.debug('Finding user', { userId: payload.id });
    const user = await User.findById(payload.id);
    if (!user || user.refreshTokenVersion !== payload.version) {
      authLogger.warn('User not found or token version mismatch', { 
        userFound: !!user, 
        userVersion: user?.refreshTokenVersion, 
        tokenVersion: payload.version 
      });
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }
    
    authLogger.debug('Rotating refresh token');
    // Rotate refresh token (single-use)
    user.refreshTokenVersion += 1;
    await user.save();
    
    authLogger.debug('Generating new tokens');
    const newAccessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, newRefreshToken);
    setAccessTokenCookie(res, newAccessToken);
    
    authLogger.info('Token refresh successful', { userId: user._id });
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true, message: 'Logged out' });
};

export const getTeachers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name');
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 

// Request email verification link
export const requestEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = getUserFromToken(req);
    if (!userData) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const user = await User.findById(userData.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.emailVerified) {
      res.json({ success: true, message: 'Email already verified' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    try {
      await sendEmail(user.email, 'Verify your email', `<p>Please verify your email by clicking <a href="${verifyUrl}">this link</a>. This link expires in 1 hour.</p>`);
    } catch (e) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Email sending failed:', e);
      }
    }
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('requestEmailVerification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify email via token
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string) || '';
    if (!token) {
      res.status(400).json({ success: false, message: 'Invalid token' });
      return;
    }
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Token invalid or expired' });
      return;
    }
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email required' });
      return;
    }
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ success: true, message: 'If that account exists, a reset email has been sent' });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      await sendEmail(user.email, 'Reset your password', `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>. This link expires in 30 minutes.</p>`);
    } catch (e) {
      // In tests or when SMTP is not configured, do not fail the flow
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Email sending failed:', e);
      }
    }
    res.json({ success: true, message: 'If that account exists, a reset email has been sent' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    if (!token || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Invalid request' });
      return;
    }
    const user = await User.findOne({ passwordResetToken: token });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Token invalid or expired' });
      return;
    }
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    // Invalidate existing refresh tokens
    user.refreshTokenVersion += 1;
    await user.save();
    res.json({ success: true, message: 'Password has been reset' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};