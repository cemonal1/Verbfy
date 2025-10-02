import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const monitoringLogger = createLogger('Monitoring');

// Performance metrics interface
interface PerformanceMetrics {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  userAgent?: string;
  ip: string;
}

// Request tracking
const activeRequests = new Map<string, { startTime: number; cpuUsage: NodeJS.CpuUsage }>();
let requestCounter = 0;

// Metrics storage
const metricsBuffer: PerformanceMetrics[] = [];
const MAX_BUFFER_SIZE = 1000;
const METRICS_FLUSH_INTERVAL = 30000; // 30 seconds

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `req_${++requestCounter}_${Date.now()}`;
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();
  
  // Store request start info
  activeRequests.set(requestId, { startTime, cpuUsage: startCpuUsage });
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endCpuUsage = process.cpuUsage(startCpuUsage);
    
    // Collect metrics
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: endCpuUsage,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    };
    
    // Add to buffer
    metricsBuffer.push(metrics);
    
    // Log slow requests
    if (responseTime > 1000) {
      monitoringLogger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: res.statusCode
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      monitoringLogger.error('Request error', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime
      });
    }
    
    // Clean up
    activeRequests.delete(requestId);
    
    // Call original end and return the result
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// System metrics collection
export const collectSystemMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      process: process.memoryUsage()
    },
    cpu: {
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      usage: process.cpuUsage()
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime()
    },
    activeRequests: activeRequests.size
  };
};

// Health check endpoint data
export const getHealthMetrics = () => {
  const systemMetrics = collectSystemMetrics();
  const recentMetrics = metricsBuffer.slice(-10);
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    requests: {
      active: activeRequests.size,
      recent: recentMetrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
        : 0
    },
    memory: {
      usage: (systemMetrics.memory.used / systemMetrics.memory.total * 100).toFixed(2) + '%',
      process: systemMetrics.memory.process
    }
  };
};

// Flush metrics to file
const flushMetrics = () => {
  if (metricsBuffer.length === 0) return;
  
  const metricsFile = path.join(logsDir, 'performance-metrics.jsonl');
  const metricsToFlush = metricsBuffer.splice(0, metricsBuffer.length);
  
  const logLines = metricsToFlush.map(metric => JSON.stringify(metric)).join('\n') + '\n';
  
  fs.appendFile(metricsFile, logLines, (err) => {
    if (err) {
      monitoringLogger.error('Failed to write metrics to file', { error: err.message });
    }
  });
  
  // Also log system metrics
  const systemMetrics = collectSystemMetrics();
  const systemMetricsFile = path.join(logsDir, 'system-metrics.jsonl');
  const systemLogLine = JSON.stringify(systemMetrics) + '\n';
  
  fs.appendFile(systemMetricsFile, systemLogLine, (err) => {
    if (err) {
      monitoringLogger.error('Failed to write system metrics to file', { error: err.message });
    }
  });
};

// Alert system for critical metrics
export const checkAlerts = () => {
  const systemMetrics = collectSystemMetrics();
  const memoryUsagePercent = (systemMetrics.memory.used / systemMetrics.memory.total) * 100;
  const loadAverage = systemMetrics.cpu.loadAverage[0];
  
  // Memory alert
  if (memoryUsagePercent > 85) {
    monitoringLogger.warn('High memory usage detected', {
      usage: `${memoryUsagePercent.toFixed(2)}%`,
      threshold: '85%'
    });
  }
  
  // CPU alert
  if (loadAverage > systemMetrics.cpu.cpuCount * 0.8) {
    monitoringLogger.warn('High CPU load detected', {
      loadAverage,
      cpuCount: systemMetrics.cpu.cpuCount,
      threshold: systemMetrics.cpu.cpuCount * 0.8
    });
  }
  
  // Active requests alert
  if (activeRequests.size > 100) {
    monitoringLogger.warn('High number of active requests', {
      activeRequests: activeRequests.size,
      threshold: 100
    });
  }
};

// Start monitoring intervals
export const startMonitoring = () => {
  // Flush metrics periodically
  setInterval(flushMetrics, METRICS_FLUSH_INTERVAL);
  
  // Check alerts periodically
  setInterval(checkAlerts, 60000); // Every minute
  
  // Clean up old metrics files (keep last 7 days)
  setInterval(() => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    ['performance-metrics.jsonl', 'system-metrics.jsonl'].forEach(filename => {
      const filePath = path.join(logsDir, filename);
      
      fs.stat(filePath, (err, stats) => {
        if (!err && stats.mtime.getTime() < sevenDaysAgo) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              monitoringLogger.info('Cleaned up old metrics file', { filename });
            }
          });
        }
      });
    });
  }, 24 * 60 * 60 * 1000); // Daily cleanup
  
  monitoringLogger.info('Monitoring system started', {
    metricsFlushInterval: METRICS_FLUSH_INTERVAL,
    maxBufferSize: MAX_BUFFER_SIZE
  });
};

// Graceful shutdown
export const stopMonitoring = () => {
  flushMetrics();
  monitoringLogger.info('Monitoring system stopped');
};

// Request timeout monitoring
export const requestTimeoutMonitoring = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        monitoringLogger.error('Request timeout', {
          method: req.method,
          url: req.url,
          timeout: timeoutMs,
          requestId: (req as any).requestId
        });
        
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process'
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      clearTimeout(timeout);
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};