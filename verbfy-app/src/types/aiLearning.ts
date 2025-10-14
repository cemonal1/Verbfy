export interface AILearningSession {
  _id: string;
  userId: string;
  sessionType: 'conversation' | 'exercise' | 'recommendation' | 'feedback';
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: {
    userInput?: string;
    aiResponse?: string;
    exerciseData?: unknown;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateAISessionData {
  sessionType: 'conversation' | 'exercise' | 'recommendation' | 'feedback';
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives?: string[];
}

export interface AIResponseData {
  sessionId: string;
  userInput: string;
  context?: string;
}

export interface AIResponse {
  response: string;
  sessionId: string;
  tokensUsed: number;
  cost: number;
}

export interface SessionProgressData {
  sessionId: string;
  correctAnswers?: number;
  duration?: number;
  rating?: number;
}

export interface AISessionFilters {
  sessionType?: 'conversation' | 'exercise' | 'recommendation' | 'feedback';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  page?: number;
  limit?: number;
}

export interface AISessionsResponse {
  sessions: AILearningSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Recommendation {
  type: 'lesson' | 'exercise' | 'conversation';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  relevance: number;
}

export interface GenerateRecommendationsData {
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  limit?: number;
}

export interface AISessionAnalytics {
  totalSessions: number;
  averageAccuracy: number;
  totalDuration: number;
  averageRating: number;
  sessionTypeDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  topicDistribution: Record<string, number>;
}

export interface AISessionAnalyticsFilters {
  timeRange?: '7d' | '30d' | '90d';
}