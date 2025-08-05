// CEFR Test Types
export interface CEFRTest {
  _id: string;
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  testType: 'placement' | 'progress' | 'certification';
  sections: {
    name: string;
    description: string;
    skill: 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary';
    timeLimit: number;
    questions: {
      type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'essay' | 'speaking' | 'listening';
      question: string;
      options?: string[];
      correctAnswer: string | string[];
      explanation?: string;
      points: number;
      audioUrl?: string;
      imageUrl?: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
  }[];
  totalQuestions: number;
  totalTime: number;
  passingScore: number;
  isActive: boolean;
  isPremium: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  averageScore: number;
  totalAttempts: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestFilters {
  cefrLevel?: string;
  testType?: string;
  isPremium?: boolean;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TestResponse {
  tests: CEFRTest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TestAttempt {
  _id: string;
  student: string;
  testId: string;
  resourceType: 'test';
  cefrLevel: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  timeLimit: number;
  score: number;
  maxScore: number;
  answers: {
    questionIndex: number;
    question: string;
    studentAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    maxPoints: number;
    timeSpent: number;
  }[];
  skills: {
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
  feedback: {
    overall: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  isCompleted: boolean;
  isPassed: boolean;
}

export interface StartTestResponse {
  attemptId: string;
  test: {
    id: string;
    title: string;
    description: string;
    cefrLevel: string;
    testType: string;
    totalTime: number;
    sections: {
      name: string;
      description: string;
      skill: string;
      timeLimit: number;
      questions: {
        index: number;
        type: string;
        question: string;
        options?: string[];
        points: number;
        audioUrl?: string;
        imageUrl?: string;
        difficulty: string;
      }[];
    }[];
  };
}

export interface SubmitTestRequest {
  answers: {
    sectionIndex: number;
    questionIndex: number;
    studentAnswer: string | string[];
    timeSpent?: number;
  }[];
  timeSpent: number;
}

export interface SubmitTestResponse {
  score: number;
  maxScore: number;
  isPassed: boolean;
  cefrLevel: string;
  feedback: {
    overall: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  skillScores: {
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
}

export interface PlacementRecommendation {
  recommendedLevel: string;
  test?: CEFRTest;
  reason: string;
  recentAttempts?: {
    cefrLevel: string;
    score: number;
    completedAt: string;
  }[];
}

export interface TestStats {
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  passRate: number;
} 