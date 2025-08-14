import express from 'express';
import { auth, requireRole } from '../middleware/auth';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
} from '../controllers/notificationsController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get user's notifications (paginated)
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Create new notification (admin/system use)
router.post('/', requireRole('admin'), createNotification);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

export default router; 