export interface AIContentGeneration {
  _id: string;
  userId: string;
  contentType: 'lesson' | 'exercise' | 'assessment' | 'material' | 'template';
  topic: string;
  targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  skillFocus: 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking' | 'listening' | 'mixed';
  generationPrompt: string;
  generatedContent: {
    title: string;
    description: string;
    content: any;
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
    relevance: number;
    accuracy: number;
    engagement: number;
    overall: number;
  };
  status: 'generating' | 'completed' | 'failed' | 'reviewed' | 'published';
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateContentRequest {
  contentType: 'lesson' | 'exercise' | 'assessment' | 'material' | 'template';
  topic: string;
  targetLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  skillFocus: 'grammar' | 'vocabulary' | 'reading' | 'writing' | 'speaking' | 'listening' | 'mixed';
  generationPrompt?: string;
  customParameters?: any;
}

export interface UpdateQualityRequest {
  relevance?: number;
  accuracy?: number;
  engagement?: number;
}

export interface ApproveContentRequest {
  reviewNotes?: string;
}

export interface ContentFilters {
  contentType?: 'lesson' | 'exercise' | 'assessment' | 'material' | 'template';
  status?: 'generating' | 'completed' | 'failed' | 'reviewed' | 'published';
  page?: number;
  limit?: number;
}

export interface ContentAnalytics {
  totalContent: number;
  totalTokens: number;
  totalCost: number;
  averageQuality: number;
  contentTypeDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

export interface ContentGenerationResponse {
  success: boolean;
  data: AIContentGeneration;
  message: string;
}

export interface ContentListResponse {
  success: boolean;
  data: AIContentGeneration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContentAnalyticsResponse {
  success: boolean;
  data: ContentAnalytics;
} 