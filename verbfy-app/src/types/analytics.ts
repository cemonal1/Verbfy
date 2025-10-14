// Teacher Analytics Types
export interface TeacherAnalytics {
  totalLessons: number;
  totalStudents: number;
  totalEarnings: number;
  averageRating: number;
  monthlyTrend: MonthlyTrendData[];
  recentRatings: RecentRating[];
  lessonTypeBreakdown: LessonTypeBreakdown[];
}

export interface MonthlyTrendData {
  _id: {
    year: number;
    month: number;
  };
  lessonCount: number;
  earnings: number;
}

export interface RecentRating {
  _id: string;
  rating: number;
  review?: string;
  createdAt: string;
  student: {
    name: string;
  };
}

export interface LessonTypeBreakdown {
  _id: string;
  count: number;
  earnings: number;
}

// Student Analytics Types
export interface StudentAnalytics {
  totalLessons: number;
  totalHours: number;
  totalSpent: number;
  averageRating: number;
  currentStreak: number;
  skillProgress: SkillProgress[];
  recentActivity: RecentActivity[];
}

export interface SkillProgress {
  skill: string;
  current: number;
  target: number;
  improvement: number;
}

export interface WeeklyProgress {
  week: string;
  lessons: number;
  tests: number;
  timeSpent: number;
  score: number;
}

export interface MonthlyStats {
  month: string;
  lessonsCompleted: number;
  testsPassed: number;
  avgScore: number;
}

export interface LearningStreak {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  averageTimePerDay: number;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  earned: boolean;
  date?: string;
  progress?: number;
}

export interface StudyPatterns {
  preferredTime: string;
  averageSessionLength: number;
  mostActiveDay: string;
  leastActiveDay: string;
}

export interface AnalyticsData {
  overallProgress: number;
  skillProgress: SkillProgress[];
  weeklyProgress: WeeklyProgress[];
  monthlyStats: MonthlyStats[];
  learningStreak: LearningStreak;
  achievements: Achievement[];
  studyPatterns: StudyPatterns;
}

export interface StudySession {
  id: number;
  date: string;
  time: string;
  duration: number;
  type: 'lesson' | 'test' | 'practice' | 'review';
  title: string;
  completed: boolean;
  goal: string;
}

export interface StudyGoal {
  id: number;
  title: string;
  progress: number;
  target: number;
  current: number;
}

export interface RecommendedTime {
  day: string;
  time: string;
  reason: string;
}

export interface StudySchedule {
  weeklyGoal: number;
  completedThisWeek: number;
  dailyGoal: number;
  averageTimePerDay: number;
  studySessions: StudySession[];
  studyGoals: StudyGoal[];
  recommendedTimes: RecommendedTime[];
}

export interface TimeRange {
  week: 'week' | 'month' | 'quarter' | 'year';
}

export interface BasicAnalyticsFilters {
  timeRange: TimeRange;
  skills?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface RecentActivity {
  _id: string;
  type: string;
  duration: number;
  rating?: number;
  createdAt: string;
  teacher: {
    name: string;
  };
}

// Admin Analytics Types
export interface AdminAnalytics {
  totalUsers: number;
  totalRevenue: number;
  totalPayments: number;
  userStats: UserStat[];
  monthlyGrowth: MonthlyGrowthData[];
  topTeachers: TopTeacher[];
  topStudents: TopStudent[];
  lessonTypeDistribution: LessonTypeDistribution[];
}

export interface UserStat {
  _id: string;
  count: number;
}

export interface MonthlyGrowthData {
  _id: {
    year: number;
    month: number;
  };
  newUsers: number;
}

export interface TopTeacher {
  _id: string;
  name: string;
  email: string;
  totalEarnings: number;
  totalLessons: number;
  averageRating: number;
}

export interface TopStudent {
  _id: string;
  name: string;
  email: string;
  totalLessons: number;
  totalHours: number;
  totalSpent: number;
}

export interface LessonTypeDistribution {
  _id: string;
  count: number;
  revenue: number;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface LineChartData {
  name: string;
  lessons?: number;
  earnings?: number;
  users?: number;
  [key: string]: unknown;
}

export interface BarChartData {
  name: string;
  value: number;
  [key: string]: unknown;
}

export interface PieChartData {
  name: string;
  value: number;
  [key: string]: unknown;
}

// API Response Types
export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Utility Types
export interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

export interface ChartConfig {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'radar';
  data: unknown[];
  height?: number;
  width?: number;
}

export interface AnalyticsDashboard {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'system' | 'business' | 'user' | 'content' | 'custom';
  layout: DashboardLayout;
  filters: AnalyticsFilters;
  refreshInterval: number; // seconds
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'gauge' | 'list';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: string;
  refreshInterval?: number;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';
  metrics?: string[];
  dimensions?: string[];
  aggregations?: string[];
  timeRange?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  colors?: string[];
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface AnalyticsFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  timeGranularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  dimensions: {
    [key: string]: string[];
  };
  metrics: string[];
  segments: string[];
  customFilters: {
    [key: string]: unknown;
  };
}

export interface AnalyticsQuery {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  query: string;
  type: 'sql' | 'aggregation' | 'pipeline';
  parameters: {
    [key: string]: unknown;
  };
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsReport {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'scheduled' | 'on-demand' | 'real-time';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  query: AnalyticsQuery;
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time: string;
    timezone: string;
    recipients: string[];
  };
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'error';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsInsight {
  _id: string;
  organizationId: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'business' | 'user' | 'content' | 'system';
  data: {
    metric: string;
    value: number;
    change: number;
    changeType: 'increase' | 'decrease' | 'stable';
    timeframe: string;
  };
  confidence: number; // 0-100
  actionable: boolean;
  actions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface AnalyticsSegment {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'user' | 'content' | 'behavior' | 'custom';
  criteria: SegmentCriteria[];
  conditions: 'all' | 'any' | 'none';
  isActive: boolean;
  userCount: number;
  lastUpdated: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: unknown;
  value2?: unknown; // for between operator
}

export interface AnalyticsMetric {
  _id: string;
  organizationId: string;
  name: string;
  displayName: string;
  description: string;
  type: 'count' | 'sum' | 'average' | 'min' | 'max' | 'percentage' | 'ratio' | 'custom';
  unit: string;
  category: 'user' | 'content' | 'business' | 'system' | 'performance';
  formula?: string;
  dataSource: string;
  aggregation: string;
  dimensions: string[];
  filters: {
    [key: string]: unknown;
  };
  isCalculated: boolean;
  refreshInterval: number;
  lastCalculated: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDimension {
  _id: string;
  organizationId: string;
  name: string;
  displayName: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  dataSource: string;
  field: string;
  category: 'user' | 'content' | 'business' | 'system' | 'time';
  isHierarchical: boolean;
  parentDimension?: string;
  values?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDataPoint {
  timestamp: Date;
  dimensions: {
    [key: string]: unknown;
  };
  metrics: {
    [key: string]: number;
  };
}

export interface AnalyticsTimeSeries {
  metric: string;
  data: {
    timestamp: Date;
    value: number;
  }[];
  metadata: {
    unit: string;
    granularity: string;
    totalPoints: number;
  };
}

export interface AnalyticsHeatmap {
  xAxis: string;
  yAxis: string;
  metric: string;
  data: {
    x: string;
    y: string;
    value: number;
  }[];
  metadata: {
    unit: string;
    minValue: number;
    maxValue: number;
  };
}

export interface AnalyticsFunnel {
  name: string;
  stages: {
    name: string;
    count: number;
    conversionRate: number;
  }[];
  metadata: {
    totalUsers: number;
    totalConversion: number;
    timeRange: string;
  };
}

export interface AnalyticsCohort {
  name: string;
  period: string;
  data: {
    cohort: string;
    periods: {
      period: number;
      users: number;
      retention: number;
    }[];
  }[];
  metadata: {
    totalCohorts: number;
    totalPeriods: number;
    timeRange: string;
  };
}

export interface AnalyticsForecast {
  metric: string;
  historical: {
    timestamp: Date;
    value: number;
  }[];
  forecast: {
    timestamp: Date;
    value: number;
    confidence: {
      lower: number;
      upper: number;
    };
  }[];
  metadata: {
    algorithm: string;
    confidence: number;
    horizon: number;
    accuracy: number;
  };
}

export interface AnalyticsAlert {
  _id: string;
  organizationId: string;
  name: string;
  description: string;
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'not_equals' | 'changes_by';
  threshold: number;
  timeWindow: number; // minutes
  frequency: 'once' | 'repeated';
  channels: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
    dashboard: boolean;
  };
  recipients: string[];
  isActive: boolean;
  lastTriggered?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsExport {
  _id: string;
  organizationId: string;
  name: string;
  type: 'dashboard' | 'report' | 'query';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filters: AnalyticsFilters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  expiresAt: Date;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AnalyticsSettings {
  organizationId: string;
  dataRetention: {
    rawData: number; // days
    aggregatedData: number; // days
    reports: number; // days
  };
  privacy: {
    anonymizeUsers: boolean;
    dataMasking: boolean;
    gdprCompliant: boolean;
  };
  performance: {
    maxConcurrentQueries: number;
    queryTimeout: number; // seconds
    cacheEnabled: boolean;
    cacheTTL: number; // seconds
  };
  integrations: {
    googleAnalytics?: {
      enabled: boolean;
      propertyId: string;
    };
    mixpanel?: {
      enabled: boolean;
      projectToken: string;
    };
    amplitude?: {
      enabled: boolean;
      apiKey: string;
    };
  };
  updatedAt: Date;
}