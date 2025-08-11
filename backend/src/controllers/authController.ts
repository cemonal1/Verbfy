import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from '../utils/jwt';
import { sendEmail } from '../utils/email';
import VerificationToken from '../models/VerificationToken';
import crypto from 'crypto';

// Helper: set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Helper: set access token cookie (short-lived)
const setAccessTokenCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

// Helper: extract user from token
const getUserFromToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return verifyToken(token) as { id: string; name: string; email: string; role: string };
  } catch {
    return null;
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userData = getUserFromToken(req);
    if (!userData) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    const user = await User.findById(userData.id).select('_id name email role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    res.json({ 
      success: true,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    console.log('Checking for existing user with email:', email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already registered:', email);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 10);
    
    console.log('Creating new user...');
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
    console.log('User created:', { id: user._id, name: user.name, email: user.email, role: user.role });

    console.log('Generating tokens...');
    const effectiveRole = user.role === 'teacher' && user.isApproved === false ? 'student' : user.role;
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: effectiveRole });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    console.log('Setting refresh token cookie...');
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);
    
    console.log('Registration successful');
    // Send email verification for all non-admin signups
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
      await VerificationToken.create({ userId: user._id, token, expiresAt });
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      await sendEmail(user.email, 'Verify your Verbfy email', `
        <p>Hi ${user.name},</p>
        <p>Please verify your email to activate your account:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
      `);
    } catch (e) {
      console.warn('Failed to send verification email:', e);
    }
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

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    console.log('Finding user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Comparing passwords...');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Generating tokens...');
    const loginEffectiveRole = user.role === 'teacher' && user.isApproved === false ? 'student' : user.role;
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: loginEffectiveRole });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    console.log('Setting refresh token cookie...');
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, accessToken);
    
    console.log('Login successful:', { userId: user._id, role: user.role });
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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    console.log('Refresh token request received');
    const token = (req as any).cookies?.refreshToken || req.cookies?.refreshToken;
    if (!token) {
      console.log('No refresh token in cookies');
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }
    
    console.log('Verifying refresh token...');
    let payload: any;
    try {
      payload = verifyRefreshToken(token) as { id: string; version: number };
      console.log('Refresh token verified successfully for user:', payload.id);
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    console.log('Finding user with ID:', payload.id);
    const user = await User.findById(payload.id);
    if (!user || user.refreshTokenVersion !== payload.version) {
      console.log('User not found or token version mismatch:', { 
        userFound: !!user, 
        userVersion: user?.refreshTokenVersion, 
        tokenVersion: payload.version 
      });
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    
    console.log('Rotating refresh token...');
    // Rotate refresh token (single-use)
    user.refreshTokenVersion += 1;
    await user.save();
    
    console.log('Generating new tokens...');
    const newAccessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, newRefreshToken);
    setAccessTokenCookie(res, newAccessToken);
    
    console.log('Token refresh successful for user:', user._id);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.clearCookie('accessToken', { path: '/' });
  res.json({ success: true, message: 'Logged out' });
};

export const getTeachers = async (_req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name');
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}; 