import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token && (req as any).cookies) {
    token = (req as any).cookies.accessToken;
  }
  
  console.log('Auth middleware - Token found:', token ? 'Yes' : 'No');
  console.log('Auth middleware - Request path:', req.path);
  console.log('Auth middleware - Request method:', req.method);
  
  if (!token) {
    console.log('Auth middleware - No token provided');
    res.status(401).json({ success: false, message: 'No token, authorization denied' });
    return;
  }
  
  try {
    const decoded = verifyToken(token);
    console.log('Auth middleware - Token decoded successfully:', decoded);
    req.user = decoded as any;
    next();
  } catch (err) {
    console.error('Auth middleware - Token verification failed:', err);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

export const requireRole = (roles: 'student' | 'teacher' | 'admin' | ('student' | 'teacher' | 'admin')[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(403).json({ success: false, message: 'Forbidden: authentication required' });
    return;
  }
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    return;
  }
  next();
};