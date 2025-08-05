export interface AdaptivePath {
  _id: string;
  userId: string;
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  modules: {
    lessonId: string;
    lessonType: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
    order: number;
    isCompleted: boolean;
    score?: number;
    timeSpent?: number;
    completedAt?: string;
  }[];
  progress: {
    overall: number;
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
  adaptiveRules: {
    difficultyAdjustment: 'increase' | 'decrease' | 'maintain';
    paceAdjustment: 'accelerate' | 'slow' | 'maintain';
    lastAdjustment: string;
    adjustmentReason: string;
  };
  analytics: {
    totalModules: number;
    completedModules: number;
    averageScore: number;
    totalTimeSpent: number;
    estimatedCompletionDate: string;
    learningVelocity: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdaptivePathData {
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learningGoals?: string[];
  preferredPace?: 'slow' | 'moderate' | 'fast';
}

export interface UpdateModuleProgressData {
  pathId: string;
  lessonId: string;
  score: number;
  timeSpent: number;
  feedback?: string;
}

export interface AdaptivePathFilters {
  targetLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  currentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  isActive?: boolean;
}

export interface AdaptivePathResponse {
  path: AdaptivePath;
}

export interface AdaptivePathsResponse {
  paths: AdaptivePath[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdaptivePathAnalytics {
  totalPaths: number;
  averageProgress: number;
  completionRate: number;
  averageTimeToComplete: number;
  levelDistribution: Record<string, number>;
  moduleTypeDistribution: Record<string, number>;
}

export interface AdaptiveRecommendation {
  type: 'lesson' | 'exercise' | 'review';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
} 