import React, { useState, useEffect } from 'react';
import { AIAnalytics, AIUserProgress } from '@/types/aiFeatures';
import { aiFeaturesAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface AIAnalyticsDashboardProps {
  userRole: 'admin' | 'teacher';
}

export const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({
  userRole
}) => {
  const { user } = useAuthContext();
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [userProgress, setUserProgress] = useState<AIUserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsResponse, progressResponse] = await Promise.all([
        aiFeaturesAPI.getAnalytics({
          period,
          startDate: selectedDate,
          endDate: selectedDate
        }),
        aiFeaturesAPI.getUserProgress({
          period,
          startDate: selectedDate,
          endDate: selectedDate
        })
      ]);
      
      setAnalytics(analyticsResponse.analytics);
      setUserProgress(progressResponse);
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMetricColor = (value: number, threshold: number = 0.7) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBgColor = (value: number, threshold: number = 0.7) => {
    if (value >= threshold) return 'bg-green-100';
    if (value >= threshold * 0.8) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into AI performance and user engagement
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.metrics.totalSessions)}</p>
                  </div>
                  <div className="text-3xl">🤖</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600">+12.5%</span>
                    <span className="text-gray-500 ml-1">from last period</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.metrics.activeUsers)}</p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600">+8.3%</span>
                    <span className="text-gray-500 ml-1">from last period</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Satisfaction Score</p>
                    <p className={`text-2xl font-bold ${getMetricColor(analytics.metrics.satisfactionScore)}`}>
                      {(analytics.metrics.satisfactionScore * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-3xl">⭐</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600">+2.1%</span>
                    <span className="text-gray-500 ml-1">from last period</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">AI Accuracy</p>
                    <p className={`text-2xl font-bold ${getMetricColor(analytics.aiPerformance.modelAccuracy)}`}>
                      {(analytics.aiPerformance.modelAccuracy * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-3xl">🎯</div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-green-600">+1.8%</span>
                    <span className="text-gray-500 ml-1">from last period</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* AI Performance */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Metrics</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Model Accuracy</span>
                    <span className={`text-sm font-medium ${getMetricColor(analytics.aiPerformance.modelAccuracy)}`}>
                      {formatPercentage(analytics.aiPerformance.modelAccuracy)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMetricBgColor(analytics.aiPerformance.modelAccuracy)}`}
                      style={{ width: `${analytics.aiPerformance.modelAccuracy * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics.aiPerformance.averageResponseTime.toFixed(1)}s
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(analytics.aiPerformance.averageResponseTime / 5 * 100, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className={`text-sm font-medium ${getMetricColor(1 - analytics.aiPerformance.errorRate)}`}>
                      {formatPercentage(analytics.aiPerformance.errorRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMetricBgColor(1 - analytics.aiPerformance.errorRate)}`}
                      style={{ width: `${(1 - analytics.aiPerformance.errorRate) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Correction Accuracy</span>
                    <span className={`text-sm font-medium ${getMetricColor(analytics.aiPerformance.correctionAccuracy)}`}>
                      {formatPercentage(analytics.aiPerformance.correctionAccuracy)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMetricBgColor(analytics.aiPerformance.correctionAccuracy)}`}
                      style={{ width: `${analytics.aiPerformance.correctionAccuracy * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* User Engagement */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analytics.userEngagement.newUsers}</div>
                      <div className="text-sm text-gray-600">New Users</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics.userEngagement.returningUsers}</div>
                      <div className="text-sm text-gray-600">Returning Users</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Churn Rate</span>
                    <span className={`text-sm font-medium ${getMetricColor(1 - analytics.userEngagement.churnRate)}`}>
                      {formatPercentage(analytics.userEngagement.churnRate)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getMetricBgColor(1 - analytics.userEngagement.churnRate)}`}
                      style={{ width: `${(1 - analytics.userEngagement.churnRate) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Sessions per User</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics.userEngagement.averageSessionsPerUser.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min(analytics.userEngagement.averageSessionsPerUser / 10 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Most Popular Features</h3>
                  <div className="space-y-2">
                    {analytics.userEngagement.mostPopularFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{feature.feature}</span>
                        <span className="text-sm font-medium text-gray-900">{feature.usageCount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Performance */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.contentPerformance.totalContentGenerated}</div>
                  <div className="text-sm text-gray-600">Total Generated</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.contentPerformance.approvedContent}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{analytics.contentPerformance.rejectedContent}</div>
                  <div className="text-sm text-gray-600">Rejected</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Content by Level</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {analytics.contentPerformance.contentByLevel.map((level, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold text-gray-900">{level.count}</div>
                      <div className="text-xs text-gray-600">{level.level}</div>
                      <div className="text-xs text-gray-500">⭐ {level.averageRating.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.costAnalysis.totalCost)}</div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.costAnalysis.costPerSession)}</div>
                  <div className="text-sm text-gray-600">Cost per Session</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.costAnalysis.costPerUser)}</div>
                  <div className="text-sm text-gray-600">Cost per User</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{formatPercentage(analytics.costAnalysis.roi)}</div>
                  <div className="text-sm text-gray-600">ROI</div>
                </div>
              </div>
            </div>

            {/* Skill Improvements */}
            {userProgress && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skill Improvements</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(userProgress.skills).map(([skill, data]) => (
                    <div key={skill} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 capitalize">{skill}</div>
                      <div className="text-2xl font-bold text-blue-600">{data.current}%</div>
                      <div className="text-sm text-green-600">+{data.improvement}%</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {data.sessions} sessions | {data.exercises} exercises
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 