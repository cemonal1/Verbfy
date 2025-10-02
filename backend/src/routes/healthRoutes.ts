import express from 'express';
import { healthService } from '../services/healthService';
import { createLogger } from '../utils/logger';

const router = express.Router();
const logger = createLogger('HealthRoutes');

// Quick health check for load balancers (no authentication required)
router.get('/ping', async (req, res) => {
  try {
    const result = await healthService.quickHealthCheck();
    
    const statusCode = result.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    logger.error('Health ping failed:', error);
    res.status(503).json({
      status: 'error',
      uptime: 0,
    });
  }
});

// Detailed health check
router.get('/health', async (req, res) => {
  try {
    const healthReport = await healthService.performHealthCheck();
    
    // Set appropriate status code based on health
    let statusCode = 200;
    if (healthReport.status === 'unhealthy') {
      statusCode = 503;
    } else if (healthReport.status === 'degraded') {
      statusCode = 200; // Still operational but with issues
    }
    
    res.status(statusCode).json(healthReport);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: [],
      summary: { total: 0, healthy: 0, unhealthy: 1, degraded: 0 },
      error: error instanceof Error ? error.message : 'Health check failed',
    });
  }
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    const healthReport = await healthService.performHealthCheck();
    
    // Service is ready if database is healthy (cache can be degraded)
    const dbCheck = healthReport.checks.find(c => c.name === 'database');
    const isReady = dbCheck?.status === 'healthy';
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: healthReport.checks.filter(c => ['database', 'memory'].includes(c.name)),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: dbCheck?.message || 'Database not available',
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', async (req, res) => {
  try {
    // Simple check - if the process is running and can respond, it's alive
    const memUsage = process.memoryUsage();
    const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = (heapUsed / heapTotal) * 100;
    
    // Consider the service dead if memory usage is critically high
    if (heapUsagePercent > 95) {
      res.status(503).json({
        status: 'not alive',
        timestamp: new Date().toISOString(),
        reason: 'Memory usage critically high',
        memoryUsage: `${heapUsagePercent.toFixed(1)}%`,
      });
    } else {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: `${heapUsagePercent.toFixed(1)}%`,
      });
    }
  } catch (error) {
    logger.error('Liveness check failed:', error);
    res.status(503).json({
      status: 'not alive',
      timestamp: new Date().toISOString(),
      reason: error instanceof Error ? error.message : 'Liveness check failed',
    });
  }
});

// Metrics endpoint (basic metrics for monitoring)
router.get('/metrics', async (req, res) => {
  try {
    const healthReport = await healthService.performHealthCheck();
    const memUsage = process.memoryUsage();
    
    // Convert to Prometheus-style metrics
    const metrics = [
      `# HELP verbfy_health_status Overall health status (1=healthy, 0.5=degraded, 0=unhealthy)`,
      `# TYPE verbfy_health_status gauge`,
      `verbfy_health_status{environment="${process.env.NODE_ENV || 'development'}"} ${
        healthReport.status === 'healthy' ? 1 : healthReport.status === 'degraded' ? 0.5 : 0
      }`,
      '',
      `# HELP verbfy_uptime_seconds Application uptime in seconds`,
      `# TYPE verbfy_uptime_seconds counter`,
      `verbfy_uptime_seconds ${Math.floor(healthReport.uptime / 1000)}`,
      '',
      `# HELP verbfy_memory_usage_bytes Memory usage in bytes`,
      `# TYPE verbfy_memory_usage_bytes gauge`,
      `verbfy_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
      `verbfy_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
      `verbfy_memory_usage_bytes{type="external"} ${memUsage.external}`,
      `verbfy_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      '',
      `# HELP verbfy_health_check_duration_seconds Health check response time`,
      `# TYPE verbfy_health_check_duration_seconds gauge`,
    ];

    // Add individual health check metrics
    healthReport.checks.forEach(check => {
      if (check.responseTime) {
        metrics.push(
          `verbfy_health_check_duration_seconds{check="${check.name}"} ${check.responseTime / 1000}`
        );
      }
      metrics.push(
        `verbfy_health_check_status{check="${check.name}"} ${
          check.status === 'healthy' ? 1 : check.status === 'degraded' ? 0.5 : 0
        }`
      );
    });

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics.join('\n'));
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Metrics generation failed',
    });
  }
});

export default router;