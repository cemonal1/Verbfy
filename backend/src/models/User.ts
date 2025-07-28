import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
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
  hourlyRate?: number;
  rating?: number;
  totalLessons?: number;
  // Student-specific fields
  englishLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  learningGoals?: string[];
  preferredLessonTypes?: string[];
  totalLessonsTaken?: number;
  // Common fields
  isActive: boolean;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
  refreshTokenVersion: number; // for refresh token rotation
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
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
  hourlyRate: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalLessons: { type: Number, default: 0 },
  // Student-specific fields
  englishLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  learningGoals: [{ type: String }],
  preferredLessonTypes: [{ type: String }],
  totalLessonsTaken: { type: Number, default: 0 },
  // Common fields
  isActive: { type: Boolean, default: true },
  lastActive: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  refreshTokenVersion: { type: Number, default: 0 },
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

export default mongoose.model<IUser>('User', UserSchema); 