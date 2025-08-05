import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';
import { TeacherAnalytics, StatCard } from '../../types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherAnalytics();
  }, []);

  const fetchTeacherAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/analytics/teacher');
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching teacher analytics:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load analytics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getStatCards = (): StatCard[] => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Lessons',
        value: analytics.totalLessons,
        icon: '📚',
        color: 'bg-blue-500'
      },
      {
        title: 'Total Students',
        value: analytics.totalStudents,
        icon: '👥',
        color: 'bg-green-500'
      },
      {
        title: 'Total Earnings',
        value: formatCurrency(analytics.totalEarnings),
        icon: '💰',
        color: 'bg-yellow-500'
      },
      {
        title: 'Average Rating',
        value: `${analytics.averageRating.toFixed(1)} ⭐`,
        icon: '⭐',
        color: 'bg-purple-500'
      }
    ];
  };

  const getMonthlyTrendData = () => {
    if (!analytics?.monthlyTrend) return [];

    return analytics.monthlyTrend.map(item => ({
      name: formatMonth(item._id.year, item._id.month),
      lessons: item.lessonCount,
      earnings: item.earnings
    }));
  };

  const getLessonTypeData = () => {
    if (!analytics?.lessonTypeBreakdown) return [];

    return analytics.lessonTypeBreakdown.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      earnings: item.earnings
    }));
  };

  const StatCardComponent = ({ card }: { card: StatCard }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${card.color} text-white`}>
          <span className="text-2xl">{card.icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {card.title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>
          {card.change && (
            <p className={`text-sm ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              {card.change}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchTeacherAnalytics}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No analytics data available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start teaching lessons to see your analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Teacher Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your teaching performance and earnings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatCards().map((card, index) => (
          <StatCardComponent key={index} card={card} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Lesson Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyTrendData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="lessons"
                stroke="#0088FE"
                strokeWidth={2}
                name="Lessons"
              />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#00C49F"
                strokeWidth={2}
                name="Earnings ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lesson Type Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lesson Type Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getLessonTypeData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getLessonTypeData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Ratings */}
      {analytics.recentRatings && analytics.recentRatings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Ratings
          </h3>
          <div className="space-y-4">
            {analytics.recentRatings.slice(0, 5).map((rating) => (
              <div
                key={rating._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-lg mr-2">⭐</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {rating.rating}/5
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {rating.student.name}
                    </p>
                    {rating.review && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "{rating.review}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(rating.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 