import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { createLogger } from '../utils/logger';

const securityLogger = createLogger('SecurityConfig');

/**
 * Enhanced security headers configuration
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for development
        "https://js.sentry-cdn.com",
        "https://browser.sentry-cdn.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://connect.facebook.net",
        "https://www.facebook.com",
        "https://static.xx.fbcdn.net",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components and CSS-in-JS
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http:", // For development
        "https://lh3.googleusercontent.com", // Google profile images
        "https://platform-lookaside.fbsbx.com", // Facebook profile images
        "https://graph.facebook.com", // Facebook profile images
        "https://res.cloudinary.com", // Cloudinary images
        "https://verbfy-uploads.s3.amazonaws.com", // S3 uploads
      ],
      connectSrc: [
        "'self'",
        "https://api.verbfy.com",
        "https://livekit.verbfy.com",
        "wss://livekit.verbfy.com",
        "https://o4507902343495680.ingest.sentry.io",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        "https://www.googleapis.com",
        "https://graph.facebook.com",
        "https://www.facebook.com",
        "ws://localhost:*", // WebSocket for development
        "wss://localhost:*",
        process.env.NODE_ENV === 'development' ? "http://localhost:*" : null,
        process.env.NODE_ENV === 'development' ? "ws://localhost:*" : null,
      ].filter(Boolean),
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.facebook.com",
        "https://web.facebook.com",
      ],
      objectSrc: ["'none'"],
      mediaSrc: [
        "'self'",
        "blob:",
        "https://res.cloudinary.com",
        "https://verbfy-uploads.s3.amazonaws.com",
      ],
      workerSrc: [
        "'self'",
        "blob:",
      ],
      childSrc: [
        "'self'",
        "blob:",
      ],
      formAction: [
        "'self'",
        "https://accounts.google.com",
        "https://www.facebook.com",
      ],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin'],
  },

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Expect-CT
  expectCt: {
    maxAge: 86400, // 24 hours
    enforce: process.env.NODE_ENV === 'production',
  },

  // Cross-Origin-Embedder-Policy
  crossOriginEmbedderPolicy: false, // Disabled for compatibility

  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin-allow-popups', // Allow OAuth popups
  },

  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

/**
 * Additional security headers middleware
 */
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // Feature Policy / Permissions Policy
  res.setHeader('Permissions-Policy', [
    'camera=(self)',
    'microphone=(self)',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=(self)',
    'encrypted-media=(self)',
    'fullscreen=(self)',
    'picture-in-picture=(self)',
  ].join(', '));

  // Clear-Site-Data header for logout endpoints
  if (req.path.includes('/logout')) {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-original-host'];
  
  // Sanitize query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Remove null bytes and control characters
        req.query[key] = value.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
      }
    }
  }

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove null bytes and control characters
      obj[key] = value.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
      
      // Limit string length to prevent DoS
      if (obj[key].length > 10000) {
        obj[key] = obj[key].substring(0, 10000);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObject(value);
    }
  }
}

/**
 * API versioning middleware
 */
export const apiVersioning = (req: Request, res: Response, next: NextFunction): void => {
  // Add API version header
  res.setHeader('API-Version', '1.0.0');
  
  // Check for deprecated API usage
  const acceptVersion = req.headers['accept-version'] || req.headers['api-version'];
  if (acceptVersion && acceptVersion !== '1.0.0') {
    securityLogger.warn(`Deprecated API version requested: ${acceptVersion}`, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.path,
    });
  }

  next();
};

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        securityLogger.warn(`Request timeout: ${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timeout: timeoutMs,
        });
        
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

/**
 * Security monitoring middleware
 */
export const securityMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript injection
    /vbscript:/gi, // VBScript injection
    /onload|onerror|onclick/gi, // Event handler injection
  ];

  const requestData = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers,
  });

  const suspiciousActivity = suspiciousPatterns.some(pattern => pattern.test(requestData));
  
  if (suspiciousActivity) {
    securityLogger.warn('Suspicious activity detected', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    });
  }

  // Log response time and status
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 5000) { // Log slow requests
      securityLogger.warn('Slow request detected', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        responseTime,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Environment-specific security configuration
 */
export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    trustProxy: isProduction, // Trust proxy in production
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // Always use httpOnly cookies
    sameSite: isProduction ? 'strict' : 'lax', // Strict in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
};