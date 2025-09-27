import mongoose, { Document, Schema } from 'mongoose';

export interface IVerbfyTalkRoom extends Document {
  name: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    joinedAt: Date;
    isActive: boolean;
    leftAt?: Date; // Add leftAt as optional property
  }>;
  maxParticipants: number;
  isPrivate: boolean;
  password?: string;
  topic?: string;
  language: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Mixed';
  isActive: boolean;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerbfyTalkRoomSchema = new Schema<IVerbfyTalkRoom>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    leftAt: {
      type: Date
    }
  }],
  maxParticipants: {
    type: Number,
    default: 5,
    min: 2,
    max: 5
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    trim: true,
    minlength: 4,
    maxlength: 50
  },
  topic: {
    type: String,
    trim: true,
    maxlength: 200
  },
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'],
    default: 'Mixed'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
VerbfyTalkRoomSchema.index({ isActive: 1, isPrivate: 1 });
VerbfyTalkRoomSchema.index({ createdBy: 1 });
VerbfyTalkRoomSchema.index({ 'participants.userId': 1 });
VerbfyTalkRoomSchema.index({ level: 1 });
VerbfyTalkRoomSchema.index({ createdAt: -1 });

// Virtual for current participant count
VerbfyTalkRoomSchema.virtual('currentParticipants').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for room status
VerbfyTalkRoomSchema.virtual('status').get(function() {
  if (!this.isActive) return 'ended';
  if (this.startedAt && !this.endedAt) return 'active';
  return 'waiting';
});

// Ensure virtuals are serialized
VerbfyTalkRoomSchema.set('toJSON', { virtuals: true });
VerbfyTalkRoomSchema.set('toObject', { virtuals: true });

// Pre-save middleware to hash password if private
VerbfyTalkRoomSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

export const VerbfyTalkRoom = mongoose.model<IVerbfyTalkRoom>('VerbfyTalkRoom', VerbfyTalkRoomSchema); 