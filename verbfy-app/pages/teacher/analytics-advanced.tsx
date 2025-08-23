import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherAnalyticsAPI } from '@/lib/api';
import { TeacherAnalytics, StudentPerformanceData, LessonAnalyticsData, EngagementMetricsData, AnalyticsFilters } from '@/types/teacherAnalytics';
import { 
  ChartBarIcon, 
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const TeacherAnalyticsAdvancedPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformanceData[]>([]);
  const [lessonAnalytics, setLessonAnalytics] = useState<LessonAnalyticsData[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '30d',
    includeInactive: false
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, studentsRes, lessonsRes, engagementRes] = await Promise.all([
        teacherAnalyticsAPI.getAnalytics(filters),
        teacherAnalyticsAPI.getStudentPerformance(filters),
        teacherAnalyticsAPI.getLessonAnalytics(filters),
        teacherAnalyticsAPI.getEngagementMetrics(filters)
      ]);

      setAnalytics(analyticsRes.analytics);
      setStudentPerformance(studentsRes.students);
      setLessonAnalytics(lessonsRes.lessons);
      setEngagementMetrics(engagementRes.metrics);
    } catch (error) {
      console.error('Error loading teacher analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = async () => {
    try {
      const response = await teacherAnalyticsAPI.generateAnalytics({
        timeRange: filters.timeRange,
        includeStudentDetails: true,
        includeRevenueData: true
      });
      setAnalytics(response.analytics);
      toast.success('Analytics generated successfully!');
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast.error('Failed to generate analytics');
    }
  };

  const getTrendIcon = (value: number, isPositive: boolean) => {
    if (isPositive) {
      return value > 0 ? (
        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
      );
    }
    return value > 0 ? (
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    ) : (
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Advanced Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
            Advanced Teacher Analytics
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into your teaching performance, student progress, and engagement metrics.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Level</label>
                <select
                  value={filters.studentLevel || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, studentLevel: e.target.value as any || undefined }))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Mastery</option>
                </select>
              </div>
            </div>
            <button
              onClick={generateAnalytics}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Analytics
            </button>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Student Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.studentMetrics.totalStudents}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(analytics.studentMetrics.newStudentsThisMonth, true)}
                      <span className="text-sm text-gray-600 ml-1">
                        +{analytics.studentMetrics.newStudentsThisMonth} this month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.performanceMetrics.averageLessonRating.toFixed(1)}</p>
                    <div className="flex items-center mt-1">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">
                        {analytics.performanceMetrics.totalLessons} lessons
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.revenueMetrics.monthlyRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      {getTrendIcon(analytics.revenueMetrics.revenueGrowth, true)}
                      <span className="text-sm text-gray-600 ml-1">
                        {analytics.revenueMetrics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueMetrics.revenueGrowth}% growth
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <HeartIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Student Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.studentMetrics.studentSatisfactionScore.toFixed(1)}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-600">
                        {analytics.engagementMetrics.messageResponseRate}% response rate
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Performance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Students</h3>
                <div className="space-y-3">
                  {analytics.studentProgress.topPerformingStudents.slice(0, 5).map((student, index) => (
                    <div key={student.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.lessonsCompleted} lessons</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{student.progress}%</p>
                        <p className="text-xs text-gray-500">progress</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Struggling Students */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Students Needing Support</h3>
                <div className="space-y-3">
                  {analytics.studentProgress.strugglingStudents.slice(0, 5).map((student, index) => (
                    <div key={student.studentId} className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Needs Help</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="mb-1"><strong>Issues:</strong> {student.issues.join(', ')}</p>
                        <p><strong>Recommendations:</strong> {student.recommendations.slice(0, 2).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lesson Analytics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lesson Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lessonAnalytics.slice(0, 10).map((lesson) => (
                      <tr key={lesson.lessonId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                          <div className="text-sm text-gray-500">{new Date(lesson.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lesson.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{lesson.rating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lesson.duration} min</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${lesson.revenue}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lesson.completionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            lesson.completionStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lesson.completionStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Engagement Metrics */}
            {engagementMetrics && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                      <ClockIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Response Time</p>
                    <p className="text-2xl font-bold text-gray-900">{engagementMetrics.responseTime} min</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Message Count</p>
                    <p className="text-2xl font-bold text-gray-900">{engagementMetrics.messageCount}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Materials Uploaded</p>
                    <p className="text-2xl font-bold text-gray-900">{engagementMetrics.materialCount}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherAnalyticsAdvancedPage; 