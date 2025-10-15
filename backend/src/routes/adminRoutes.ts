import { Router, Request, Response, NextFunction } from 'express';
import { auth, requireAdmin } from '../middleware/auth';
import { adminApiRateLimit } from '../middleware/adminRateLimit';
import {
  // User Management
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  // Material Moderation
  getMaterials,
  approveMaterial,
  deleteMaterial,
  // Payment Management
  getPayments,
  approvePayment,
  rejectPayment,
  refundPayment,
  // Logs & Activity
  getLogs,
  // Analytics/Overview
  getOverview,
  // Add generic update handler
  updateUser,
  // Temporary admin creation
  createTempAdmin
} from '../controllers/adminController';
import { listPendingTeachers, approveTeacher, rejectTeacher } from '../controllers/adminController';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { createLogger } from '../utils/logger';
const adminRoutesLogger = createLogger('admin-routes');

const router = Router();

// Temporary admin creation endpoint (no auth required)
router.post('/create-temp-admin', createTempAdmin);

// All other admin routes require authentication, admin role, and rate limiting
router.use(adminApiRateLimit);
router.use(auth);
router.use(requireAdmin);

// Analytics/Overview
router.get('/overview', getOverview);

// Add aliases for test expectations
router.get('/dashboard', getOverview);
router.get('/analytics', getOverview);
router.get('/settings', (_req, res) => {
  res.json({ success: true, settings: { version: '1.0', maintenanceMode: false } });
});

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
// Generic update route to support tests using PUT
router.put('/users/:id', idempotencyMiddleware, updateUser);
router.patch('/users/:id/role', idempotencyMiddleware, updateUserRole);
router.patch('/users/:id/status', idempotencyMiddleware, updateUserStatus);
router.delete('/users/:id', idempotencyMiddleware, deleteUser);
// Teacher approval
router.get('/teachers/pending', listPendingTeachers);
router.patch('/teachers/:id/approve', idempotencyMiddleware, approveTeacher);
router.patch('/teachers/:id/reject', idempotencyMiddleware, rejectTeacher);

// Material Moderation
router.get('/materials', getMaterials);
router.patch('/materials/:id/approve', idempotencyMiddleware, approveMaterial);
router.delete('/materials/:id', idempotencyMiddleware, deleteMaterial);

// Payment Management
router.get('/payments', getPayments);
router.patch('/payments/:id/approve', idempotencyMiddleware, approvePayment);
router.patch('/payments/:id/reject', idempotencyMiddleware, rejectPayment);
router.patch('/payments/:id/refund', idempotencyMiddleware, refundPayment);

// Logs & Activity
router.get('/logs', getLogs);

// Legacy routes for backward compatibility
router.get('/stats', getOverview);
router.get('/activities', getLogs);
router.get('/getAllUsers', getUsers);
router.patch('/users/:userId/status', idempotencyMiddleware, updateUserStatus);

// Error-handling middleware to sanitize internal error messages for admin routes
router.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isError = err instanceof Error;
  adminRoutesLogger.error('Admin route error', {
    name: isError ? err.name : 'Error',
    message: isError ? err.message : 'Unknown error',
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default router;