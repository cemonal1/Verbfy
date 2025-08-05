import mongoose, { Document, Schema } from 'mongoose';

export interface IAILearningSession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionType: 'conversation' | 'exercise' | 'recommendation' | 'feedback';
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    userInput?: string;
    aiResponse?: string;
    exerciseData?: any;
    recommendations?: string[];
  };
  metadata: {
    duration: number;
    questionsAnswered: number;
    correctAnswers: number;
    learningObjectives: string[];
    sessionRating?: number;
  };
  aiModel: string;
  tokensUsed: number;
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

const AILearningSessionSchema = new Schema<IAILearningSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionType: {
    type: String,
    enum: ['conversation', 'exercise', 'recommendation', 'feedback'],
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  content: {
    userInput: {
      type: String,
      trim: true
    },
    aiResponse: {
      type: String,
      trim: true
    },
    exerciseData: {
      type: Schema.Types.Mixed
    },
    recommendations: [{
      type: String,
      trim: true
    }]
  },
  metadata: {
    duration: {
      type: Number,
      default: 0,
      min: 0
    },
    questionsAnswered: {
      type: Number,
      default: 0,
      min: 0
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0
    },
    learningObjectives: [{
      type: String,
      trim: true
    }],
    sessionRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  aiModel: {
    type: String,
    required: true,
    default: 'gpt-3.5-turbo'
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
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
AILearningSessionSchema.index({ userId: 1, createdAt: -1 });
AILearningSessionSchema.index({ sessionType: 1, difficulty: 1 });
AILearningSessionSchema.index({ topic: 1 });

// Virtual for accuracy percentage
AILearningSessionSchema.virtual('accuracyPercentage').get(function() {
  if (this.metadata.questionsAnswered === 0) return 0;
  return (this.metadata.correctAnswers / this.metadata.questionsAnswered) * 100;
});

// Method to calculate session effectiveness
AILearningSessionSchema.methods.calculateEffectiveness = function(): number {
  const accuracyWeight = 0.4;
  const durationWeight = 0.3;
  const ratingWeight = 0.3;
  
  const accuracy = this.accuracyPercentage / 100;
  const durationScore = Math.min(this.metadata.duration / 1800, 1); // Normalize to 30 minutes
  const rating = this.metadata.sessionRating ? this.metadata.sessionRating / 5 : 0.5;
  
  return (accuracy * accuracyWeight) + (durationScore * durationWeight) + (rating * ratingWeight);
};

export default mongoose.model<IAILearningSession>('AILearningSession', AILearningSessionSchema); 