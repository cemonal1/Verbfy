import mongoose from 'mongoose';
import { cacheService } from './cacheService';
import { getDBMetrics } from '../config/db';
import { performanceService } from './performanceService';
import { createLogger } from '../utils/logger';

const logger = createLogger('HealthService');

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: any;
}

export interface HealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

class HealthService {
  private startTime = Date.now();

  async performHealthCheck(): Promise<HealthReport> {
    const checks: HealthCheck[] = [];
    
    // Run all health checks in parallel
    const checkPromises = [
      this.checkDatabase(),
      this.checkCache(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkExternalServices(),
    ];

    const results = await Promise.allSettled(checkPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks.push(result.value);
      } else {
        checks.push({
          name: ['database', 'cache', 'memory', 'disk', 'external'][index],
          status: 'unhealthy',
          message: result.reason?.message || 'Health check failed',
        });
      }
    });

    // Calculate overall status
    const summary = this.calculateSummary(checks);
    const overallStatus = this.determineOverallStatus(summary);

    // Get performance metrics
    const performanceMetrics = performanceService.getPerformanceSummary();

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      summary,
      performance: performanceMetrics,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const state = mongoose.connection.readyState;
      const responseTime = Date.now() - start;

      if (state === 1) {
        // Test a simple query
        await mongoose.connection.db.admin().ping();
        
        // Get enhanced database metrics
        const dbMetrics = getDBMetrics();
        
        return {
          name: 'database',
          status: 'healthy',
          message: 'MongoDB connection is healthy',
          responseTime,
          details: {
            readyState: state,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
            connectionPool: dbMetrics?.connection ? {
              totalConnections: dbMetrics.connection.poolSize,
              availableConnections: dbMetrics.connection.availableConnections,
              checkedOutConnections: dbMetrics.connection.checkedOutConnections
            } : null
          },
        };
      } else {
        return {
          name: 'database',
          status: 'unhealthy',
          message: `MongoDB connection state: ${state}`,
          responseTime,
        };
      }
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkCache(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const isHealthy = cacheService.isHealthy();
      const responseTime = Date.now() - start;

      if (isHealthy) {
        // Test cache operations
        const testKey = 'health-check-test';
        const testValue = { timestamp: Date.now() };
        
        await cacheService.set(testKey, testValue, 10);
        const retrieved = await cacheService.get(testKey);
        await cacheService.del(testKey);

        const isWorking = retrieved && retrieved.timestamp === testValue.timestamp;

        return {
          name: 'cache',
          status: isWorking ? 'healthy' : 'degraded',
          message: isWorking ? 'Redis cache is healthy' : 'Redis cache operations failed',
          responseTime,
        };
      } else {
        return {
          name: 'cache',
          status: 'degraded',
          message: 'Redis cache is not connected (app will work without cache)',
          responseTime,
        };
      }
    } catch (error) {
      return {
        name: 'cache',
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Cache check failed',
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - start;
      
      // Convert to MB
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
      const external = Math.round(memUsage.external / 1024 / 1024);
      const rss = Math.round(memUsage.rss / 1024 / 1024);
      
      // Check if memory usage is concerning (>80% of heap)
      const heapUsagePercent = (heapUsed / heapTotal) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Memory usage is normal';
      
      if (heapUsagePercent > 90) {
        status = 'unhealthy';
        message = 'Memory usage is critically high';
      } else if (heapUsagePercent > 80) {
        status = 'degraded';
        message = 'Memory usage is high';
      }

      return {
        name: 'memory',
        status,
        message,
        responseTime,
        details: {
          heapUsed: `${heapUsed}MB`,
          heapTotal: `${heapTotal}MB`,
          heapUsagePercent: `${heapUsagePercent.toFixed(1)}%`,
          external: `${external}MB`,
          rss: `${rss}MB`,
        },
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Memory check failed',
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Check if we can write to uploads directory
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const testFile = path.join(uploadsDir, 'health-check.tmp');
      
      await fs.writeFile(testFile, 'health check');
      await fs.unlink(testFile);
      
      const responseTime = Date.now() - start;

      return {
        name: 'disk',
        status: 'healthy',
        message: 'Disk I/O is working',
        responseTime,
      };
    } catch (error) {
      return {
        name: 'disk',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Disk check failed',
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const checks = [];
      
      // Check LiveKit if configured
      if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
        checks.push('LiveKit configured');
      }
      
      // Check email service if configured
      if (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY) {
        checks.push('Email service configured');
      }
      
      // Check file storage if configured
      if (process.env.AWS_ACCESS_KEY_ID || process.env.CLOUDINARY_URL) {
        checks.push('File storage configured');
      }

      const responseTime = Date.now() - start;

      return {
        name: 'external',
        status: checks.length > 0 ? 'healthy' : 'degraded',
        message: checks.length > 0 ? 'External services configured' : 'No external services configured',
        responseTime,
        details: { services: checks },
      };
    } catch (error) {
      return {
        name: 'external',
        status: 'degraded',
        message: error instanceof Error ? error.message : 'External services check failed',
        responseTime: Date.now() - start,
      };
    }
  }

  private calculateSummary(checks: HealthCheck[]) {
    const total = checks.length;
    const healthy = checks.filter(c => c.status === 'healthy').length;
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;

    return { total, healthy, unhealthy, degraded };
  }

  private determineOverallStatus(summary: { healthy: number; unhealthy: number; degraded: number }): 'healthy' | 'unhealthy' | 'degraded' {
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    }
    if (summary.degraded > 0) {
      return 'degraded';
    }
    return 'healthy';
  }

  // Quick health check for load balancers
  async quickHealthCheck(): Promise<{ status: string; uptime: number }> {
    try {
      const dbState = mongoose.connection.readyState;
      const status = dbState === 1 ? 'ok' : 'error';
      
      return {
        status,
        uptime: Date.now() - this.startTime,
      };
    } catch (error) {
      return {
        status: 'error',
        uptime: Date.now() - this.startTime,
      };
    }
  }
}

export const healthService = new HealthService();
export default healthService;