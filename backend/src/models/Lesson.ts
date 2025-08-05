import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: 'conversation' | 'grammar' | 'reading' | 'writing' | 'listening' | 'speaking';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: Date;
  endTime: Date;
  duration: number; // in hours
  price: number;
  rating?: number;
  review?: string;
  notes?: string;
  materials?: mongoose.Types.ObjectId[];
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['conversation', 'grammar', 'reading', 'writing', 'listening', 'speaking'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0.25, // 15 minutes minimum
    max: 4 // 4 hours maximum
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 1000
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  materials: [{
    type: Schema.Types.ObjectId,
    ref: 'Material'
  }],
  roomId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
LessonSchema.index({ teacherId: 1, status: 1 });
LessonSchema.index({ studentId: 1, status: 1 });
LessonSchema.index({ startTime: 1 });
LessonSchema.index({ status: 1, startTime: 1 });

// Virtual for calculating if lesson is in the past
LessonSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Virtual for calculating if lesson is currently happening
LessonSchema.virtual('isNow').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
});

// Method to check if lesson can be cancelled
LessonSchema.methods.canBeCancelled = function(): boolean {
  const now = new Date();
  const hoursUntilStart = (this.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return this.status === 'scheduled' && hoursUntilStart >= 24; // 24 hours notice required
};

// Static method to get upcoming lessons for a user
LessonSchema.statics.getUpcomingLessons = function(userId: string, role: 'teacher' | 'student') {
  const query = role === 'teacher' ? { teacherId: userId } : { studentId: userId };
  return this.find({
    ...query,
    status: 'scheduled',
    startTime: { $gt: new Date() }
  }).sort({ startTime: 1 });
};

// Static method to get completed lessons for a user
LessonSchema.statics.getCompletedLessons = function(userId: string, role: 'teacher' | 'student') {
  const query = role === 'teacher' ? { teacherId: userId } : { studentId: userId };
  return this.find({
    ...query,
    status: 'completed'
  }).sort({ startTime: -1 });
};

export const Lesson = mongoose.model<ILesson>('Lesson', LessonSchema); 