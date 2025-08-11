import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  // Approval workflow for teachers
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  profileImage?: string;
  bio?: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  nativeLanguage?: string;
  // Teacher-specific fields
  specialties?: string[];
  experience?: number; // years of experience
  education?: string;
  certifications?: string[];
   cvUrl?: string;
   introVideoUrl?: string;
  hourlyRate?: number;
  rating?: number;
  totalLessons?: number;
  // Student-specific fields
  englishLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learningGoals?: string[];
  preferredLessonTypes?: string[];
  totalLessonsTaken?: number;
  // Enhanced learning tracking
  overallProgress?: {
    grammar: number; // 0-100
    reading: number; // 0-100
    writing: number; // 0-100
    speaking: number; // 0-100
    listening: number; // 0-100
    vocabulary: number; // 0-100
  };
  currentStreak?: number;
  longestStreak?: number;
  totalStudyTime?: number; // in minutes
  achievements?: string[];
  // Subscription fields
  subscriptionStatus?: 'active' | 'inactive' | 'expired';
  subscriptionType?: string;
  subscriptionExpiry?: Date;
  // Lesson tokens
  lessonTokens?: number;
  // Common fields
  isActive: boolean;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
  refreshTokenVersion: number; // for refresh token rotation
  // Multi-tenant organization support
  organizationId?: mongoose.Types.ObjectId;
  lastActiveAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  // Approval workflow for teachers: students are approved by default
  isApproved: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  profileImage: { type: String },
  bio: { type: String },
  phone: { type: String },
  dateOfBirth: { type: Date },
  nationality: { type: String },
  nativeLanguage: { type: String },
  // Teacher-specific fields
  specialties: [{ type: String }],
  experience: { type: Number, min: 0 },
  education: { type: String },
  certifications: [{ type: String }],
  cvUrl: { type: String },
  introVideoUrl: { type: String },
  hourlyRate: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalLessons: { type: Number, default: 0 },
  // Student-specific fields
  englishLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  cefrLevel: { type: String, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  learningGoals: [{ type: String }],
  preferredLessonTypes: [{ type: String }],
  totalLessonsTaken: { type: Number, default: 0 },
  // Enhanced learning tracking
  overallProgress: {
    grammar: { type: Number, min: 0, max: 100, default: 0 },
    reading: { type: Number, min: 0, max: 100, default: 0 },
    writing: { type: Number, min: 0, max: 100, default: 0 },
    speaking: { type: Number, min: 0, max: 100, default: 0 },
    listening: { type: Number, min: 0, max: 100, default: 0 },
    vocabulary: { type: Number, min: 0, max: 100, default: 0 }
  },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  achievements: [{ type: String }],
  // Subscription fields
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  subscriptionType: String,
  subscriptionExpiry: Date,
  // Lesson tokens
  lessonTokens: {
    type: Number,
    default: 0,
    min: 0
  },
  // Common fields
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  refreshTokenVersion: { type: Number, default: 0 },
  // Multi-tenant organization support
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  lastActiveAt: { type: Date }
});

// Update the updatedAt field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ rating: -1 }); // For teacher ranking
UserSchema.index({ totalLessons: -1 }); // For teacher popularity
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1, passwordResetExpires: 1 });

export default mongoose.model<IUser>('User', UserSchema); 