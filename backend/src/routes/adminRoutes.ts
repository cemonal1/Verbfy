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

const router = Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole('admin'));

// Analytics/Overview
router.get('/overview', getOverview);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Material Moderation
router.get('/materials', getMaterials);
router.patch('/materials/:id/approve', approveMaterial);
router.delete('/materials/:id', deleteMaterial);

// Payment Management
router.get('/payments', getPayments);
router.patch('/payments/:id/refund', refundPayment);

// Logs & Activity
router.get('/logs', getLogs);

// Legacy routes for backward compatibility
router.get('/stats', getOverview);
router.get('/activities', getLogs);
router.get('/getAllUsers', getUsers);
router.patch('/users/:userId/status', updateUserStatus);

export default router; 