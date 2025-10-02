import express from 'express';
import { Request, Response } from 'express';
import { performanceService } from '../services/performanceService';
import { healthService } from '../services/healthService';
import { checkIndexes, analyzeQueryPerformance } from '../config/indexes';
import { auth, AuthRequest, requireRole } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = express.Router();
const perfLogger = createLogger('performance-routes');

// Get current performance metrics
router.get('/metrics', auth, requireRole('admin'), async (req, res) => {
  try {
    const summary = performanceService.getPerformanceSummary();
    const trends = performanceService.getPerformanceTrends();
    
    res.json({
      success: true,
      data: {
        current: summary,
        trends: trends
      }
    });
  } catch (error) {
    perfLogger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

// Get historical performance data (admin only)
router.get('/metrics/history', auth, requireRole('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const historical = performanceService.getHistoricalMetrics(limit);
    
    res.json({
      success: true,
      data: historical
    });
  } catch (error) {
    perfLogger.error('Error getting historical metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get historical metrics'
    });
  }
});

// Get comprehensive health check (admin only)
router.get('/health', auth, requireRole('admin'), async (req, res) => {
  try {
    const healthCheck = await healthService.getHealthStatus();
    const performanceMetrics = performanceService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: {
        health: healthCheck,
        performance: performanceMetrics,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    perfLogger.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health status'
    });
  }
});

// Get database index information (admin only)
router.get('/database/indexes', auth, requireRole('admin'), async (req, res) => {
  try {
    const indexes = await checkIndexes();
    
    res.json({
      success: true,
      data: indexes
    });
  } catch (error) {
    perfLogger.error('Error getting database indexes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database indexes'
    });
  }
});

// Analyze query performance (admin only)
router.post('/database/analyze-query', auth, requireRole('admin'), async (req, res) => {
  try {
    const { collection, query } = req.body;
    
    if (!collection || !query) {
      res.status(400).json({
        success: false,
        message: 'Collection and query are required'
      });
      return;
    }
    
    const analysis = await analyzeQueryPerformance(collection, query);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    perfLogger.error('Error analyzing query performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze query performance'
    });
  }
});

// Reset performance metrics (admin only)
router.post('/metrics/reset', auth, requireRole('admin'), async (req, res) => {
  try {
    performanceService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    perfLogger.error('Error resetting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset performance metrics'
    });
  }
});

// Get system resource usage (admin only)
router.get('/system', auth, requireRole('admin'), async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // Get Node.js version and platform info
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: {
          seconds: uptime,
          formatted: formatUptime(uptime * 1000)
        }
      },
      memory: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        arrayBuffers: `${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)}MB`
      },
      cpu: {
        user: `${(cpuUsage.user / 1000000).toFixed(2)}ms`,
        system: `${(cpuUsage.system / 1000000).toFixed(2)}ms`
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    perfLogger.error('Error getting system information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system information'
    });
  }
});

// Get performance alerts (admin only)
router.get('/alerts', auth, requireRole('admin'), async (req, res) => {
  try {
    const currentMetrics = performanceService.getPerformanceSummary();
    const alerts = [];
    
    if (currentMetrics) {
      // Check for various alert conditions
      const memoryUsageMB = parseInt(currentMetrics.memory.heapUsed);
      const errorRate = parseFloat(currentMetrics.errors.rate);
      const avgResponseTime = parseFloat(currentMetrics.requests.averageResponseTime);
      
      if (memoryUsageMB > 500) {
        alerts.push({
          type: 'warning',
          category: 'memory',
          message: `High memory usage: ${memoryUsageMB}MB`,
          threshold: '500MB',
          current: `${memoryUsageMB}MB`
        });
      }
      
      if (errorRate > 5) {
        alerts.push({
          type: 'error',
          category: 'errors',
          message: `High error rate: ${errorRate}%`,
          threshold: '5%',
          current: `${errorRate}%`
        });
      }
      
      if (avgResponseTime > 2000) {
        alerts.push({
          type: 'warning',
          category: 'performance',
          message: `Slow response time: ${avgResponseTime}ms`,
          threshold: '2000ms',
          current: `${avgResponseTime}ms`
        });
      }
      
      if (currentMetrics.requests.active > 100) {
        alerts.push({
          type: 'warning',
          category: 'load',
          message: `High concurrent requests: ${currentMetrics.requests.active}`,
          threshold: '100',
          current: currentMetrics.requests.active.toString()
        });
      }
      
      if (!currentMetrics.cache.isHealthy) {
        alerts.push({
          type: 'error',
          category: 'cache',
          message: 'Cache is unhealthy',
          threshold: 'healthy',
          current: 'unhealthy'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        alerts,
        alertCount: alerts.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    perfLogger.error('Error getting performance alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance alerts'
    });
  }
});

// Helper function to format uptime
function formatUptime(milliseconds: number): string {
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

export default router;