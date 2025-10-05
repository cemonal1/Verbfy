import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { adminApiRateLimit } from '../middleware/adminRateLimit';
import { idempotencyMiddleware } from '../middleware/idempotency';
import {
  getSystemHealth,
  getSystemStats,
  clearCache,
  getAuditLogs,
  getSecurityAlerts
} from '../controllers/adminSystemController';

const router = Router();

// All admin system routes require authentication, admin role, and rate limiting
router.use(adminApiRateLimit);
router.use(auth);
router.use(requireRole('admin'));

/**
 * System Health & Monitoring
 */

// GET /api/admin/system/health - Get system health status
router.get('/health', getSystemHealth);

// GET /api/admin/system/stats - Get system statistics and metrics
router.get('/stats', getSystemStats);

/**
 * Cache Management
 */

// POST /api/admin/system/cache/clear - Clear system cache
router.post('/cache/clear', idempotencyMiddleware, clearCache);

/**
 * Audit & Security
 */

// GET /api/admin/system/audit-logs - Get audit logs with advanced filtering
router.get('/audit-logs', getAuditLogs);

// GET /api/admin/system/security-alerts - Get security alerts and suspicious activities
router.get('/security-alerts', getSecurityAlerts);

export default router;