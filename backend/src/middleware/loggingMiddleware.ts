import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('LoggingMiddleware');

/**
 * Middleware to replace console.log, console.error, etc. with structured logger
 * This helps standardize logging across the application
 */
export const setupLoggingInterceptor = () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Override console methods with structured logger
  console.log = (...args: any[]) => {
    logger.debug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.log(...args);
    }
  };

  console.error = (...args: any[]) => {
    logger.error(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.error(...args);
    }
  };

  console.warn = (...args: any[]) => {
    logger.warn(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.warn(...args);
    }
  };

  console.info = (...args: any[]) => {
    logger.info(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.info(...args);
    }
  };

  console.debug = (...args: any[]) => {
    logger.debug(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
    if (process.env.NODE_ENV !== 'production') {
      originalConsole.debug(...args);
    }
  };
};

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 15);
  
  // Add request ID to response headers for tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Log request details
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    logger.info(`Response sent: ${res.statusCode} (${responseTime}ms)`, {
      requestId,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id || 'anonymous'
    });
    
    return originalSend.call(this, body);
  };

  next();
};

export default { setupLoggingInterceptor, requestLogger };