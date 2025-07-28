import express from 'express';
import { auth } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount
} from '../controllers/notificationController';

const router = express.Router();

// Get user's notifications
router.get('/', auth, getUserNotifications);

// Get unread notification count
router.get('/unread-count', auth, getUnreadNotificationCount);

// Mark notification as read
router.patch('/:notificationId/read', auth, markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', auth, markAllNotificationsAsRead);

export default router; 