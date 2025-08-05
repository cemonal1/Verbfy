import mongoose, { Document, Schema } from 'mongoose';

export interface IVerbfyLesson extends Document {
  title: string;
  description: string;
  lessonType: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string; // e.g., 'Present Tense', 'Reading Comprehension', 'Essay Writing'
  subcategory?: string; // e.g., 'Present Simple', 'News Articles', 'Argumentative Essays'
  estimatedDuration: number; // in minutes
  content: {
    instructions: string;
    materials: {
      type: 'text' | 'audio' | 'video' | 'image' | 'interactive' | 'quiz';
      content: string;
      fileUrl?: string;
      duration?: number; // for audio/video
    }[];
    exercises: {
      type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'essay' | 'speaking' | 'listening';
      question: string;
      options?: string[];
      correctAnswer: string | string[];
      explanation?: string;
      points: number;
      audioUrl?: string; // for listening exercises
      imageUrl?: string; // for visual exercises
    }[];
    vocabulary?: {
      word: string;
      definition: string;
      example: string;
      pronunciation?: string;
      audioUrl?: string;
    }[];
    grammar?: {
      rule: string;
      examples: string[];
      exceptions?: string[];
    }[];
  };
  learningObjectives: string[];
  prerequisites?: string[]; // lesson IDs that should be completed first
  tags: string[];
  isActive: boolean;
  isPremium: boolean;
  createdBy: mongoose.Types.ObjectId;
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  averageCompletionTime: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

const VerbfyLessonSchema = new Schema<IVerbfyLesson>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  lessonType: { 
    type: String, 
    enum: ['VerbfyGrammar', 'VerbfyRead', 'VerbfyWrite', 'VerbfySpeak', 'VerbfyListen', 'VerbfyVocab'], 
    required: true 
  },
  cefrLevel: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    required: true 
  },
  category: { type: String, required: true },
  subcategory: { type: String },
  estimatedDuration: { type: Number, required: true, min: 1 },
  content: {
    instructions: { type: String, required: true },
    materials: [{
      type: { 
        type: String, 
        enum: ['text', 'audio', 'video', 'image', 'interactive', 'quiz'], 
        required: true 
      },
      content: { type: String, required: true },
      fileUrl: { type: String },
      duration: { type: Number }
    }],
    exercises: [{
      type: { 
        type: String, 
        enum: ['multiple-choice', 'fill-blank', 'matching', 'true-false', 'essay', 'speaking', 'listening'], 
        required: true 
      },
      question: { type: String, required: true },
      options: [{ type: String }],
      correctAnswer: { type: Schema.Types.Mixed, required: true }, // string or array
      explanation: { type: String },
      points: { type: Number, required: true, min: 1 },
      audioUrl: { type: String },
      imageUrl: { type: String }
    }],
    vocabulary: [{
      word: { type: String, required: true },
      definition: { type: String, required: true },
      example: { type: String, required: true },
      pronunciation: { type: String },
      audioUrl: { type: String }
    }],
    grammar: [{
      rule: { type: String, required: true },
      examples: [{ type: String }],
      exceptions: [{ type: String }]
    }]
  },
  learningObjectives: [{ type: String, required: true }],
  prerequisites: [{ type: Schema.Types.ObjectId, ref: 'VerbfyLesson' }],
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  totalRatings: { type: Number, default: 0 },
  completionRate: { type: Number, min: 0, max: 100, default: 0 },
  averageCompletionTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
VerbfyLessonSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
VerbfyLessonSchema.index({ lessonType: 1, cefrLevel: 1, difficulty: 1 });
VerbfyLessonSchema.index({ category: 1, subcategory: 1 });
VerbfyLessonSchema.index({ isActive: 1, isPremium: 1 });
VerbfyLessonSchema.index({ createdBy: 1 });
VerbfyLessonSchema.index({ tags: 1 });
VerbfyLessonSchema.index({ averageRating: -1 });
VerbfyLessonSchema.index({ completionRate: -1 });

export const VerbfyLesson = mongoose.model<IVerbfyLesson>('VerbfyLesson', VerbfyLessonSchema); 