import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';

// Get user's notifications
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, unreadOnly = false } = req.query;

    let query: any = { recipient: userId };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .populate('relatedReservation', 'actualDate startTime endTime lessonType lessonLevel')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        sender: notification.sender,
        relatedReservation: notification.relatedReservation
      }))
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch notifications' 
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ 
        message: 'Notification not found' 
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        isRead: notification.isRead
      }
    });

  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to mark notification as read' 
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });

  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to mark notifications as read' 
    });
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.json({
      unreadCount: count
    });

  } catch (error: any) {
    console.error('Error getting unread notification count:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get unread notification count' 
    });
  }
}; 