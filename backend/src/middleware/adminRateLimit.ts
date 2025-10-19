import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';

const rateLimitLogger = createLogger('rate-limit');

// In test environment, we want to skip rate limiting for most tests.
// Set process.env.ENABLE_RATE_LIMIT_TESTS = 'true' to enable rate limiting in specific tests.
const shouldSkipRateLimit = (req: Request): boolean => {
  const isTest = process.env.NODE_ENV === 'test';
  const enableRateLimitTests = process.env.ENABLE_RATE_LIMIT_TESTS === 'true';
  return isTest && !enableRateLimitTests;
};

/**
 * Rate limiter for admin login attempts
 * More restrictive than general API rate limiting
 */
export const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: shouldSkipRateLimit,
  
  // Custom key generator to include user agent for better tracking
  keyGenerator: (req: Request): string => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
    const userAgent = req.get('User-Agent') || 'unknown';
    return `${ip}:${Buffer.from(userAgent).toString('base64').slice(0, 20)}`;
  },

  // Custom handler for rate limit exceeded
  handler: (req: Request, res: Response) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress);
    const userAgent = req.get('User-Agent');
    
    rateLimitLogger.warn('Admin login rate limit exceeded', {
      ip,
      userAgent,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    });
  },

  // Skip rate limiting for successful requests (optional)
  skipSuccessfulRequests: true,

  // Skip rate limiting for failed requests that aren't auth-related
  skipFailedRequests: false,

  // Store rate limit data in memory (consider Redis for production)
  store: undefined // Uses default memory store
});

/**
 * Rate limiter for general admin API endpoints
 * Less restrictive than login, but still protective
 */
export const adminApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for admin APIs
  message: {
    success: false,
    message: 'Too many API requests. Please try again later.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  
  keyGenerator: (req: Request): string => {
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },

  handler: (req: Request, res: Response) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress);
    
    rateLimitLogger.warn('Admin API rate limit exceeded', {
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      message: 'Too many API requests. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

/**
 * Rate limiter for admin password reset attempts
 * Very restrictive to prevent abuse
 */
export const adminPasswordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  
  keyGenerator: (req: Request): string => {
    return ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown');
  },

  handler: (req: Request, res: Response) => {
    const ip = req.ip || (req.connection && req.connection.remoteAddress);
    
    rateLimitLogger.warn('Admin password reset rate limit exceeded', {
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts. Please try again in 1 hour.',
      retryAfter: 60 * 60
    });
  }
});