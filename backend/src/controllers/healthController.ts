import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';
import { cacheService } from '../services/cacheService';
import { getRequestId } from '../middleware/requestId';

const healthLogger = createLogger('Health');

/**
 * Basic health check endpoint
 * Returns 200 if the service is running
 *
 * GET /api/v1/health
 */
export const getHealth = async (req: Request, res: Response): Promise<void> => {
  const requestId = getRequestId(req);

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: require('../../package.json').version,
      requestId
    };

    healthLogger.debug('Health check passed', { requestId });
    res.status(200).json(health);
  } catch (error) {
    healthLogger.error('Health check failed', {
      requestId,
      error: error instanceof Error ? error.message : error
    });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Readiness check endpoint
 * Returns 200 if the service is ready to accept traffic (all dependencies are available)
 *
 * GET /api/v1/ready
 */
export const getReady = async (req: Request, res: Response): Promise<void> => {
  const requestId = getRequestId(req);

  try {
    const checks = {
      mongodb: false,
      redis: false
    };

    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      checks.mongodb = true;
    }

    // Check Redis connection
    if (cacheService.isHealthy()) {
      checks.redis = true;
    }

    const allChecks = Object.values(checks).every(check => check === true);

    if (allChecks) {
      healthLogger.debug('Readiness check passed', { requestId, checks });
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
        requestId
      });
    } else {
      healthLogger.warn('Readiness check failed', { requestId, checks });
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks,
        message: 'Some dependencies are unavailable',
        requestId
      });
    }
  } catch (error) {
    healthLogger.error('Readiness check error', {
      requestId,
      error: error instanceof Error ? error.message : error
    });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Liveness check endpoint
 * Returns 200 if the service is alive and not stuck
 * Checks event loop lag to detect if the process is hanging
 *
 * GET /api/v1/live
 */
export const getLive = async (req: Request, res: Response): Promise<void> => {
  const requestId = getRequestId(req);

  try {
    // Measure event loop lag
    const start = process.hrtime.bigint();
    await new Promise(resolve => setImmediate(resolve));
    const end = process.hrtime.bigint();
    const lagMs = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds

    const eventLoopLagThreshold = 100; // 100ms threshold
    const isHealthy = lagMs < eventLoopLagThreshold;

    const liveness = {
      status: isHealthy ? 'alive' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      eventLoopLagMs: Math.round(lagMs * 100) / 100, // Round to 2 decimal places
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024), // MB
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024) // MB
      },
      requestId
    };

    if (isHealthy) {
      healthLogger.debug('Liveness check passed', { requestId, lagMs });
      res.status(200).json(liveness);
    } else {
      healthLogger.warn('Liveness check degraded - high event loop lag', {
        requestId,
        lagMs,
        threshold: eventLoopLagThreshold
      });
      res.status(200).json(liveness); // Still return 200 but with 'degraded' status
    }
  } catch (error) {
    healthLogger.error('Liveness check failed', {
      requestId,
      error: error instanceof Error ? error.message : error
    });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};

/**
 * Combined health/readiness/liveness check
 * Returns detailed status of all checks
 *
 * GET /api/v1/status
 */
export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const requestId = getRequestId(req);

  try {
    // Health check
    const health = {
      alive: true,
      uptime: process.uptime()
    };

    // Readiness checks
    const ready = {
      mongodb: mongoose.connection.readyState === 1,
      redis: cacheService.isHealthy()
    };

    // Liveness check - event loop lag
    const start = process.hrtime.bigint();
    await new Promise(resolve => setImmediate(resolve));
    const end = process.hrtime.bigint();
    const lagMs = Number(end - start) / 1_000_000;

    const eventLoopLagThreshold = 100;
    const live = {
      eventLoopLagMs: Math.round(lagMs * 100) / 100,
      healthy: lagMs < eventLoopLagThreshold
    };

    const allReady = Object.values(ready).every(check => check === true);
    const overallStatus = health.alive && allReady && live.healthy ? 'healthy' : 'degraded';

    const status = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: require('../../package.json').version,
      environment: process.env.NODE_ENV || 'development',
      health,
      ready,
      live,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      requestId
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    healthLogger.debug(`Status check: ${overallStatus}`, { requestId, status });
    res.status(statusCode).json(status);
  } catch (error) {
    healthLogger.error('Status check failed', {
      requestId,
      error: error instanceof Error ? error.message : error
    });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    });
  }
};
