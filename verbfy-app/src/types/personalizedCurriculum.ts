// Personalized Curriculum Types
export interface PersonalizedCurriculum {
  _id: string;
  student: string;
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learningGoals: {
    skill: 'grammar' | 'reading' | 'writing' | 'speaking' | 'listening' | 'vocabulary';
    currentLevel: number;
    targetLevel: number;
    priority: 'low' | 'medium' | 'high';
  }[];
  curriculumPath: {
    phase: number;
    title: string;
    description: string;
    estimatedDuration: number;
    lessons: {
      lessonId: string;
      lessonType: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      order: number;
      isCompleted: boolean;
      completedAt?: string;
      score?: number;
      timeSpent?: number;
    }[];
    tests: {
      testId: string;
      testType: 'placement' | 'progress' | 'certification';
      cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      order: number;
      isCompleted: boolean;
      completedAt?: string;
      score?: number;
    }[];
    isCompleted: boolean;
    completedAt?: string;
  }[];
  progress: {
    currentPhase: number;
    lessonsCompleted: number;
    totalLessons: number;
    testsCompleted: number;
    totalTests: number;
    overallProgress: number;
    estimatedCompletionDate?: string;
  };
  recommendations: {
    _id: string;
    type: 'lesson' | 'test' | 'practice' | 'review';
    title: string;
    description: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    resourceId?: string;
    resourceType?: 'lesson' | 'test' | 'material';
    isCompleted: boolean;
    createdAt: string;
  }[];
  studySchedule: {
    dayOfWeek: number;
    preferredTime: string;
    duration: number;
    isActive: boolean;
  }[];
  achievements: {
    type: 'streak' | 'milestone' | 'skill' | 'level';
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurriculumRequest {
  currentCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  targetCEFRLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  learningGoals: {
    skill: 'grammar' | 'reading' | 'writing' | 'speaking' | 'listening' | 'vocabulary';
    currentLevel: number;
    targetLevel: number;
    priority: 'low' | 'medium' | 'high';
  }[];
}

export interface UpdateProgressRequest {
  lessonId?: string;
  testId?: string;
  score: number;
  timeSpent?: number;
}

export interface UpdateStudyScheduleRequest {
  studySchedule: {
    dayOfWeek: number;
    preferredTime: string;
    duration: number;
    isActive: boolean;
  }[];
}

export interface CurriculumAnalytics {
  overallProgress: number;
  currentPhase: number;
  totalPhases: number;
  lessonsCompleted: number;
  totalLessons: number;
  testsCompleted: number;
  totalTests: number;
  currentStreak: {
    type: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  } | null;
  skillProgress: {
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
  weeklyProgress: {
    currentWeek: number;
    lessonsCompleted: number;
    timeSpent: number;
    averageScore: number;
  };
  estimatedCompletion: string;
  recentActivity: any[];
}

export interface CurriculumRecommendation {
  _id: string;
  type: 'lesson' | 'test' | 'practice' | 'review';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  resourceId?: string;
  resourceType?: 'lesson' | 'test' | 'material';
  isCompleted: boolean;
  createdAt: string;
} 