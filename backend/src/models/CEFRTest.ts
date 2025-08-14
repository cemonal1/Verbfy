import mongoose, { Document, Schema } from 'mongoose';

export interface ICEFRTest extends Document {
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  testType: 'placement' | 'progress' | 'certification';
  timed?: boolean;
  scoringRubric?: { min: number; max: number; level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2' }[];
  sections: {
    name: string;
    description: string;
    skill: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary';
    timeLimit: number; // in minutes
    questions: {
      type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'essay' | 'speaking' | 'listening';
      question: string;
      options?: string[];
      correctAnswer: string | string[];
      explanation?: string;
      points: number;
      audioUrl?: string;
      imageUrl?: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
  }[];
  totalQuestions: number;
  totalTime: number; // in minutes
  passingScore: number; // percentage
  isActive: boolean;
  isPremium: boolean;
  createdBy: mongoose.Types.ObjectId;
  averageScore: number;
  totalAttempts: number;
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const CEFRTestSchema = new Schema<ICEFRTest>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  cefrLevel: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
    required: true 
  },
  testType: { 
    type: String, 
    enum: ['placement', 'progress', 'certification'], 
    required: true 
  },
  timed: { type: Boolean, default: true },
  sections: [{
    name: { type: String, required: true },
    description: { type: String, required: true },
    skill: { 
      type: String, 
      enum: ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'], 
      required: true 
    },
    timeLimit: { type: Number, required: true, min: 1 },
    questions: [{
      type: { 
        type: String, 
        enum: ['multiple-choice', 'fill-blank', 'matching', 'true-false', 'essay', 'speaking', 'listening'], 
        required: true 
      },
      question: { type: String, required: true },
      options: [{ type: String }],
      correctAnswer: { type: Schema.Types.Mixed, required: true },
      explanation: { type: String },
      points: { type: Number, required: true, min: 1 },
      audioUrl: { type: String },
      imageUrl: { type: String },
      difficulty: { 
        type: String, 
        enum: ['easy', 'medium', 'hard'], 
        required: true 
      }
    }]
  }],
  totalQuestions: { type: Number, required: true, min: 1 },
  totalTime: { type: Number, required: true, min: 1 },
  passingScore: { type: Number, required: true, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  averageScore: { type: Number, min: 0, max: 100, default: 0 },
  totalAttempts: { type: Number, default: 0 },
  completionRate: { type: Number, min: 0, max: 100, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
CEFRTestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
CEFRTestSchema.index({ cefrLevel: 1, testType: 1 });
CEFRTestSchema.index({ isActive: 1, isPremium: 1 });
CEFRTestSchema.index({ createdBy: 1 });
CEFRTestSchema.index({ averageScore: -1 });
CEFRTestSchema.index({ completionRate: -1 });

export const CEFRTest = mongoose.model<ICEFRTest>('CEFRTest', CEFRTestSchema); 