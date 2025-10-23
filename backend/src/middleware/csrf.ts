import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const csrfLogger = createLogger('CSRF');

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
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined; // e.g., .verbfy.com to share across subdomains
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      domain: cookieDomain,
    });
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

  // Disable CSRF protection outside production (development, test, CI)
  const env = process.env.NODE_ENV || 'development';
  csrfLogger.info('CSRF verification', { method, path, env });
  
  if (env !== 'production') {
    csrfLogger.info('CSRF protection disabled in non-production environment');
    return next();
  }

  const headerToken = (req.headers[CSRF_HEADER_NAME] as string | undefined) || (req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined);
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;

  csrfLogger.info('CSRF token verification', {
    hasHeaderToken: !!headerToken,
    hasCookieToken: !!cookieToken,
    headerTokenLength: headerToken?.length || 0,
    cookieTokenLength: cookieToken?.length || 0,
    tokensMatch: headerToken === cookieToken,
    headers: Object.keys(req.headers),
    cookies: Object.keys(req.cookies || {})
  });

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    csrfLogger.warn('CSRF token validation failed', {
      headerToken: headerToken ? `${headerToken.substring(0, 8)}...` : 'missing',
      cookieToken: cookieToken ? `${cookieToken.substring(0, 8)}...` : 'missing',
      match: headerToken === cookieToken
    });
    return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  }
  
  csrfLogger.info('CSRF token validation successful');
  return next();
}



