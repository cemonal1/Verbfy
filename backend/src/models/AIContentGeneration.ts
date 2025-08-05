import mongoose, { Document, Schema } from 'mongoose';

export interface IAIContentGeneration extends Document {
  userId: mongoose.Types.ObjectId;
  contentType: 'lesson' | 'exercise' | 'assessment' | 'material' | 'template';
  topic: string;
  targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  skillFocus: 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking' | 'listening' | 'mixed';
  generationPrompt: string;
  generatedContent: {
    title: string;
    description: string;
    content: any; // Structured content based on type
    metadata: {
      estimatedDuration: number;
      difficulty: number;
      tags: string[];
      learningObjectives: string[];
    };
  };
  aiModel: string;
  tokensUsed: number;
  cost: number;
  quality: {
    relevance: number; // 0-100
    accuracy: number; // 0-100
    engagement: number; // 0-100
    overall: number; // 0-100
  };
  status: 'generating' | 'completed' | 'failed' | 'reviewed' | 'published';
  reviewNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIContentGenerationSchema = new Schema<IAIContentGeneration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contentType: {
    type: String,
    enum: ['lesson', 'exercise', 'assessment', 'material', 'template'],
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  targetLevel: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    required: true
  },
  skillFocus: {
    type: String,
    enum: ['grammar', 'vocabulary', 'reading', 'writing', 'speaking', 'listening', 'mixed'],
    required: true
  },
  generationPrompt: {
    type: String,
    required: true,
    trim: true
  },
  generatedContent: {
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
    content: {
      type: Schema.Types.Mixed,
      required: true
    },
    metadata: {
      estimatedDuration: {
        type: Number,
        default: 30,
        min: 5,
        max: 180
      },
      difficulty: {
        type: Number,
        min: 1,
        max: 10,
        default: 5
      },
      tags: [{
        type: String,
        trim: true
      }],
      learningObjectives: [{
        type: String,
        trim: true
      }]
    }
  },
  aiModel: {
    type: String,
    required: true,
    default: 'gpt-4'
  },
  tokensUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  quality: {
    relevance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    engagement: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overall: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed', 'reviewed', 'published'],
    default: 'generating'
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AIContentGenerationSchema.index({ userId: 1, createdAt: -1 });
AIContentGenerationSchema.index({ contentType: 1, targetLevel: 1 });
AIContentGenerationSchema.index({ status: 1, quality: 1 });
AIContentGenerationSchema.index({ topic: 1, skillFocus: 1 });

// Virtual for content quality assessment
AIContentGenerationSchema.virtual('qualityScore').get(function() {
  return (this.quality.relevance + this.quality.accuracy + this.quality.engagement) / 3;
});

// Method to calculate content effectiveness
AIContentGenerationSchema.methods.calculateEffectiveness = function(): number {
  const qualityWeight = 0.4;
  const engagementWeight = 0.3;
  const relevanceWeight = 0.3;
  
  const qualityScore = this.quality.overall / 100;
  const engagementScore = this.quality.engagement / 100;
  const relevanceScore = this.quality.relevance / 100;
  
  return (qualityScore * qualityWeight) + (engagementScore * engagementWeight) + (relevanceScore * relevanceWeight);
};

// Pre-save middleware to calculate overall quality
AIContentGenerationSchema.pre('save', function(next) {
  if (this.quality.relevance && this.quality.accuracy && this.quality.engagement) {
    this.quality.overall = Math.round((this.quality.relevance + this.quality.accuracy + this.quality.engagement) / 3);
  }
  next();
});

export default mongoose.model<IAIContentGeneration>('AIContentGeneration', AIContentGenerationSchema); 