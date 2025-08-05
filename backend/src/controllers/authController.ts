import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyToken, verifyRefreshToken } from '../utils/jwt';

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
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const user = await User.findById(userData.id).select('_id name email role');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    res.json({ 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ message: 'All fields required' });
    }

    console.log('Checking for existing user with email:', email);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already registered:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 10);
    
    console.log('Creating new user...');
    const user = await User.create({ name, email, password: hashed, role });
    console.log('User created:', { id: user._id, name: user.name, email: user.email, role: user.role });

    console.log('Generating tokens...');
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    console.log('Setting refresh token cookie...');
    setRefreshTokenCookie(res, refreshToken);
    
    console.log('Registration successful');
    res.status(201).json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'All fields required' });
    }

    console.log('Finding user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Comparing passwords...');
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Generating tokens...');
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    
    console.log('Setting refresh token cookie...');
    setRefreshTokenCookie(res, refreshToken);
    
    console.log('Login successful:', { userId: user._id, role: user.role });
    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    console.log('Refresh token request received');
    const token = req.cookies.refreshToken;
    if (!token) {
      console.log('No refresh token in cookies');
      return res.status(401).json({ message: 'No refresh token' });
    }
    
    console.log('Verifying refresh token...');
    let payload: any;
    try {
      payload = verifyRefreshToken(token) as { id: string; version: number };
      console.log('Refresh token verified successfully for user:', payload.id);
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    console.log('Finding user with ID:', payload.id);
    const user = await User.findById(payload.id);
    if (!user || user.refreshTokenVersion !== payload.version) {
      console.log('User not found or token version mismatch:', { 
        userFound: !!user, 
        userVersion: user?.refreshTokenVersion, 
        tokenVersion: payload.version 
      });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    console.log('Rotating refresh token...');
    // Rotate refresh token (single-use)
    user.refreshTokenVersion += 1;
    await user.save();
    
    console.log('Generating new tokens...');
    const newAccessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, newRefreshToken);
    
    console.log('Token refresh successful for user:', user._id);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ message: 'Logged out' });
};

export const getTeachers = async (_req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('_id name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 