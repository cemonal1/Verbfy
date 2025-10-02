import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonChat extends Document {
  lessonId: string;
  userId: mongoose.Types.ObjectId;
  message: string;
  messageType: 'text' | 'file' | 'system';
  fileId?: mongoose.Types.ObjectId;
  timestamp: Date;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

const LessonChatSchema = new Schema<ILessonChat>({
  lessonId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'LessonFile',
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
LessonChatSchema.index({ lessonId: 1, timestamp: 1 });
LessonChatSchema.index({ lessonId: 1, userId: 1 });

// Virtual for formatted timestamp
LessonChatSchema.virtual('formattedTime').get(function() {
  return this.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to soft delete message
LessonChatSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to edit message
LessonChatSchema.methods.editMessage = function(newMessage: string) {
  this.message = newMessage;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get recent messages
LessonChatSchema.statics.getRecentMessages = function(lessonId: string, limit: number = 50) {
  return this.find({ 
    lessonId, 
    isDeleted: { $ne: true } 
  })
  .populate('userId', 'name email role avatar')
  .populate('fileId', 'fileName fileSize mimeType')
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to get message count for lesson
LessonChatSchema.statics.getMessageCount = function(lessonId: string) {
  return this.countDocuments({ 
    lessonId, 
    isDeleted: { $ne: true } 
  });
};

export const LessonChat = mongoose.model<ILessonChat>('LessonChat', LessonChatSchema);