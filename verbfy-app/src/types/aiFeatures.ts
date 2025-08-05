// AI Features Types
export interface AITutoringSession {
  _id: string;
  student: string;
  sessionType: 'conversation' | 'grammar' | 'pronunciation' | 'writing' | 'reading' | 'listening';
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  endedAt?: string;
  duration: number;
  messages: AITutoringMessage[];
  topics: string[];
  skills: {
    grammar: number;
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    comprehension: number;
  };
  feedback: {
    overall: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  aiModel: string;
  aiVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface AITutoringMessage {
  _id: string;
  role: 'student' | 'ai' | 'system';
  content: string;
  timestamp: string;
  messageType: 'text' | 'audio' | 'image' | 'correction' | 'suggestion';
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
    type: 'grammar' | 'pronunciation' | 'vocabulary' | 'spelling';
  }[];
  suggestions?: {
    type: 'vocabulary' | 'grammar' | 'pronunciation' | 'fluency';
    suggestion: string;
    explanation: string;
  }[];
  audioUrl?: string;
  imageUrl?: string;
  confidence?: number;
}

export interface AIContentGeneration {
  _id: string;
  type: 'lesson' | 'exercise' | 'story' | 'dialogue' | 'quiz' | 'material';
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  subcategory?: string;
  content: {
    text?: string;
    audioUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    exercises?: {
      type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'essay';
      question: string;
      options?: string[];
      correctAnswer: string | string[];
      explanation?: string;
      points: number;
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
  estimatedDuration: number;
  tags: string[];
  isActive: boolean;
  isPremium: boolean;
  createdBy: {
    _id: string;
    name: string;
    role: 'teacher' | 'admin' | 'ai';
  };
  aiModel: string;
  aiVersion: string;
  generationPrompt: string;
  qualityScore: number;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  reviewedBy?: {
    _id: string;
    name: string;
    role: string;
  };
  reviewNotes?: string;
  usageCount: number;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIContentGenerationRequest {
  type: 'lesson' | 'exercise' | 'story' | 'dialogue' | 'quiz' | 'material';
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  subcategory?: string;
  learningObjectives: string[];
  estimatedDuration: number;
  tags: string[];
  customPrompt?: string;
  includeExercises?: boolean;
  includeVocabulary?: boolean;
  includeGrammar?: boolean;
  includeAudio?: boolean;
  includeImages?: boolean;
}

export interface AIContentGenerationResponse {
  content: AIContentGeneration;
  generationTime: number;
  qualityScore: number;
  suggestions: {
    type: 'improvement' | 'addition' | 'modification';
    suggestion: string;
    reason: string;
  }[];
}

export interface AIAnalytics {
  _id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  metrics: {
    totalSessions: number;
    activeUsers: number;
    averageSessionDuration: number;
    completionRate: number;
    satisfactionScore: number;
    aiAccuracy: number;
    contentGenerationCount: number;
    contentUsageCount: number;
    averageResponseTime: number;
    errorRate: number;
  };
  userEngagement: {
    newUsers: number;
    returningUsers: number;
    churnRate: number;
    averageSessionsPerUser: number;
    peakUsageHours: number[];
    mostPopularFeatures: {
      feature: string;
      usageCount: number;
      percentage: number;
    }[];
  };
  contentPerformance: {
    totalContentGenerated: number;
    approvedContent: number;
    rejectedContent: number;
    averageQualityScore: number;
    mostPopularCategories: {
      category: string;
      usageCount: number;
      averageRating: number;
    }[];
    contentByLevel: {
      level: string;
      count: number;
      averageRating: number;
    }[];
  };
  aiPerformance: {
    modelAccuracy: number;
    averageResponseTime: number;
    errorRate: number;
    userSatisfaction: number;
    correctionAccuracy: number;
    suggestionRelevance: number;
  };
  skillImprovements: {
    grammar: number;
    pronunciation: number;
    fluency: number;
    vocabulary: number;
    comprehension: number;
    writing: number;
    reading: number;
    listening: number;
  };
  costAnalysis: {
    totalCost: number;
    costPerSession: number;
    costPerUser: number;
    costPerContent: number;
    roi: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIUserProgress {
  _id: string;
  student: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  sessions: {
    total: number;
    completed: number;
    averageDuration: number;
    totalTime: number;
  };
  skills: {
    grammar: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    pronunciation: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    fluency: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    vocabulary: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    comprehension: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    writing: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    reading: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
    listening: {
      current: number;
      improvement: number;
      sessions: number;
      exercises: number;
    };
  };
  aiInteractions: {
    totalMessages: number;
    correctionsReceived: number;
    suggestionsReceived: number;
    averageResponseTime: number;
    satisfactionScore: number;
  };
  contentUsage: {
    lessonsCompleted: number;
    exercisesCompleted: number;
    materialsUsed: number;
    averageRating: number;
  };
  achievements: {
    type: 'streak' | 'milestone' | 'skill' | 'level';
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  recommendations: {
    type: 'lesson' | 'exercise' | 'practice' | 'review';
    title: string;
    description: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    resourceId?: string;
    resourceType?: 'lesson' | 'exercise' | 'material';
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AIRecommendation {
  _id: string;
  student: string;
  type: 'lesson' | 'exercise' | 'practice' | 'review' | 'content';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  resourceId?: string;
  resourceType?: 'lesson' | 'exercise' | 'material' | 'ai_session';
  skillFocus: string[];
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  estimatedDuration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  isCompleted: boolean;
  completedAt?: string;
  feedback?: {
    rating: number;
    comment?: string;
    helpful: boolean;
  };
  aiModel: string;
  aiVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISessionFilters {
  sessionType?: string;
  cefrLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  student?: string;
  page?: number;
  limit?: number;
}

export interface AIContentFilters {
  type?: string;
  cefrLevel?: string;
  difficulty?: string;
  category?: string;
  reviewStatus?: string;
  isPremium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AIAnalyticsFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  student?: string;
  groupBy?: string;
}

export interface AISessionResponse {
  sessions: AITutoringSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AIContentResponse {
  content: AIContentGeneration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AIAnalyticsResponse {
  analytics: AIAnalytics[];
  summary: {
    totalSessions: number;
    totalUsers: number;
    averageSatisfaction: number;
    totalContent: number;
    averageQuality: number;
  };
} 