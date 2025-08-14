import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
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
  refundPayment,
  // Logs & Activity
  getLogs,
  // Analytics/Overview
  getOverview
} from '../controllers/adminController';
import { listPendingTeachers, approveTeacher, rejectTeacher } from '../controllers/adminController';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole('admin'));

// Analytics/Overview
router.get('/overview', getOverview);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
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
router.patch('/payments/:id/refund', idempotencyMiddleware, refundPayment);

// Logs & Activity
router.get('/logs', getLogs);

// Legacy routes for backward compatibility
router.get('/stats', getOverview);
router.get('/activities', getLogs);
router.get('/getAllUsers', getUsers);
router.patch('/users/:userId/status', idempotencyMiddleware, updateUserStatus);

export default router; 