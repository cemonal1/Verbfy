import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { createLogger } from '../utils/logger';
import UserModel from '../models/User';

const authLogger = createLogger('auth');

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
    role: 'student' | 'teacher' | 'admin';
  };
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.cookies?.token || req.cookies?.adminToken;

  if (!token) {
    authLogger.warn('Authentication failed: No token provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasAuthHeader: !!authHeader,
      hasCookie: !!req.cookies?.token,
      hasAdminCookie: !!req.cookies?.adminToken
    });
    res.status(401).json({ success: false, message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = await verifyToken(token);

    const id = decoded.id || decoded.userId;
    const role = decoded.role;
    if (!id || !role) {
      throw new Error('Invalid token payload');
    }

    req.user = {
      id: typeof id === 'string' ? id : id.toString(),
      name: decoded.name,
      email: decoded.email,
      role
    };

    if (process.env.NODE_ENV === 'development') {
      authLogger.debug('Token verified successfully', {
        userId: req.user.id,
        role: req.user.role,
        path: req.path
      });
    }

    next();
  } catch (err) {
    authLogger.error('Token verification failed', {
      error: err instanceof Error ? err.message : 'Unknown error',
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

export const requireRole = (roles: 'student' | 'teacher' | 'admin' | ('student' | 'teacher' | 'admin')[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    authLogger.warn('Role check failed: No user in request', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({ success: false, message: 'Forbidden: authentication required' });
    return;
  }
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(req.user.role)) {
    authLogger.warn('Role check failed: Insufficient permissions', {
      userId: req.user.id,
      userRole: req.user.role,
      requiredRoles: allowedRoles,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    return;
  }
  
  next();
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      authLogger.warn('Admin access denied: No authenticated user', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required for admin access' 
      });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      authLogger.warn('Admin access denied: Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
      return;
    }

    // Additional security: verify user still exists and is active in database
    let user: any = null;
    try {
      const query: any = UserModel.findById(req.user.id);
      if (query && typeof query.select === 'function') {
        user = await query.select('role isActive');
      } else {
        // In case of mocked findById returning a Promise or other type
        user = await query;
      }
    } catch (dbErr) {
      authLogger.error('Admin middleware database error', {
        error: dbErr instanceof Error ? dbErr.message : 'Unknown error',
        userId: req.user.id,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error during authentication' 
      });
      return;
    }
    
    if (!user) {
      authLogger.error('Admin access denied: User not found in database', {
        userId: req.user.id,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(401).json({ 
        success: false, 
        message: 'Invalid user account' 
      });
      return;
    }

    if (user.role !== 'admin') {
      authLogger.error('Admin access denied: Role mismatch in database', {
        userId: req.user.id,
        tokenRole: req.user.role,
        dbRole: user.role,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(403).json({ 
        success: false, 
        message: 'Admin access revoked' 
      });
      return;
    }

    if (user.isActive === false) {
      authLogger.warn('Admin access denied: Account deactivated', {
        userId: req.user.id,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(403).json({ 
        success: false, 
        message: 'Account deactivated' 
      });
      return;
    }

    // Log successful admin access for security monitoring
    authLogger.info('Admin access granted', {
      userId: req.user.id,
      userEmail: req.user.email,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    authLogger.error('Admin middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
};