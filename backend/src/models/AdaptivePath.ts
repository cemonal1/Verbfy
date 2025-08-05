import mongoose, { Document, Schema } from 'mongoose';

export interface IAdaptivePath extends Document {
  userId: mongoose.Types.ObjectId;
  pathName: string;
  description: string;
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  estimatedDuration: number; // in days
  progress: {
    completedLessons: number;
    totalLessons: number;
    currentModule: number;
    overallProgress: number;
    lastActivity: Date;
  };
  modules: Array<{
    moduleId: mongoose.Types.ObjectId;
    moduleType: 'grammar' | 'reading' | 'writing' | 'speaking' | 'listening' | 'vocabulary';
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number; // in minutes
    prerequisites: mongoose.Types.ObjectId[];
    isCompleted: boolean;
    completionDate?: Date;
    performance: {
      score: number;
      attempts: number;
      timeSpent: number;
    };
  }>;
  adaptiveRules: {
    difficultyAdjustment: 'auto' | 'manual';
    paceAdjustment: 'accelerated' | 'normal' | 'remedial';
    focusAreas: string[];
    skipPrerequisites: boolean;
  };
  analytics: {
    timeToComplete: number;
    averageScore: number;
    retentionRate: number;
    engagementScore: number;
    difficultyProgression: Array<{
      moduleId: mongoose.Types.ObjectId;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      date: Date;
    }>;
  };
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const AdaptivePathSchema = new Schema<IAdaptivePath>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pathName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  targetCEFRLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  currentCEFRLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  progress: {
    completedLessons: {
      type: Number,
      default: 0,
      min: 0
    },
    totalLessons: {
      type: Number,
      required: true,
      min: 1
    },
    currentModule: {
      type: Number,
      default: 0,
      min: 0
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  modules: [{
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'VerbfyLesson',
      required: true
    },
    moduleType: {
      type: String,
      enum: ['grammar', 'reading', 'writing', 'speaking', 'listening', 'vocabulary'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 1
    },
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'VerbfyLesson'
    }],
    isCompleted: {
      type: Boolean,
      default: false
    },
    completionDate: {
      type: Date
    },
    performance: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      attempts: {
        type: Number,
        default: 0,
        min: 0
      },
      timeSpent: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  }],
  adaptiveRules: {
    difficultyAdjustment: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'auto'
    },
    paceAdjustment: {
      type: String,
      enum: ['accelerated', 'normal', 'remedial'],
      default: 'normal'
    },
    focusAreas: [{
      type: String,
      trim: true
    }],
    skipPrerequisites: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    timeToComplete: {
      type: Number,
      default: 0,
      min: 0
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    retentionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    difficultyProgression: [{
      moduleId: {
        type: Schema.Types.ObjectId,
        ref: 'VerbfyLesson'
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AdaptivePathSchema.index({ userId: 1, status: 1 });
AdaptivePathSchema.index({ userId: 1, currentCEFRLevel: 1 });
AdaptivePathSchema.index({ 'progress.lastActivity': -1 });

// Virtual for completion percentage
AdaptivePathSchema.virtual('completionPercentage').get(function() {
  if (this.progress.totalLessons === 0) return 0;
  return (this.progress.completedLessons / this.progress.totalLessons) * 100;
});

// Method to update progress
AdaptivePathSchema.methods.updateProgress = function(completedModuleId: mongoose.Types.ObjectId) {
  const module = this.modules.find((m: any) => m.moduleId.equals(completedModuleId));
  if (module && !module.isCompleted) {
    module.isCompleted = true;
    module.completionDate = new Date();
    this.progress.completedLessons += 1;
    this.progress.overallProgress = this.completionPercentage;
    this.progress.lastActivity = new Date();
    
    // Update current module index
    const completedIndex = this.modules.findIndex((m: any) => m.moduleId.equals(completedModuleId));
    if (completedIndex >= this.progress.currentModule) {
      this.progress.currentModule = completedIndex + 1;
    }
  }
};

// Method to calculate path effectiveness
AdaptivePathSchema.methods.calculateEffectiveness = function(): number {
  const progressWeight = 0.3;
  const scoreWeight = 0.3;
  const retentionWeight = 0.2;
  const engagementWeight = 0.2;
  
  const progressScore = this.progress.overallProgress / 100;
  const averageScore = this.analytics.averageScore / 100;
  const retentionScore = this.analytics.retentionRate / 100;
  const engagementScore = this.analytics.engagementScore / 100;
  
  return (progressScore * progressWeight) + 
         (averageScore * scoreWeight) + 
         (retentionScore * retentionWeight) + 
         (engagementScore * engagementWeight);
};

export default mongoose.model<IAdaptivePath>('AdaptivePath', AdaptivePathSchema); 