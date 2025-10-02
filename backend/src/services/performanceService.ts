import { createLogger } from '../utils/logger';
import { getDBMetrics, monitorConnectionPool } from '../config/db';
import { cacheService } from './cacheService';

const perfLogger = createLogger('performance');

interface PerformanceMetrics {
  timestamp: Date;
  memory: NodeJS.MemoryUsage;
  cpu: {
    user: number;
    system: number;
  };
  database: {
    connectionPool?: any;
    responseTime?: number;
  };
  cache: {
    isHealthy: boolean;
    responseTime?: number;
  };
  requests: {
    total: number;
    active: number;
    averageResponseTime: number;
  };
  errors: {
    total: number;
    rate: number;
  };
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private requestCount = 0;
  private activeRequests = 0;
  private totalResponseTime = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private cpuUsage = process.cpuUsage();

  constructor() {
    // Start collecting metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Clean old metrics every 5 minutes (keep last 100 entries)
    setInterval(() => {
      this.cleanOldMetrics();
    }, 300000);
  }

  // Track request start
  trackRequestStart(): string {
    this.activeRequests++;
    this.requestCount++;
    return Date.now().toString();
  }

  // Track request end
  trackRequestEnd(startTime: string, isError: boolean = false): void {
    this.activeRequests--;
    const responseTime = Date.now() - parseInt(startTime);
    this.totalResponseTime += responseTime;

    if (isError) {
      this.errorCount++;
    }
  }

  // Collect comprehensive metrics
  private async collectMetrics(): Promise<void> {
    try {
      const now = new Date();
      const currentCpuUsage = process.cpuUsage(this.cpuUsage);
      
      // Database metrics
      let dbMetrics = null;
      let dbResponseTime = null;
      try {
        const dbStart = Date.now();
        dbMetrics = getDBMetrics();
        dbResponseTime = Date.now() - dbStart;
      } catch (error) {
        perfLogger.warn('Failed to get database metrics:', error);
      }

      // Cache metrics
      let cacheHealthy = false;
      let cacheResponseTime = null;
      try {
        const cacheStart = Date.now();
        cacheHealthy = await cacheService.isHealthy();
        cacheResponseTime = Date.now() - cacheStart;
      } catch (error) {
        perfLogger.warn('Failed to get cache metrics:', error);
      }

      const metrics: PerformanceMetrics = {
        timestamp: now,
        memory: process.memoryUsage(),
        cpu: {
          user: currentCpuUsage.user / 1000000, // Convert to milliseconds
          system: currentCpuUsage.system / 1000000
        },
        database: {
          connectionPool: dbMetrics?.connection,
          responseTime: dbResponseTime
        },
        cache: {
          isHealthy: cacheHealthy,
          responseTime: cacheResponseTime
        },
        requests: {
          total: this.requestCount,
          active: this.activeRequests,
          averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
        },
        errors: {
          total: this.errorCount,
          rate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
        }
      };

      this.metrics.push(metrics);
      this.cpuUsage = process.cpuUsage(); // Reset for next measurement

      // Log performance summary
      perfLogger.info('Performance metrics collected:', {
        memoryUsage: `${Math.round(metrics.memory.heapUsed / 1024 / 1024)}MB`,
        cpuUser: `${metrics.cpu.user.toFixed(2)}ms`,
        activeRequests: metrics.requests.active,
        errorRate: `${metrics.errors.rate.toFixed(2)}%`,
        avgResponseTime: `${metrics.requests.averageResponseTime.toFixed(2)}ms`,
        cacheHealthy: metrics.cache.isHealthy,
        dbConnections: metrics.database.connectionPool?.totalConnections || 'N/A'
      });

      // Alert on high resource usage
      this.checkAlerts(metrics);

    } catch (error) {
      perfLogger.error('Error collecting performance metrics:', error);
    }
  }

  // Check for performance alerts
  private checkAlerts(metrics: PerformanceMetrics): void {
    const memoryUsageMB = metrics.memory.heapUsed / 1024 / 1024;
    
    // Memory usage alert (>500MB)
    if (memoryUsageMB > 500) {
      perfLogger.warn(`High memory usage detected: ${memoryUsageMB.toFixed(2)}MB`);
    }

    // Error rate alert (>5%)
    if (metrics.errors.rate > 5) {
      perfLogger.warn(`High error rate detected: ${metrics.errors.rate.toFixed(2)}%`);
    }

    // Response time alert (>2000ms average)
    if (metrics.requests.averageResponseTime > 2000) {
      perfLogger.warn(`Slow response time detected: ${metrics.requests.averageResponseTime.toFixed(2)}ms`);
    }

    // Active requests alert (>100)
    if (metrics.requests.active > 100) {
      perfLogger.warn(`High concurrent requests: ${metrics.requests.active}`);
    }

    // Cache health alert
    if (!metrics.cache.isHealthy) {
      perfLogger.error('Cache is unhealthy');
    }
  }

  // Clean old metrics (keep last 100 entries)
  private cleanOldMetrics(): void {
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
      perfLogger.debug('Cleaned old performance metrics');
    }
  }

  // Get current performance summary
  getPerformanceSummary(): any {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) {
      return null;
    }

    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: {
        milliseconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      memory: {
        heapUsed: `${Math.round(latest.memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(latest.memory.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(latest.memory.external / 1024 / 1024)}MB`,
        rss: `${Math.round(latest.memory.rss / 1024 / 1024)}MB`
      },
      cpu: {
        user: `${latest.cpu.user.toFixed(2)}ms`,
        system: `${latest.cpu.system.toFixed(2)}ms`
      },
      requests: {
        total: latest.requests.total,
        active: latest.requests.active,
        averageResponseTime: `${latest.requests.averageResponseTime.toFixed(2)}ms`,
        requestsPerSecond: (latest.requests.total / (uptime / 1000)).toFixed(2)
      },
      errors: {
        total: latest.errors.total,
        rate: `${latest.errors.rate.toFixed(2)}%`
      },
      database: {
        connectionPool: latest.database.connectionPool,
        responseTime: latest.database.responseTime ? `${latest.database.responseTime}ms` : null
      },
      cache: {
        isHealthy: latest.cache.isHealthy,
        responseTime: latest.cache.responseTime ? `${latest.cache.responseTime}ms` : null
      }
    };
  }

  // Get historical metrics
  getHistoricalMetrics(limit: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get performance trends
  getPerformanceTrends(): any {
    if (this.metrics.length < 2) {
      return null;
    }

    const recent = this.metrics.slice(-10); // Last 10 measurements
    const older = this.metrics.slice(-20, -10); // Previous 10 measurements

    const recentAvg = {
      memory: recent.reduce((sum, m) => sum + m.memory.heapUsed, 0) / recent.length,
      responseTime: recent.reduce((sum, m) => sum + m.requests.averageResponseTime, 0) / recent.length,
      errorRate: recent.reduce((sum, m) => sum + m.errors.rate, 0) / recent.length
    };

    const olderAvg = {
      memory: older.reduce((sum, m) => sum + m.memory.heapUsed, 0) / older.length,
      responseTime: older.reduce((sum, m) => sum + m.requests.averageResponseTime, 0) / older.length,
      errorRate: older.reduce((sum, m) => sum + m.errors.rate, 0) / older.length
    };

    return {
      memory: {
        trend: recentAvg.memory > olderAvg.memory ? 'increasing' : 'decreasing',
        change: ((recentAvg.memory - olderAvg.memory) / olderAvg.memory * 100).toFixed(2) + '%'
      },
      responseTime: {
        trend: recentAvg.responseTime > olderAvg.responseTime ? 'increasing' : 'decreasing',
        change: ((recentAvg.responseTime - olderAvg.responseTime) / olderAvg.responseTime * 100).toFixed(2) + '%'
      },
      errorRate: {
        trend: recentAvg.errorRate > olderAvg.errorRate ? 'increasing' : 'decreasing',
        change: ((recentAvg.errorRate - olderAvg.errorRate) / Math.max(olderAvg.errorRate, 0.01) * 100).toFixed(2) + '%'
      }
    };
  }

  // Format uptime
  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Reset metrics (for testing or maintenance)
  resetMetrics(): void {
    this.metrics = [];
    this.requestCount = 0;
    this.activeRequests = 0;
    this.totalResponseTime = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    this.cpuUsage = process.cpuUsage();
    perfLogger.info('Performance metrics reset');
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();
export default performanceService;