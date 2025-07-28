import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt';

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
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'All fields required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, refreshToken);
    res.status(201).json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, refreshToken);
    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    let payload: any;
    try {
      payload = verifyToken(token) as { id: string; version: number };
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const user = await User.findById(payload.id);
    if (!user || user.refreshTokenVersion !== payload.version) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    // Rotate refresh token (single-use)
    user.refreshTokenVersion += 1;
    await user.save();
    const newAccessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
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