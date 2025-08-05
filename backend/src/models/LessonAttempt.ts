import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonAttempt extends Document {
  student: mongoose.Types.ObjectId;
  lessonId?: mongoose.Types.ObjectId; // for lesson attempts
  testId?: mongoose.Types.ObjectId; // for test attempts
  resourceType: 'lesson' | 'test';
  lessonType?: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // in minutes
  score: number; // 0-100
  maxScore: number;
  answers: {
    questionIndex: number;
    question: string;
    studentAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    maxPoints: number;
    timeSpent: number; // in seconds
  }[];
  skills: {
    grammar: number; // 0-100
    reading: number; // 0-100
    writing: number; // 0-100
    speaking: number; // 0-100
    listening: number; // 0-100
    vocabulary: number; // 0-100
  };
  feedback: {
    overall: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  isCompleted: boolean;
  isPassed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonAttemptSchema = new Schema<ILessonAttempt>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'VerbfyLesson' },
  testId: { type: Schema.Types.ObjectId, ref: 'CEFRTest' },
  resourceType: { 
    type: String, 
    enum: ['lesson', 'test'], 
    required: true 
  },
  lessonType: { 
    type: String, 
    enum: ['VerbfyGrammar', 'VerbfyRead', 'VerbfyWrite', 'VerbfySpeak', 'VerbfyListen', 'VerbfyVocab'] 
  },
  cefrLevel: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
    required: true 
  },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  timeSpent: { type: Number, default: 0, min: 0 },
  score: { type: Number, min: 0, max: 100, default: 0 },
  maxScore: { type: Number, required: true, min: 1 },
  answers: [{
    questionIndex: { type: Number, required: true },
    question: { type: String, required: true },
    studentAnswer: { type: Schema.Types.Mixed, required: true },
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean, required: true },
    points: { type: Number, required: true, min: 0 },
    maxPoints: { type: Number, required: true, min: 1 },
    timeSpent: { type: Number, required: true, min: 0 }
  }],
  skills: {
    grammar: { type: Number, min: 0, max: 100, default: 0 },
    reading: { type: Number, min: 0, max: 100, default: 0 },
    writing: { type: Number, min: 0, max: 100, default: 0 },
    speaking: { type: Number, min: 0, max: 100, default: 0 },
    listening: { type: Number, min: 0, max: 100, default: 0 },
    vocabulary: { type: Number, min: 0, max: 100, default: 0 }
  },
  feedback: {
    overall: { type: String },
    strengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    recommendations: [{ type: String }]
  },
  isCompleted: { type: Boolean, default: false },
  isPassed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
LessonAttemptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
LessonAttemptSchema.index({ student: 1, resourceType: 1 });
LessonAttemptSchema.index({ lessonId: 1 });
LessonAttemptSchema.index({ testId: 1 });
LessonAttemptSchema.index({ cefrLevel: 1 });
LessonAttemptSchema.index({ startedAt: -1 });
LessonAttemptSchema.index({ score: -1 });
LessonAttemptSchema.index({ isCompleted: 1, isPassed: 1 });

export const LessonAttempt = mongoose.model<ILessonAttempt>('LessonAttempt', LessonAttemptSchema); 