import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../lib/api';
import { StudentAnalytics, StatCard } from '../../types/analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StudentDashboard() {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  const fetchStudentAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/analytics/student');
      
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching student analytics:', error);
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

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
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
        title: 'Total Hours',
        value: formatHours(analytics.totalHours),
        icon: '⏰',
        color: 'bg-green-500'
      },
      {
        title: 'Total Spent',
        value: formatCurrency(analytics.totalSpent),
        icon: '💰',
        color: 'bg-yellow-500'
      },
      {
        title: 'Current Streak',
        value: `${analytics.currentStreak} days 🔥`,
        icon: '🔥',
        color: 'bg-red-500'
      }
    ];
  };

  const getSkillProgressData = () => {
    if (!analytics?.skillProgress) return [];

    return analytics.skillProgress.map(skill => ({
      subject: skill.skill.charAt(0).toUpperCase() + skill.skill.slice(1),
      lessons: skill.current,
      hours: skill.target,
      rating: skill.improvement || 0
    }));
  };

  const getSkillRadarData = () => {
    if (!analytics?.skillProgress) return [];

    return analytics.skillProgress.map(skill => ({
      subject: skill.skill.charAt(0).toUpperCase() + skill.skill.slice(1),
      lessons: skill.current,
      hours: skill.target,
      rating: skill.improvement || 0
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
          onClick={fetchStudentAnalytics}
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
          Start taking lessons to see your progress analytics here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Student Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your learning progress and activity
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
        {/* Skill Progress Radar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Skill Progress Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={getSkillRadarData()}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
              <Radar
                name="Lessons"
                dataKey="lessons"
                stroke="#0088FE"
                fill="#0088FE"
                fillOpacity={0.6}
              />
              <Radar
                name="Hours"
                dataKey="hours"
                stroke="#00C49F"
                fill="#00C49F"
                fillOpacity={0.6}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Breakdown Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lessons by Skill
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getSkillProgressData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="lessons" fill="#0088FE" name="Lessons" />
              <Bar dataKey="hours" fill="#00C49F" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {analytics.recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity._id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-blue-500 text-lg mr-2">📚</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} Lesson
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        with {activity.teacher.name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatHours(activity.duration)}
                    </p>
                    {activity.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-500 text-sm mr-1">⭐</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak Information */}
      {analytics.currentStreak > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                🔥 Learning Streak
              </h3>
              <p className="text-lg">
                You've been learning for <span className="font-bold">{analytics.currentStreak} days</span> in a row!
              </p>
              <p className="text-sm opacity-90 mt-1">
                Keep up the great work! Consistency is key to language learning.
              </p>
            </div>
            <div className="text-4xl">
              🔥
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 