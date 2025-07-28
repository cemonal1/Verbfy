import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonProgress extends Document {
  student: mongoose.Types.ObjectId;
  lessonType: 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfyGrammar' | 'VerbfyExam';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  totalLessons: number;
  completedLessons: number;
  averageScore: number; // 0-100
  totalTimeSpent: number; // in minutes
  lastLessonDate?: Date;
  currentStreak: number; // consecutive days
  longestStreak: number;
  achievements: string[];
  skills: {
    speaking: number; // 0-100
    listening: number; // 0-100
    reading: number; // 0-100
    writing: number; // 0-100
    grammar: number; // 0-100
    vocabulary: number; // 0-100
  };
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonType: { 
    type: String, 
    enum: ['VerbfySpeak', 'VerbfyListen', 'VerbfyRead', 'VerbfyWrite', 'VerbfyGrammar', 'VerbfyExam'], 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    required: true 
  },
  totalLessons: { type: Number, default: 0 },
  completedLessons: { type: Number, default: 0 },
  averageScore: { type: Number, min: 0, max: 100, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  lastLessonDate: { type: Date },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  achievements: [{ type: String }],
  skills: {
    speaking: { type: Number, min: 0, max: 100, default: 0 },
    listening: { type: Number, min: 0, max: 100, default: 0 },
    reading: { type: Number, min: 0, max: 100, default: 0 },
    writing: { type: Number, min: 0, max: 100, default: 0 },
    grammar: { type: Number, min: 0, max: 100, default: 0 },
    vocabulary: { type: Number, min: 0, max: 100, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
LessonProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes for efficient queries
LessonProgressSchema.index({ student: 1, lessonType: 1, level: 1 }, { unique: true });
LessonProgressSchema.index({ student: 1 });
LessonProgressSchema.index({ lessonType: 1 });
LessonProgressSchema.index({ level: 1 });

export const LessonProgress = mongoose.model<ILessonProgress>('LessonProgress', LessonProgressSchema); 