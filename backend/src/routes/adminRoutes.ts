import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import * as adminController from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireRole('admin'));

// Get admin statistics
router.get('/stats', adminController.getAdminStats);

// Get recent activities
router.get('/activities', adminController.getRecentActivities);

// Get all users with pagination and filtering
router.get('/users', adminController.getAllUsers);

// Update user status
router.patch('/users/:userId/status', adminController.updateUserStatus);

export default router; 