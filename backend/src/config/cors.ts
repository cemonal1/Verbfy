import { CorsOptions } from 'cors';
import { createLogger } from '../utils/logger';

const corsLogger = createLogger('CORS');

// Production domains configuration
const PRODUCTION_DOMAINS = [
  'https://verbfy.com',
  'https://www.verbfy.com',
  'https://api.verbfy.com',
  'https://app.verbfy.com'
];

// Development domains
const DEVELOPMENT_DOMAINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

// Hetzner server IPs
const HETZNER_IPS = [
  'http://46.62.161.121:3000',
  'https://46.62.161.121:3000',
  'http://46.62.161.121:5000',
  'https://46.62.161.121:5000'
];

/**
 * Get allowed origins based on environment
 */
export const getAllowedOrigins = (): string[] => {
  const defaultOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const productionDomains = process.env.PRODUCTION_DOMAINS 
    ? process.env.PRODUCTION_DOMAINS.split(',').map(s => s.trim()).filter(Boolean)
    : PRODUCTION_DOMAINS;

  let allowedOrigins: string[] = [defaultOrigin, ...extraOrigins];

  if (process.env.NODE_ENV === 'production') {
    allowedOrigins = [...allowedOrigins, ...productionDomains, ...HETZNER_IPS];
  } else {
    allowedOrigins = [...allowedOrigins, ...DEVELOPMENT_DOMAINS];
  }

  // Remove duplicates
  return [...new Set(allowedOrigins)];
};

/**
 * Validate origin against allowed list
 */
export const validateOrigin = (origin: string | undefined, allowedOrigins: string[]): boolean => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) return true;

  // Check exact match
  if (allowedOrigins.includes(origin)) return true;

  // Check wildcard subdomains for production
  if (process.env.NODE_ENV === 'production') {
    const isVerbfySubdomain = /^https:\/\/[a-zA-Z0-9-]+\.verbfy\.com$/.test(origin);
    if (isVerbfySubdomain) return true;
  }

  return false;
};

/**
 * Enhanced CORS configuration
 */
export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = validateOrigin(origin, allowedOrigins);

    if (isAllowed) {
      corsLogger.debug(`CORS allowed origin: ${origin || 'no-origin'}`);
      return callback(null, true);
    }

    corsLogger.warn(`CORS blocked origin: ${origin}`, {
      origin,
      allowedOrigins,
      userAgent: 'unknown', // Will be filled by middleware
      timestamp: new Date().toISOString()
    });

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-csrf-token',
    'X-CSRF-Token',
    'Idempotency-Key',
    'idempotency-key',
    'Accept',
    'Origin',
    'User-Agent',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match'
  ],
  exposedHeaders: [
    'set-cookie',
    'X-CSRF-Token',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After'
  ],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200, // For legacy browser support
  preflightContinue: false
};

/**
 * Socket.IO CORS configuration
 */
export const socketCorsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, success?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();
    const isAllowed = validateOrigin(origin, allowedOrigins);

    if (isAllowed) {
      corsLogger.debug(`Socket.IO CORS allowed origin: ${origin || 'no-origin'}`);
      return callback(null, true);
    }

    corsLogger.warn(`Socket.IO CORS blocked origin: ${origin}`, {
      origin,
      allowedOrigins,
      timestamp: new Date().toISOString()
    });

    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'x-csrf-token',
    'Idempotency-Key',
    'idempotency-key',
    'Cache-Control',
    'User-Agent'
  ]
};

/**
 * CORS monitoring middleware
 */
export const corsMonitoring = (req: any, res: any, next: any) => {
  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const method = req.method;
  const path = req.path;

  // Log CORS requests for monitoring
  if (origin) {
    corsLogger.info(`CORS request from ${origin}`, {
      origin,
      method,
      path,
      userAgent,
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    });
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add CORS debugging headers in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-CORS-Debug', 'enabled');
    res.setHeader('X-Allowed-Origins', getAllowedOrigins().join(', '));
  }

  next();
};

/**
 * Preflight handler for complex CORS requests
 */
export const preflightHandler = (req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    corsLogger.debug(`Preflight request from ${req.headers.origin}`, {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers'],
      path: req.path
    });

    // Handle preflight
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(204).end();
    return;
  }

  next();
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err.message === 'Not allowed by CORS') {
    corsLogger.error(`CORS error for origin: ${req.headers.origin}`, {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    });

    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'Origin not allowed'
    });
  }

  next(err);
};