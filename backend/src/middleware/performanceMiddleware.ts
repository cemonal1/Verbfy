import { Request, Response, NextFunction } from 'express';
import { performanceService } from '../services/performanceService';
import { createLogger } from '../utils/logger';

const perfLogger = createLogger('performance-middleware');

// Extend Request interface to include performance tracking
declare global {
  namespace Express {
    interface Request {
      startTime?: string;
      performanceMetrics?: {
        startTime: number;
        route: string;
        method: string;
      };
    }
  }
}

// Performance tracking middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performanceService.trackRequestStart();
  req.startTime = startTime;
  
  // Track additional metrics
  req.performanceMetrics = {
    startTime: Date.now(),
    route: req.route?.path || req.path,
    method: req.method
  };

  // Override res.end to track completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const isError = res.statusCode >= 400;
    performanceService.trackRequestEnd(startTime, isError);
    
    // Log slow requests (>1000ms)
    const responseTime = Date.now() - req.performanceMetrics!.startTime;
    if (responseTime > 1000) {
      perfLogger.warn('Slow request detected:', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    // Log error requests
    if (isError) {
      perfLogger.error('Error request:', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    return originalEnd.call(this, chunk, encoding) as Response;
  };

  next();
};

// Route-specific performance tracking
export const trackRoutePerformance = (routeName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Override res.json to track API response times
    const originalJson = res.json;
    res.json = function(body?: any) {
      const responseTime = Date.now() - startTime;
      
      // Log API performance
      perfLogger.debug('API Performance:', {
        route: routeName,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        bodySize: JSON.stringify(body).length
      });

      return originalJson.call(this, body);
    };

    next();
  };
};

// Database query performance tracking
export const trackDatabaseQuery = (queryName: string, queryFn: Function) => {
  return async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = await queryFn(...args);
      const queryTime = Date.now() - startTime;
      
      // Log slow database queries (>100ms)
      if (queryTime > 100) {
        perfLogger.warn('Slow database query:', {
          queryName,
          queryTime: `${queryTime}ms`
        });
      }
      
      return result;
    } catch (error) {
      const queryTime = Date.now() - startTime;
      perfLogger.error('Database query error:', {
        queryName,
        queryTime: `${queryTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
};

// Cache operation performance tracking
export const trackCacheOperation = (operationName: string, operationFn: Function) => {
  return async (...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = await operationFn(...args);
      const operationTime = Date.now() - startTime;
      
      // Log slow cache operations (>50ms)
      if (operationTime > 50) {
        perfLogger.warn('Slow cache operation:', {
          operationName,
          operationTime: `${operationTime}ms`
        });
      }
      
      return result;
    } catch (error) {
      const operationTime = Date.now() - startTime;
      perfLogger.error('Cache operation error:', {
        operationName,
        operationTime: `${operationTime}ms`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  };
};

// Memory usage tracking middleware
export const memoryTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const memoryBefore = process.memoryUsage();
  
  // Override res.end to track memory usage
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const memoryAfter = process.memoryUsage();
    const memoryDiff = {
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      external: memoryAfter.external - memoryBefore.external,
      rss: memoryAfter.rss - memoryBefore.rss
    };
    
    // Log significant memory increases (>10MB)
    if (memoryDiff.heapUsed > 10 * 1024 * 1024) {
      perfLogger.warn('High memory usage increase:', {
        route: req.path,
        method: req.method,
        memoryIncrease: `${Math.round(memoryDiff.heapUsed / 1024 / 1024)}MB`,
        totalHeapUsed: `${Math.round(memoryAfter.heapUsed / 1024 / 1024)}MB`
      });
    }
    
    return originalEnd.call(this, chunk, encoding) as Response;
  };
  
  next();
};

// Request size tracking middleware
export const requestSizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  
  if (contentLength) {
    const sizeBytes = parseInt(contentLength);
    const sizeMB = sizeBytes / (1024 * 1024);
    
    // Log large requests (>5MB)
    if (sizeMB > 5) {
      perfLogger.warn('Large request received:', {
        route: req.path,
        method: req.method,
        size: `${sizeMB.toFixed(2)}MB`,
        contentType: req.get('content-type')
      });
    }
  }
  
  next();
};

export default {
  performanceMiddleware,
  trackRoutePerformance,
  trackDatabaseQuery,
  trackCacheOperation,
  memoryTrackingMiddleware,
  requestSizeMiddleware
};