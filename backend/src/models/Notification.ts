import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: 'message' | 'reservation' | 'material' | 'admin' | 'lesson' | 'payment' | 'system';
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  readAt?: Date;
  meta?: {
    senderId?: mongoose.Types.ObjectId;
    lessonId?: mongoose.Types.ObjectId;
    materialId?: mongoose.Types.ObjectId;
    reservationId?: mongoose.Types.ObjectId;
    amount?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['message', 'reservation', 'material', 'admin', 'lesson', 'payment', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  link: {
    type: String,
    maxlength: 200
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - this.createdAt.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Define static methods interface
interface NotificationModel extends mongoose.Model<INotification> {
  createNotification(data: {
    recipient: string;
    type: INotification['type'];
    title: string;
    body: string;
    link?: string;
    meta?: any;
  }): Promise<INotification>;
  getUnreadCount(userId: string): Promise<number>;
  markAllAsRead(userId: string): Promise<any>;
}

// Define instance methods interface
export interface INotificationDocument extends INotification, Document {
  markAsRead(): Promise<INotificationDocument>;
}

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data: {
  recipient: string;
  type: INotification['type'];
  title: string;
  body: string;
  link?: string;
  meta?: any;
}) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId: string) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to mark all as read for user
NotificationSchema.statics.markAllAsRead = async function(userId: string) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Instance method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Pre-save middleware to ensure readAt is set when marking as read
NotificationSchema.pre('save', function(next) {
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export const Notification = mongoose.model<INotification, NotificationModel>('Notification', NotificationSchema); 