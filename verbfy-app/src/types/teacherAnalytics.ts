export interface TeacherAnalytics {
  _id: string;
  teacherId: string;
  studentMetrics: {
    totalStudents: number;
    activeStudents: number;
    newStudentsThisMonth: number;
    averageStudentRetention: number;
    studentSatisfactionScore: number;
  };
  performanceMetrics: {
    totalLessons: number;
    averageLessonRating: number;
    totalEarnings: number;
    averageEarningsPerLesson: number;
    completionRate: number;
    cancellationRate: number;
  };
  lessonAnalytics: {
    lessonsByType: Record<string, number>;
    averageLessonDuration: number;
    popularTimeSlots: Record<string, number>;
    lessonRatingDistribution: Record<string, number>;
  };
  studentProgress: {
    cefrLevelDistribution: Record<string, number>;
    topPerformingStudents: Array<{
      studentId: string;
      name: string;
      progress: number;
      lessonsCompleted: number;
    }>;
    strugglingStudents: Array<{
      studentId: string;
      name: string;
      issues: string[];
      recommendations: string[];
    }>;
  };
  engagementMetrics: {
    averageResponseTime: number;
    messageResponseRate: number;
    materialUploadCount: number;
    studentInteractionScore: number;
  };
  revenueMetrics: {
    monthlyRevenue: number;
    revenueGrowth: number;
    topRevenueSources: Array<{
      source: string;
      amount: number;
      percentage: number;
    }>;
    averageStudentLifetimeValue: number;
  };
  feedbackAnalytics: {
    positiveFeedbackCount: number;
    negativeFeedbackCount: number;
    commonPositiveThemes: string[];
    commonNegativeThemes: string[];
    improvementSuggestions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateAnalyticsData {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  includeStudentDetails?: boolean;
  includeRevenueData?: boolean;
}

export interface StudentPerformanceData {
  studentId: string;
  name: string;
  email: string;
  cefrLevel: string;
  totalLessons: number;
  averageScore: number;
  progress: {
    grammar: number;
    reading: number;
    writing: number;
    speaking: number;
    listening: number;
    vocabulary: number;
  };
  lastActive: string;
  upcomingLessons: number;
  issues?: string[];
  recommendations: string[];
}

export interface LessonAnalyticsData {
  lessonId: string;
  title: string;
  type: string;
  date: string;
  duration: number;
  rating: number;
  studentFeedback: string;
  completionStatus: 'completed' | 'cancelled' | 'rescheduled';
  revenue: number;
}

export interface EngagementMetricsData {
  responseTime: number;
  messageCount: number;
  materialCount: number;
  studentSatisfaction: number;
  interactionScore: number;
  timeRange: string;
}

export interface AnalyticsFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  studentLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  lessonType?: string;
  includeInactive?: boolean;
}

export interface TeacherAnalyticsResponse {
  analytics: TeacherAnalytics;
}

export interface StudentPerformanceResponse {
  students: StudentPerformanceData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LessonAnalyticsResponse {
  lessons: LessonAnalyticsData[];
  summary: {
    totalLessons: number;
    averageRating: number;
    totalRevenue: number;
    completionRate: number;
  };
}

export interface EngagementMetricsResponse {
  metrics: EngagementMetricsData;
} 