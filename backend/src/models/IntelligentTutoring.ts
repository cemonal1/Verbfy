import mongoose, { Document, Schema } from 'mongoose';

export interface IIntelligentTutoring extends Document {
  studentId: mongoose.Types.ObjectId;
  currentSession: {
    sessionId: string;
    startTime: Date;
    currentActivity: string;
    progress: number;
    timeSpent: number;
    difficulty: 'easy' | 'medium' | 'hard';
    engagement: number;
    frustration: number;
  };
  learningProfile: {
    preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
    attentionSpan: number;
    optimalSessionLength: number;
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    learningPace: 'slow' | 'moderate' | 'fast';
    motivationLevel: number;
    confidenceLevel: number;
  };
  adaptiveRules: {
    difficultyAdjustment: {
      threshold: number;
      stepSize: number;
      minDifficulty: number;
      maxDifficulty: number;
    };
    engagementMonitoring: {
      lowEngagementThreshold: number;
      highFrustrationThreshold: number;
      interventionDelay: number;
    };
  };
  performanceHistory: Array<{
    activityId: string;
    activityType: string;
    score: number;
    timeSpent: number;
    difficulty: number;
    engagement: number;
    frustration: number;
    completedAt: Date;
  }>;
  recommendations: Array<{
    type: 'activity' | 'break' | 'review' | 'challenge' | 'support';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reason: string;
    suggestedActivity?: string;
    estimatedDuration: number;
    confidence: number;
    createdAt: Date;
    isCompleted: boolean;
    completedAt?: Date;
  }>;
  analytics: {
    totalSessions: number;
    averageSessionLength: number;
    averageEngagement: number;
    averagePerformance: number;
    learningVelocity: number;
    retentionRate: number;
    motivationTrend: 'increasing' | 'stable' | 'decreasing';
    confidenceTrend: 'increasing' | 'stable' | 'decreasing';
  };
  createdAt: Date;
  updatedAt: Date;
}

const IntelligentTutoringSchema = new Schema<IIntelligentTutoring>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  currentSession: {
    sessionId: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    currentActivity: { type: String, required: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    timeSpent: { type: Number, default: 0, min: 0 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    engagement: { type: Number, min: 0, max: 100, default: 50 },
    frustration: { type: Number, min: 0, max: 100, default: 0 }
  },
  learningProfile: {
    preferredLearningStyle: { type: String, enum: ['visual', 'auditory', 'kinesthetic', 'reading', 'mixed'], default: 'mixed' },
    attentionSpan: { type: Number, default: 25, min: 5, max: 120 },
    optimalSessionLength: { type: Number, default: 45, min: 15, max: 180 },
    preferredDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    learningPace: { type: String, enum: ['slow', 'moderate', 'fast'], default: 'moderate' },
    motivationLevel: { type: Number, min: 0, max: 100, default: 75 },
    confidenceLevel: { type: Number, min: 0, max: 100, default: 60 }
  },
  adaptiveRules: {
    difficultyAdjustment: {
      threshold: { type: Number, default: 0.7, min: 0.1, max: 0.9 },
      stepSize: { type: Number, default: 0.1, min: 0.05, max: 0.3 },
      minDifficulty: { type: Number, default: 0.1, min: 0, max: 1 },
      maxDifficulty: { type: Number, default: 0.9, min: 0, max: 1 }
    },
    engagementMonitoring: {
      lowEngagementThreshold: { type: Number, default: 30, min: 0, max: 100 },
      highFrustrationThreshold: { type: Number, default: 70, min: 0, max: 100 },
      interventionDelay: { type: Number, default: 5, min: 1, max: 30 }
    }
  },
  performanceHistory: [{
    activityId: { type: String, required: true },
    activityType: { type: String, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    timeSpent: { type: Number, min: 0, required: true },
    difficulty: { type: Number, min: 0, max: 1, required: true },
    engagement: { type: Number, min: 0, max: 100, required: true },
    frustration: { type: Number, min: 0, max: 100, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  recommendations: [{
    type: { type: String, enum: ['activity', 'break', 'review', 'challenge', 'support'], required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    reason: { type: String, required: true },
    suggestedActivity: { type: String },
    estimatedDuration: { type: Number, min: 1, max: 180, required: true },
    confidence: { type: Number, min: 0, max: 100, default: 70 },
    createdAt: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  analytics: {
    totalSessions: { type: Number, default: 0, min: 0 },
    averageSessionLength: { type: Number, default: 0, min: 0 },
    averageEngagement: { type: Number, default: 0, min: 0, max: 100 },
    averagePerformance: { type: Number, default: 0, min: 0, max: 100 },
    learningVelocity: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0, min: 0, max: 100 },
    motivationTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
    confidenceTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' }
  }
}, {
  timestamps: true
});

// Indexes
IntelligentTutoringSchema.index({ studentId: 1 });
IntelligentTutoringSchema.index({ 'analytics.learningVelocity': -1 });

export default mongoose.model<IIntelligentTutoring>('IntelligentTutoring', IntelligentTutoringSchema); 