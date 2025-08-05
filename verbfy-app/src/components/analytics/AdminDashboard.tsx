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
import { AdminAnalytics, StatCard } from '../../types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAnalytics();
  }, []);

  const fetchAdminAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/analytics/admin');
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching admin analytics:', error);
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getStatCards = (): StatCard[] => {
    if (!analytics) return [];

    return [
      {
        title: 'Total Users',
        value: formatNumber(analytics.totalUsers),
        icon: '👥',
        color: 'bg-blue-500'
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(analytics.totalRevenue),
        icon: '💰',
        color: 'bg-green-500'
      },
      {
        title: 'Total Payments',
        value: formatNumber(analytics.totalPayments),
        icon: '💳',
        color: 'bg-yellow-500'
      },
      {
        title: 'Active Teachers',
        value: analytics.userStats.find(s => s._id === 'teacher')?.count || 0,
        icon: '👨‍🏫',
        color: 'bg-purple-500'
      }
    ];
  };

  const getMonthlyGrowthData = () => {
    if (!analytics?.monthlyGrowth) return [];

    return analytics.monthlyGrowth.map(item => ({
      name: formatMonth(item._id.year, item._id.month),
      users: item.newUsers
    }));
  };

  const getTopTeachersData = () => {
    if (!analytics?.topTeachers) return [];

    return analytics.topTeachers.map(teacher => ({
      name: teacher.name,
      earnings: teacher.totalEarnings,
      lessons: teacher.totalLessons,
      rating: teacher.averageRating
    }));
  };

  const getTopStudentsData = () => {
    if (!analytics?.topStudents) return [];

    return analytics.topStudents.map(student => ({
      name: student.name,
      lessons: student.totalLessons,
      hours: student.totalHours,
      spent: student.totalSpent
    }));
  };

  const getLessonTypeData = () => {
    if (!analytics?.lessonTypeDistribution) return [];

    return analytics.lessonTypeDistribution.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
      revenue: item.revenue
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
          onClick={fetchAdminAnalytics}
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
          Platform data will appear here once users start using the system.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Platform overview and performance metrics
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
        {/* Monthly Growth Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly User Growth
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getMonthlyGrowthData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#0088FE"
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lesson Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lesson Type Distribution
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

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Teachers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Earning Teachers
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTopTeachersData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="earnings" fill="#00C49F" name="Earnings ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Students */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Active Students
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTopStudentsData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="lessons" fill="#FFBB28" name="Lessons" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.userStats.map((stat) => (
            <div key={stat._id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(stat.count)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {stat._id}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 