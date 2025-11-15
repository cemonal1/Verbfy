import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';

const cspLogger = createLogger('CSPNonce');

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware to generate and attach CSP nonce to each request
 */
export function cspNonceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const nonce = generateNonce();

  // Attach nonce to response locals for access in routes/views
  res.locals.cspNonce = nonce;

  // Add nonce to response header for client-side access (if needed)
  res.setHeader('X-CSP-Nonce', nonce);

  cspLogger.debug('Generated CSP nonce for request', {
    method: req.method,
    path: req.path,
    nonce: nonce.substring(0, 8) + '...' // Log partial nonce for debugging
  });

  next();
}

/**
 * Build CSP directive with nonce support
 */
export function buildCSPWithNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production';

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      ...(isDev ? ["'unsafe-eval'"] : []), // Only for development
      'https://*.sentry-cdn.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://*.google.com',
      'https://*.googleapis.com',
      'https://*.gstatic.com',
      'https://*.facebook.net',
      'https://*.facebook.com',
      'https://*.fbcdn.net',
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com',
      'https://cdnjs.cloudflare.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      ...(isDev ? ['http:'] : []),
      'https://*.googleusercontent.com',
      'https://*.fbsbx.com',
      'https://graph.facebook.com',
      'https://res.cloudinary.com',
      'https://verbfy-uploads.s3.amazonaws.com',
    ],
    'connect-src': [
      "'self'",
      'https://api.verbfy.com',
      'https://livekit.verbfy.com',
      'wss://livekit.verbfy.com',
      'https://o4507902343495680.ingest.sentry.io',
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      'https://www.googleapis.com',
      'https://graph.facebook.com',
      'https://www.facebook.com',
      ...(isDev ? ['http://localhost:*', 'ws://localhost:*', 'wss://localhost:*'] : []),
    ],
    'frame-src': [
      "'self'",
      'https://accounts.google.com',
      'https://www.facebook.com',
      'https://web.facebook.com',
    ],
    'object-src': ["'none'"],
    'media-src': [
      "'self'",
      'blob:',
      'https://res.cloudinary.com',
      'https://verbfy-uploads.s3.amazonaws.com',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'child-src': [
      "'self'",
      'blob:',
    ],
    'form-action': [
      "'self'",
      'https://accounts.google.com',
      'https://www.facebook.com',
    ],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  // Build CSP string
  const cspString = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  return cspString;
}

/**
 * Enhanced CSP middleware with nonce support
 */
export function cspHeaderMiddleware(req: Request, res: Response, next: NextFunction): void {
  const nonce = res.locals.cspNonce;

  if (!nonce) {
    cspLogger.warn('CSP nonce not found in response locals', {
      method: req.method,
      path: req.path
    });
    next();
    return;
  }

  const cspString = buildCSPWithNonce(nonce);
  res.setHeader('Content-Security-Policy', cspString);

  cspLogger.debug('Applied CSP header with nonce', {
    method: req.method,
    path: req.path,
    nonce: nonce.substring(0, 8) + '...'
  });

  next();
}

/**
 * Utility function to get nonce from response for use in templates/views
 */
export function getCSPNonce(res: Response): string {
  return res.locals.cspNonce || '';
}
