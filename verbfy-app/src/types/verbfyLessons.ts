// Verbfy Lesson Types
export interface VerbfyLesson {
  _id: string;
  title: string;
  description: string;
  lessonType: 'VerbfyGrammar' | 'VerbfyRead' | 'VerbfyWrite' | 'VerbfySpeak' | 'VerbfyListen' | 'VerbfyVocab';
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  subcategory?: string;
  estimatedDuration: number;
  content: {
    instructions: string;
    materials: {
      type: 'text' | 'audio' | 'video' | 'image' | 'interactive' | 'quiz';
      content: string;
      fileUrl?: string;
      duration?: number;
    }[];
    exercises: {
      type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'essay' | 'speaking' | 'listening';
      question: string;
      options?: string[];
      correctAnswer: string | string[];
      explanation?: string;
      points: number;
      audioUrl?: string;
      imageUrl?: string;
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
  prerequisites?: string[];
  tags: string[];
  isActive: boolean;
  isPremium: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  averageRating: number;
  totalRatings: number;
  completionRate: number;
  averageCompletionTime: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFilters {
  lessonType?: string;
  cefrLevel?: string;
  difficulty?: string;
  category?: string;
  isPremium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LessonResponse {
  lessons: VerbfyLesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LessonAttempt {
  _id: string;
  student: string;
  lessonId: string;
  resourceType: 'lesson';
  lessonType: string;
  cefrLevel: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
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

export interface StartLessonResponse {
  attemptId: string;
  lesson: {
    id: string;
    title: string;
    description: string;
    instructions: string;
    materials: {
      id: string;
      type: 'text' | 'image' | 'audio' | 'video' | 'document';
      title: string;
      content: string;
      url?: string;
    }[];
    exercises: {
      index: number;
      type: string;
      question: string;
      options?: string[];
      points: number;
      audioUrl?: string;
      imageUrl?: string;
    }[];
    vocabulary?: {
      word: string;
      definition: string;
      pronunciation?: string;
      example?: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
    grammar?: {
      rule: string;
      explanation: string;
      examples: string[];
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
    estimatedDuration: number;
  };
}

export interface SubmitLessonRequest {
  answers: {
    questionIndex: number;
    studentAnswer: string | string[];
    timeSpent?: number;
  }[];
  timeSpent: number;
}

export interface SubmitLessonResponse {
  score: number;
  maxScore: number;
  isPassed: boolean;
  feedback: {
    overall: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
  skillImprovements: {
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
}

export interface LessonStats {
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  passRate: number;
} 