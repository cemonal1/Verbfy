import React, { useState, useEffect } from 'react';
import { AnalyticsDashboard, DashboardWidget, WidgetConfig, AnalyticsFilters } from '@/types/analytics';
import api from '@/lib/api';

interface AnalyticsDashboardBuilderProps {
  dashboard?: AnalyticsDashboard;
  onSave: (dashboard: AnalyticsDashboard) => void;
  onCancel: () => void;
}

export default function AnalyticsDashboardBuilder({ dashboard, onSave, onCancel }: AnalyticsDashboardBuilderProps) {
  const [formData, setFormData] = useState<Partial<AnalyticsDashboard>>({
    name: '',
    description: '',
    type: 'custom',
    layout: {
      columns: 12,
      rows: 8,
      widgets: []
    },
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      },
      timeGranularity: 'day',
      dimensions: {},
      metrics: [],
      segments: [],
      customFilters: {}
    },
    refreshInterval: 300, // 5 minutes
    isPublic: false
  });

  const [availableWidgets, setAvailableWidgets] = useState<DashboardWidget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const [isEditingWidget, setIsEditingWidget] = useState(false);

  useEffect(() => {
    if (dashboard) {
      setFormData(dashboard);
    }
    loadAvailableWidgets();
  }, [dashboard]);

  const loadAvailableWidgets = async () => {
    try {
      const response = await api.get('/api/analytics/widgets');
      setAvailableWidgets(response.data.data);
    } catch (err: any) {
      console.error('Failed to load available widgets:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters!,
        [field]: value
      }
    }));
  };

  const addWidget = (widgetType: string) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: widgetType as any,
      title: `New ${widgetType} Widget`,
      position: {
        x: 0,
        y: 0,
        width: 6,
        height: 4
      },
      config: {
        chartType: widgetType === 'chart' ? 'line' : undefined,
        metrics: [],
        dimensions: [],
        aggregations: [],
        timeRange: '7d',
        limit: 10,
        sortBy: '',
        sortOrder: 'desc',
        colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
        thresholds: {
          warning: 80,
          critical: 95
        }
      },
      dataSource: 'default',
      refreshInterval: 300
    };

    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: [...prev.layout!.widgets, newWidget]
      }
    }));
  };

  const updateWidget = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: prev.layout!.widgets.map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      }
    }));
  };

  const removeWidget = (widgetId: string) => {
    setFormData(prev => ({
      ...prev,
      layout: {
        ...prev.layout!,
        widgets: prev.layout!.widgets.filter(widget => widget.id !== widgetId)
      }
    }));
  };

  const handleSave = async () => {
    try {
      const dashboardData = {
        ...formData,
        organizationId: 'current', // This should come from context
        createdBy: 'current-user' // This should come from context
      } as AnalyticsDashboard;

      onSave(dashboardData);
    } catch (err: any) {
      console.error('Failed to save dashboard:', err);
    }
  };

  const renderWidgetEditor = (widget: DashboardWidget) => {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Widget: {widget.title}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Widget Title</label>
            <input
              type="text"
              value={widget.title}
              onChange={(e) => updateWidget(widget.id, { title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {widget.type === 'chart' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type</label>
              <select
                value={widget.config.chartType}
                onChange={(e) => updateWidget(widget.id, { 
                  config: { ...widget.config, chartType: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="area">Area Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
            <select
              multiple
              value={widget.config.metrics || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateWidget(widget.id, { 
                  config: { ...widget.config, metrics: selected }
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="users">Total Users</option>
              <option value="sessions">Sessions</option>
              <option value="pageviews">Page Views</option>
              <option value="revenue">Revenue</option>
              <option value="conversion_rate">Conversion Rate</option>
              <option value="bounce_rate">Bounce Rate</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
            <select
              multiple
              value={widget.config.dimensions || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                updateWidget(widget.id, { 
                  config: { ...widget.config, dimensions: selected }
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="country">Country</option>
              <option value="device">Device</option>
              <option value="browser">Browser</option>
              <option value="source">Traffic Source</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
              <input
                type="number"
                value={widget.position.width}
                onChange={(e) => updateWidget(widget.id, { 
                  position: { ...widget.position, width: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
              <input
                type="number"
                value={widget.position.height}
                onChange={(e) => updateWidget(widget.id, { 
                  position: { ...widget.position, height: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="8"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setIsEditingWidget(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsEditingWidget(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Widget
          </button>
        </div>
      </div>
    );
  };

  const renderWidgetPreview = (widget: DashboardWidget) => {
    return (
      <div
        key={widget.id}
        className="bg-white rounded-lg shadow p-4 border-2 border-dashed border-gray-300"
        style={{
          gridColumn: `span ${widget.position.width}`,
          gridRow: `span ${widget.position.height}`
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">{widget.title}</h4>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSelectedWidget(widget);
                setIsEditingWidget(true);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => removeWidget(widget.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded p-3 text-center">
          <div className="text-gray-500 text-sm">
            {widget.type === 'chart' && (
              <div>
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>{widget.config.chartType} Chart</p>
              </div>
            )}
            {widget.type === 'metric' && (
              <div>
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>Metric Display</p>
              </div>
            )}
            {widget.type === 'table' && (
              <div>
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p>Data Table</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {dashboard ? 'Edit Dashboard' : 'Create Dashboard'}
          </h2>
          <p className="text-gray-600">Build custom analytics dashboards</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Dashboard
          </button>
        </div>
      </div>

      {/* Dashboard Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter dashboard name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter dashboard description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dashboard Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="system">System Analytics</option>
                  <option value="business">Business Analytics</option>
                  <option value="user">User Analytics</option>
                  <option value="content">Content Analytics</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                <input
                  type="number"
                  value={formData.refreshInterval}
                  onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="3600"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make dashboard public
                </label>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Granularity</label>
                <select
                  value={formData.filters?.timeGranularity}
                  onChange={(e) => handleFilterChange('timeGranularity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.filters?.dateRange?.start?.toISOString().split('T')[0]}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...formData.filters?.dateRange,
                      start: new Date(e.target.value)
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={formData.filters?.dateRange?.end?.toISOString().split('T')[0]}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...formData.filters?.dateRange,
                      end: new Date(e.target.value)
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Widget Library */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Widgets</h3>
            <div className="space-y-3">
              <button
                onClick={() => addWidget('chart')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Chart</p>
                    <p className="text-sm text-gray-500">Line, bar, pie, and other charts</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => addWidget('metric')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Metric</p>
                    <p className="text-sm text-gray-500">Single value display</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => addWidget('table')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Table</p>
                    <p className="text-sm text-gray-500">Data table with sorting</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => addWidget('heatmap')}
                className="w-full px-4 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Heatmap</p>
                    <p className="text-sm text-gray-500">Color-coded data visualization</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Canvas */}
        <div className="lg:col-span-2">
          {isEditingWidget && selectedWidget ? (
            renderWidgetEditor(selectedWidget)
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Layout</h3>
              
              {formData.layout?.widgets.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets added</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add widgets from the panel on the left to build your dashboard.
                  </p>
                </div>
              ) : (
                <div 
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${formData.layout?.columns}, 1fr)`,
                    gridTemplateRows: `repeat(${formData.layout?.rows}, 1fr)`
                  }}
                >
                  {formData.layout?.widgets.map(renderWidgetPreview)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 