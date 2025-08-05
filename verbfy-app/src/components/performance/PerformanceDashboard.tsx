import React, { useState, useEffect } from 'react';
import { PerformanceDashboard as PerformanceDashboardType, PerformanceAlert } from '@/types/performance';
import api from '@/lib/api';

interface PerformanceDashboardProps {
  organizationId?: string;
}

export default function PerformanceDashboard({ organizationId }: PerformanceDashboardProps) {
  const [dashboard, setDashboard] = useState<PerformanceDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<PerformanceAlert | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [organizationId, timeRange, autoRefresh]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/performance/dashboard', {
        params: { organizationId, timeRange }
      });
      setDashboard(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.put(`/api/performance/alerts/${alertId}/acknowledge`);
      fetchPerformanceData(); // Refresh data
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.put(`/api/performance/alerts/${alertId}/resolve`);
      fetchPerformanceData(); // Refresh data
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading && !dashboard) {
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

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
        <p className="text-gray-500">Performance monitoring data is not available.</p>
      </div>
    );
  }

  const { currentMetrics, summary, alerts } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
              Auto Refresh
            </label>
          </div>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overall Health</p>
              <p className={`text-lg font-semibold ${getHealthColor(summary.overallHealth)} px-2 py-1 rounded`}>
                {summary.overallHealth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System</p>
              <p className={`text-lg font-semibold ${getHealthColor(summary.systemHealth)} px-2 py-1 rounded`}>
                {summary.systemHealth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Application</p>
              <p className={`text-lg font-semibold ${getHealthColor(summary.applicationHealth)} px-2 py-1 rounded`}>
                {summary.applicationHealth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Database</p>
              <p className={`text-lg font-semibold ${getHealthColor(summary.databaseHealth)} px-2 py-1 rounded`}>
                {summary.databaseHealth}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">API</p>
              <p className={`text-lg font-semibold ${getHealthColor(summary.apiHealth)} px-2 py-1 rounded`}>
                {summary.apiHealth}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU and Memory */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>CPU Usage</span>
                <span>{formatPercentage(currentMetrics.system.cpu.usage)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    currentMetrics.system.cpu.usage > 80 ? 'bg-red-500' :
                    currentMetrics.system.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${currentMetrics.system.cpu.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Load: {currentMetrics.system.cpu.load.toFixed(2)} | Cores: {currentMetrics.system.cpu.cores}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Memory Usage</span>
                <span>{formatPercentage(currentMetrics.system.memory.usage)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    currentMetrics.system.memory.usage > 80 ? 'bg-red-500' :
                    currentMetrics.system.memory.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${currentMetrics.system.memory.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(currentMetrics.system.memory.used)} / {formatBytes(currentMetrics.system.memory.total)}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Disk Usage</span>
                <span>{formatPercentage(currentMetrics.system.disk.usage)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    currentMetrics.system.disk.usage > 80 ? 'bg-red-500' :
                    currentMetrics.system.disk.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${currentMetrics.system.disk.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(currentMetrics.system.disk.used)} / {formatBytes(currentMetrics.system.disk.total)}
              </p>
            </div>
          </div>
        </div>

        {/* Application Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Response Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.application.responseTime.average.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-500">
                  P95: {currentMetrics.application.responseTime.p95.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Throughput</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.application.throughput.requestsPerSecond.toFixed(1)}/s
                </p>
                <p className="text-xs text-gray-500">
                  Success: {formatPercentage(currentMetrics.application.throughput.successRate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatDuration(currentMetrics.application.uptime)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Connections</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.application.activeConnections}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Memory Usage</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${(currentMetrics.application.memory.heapUsed / currentMetrics.application.memory.heapTotal) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatBytes(currentMetrics.application.memory.heapUsed)} / {formatBytes(currentMetrics.application.memory.heapTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database and API Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Connections</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.database.connections.active}/{currentMetrics.database.connections.max}
                </p>
                <p className="text-xs text-gray-500">
                  Usage: {formatPercentage(currentMetrics.database.connections.usage)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Query Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.database.queries.averageTime.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-500">
                  {currentMetrics.database.queries.slow} slow queries
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Cache Hit Ratio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(currentMetrics.database.performance.cacheHitRatio)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Index Hit Ratio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(currentMetrics.database.performance.indexHitRatio)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Request Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.api.requests.rate.toFixed(1)}/s
                </p>
                <p className="text-xs text-gray-500">
                  Total: {currentMetrics.api.requests.total.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Latency</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {currentMetrics.api.latency.average.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-500">
                  P95: {currentMetrics.api.latency.p95.toFixed(0)}ms
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">Response Codes</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">{currentMetrics.api.responseCodes['2xx']}</p>
                  <p className="text-xs text-gray-500">2xx</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-600">{currentMetrics.api.responseCodes['3xx']}</p>
                  <p className="text-xs text-gray-500">3xx</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-yellow-600">{currentMetrics.api.responseCodes['4xx']}</p>
                  <p className="text-xs text-gray-500">4xx</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-600">{currentMetrics.api.responseCodes['5xx']}</p>
                  <p className="text-xs text-gray-500">5xx</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
        </div>
        <div className="p-6">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">All systems are running normally.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <p className="text-xs mt-2">
                        Metric: {alert.metric} | Current: {alert.currentValue} | Threshold: {alert.threshold}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {alert.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleAcknowledgeAlert(alert._id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolveAlert(alert._id)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {alert.status === 'acknowledged' && (
                        <button
                          onClick={() => handleResolveAlert(alert._id)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 