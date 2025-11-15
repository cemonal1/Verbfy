import express from 'express';
import {
  getHealth,
  getReady,
  getLive,
  getStatus
} from '../controllers/healthController';

const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns 200 if the service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 environment:
 *                   type: string
 *                   example: production
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 requestId:
 *                   type: string
 *                   example: uuid-1234
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', getHealth);

/**
 * @swagger
 * /api/v1/ready:
 *   get:
 *     summary: Readiness check
 *     description: Returns 200 if the service is ready to accept traffic (all dependencies available)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                   properties:
 *                     mongodb:
 *                       type: boolean
 *                       example: true
 *                     redis:
 *                       type: boolean
 *                       example: true
 *                 requestId:
 *                   type: string
 *       503:
 *         description: Service is not ready (dependencies unavailable)
 */
router.get('/ready', getReady);

/**
 * @swagger
 * /api/v1/live:
 *   get:
 *     summary: Liveness check
 *     description: Returns 200 if the service is alive and not stuck (checks event loop lag)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [alive, degraded]
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 eventLoopLagMs:
 *                   type: number
 *                   example: 15.23
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       description: Resident Set Size in MB
 *                     heapUsed:
 *                       type: number
 *                       description: Heap used in MB
 *                     heapTotal:
 *                       type: number
 *                       description: Total heap in MB
 *                     external:
 *                       type: number
 *                       description: External memory in MB
 *                 requestId:
 *                   type: string
 *       503:
 *         description: Service is unhealthy
 */
router.get('/live', getLive);

/**
 * @swagger
 * /api/v1/status:
 *   get:
 *     summary: Combined health/readiness/liveness check
 *     description: Returns detailed status of all health checks
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: production
 *                 health:
 *                   type: object
 *                   properties:
 *                     alive:
 *                       type: boolean
 *                     uptime:
 *                       type: number
 *                 ready:
 *                   type: object
 *                   properties:
 *                     mongodb:
 *                       type: boolean
 *                     redis:
 *                       type: boolean
 *                 live:
 *                   type: object
 *                   properties:
 *                     eventLoopLagMs:
 *                       type: number
 *                     healthy:
 *                       type: boolean
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                     heapUsed:
 *                       type: number
 *                     heapTotal:
 *                       type: number
 *                     external:
 *                       type: number
 *                 requestId:
 *                   type: string
 *       503:
 *         description: Service is degraded or unhealthy
 */
router.get('/status', getStatus);

export default router;
