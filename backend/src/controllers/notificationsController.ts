import { Request, Response } from 'express';
import { Notification, INotificationDocument } from '../models/Notification';
import { createLogger } from '../utils/logger';

const notificationsLogger = createLogger('NotificationsController');

// Get user's notifications
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { recipient: userId };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('recipient', 'name email')
      .lean();

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        unreadCount
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error getting notifications:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications'
    });
  }
};

// Create new notification
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient, type, title, body, link, meta } = req.body;

    // Validate required fields
    if (!recipient || !type || !title || !body) {
      res.status(400).json({
        success: false,
        message: 'Recipient, type, title, and body are required'
      });
      return;
    }

    // Create notification
    const notification = await Notification.createNotification({
      recipient,
      type,
      title,
      body,
      link,
      meta
    });

    // Populate recipient info
    await notification.populate('recipient', 'name email');

    // Emit real-time notification (if Socket.IO is available)
    if ((req as any).io) {
      (req as any).io.to(recipient).emit('notification:new', {
        notification: notification.toObject()
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error creating notification:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId
    }) as INotificationDocument | null;

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    await notification.markAsRead();

    // Get updated unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notification,
        unreadCount
      },
      message: 'Notification marked as read'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error marking notification as read:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      data: {
        unreadCount: 0
      },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error marking all notifications as read:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount },
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error getting unread count:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
      return;
    }

    // Get updated unread count
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount },
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error deleting notification:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Utility function to create system notifications
export const createSystemNotification = async (
  recipientId: string,
  type: 'message' | 'reservation' | 'material' | 'admin' | 'lesson' | 'payment' | 'system',
  title: string,
  body: string,
  link?: string,
  meta?: any
) => {
  try {
    const notification = await Notification.createNotification({
      recipient: recipientId,
      type,
      title,
      body,
      link,
      meta
    });

    return notification;
  } catch (error) {
    notificationsLogger.error('Error', { requestId: req.requestId, error: 'Error creating system notification:', error });
    throw error;
  }
}; 