import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
    if (!token || token.length < 16) {
      token = generateToken();
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // must be readable by client to echo in header if same-site
      sameSite: 'lax',
      secure: isProd,
      // domain: optionally set via env if needed
      // path defaults to '/'
    });
    // Also expose token via response header so cross-origin FE can capture and reuse
    res.setHeader('X-CSRF-Token', token);
  } catch (_) {}
  next();
}

export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF checks for safe methods and specific endpoints
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const path = req.path || '';
  if (path.startsWith('/api/health') || path.startsWith('/api/payments/webhook')) return next();

  // Enforce only in production to avoid breaking local dev flows
  if (process.env.NODE_ENV !== 'production') return next();

  const headerToken = (req.headers[CSRF_HEADER_NAME] as string | undefined) || (req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined);
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }
  return next();
}



