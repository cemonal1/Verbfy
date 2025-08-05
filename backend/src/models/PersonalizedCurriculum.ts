import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalizedCurriculum extends Document {
  student: mongoose.Types.ObjectId;
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learningGoals: {
    skill: 'grammar' | 'reading' | 'writing' | 'speaking' | 'listening' | 'vocabulary';
    currentLevel: number; // 0-100
    targetLevel: number; // 0-100
    priority: 'low' | 'medium' | 'high';
  }[];
  curriculumPath: {
    phase: number;
    title: string;
    description: string;
    estimatedDuration: number; // in weeks
    lessons: {
      lessonId: mongoose.Types.ObjectId;
      lessonType: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      order: number;
      isCompleted: boolean;
      completedAt?: Date;
      score?: number;
      timeSpent?: number; // in minutes
    }[];
    tests: {
      testId: mongoose.Types.ObjectId;
      testType: 'placement' | 'progress' | 'certification';
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      order: number;
      isCompleted: boolean;
      completedAt?: Date;
      score?: number;
    }[];
    isCompleted: boolean;
    completedAt?: Date;
  }[];
  progress: {
    currentPhase: number;
    lessonsCompleted: number;
    totalLessons: number;
    testsCompleted: number;
    totalTests: number;
    overallProgress: number; // percentage
    estimatedCompletionDate?: Date;
  };
  recommendations: {
    type: 'lesson' | 'test' | 'practice' | 'review';
    title: string;
    description: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    resourceId?: mongoose.Types.ObjectId;
    resourceType?: 'lesson' | 'test' | 'material';
    isCompleted: boolean;
    createdAt: Date;
  }[];
  studySchedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    preferredTime: string; // HH:MM format
    duration: number; // in minutes
    isActive: boolean;
  }[];
  achievements: {
    type: 'streak' | 'milestone' | 'skill' | 'level';
    title: string;
    description: string;
    icon: string;
    unlockedAt: Date;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalizedCurriculumSchema = new Schema<IPersonalizedCurriculum>({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  currentCEFRLevel: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
    required: true 
  },
  targetCEFRLevel: { 
    type: String, 
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
    required: true 
  },
  learningGoals: [{
    skill: { 
      type: String, 
      enum: ['grammar', 'reading', 'writing', 'speaking', 'listening', 'vocabulary'], 
      required: true 
    },
    currentLevel: { type: Number, min: 0, max: 100, required: true },
    targetLevel: { type: Number, min: 0, max: 100, required: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      required: true 
    }
  }],
  curriculumPath: [{
    phase: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    estimatedDuration: { type: Number, required: true, min: 1 },
    lessons: [{
      lessonId: { type: Schema.Types.ObjectId, ref: 'VerbfyLesson', required: true },
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
      order: { type: Number, required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      score: { type: Number, min: 0, max: 100 },
      timeSpent: { type: Number, min: 0 }
    }],
    tests: [{
      testId: { type: Schema.Types.ObjectId, ref: 'CEFRTest', required: true },
      testType: { 
        type: String, 
        enum: ['placement', 'progress', 'certification'], 
        required: true 
      },
      cefrLevel: { 
        type: String, 
        enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
        required: true 
      },
      order: { type: Number, required: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: { type: Date },
      score: { type: Number, min: 0, max: 100 }
    }],
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  progress: {
    currentPhase: { type: Number, default: 1 },
    lessonsCompleted: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    testsCompleted: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    overallProgress: { type: Number, min: 0, max: 100, default: 0 },
    estimatedCompletionDate: { type: Date }
  },
  recommendations: [{
    type: { 
      type: String, 
      enum: ['lesson', 'test', 'practice', 'review'], 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    reason: { type: String, required: true },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      required: true 
    },
    resourceId: { type: Schema.Types.ObjectId },
    resourceType: { 
      type: String, 
      enum: ['lesson', 'test', 'material'] 
    },
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  studySchedule: [{
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    preferredTime: { type: String, required: true },
    duration: { type: Number, required: true, min: 15 },
    isActive: { type: Boolean, default: true }
  }],
  achievements: [{
    type: { 
      type: String, 
      enum: ['streak', 'milestone', 'skill', 'level'], 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    unlockedAt: { type: Date, required: true }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
PersonalizedCurriculumSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for efficient queries
PersonalizedCurriculumSchema.index({ student: 1 }, { unique: true });
PersonalizedCurriculumSchema.index({ currentCEFRLevel: 1, targetCEFRLevel: 1 });
PersonalizedCurriculumSchema.index({ isActive: 1 });
PersonalizedCurriculumSchema.index({ 'progress.overallProgress': -1 });

export const PersonalizedCurriculum = mongoose.model<IPersonalizedCurriculum>('PersonalizedCurriculum', PersonalizedCurriculumSchema); 