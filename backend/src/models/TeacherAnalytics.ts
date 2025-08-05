import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherAnalytics extends Document {
  teacherId: mongoose.Types.ObjectId;
  period: {
    startDate: Date;
    endDate: Date;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  studentMetrics: {
    totalStudents: number;
    activeStudents: number;
    newStudents: number;
    returningStudents: number;
    averageSessionDuration: number;
    averageLessonsCompleted: number;
  };
  performanceMetrics: {
    averageStudentScore: number;
    completionRate: number;
    retentionRate: number;
    satisfactionScore: number;
    improvementRate: number;
  };
  lessonAnalytics: {
    totalLessons: number;
    completedLessons: number;
    averageLessonRating: number;
    popularLessons: Array<{
      lessonId: mongoose.Types.ObjectId;
      title: string;
      completionCount: number;
      averageRating: number;
    }>;
    lessonTypeDistribution: {
      grammar: number;
      reading: number;
      writing: number;
      speaking: number;
      listening: number;
      vocabulary: number;
    };
  };
  studentProgress: {
    cefrLevelDistribution: {
      A1: number;
      A2: number;
      B1: number;
      B2: number;
      C1: number;
      C2: number;
    };
    progressTrends: Array<{
      date: Date;
      averageProgress: number;
      studentsCount: number;
    }>;
    topPerformers: Array<{
      studentId: mongoose.Types.ObjectId;
      name: string;
      progress: number;
      lessonsCompleted: number;
    }>;
    strugglingStudents: Array<{
      studentId: mongoose.Types.ObjectId;
      name: string;
      progress: number;
      lastActivity: Date;
      issues: string[];
    }>;
  };
  engagementMetrics: {
    averageDailyActiveUsers: number;
    peakUsageHours: Array<{
      hour: number;
      userCount: number;
    }>;
    sessionFrequency: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    featureUsage: {
      lessons: number;
      materials: number;
      chat: number;
      videoCalls: number;
      assessments: number;
    };
  };
  revenueMetrics: {
    totalRevenue: number;
    averageRevenuePerStudent: number;
    subscriptionConversionRate: number;
    churnRate: number;
    revenueGrowth: number;
  };
  feedbackAnalytics: {
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
    commonIssues: Array<{
      issue: string;
      frequency: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    positiveFeedback: Array<{
      feedback: string;
      frequency: number;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeacherAnalyticsSchema = new Schema<ITeacherAnalytics>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      required: true
    }
  },
  studentMetrics: {
    totalStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    activeStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    newStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    returningStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    averageLessonsCompleted: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  performanceMetrics: {
    averageStudentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completionRate: {
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
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    improvementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  lessonAnalytics: {
    totalLessons: {
      type: Number,
      default: 0,
      min: 0
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0
    },
    averageLessonRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    popularLessons: [{
      lessonId: {
        type: Schema.Types.ObjectId,
        ref: 'VerbfyLesson'
      },
      title: {
        type: String,
        trim: true
      },
      completionCount: {
        type: Number,
        default: 0,
        min: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    }],
    lessonTypeDistribution: {
      grammar: {
        type: Number,
        default: 0,
        min: 0
      },
      reading: {
        type: Number,
        default: 0,
        min: 0
      },
      writing: {
        type: Number,
        default: 0,
        min: 0
      },
      speaking: {
        type: Number,
        default: 0,
        min: 0
      },
      listening: {
        type: Number,
        default: 0,
        min: 0
      },
      vocabulary: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  studentProgress: {
    cefrLevelDistribution: {
      A1: {
        type: Number,
        default: 0,
        min: 0
      },
      A2: {
        type: Number,
        default: 0,
        min: 0
      },
      B1: {
        type: Number,
        default: 0,
        min: 0
      },
      B2: {
        type: Number,
        default: 0,
        min: 0
      },
      C1: {
        type: Number,
        default: 0,
        min: 0
      },
      C2: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    progressTrends: [{
      date: {
        type: Date,
        required: true
      },
      averageProgress: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      studentsCount: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    topPerformers: [{
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        trim: true
      },
      progress: {
        type: Number,
        min: 0,
        max: 100
      },
      lessonsCompleted: {
        type: Number,
        min: 0
      }
    }],
    strugglingStudents: [{
      studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        type: String,
        trim: true
      },
      progress: {
        type: Number,
        min: 0,
        max: 100
      },
      lastActivity: {
        type: Date
      },
      issues: [{
        type: String,
        trim: true
      }]
    }]
  },
  engagementMetrics: {
    averageDailyActiveUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    peakUsageHours: [{
      hour: {
        type: Number,
        min: 0,
        max: 23
      },
      userCount: {
        type: Number,
        min: 0
      }
    }],
    sessionFrequency: {
      daily: {
        type: Number,
        default: 0,
        min: 0
      },
      weekly: {
        type: Number,
        default: 0,
        min: 0
      },
      monthly: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    featureUsage: {
      lessons: {
        type: Number,
        default: 0,
        min: 0
      },
      materials: {
        type: Number,
        default: 0,
        min: 0
      },
      chat: {
        type: Number,
        default: 0,
        min: 0
      },
      videoCalls: {
        type: Number,
        default: 0,
        min: 0
      },
      assessments: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  revenueMetrics: {
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRevenuePerStudent: {
      type: Number,
      default: 0,
      min: 0
    },
    subscriptionConversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    churnRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    revenueGrowth: {
      type: Number,
      default: 0
    }
  },
  feedbackAnalytics: {
    totalFeedback: {
      type: Number,
      default: 0,
      min: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingDistribution: {
      '1': {
        type: Number,
        default: 0,
        min: 0
      },
      '2': {
        type: Number,
        default: 0,
        min: 0
      },
      '3': {
        type: Number,
        default: 0,
        min: 0
      },
      '4': {
        type: Number,
        default: 0,
        min: 0
      },
      '5': {
        type: Number,
        default: 0,
        min: 0
      }
    },
    commonIssues: [{
      issue: {
        type: String,
        trim: true
      },
      frequency: {
        type: Number,
        min: 0
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    positiveFeedback: [{
      feedback: {
        type: String,
        trim: true
      },
      frequency: {
        type: Number,
        min: 0
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
TeacherAnalyticsSchema.index({ teacherId: 1, 'period.startDate': -1 });
TeacherAnalyticsSchema.index({ teacherId: 1, 'period.type': 1 });
TeacherAnalyticsSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

// Virtual for overall performance score
TeacherAnalyticsSchema.virtual('overallPerformanceScore').get(function() {
  const scoreWeight = 0.3;
  const completionWeight = 0.25;
  const retentionWeight = 0.25;
  const satisfactionWeight = 0.2;
  
  const score = this.performanceMetrics.averageStudentScore / 100;
  const completion = this.performanceMetrics.completionRate / 100;
  const retention = this.performanceMetrics.retentionRate / 100;
  const satisfaction = this.performanceMetrics.satisfactionScore / 5;
  
  return (score * scoreWeight) + 
         (completion * completionWeight) + 
         (retention * retentionWeight) + 
         (satisfaction * satisfactionWeight);
});

// Method to calculate engagement score
TeacherAnalyticsSchema.methods.calculateEngagementScore = function(): number {
  const activeUserWeight = 0.4;
  const sessionWeight = 0.3;
  const featureWeight = 0.3;
  
  const activeUserScore = Math.min(this.engagementMetrics.averageDailyActiveUsers / this.studentMetrics.totalStudents, 1);
  const sessionScore = Math.min(this.engagementMetrics.sessionFrequency.daily / 7, 1);
  const featureScore = Math.min(
    (this.engagementMetrics.featureUsage.lessons + 
     this.engagementMetrics.featureUsage.materials + 
     this.engagementMetrics.featureUsage.chat) / 3, 1
  );
  
  return (activeUserScore * activeUserWeight) + 
         (sessionScore * sessionWeight) + 
         (featureScore * featureWeight);
};

export default mongoose.model<ITeacherAnalytics>('TeacherAnalytics', TeacherAnalyticsSchema); 