import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for authentication endpoints
 * Limits each IP to 5 requests per 15 minutes for login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    retryAfter: Math.round(15 * 60 / 60) // minutes
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later',
      retryAfter: Math.round(15 * 60 / 60)
    });
  }
});

/**
 * Rate limiting middleware for general API endpoints
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: Math.round(15 * 60 / 60) // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: Math.round(15 * 60 / 60)
    });
  }
});

/**
 * Rate limiting middleware for file uploads
 * Limits each IP to 10 uploads per hour
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
    retryAfter: Math.round(60 / 60) // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later',
      retryAfter: Math.round(60 / 60)
    });
  }
});

/**
 * Rate limiting middleware for chat messages
 * Limits each IP to 50 messages per minute
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down',
    retryAfter: Math.round(1) // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many messages, please slow down',
      retryAfter: Math.round(1)
    });
  }
});

/**
 * Rate limiting middleware for password reset
 * Limits each IP to 3 password reset attempts per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    retryAfter: Math.round(60 / 60) // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later',
      retryAfter: Math.round(60 / 60)
    });
  }
}); 