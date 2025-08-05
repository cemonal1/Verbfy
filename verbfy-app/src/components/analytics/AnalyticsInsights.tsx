import React, { useState, useEffect } from 'react';
import { AnalyticsInsight } from '@/types/analytics';
import api from '@/lib/api';

interface AnalyticsInsightsProps {
  organizationId?: string;
}

export default function AnalyticsInsights({ organizationId }: AnalyticsInsightsProps) {
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'trend' | 'anomaly' | 'correlation' | 'forecast' | 'recommendation'>('all');
  const [severity, setSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  useEffect(() => {
    fetchInsights();
  }, [organizationId, filter, severity]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/analytics/insights', {
        params: { organizationId, type: filter !== 'all' ? filter : undefined, severity: severity !== 'all' ? severity : undefined }
      });
      setInsights(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'anomaly':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'correlation':
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'forecast':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'recommendation':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-100 text-blue-800';
      case 'anomaly':
        return 'bg-red-100 text-red-800';
      case 'correlation':
        return 'bg-purple-100 text-purple-800';
      case 'forecast':
        return 'bg-green-100 text-green-800';
      case 'recommendation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatChange = (change: number, changeType: string) => {
    const sign = change > 0 ? '+' : '';
    const color = changeType === 'increase' ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
    return <span className={color}>{sign}{change.toFixed(1)}%</span>;
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Insights</h2>
          <p className="text-gray-600">AI-powered insights and recommendations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="trend">Trends</option>
              <option value="anomaly">Anomalies</option>
              <option value="correlation">Correlations</option>
              <option value="forecast">Forecasts</option>
              <option value="recommendation">Recommendations</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Severity:</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No insights available</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter !== 'all' || severity !== 'all' 
              ? 'Try adjusting your filters to see more insights.'
              : 'Insights will appear here as they are generated.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight) => (
            <div
              key={insight._id}
              className={`bg-white rounded-lg shadow border-l-4 ${getSeverityColor(insight.severity)}`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(insight.type)}`}>
                          {insight.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(insight.severity)}`}>
                          {insight.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">{insight.description}</p>

                {/* Data */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metric</p>
                      <p className="text-sm font-semibold text-gray-900">{insight.data.metric}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Value</p>
                      <p className="text-sm font-semibold text-gray-900">{insight.data.value.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Change</p>
                      <p className="text-sm font-semibold">
                        {formatChange(insight.data.change, insight.data.changeType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Timeframe</p>
                      <p className="text-sm font-semibold text-gray-900">{insight.data.timeframe}</p>
                    </div>
                  </div>
                </div>

                {/* Confidence and Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confidence</p>
                    <p className="text-sm font-semibold text-gray-900">{formatConfidence(insight.confidence)}</p>
                  </div>
                  {insight.actionable && insight.actions.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</p>
                      <p className="text-sm text-blue-600">{insight.actions.length} available</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {insight.actionable && insight.actions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</p>
                    <div className="space-y-2">
                      {insight.actions.slice(0, 2).map((action, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm text-gray-700">{action}</span>
                        </div>
                      ))}
                      {insight.actions.length > 2 && (
                        <p className="text-sm text-gray-500">+{insight.actions.length - 2} more actions</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
                    {insight.expiresAt && (
                      <span>Expires {new Date(insight.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
              <p className="text-sm text-gray-500">Total Insights</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {insights.filter(i => i.severity === 'critical').length}
              </p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {insights.filter(i => i.severity === 'high').length}
              </p>
              <p className="text-sm text-gray-500">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {insights.filter(i => i.actionable).length}
              </p>
              <p className="text-sm text-gray-500">Actionable</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {insights.filter(i => i.type === 'recommendation').length}
              </p>
              <p className="text-sm text-gray-500">Recommendations</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 