import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const securityLogger = createLogger('Security');

// Trusted IP addresses (Hetzner, Cloudflare, etc.)
const TRUSTED_IPS = [
  '46.62.161.121', // Hetzner server
  '127.0.0.1',     // Localhost
  '::1',           // IPv6 localhost
  // Cloudflare IP ranges (add as needed)
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '108.162.192.0/18',
  '131.0.72.0/22',
  '141.101.64.0/18',
  '162.158.0.0/15',
  '172.64.0.0/13',
  '173.245.48.0/20',
  '188.114.96.0/20',
  '190.93.240.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17'
];

// Suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b(union|select|insert|delete|drop|create|alter|exec|script)\b/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload|onerror|onclick/gi,
  /\.\.\//g, // Path traversal
  /\/etc\/passwd/gi,
  /\/proc\/self\/environ/gi
];

// Rate limiting by IP for suspicious activity
const suspiciousActivityTracker = new Map<string, { count: number; lastSeen: number }>();

/**
 * Get real IP address from request
 */
export const getRealIP = (req: Request): string => {
  // Check various headers for real IP
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
};

/**
 * Check if IP is in CIDR range
 */
const isIPInCIDR = (ip: string, cidr: string): boolean => {
  if (!cidr.includes('/')) return ip === cidr;
  
  const [network, prefixLength] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(prefixLength)) - 1);
  
  const ipInt = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const networkInt = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipInt & mask) === (networkInt & mask);
};

/**
 * Check if request contains suspicious patterns
 */
export const detectSuspiciousActivity = (req: Request): boolean => {
  const checkString = JSON.stringify({
    url: req.url,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(checkString));
};

/**
 * Security middleware for request validation
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = getRealIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const now = Date.now();
  
  // Log request for monitoring
  securityLogger.info(`Request from ${clientIP}: ${req.method} ${req.url}`, {
    ip: clientIP,
    userAgent,
    method: req.method,
    url: req.url
  });
  
  // Check for suspicious activity
  if (detectSuspiciousActivity(req)) {
    securityLogger.warn(`Suspicious activity detected from ${clientIP}`, {
      ip: clientIP,
      userAgent,
      url: req.url,
      body: req.body
    });
    
    // Track suspicious activity
    const activity = suspiciousActivityTracker.get(clientIP) || { count: 0, lastSeen: 0 };
    activity.count++;
    activity.lastSeen = now;
    suspiciousActivityTracker.set(clientIP, activity);
    
    // Block if too many suspicious requests
    if (activity.count > 5) {
      securityLogger.error(`Blocking IP ${clientIP} for repeated suspicious activity`);
      res.status(403).json({
        success: false,
        message: 'Access denied due to suspicious activity'
      });
      return;
    }
  }
  
  // Clean up old entries (older than 1 hour)
  for (const [ip, activity] of suspiciousActivityTracker.entries()) {
    if (now - activity.lastSeen > 3600000) { // 1 hour
      suspiciousActivityTracker.delete(ip);
    }
  }
  
  next();
};

/**
 * DDoS protection middleware
 */
const requestTracker = new Map<string, { count: number; windowStart: number }>();

export const ddosProtection = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = getRealIP(req);
  const now = Date.now();
  const windowSize = 60000; // 1 minute
  const maxRequests = 100; // Max requests per minute per IP
  
  const tracker = requestTracker.get(clientIP) || { count: 0, windowStart: now };
  
  // Reset window if expired
  if (now - tracker.windowStart > windowSize) {
    tracker.count = 0;
    tracker.windowStart = now;
  }
  
  tracker.count++;
  requestTracker.set(clientIP, tracker);
  
  // Check if limit exceeded
  if (tracker.count > maxRequests) {
    securityLogger.warn(`DDoS protection triggered for IP ${clientIP}`, {
      ip: clientIP,
      requestCount: tracker.count,
      timeWindow: windowSize
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil((windowSize - (now - tracker.windowStart)) / 1000)
    });
    return;
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      securityLogger.warn(`Request too large from ${getRealIP(req)}`, {
        ip: getRealIP(req),
        contentLength,
        maxSize
      });
      
      res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
      return;
    }
    
    next();
  };
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS for HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
export const ipWhitelist = (allowedIPs: string[] = TRUSTED_IPS) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = getRealIP(req);
    
    const isAllowed = allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        return isIPInCIDR(clientIP, allowedIP);
      }
      return clientIP === allowedIP;
    });
    
    if (!isAllowed) {
      securityLogger.warn(`Unauthorized IP access attempt: ${clientIP}`, {
        ip: clientIP,
        url: req.url,
        userAgent: req.headers['user-agent']
      });
      
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
      return;
    }
    
    next();
  };
};

/**
 * Clean up tracking maps periodically
 */
if ((process.env.NODE_ENV || 'development') !== 'test') {
  setInterval(() => {
    const now = Date.now();
    const oneHour = 3600000;
    
    // Clean suspicious activity tracker
    for (const [ip, activity] of suspiciousActivityTracker.entries()) {
      if (now - activity.lastSeen > oneHour) {
        suspiciousActivityTracker.delete(ip);
      }
    }
    
    // Clean request tracker
    for (const [ip, tracker] of requestTracker.entries()) {
      if (now - tracker.windowStart > oneHour) {
        requestTracker.delete(ip);
      }
    }
  }, 300000); // Clean every 5 minutes
}