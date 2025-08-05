import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { personalizedCurriculumAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

// Chart components (you'll need to install recharts: npm install recharts)
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export default function DetailedProgressPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { error } = useToast();
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // const response = await personalizedCurriculumAPI.getAnalytics({ timeRange });
      // setAnalytics(response.analytics);
      
      // Simulated data for demonstration
      setAnalytics({
        overallProgress: 68,
        skillProgress: [
          { skill: 'grammar', current: 75, target: 80, improvement: 12 },
          { skill: 'reading', current: 82, target: 75, improvement: 8 },
          { skill: 'writing', current: 65, target: 70, improvement: 15 },
          { skill: 'speaking', current: 70, target: 75, improvement: 10 },
          { skill: 'listening', current: 78, target: 80, improvement: 6 },
          { skill: 'vocabulary', current: 85, target: 85, improvement: 18 }
        ],
        weeklyProgress: [
          { week: 'Week 1', lessons: 5, tests: 2, timeSpent: 240, score: 78 },
          { week: 'Week 2', lessons: 7, tests: 3, timeSpent: 320, score: 82 },
          { week: 'Week 3', lessons: 6, tests: 2, timeSpent: 280, score: 85 },
          { week: 'Week 4', lessons: 8, tests: 4, timeSpent: 360, score: 88 },
          { week: 'Week 5', lessons: 9, tests: 3, timeSpent: 400, score: 90 },
          { week: 'Week 6', lessons: 7, tests: 2, timeSpent: 300, score: 92 }
        ],
        monthlyStats: [
          { month: 'Jan', lessonsCompleted: 25, testsPassed: 8, avgScore: 78 },
          { month: 'Feb', lessonsCompleted: 28, testsPassed: 10, avgScore: 82 },
          { month: 'Mar', lessonsCompleted: 32, testsPassed: 12, avgScore: 85 },
          { month: 'Apr', lessonsCompleted: 30, testsPassed: 11, avgScore: 88 },
          { month: 'May', lessonsCompleted: 35, testsPassed: 14, avgScore: 90 },
          { month: 'Jun', lessonsCompleted: 38, testsPassed: 15, avgScore: 92 }
        ],
        learningStreak: {
          currentStreak: 12,
          longestStreak: 18,
          totalStudyDays: 45,
          averageTimePerDay: 45
        },
        achievements: [
          { id: 1, name: 'First Lesson', description: 'Completed your first lesson', earned: true, date: '2024-01-15' },
          { id: 2, name: 'Week Warrior', description: 'Studied for 7 consecutive days', earned: true, date: '2024-01-22' },
          { id: 3, name: 'Grammar Master', description: 'Achieved 80% in grammar skills', earned: true, date: '2024-02-10' },
          { id: 4, name: 'Test Champion', description: 'Passed 10 tests', earned: false, progress: 8 },
          { id: 5, name: 'Vocabulary Expert', description: 'Learned 500 new words', earned: false, progress: 320 }
        ],
        studyPatterns: {
          preferredTime: 'Evening (6-9 PM)',
          averageSessionLength: 45,
          mostActiveDay: 'Wednesday',
          leastActiveDay: 'Sunday'
        }
      });
    } catch (err) {
      error('Failed to load analytics');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSkillIcon = (skill: string) => {
    const icons = {
      grammar: '📝',
      reading: '📖',
      writing: '✍️',
      speaking: '🎤',
      listening: '🎧',
      vocabulary: '📚'
    };
    return icons[skill as keyof typeof icons] || '📚';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#10B981';
    if (progress >= 60) return '#3B82F6';
    if (progress >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No analytics available</h2>
          <p className="text-gray-600 mb-4">Start learning to see your progress analytics.</p>
          <button
            onClick={() => router.push('/verbfy-lessons')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <Head>
        <title>Detailed Progress - Verbfy</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Detailed Progress</h1>
              <p className="text-gray-600">
                Comprehensive analytics and insights into your learning journey
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={() => router.push('/personalized-curriculum')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Curriculum
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overallProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.learningStreak.currentStreak} days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🔥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.learningStreak.averageTimePerDay} min/day</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">⏰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.achievements.filter((a: any) => a.earned).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🏆</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skills Radar Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={analytics.skillProgress}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Current Level"
                  dataKey="current"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Target Level"
                  dataKey="target"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Progress Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Statistics */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lessonsCompleted" fill="#3B82F6" name="Lessons" />
                <Bar dataKey="testsPassed" fill="#10B981" name="Tests" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Study Patterns */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Patterns</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Preferred Time</span>
                <span className="text-gray-900">{analytics.studyPatterns.preferredTime}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Average Session</span>
                <span className="text-gray-900">{analytics.studyPatterns.averageSessionLength} minutes</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Most Active Day</span>
                <span className="text-gray-900">{analytics.studyPatterns.mostActiveDay}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Least Active Day</span>
                <span className="text-gray-900">{analytics.studyPatterns.leastActiveDay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Progress Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analytics.skillProgress.map((skill: any) => (
              <div key={skill.skill} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="mr-2">{getSkillIcon(skill.skill)}</span>
                    <span className="capitalize font-medium text-gray-900">{skill.skill}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: getProgressColor(skill.current) }}>
                    {skill.current}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Current</span>
                    <span>Target</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${skill.current}%`,
                        backgroundColor: getProgressColor(skill.current)
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Target: {skill.target}%</span>
                    <span className="text-green-600">+{skill.improvement}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.achievements.map((achievement: any) => (
              <div 
                key={achievement.id} 
                className={`p-4 border rounded-lg ${
                  achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl ${achievement.earned ? 'text-green-600' : 'text-gray-400'}`}>
                    {achievement.earned ? '🏆' : '🔒'}
                  </span>
                  {!achievement.earned && achievement.progress && (
                    <span className="text-xs text-gray-500">
                      {achievement.progress}%
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{achievement.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                {achievement.earned && (
                  <p className="text-xs text-green-600">Earned {achievement.date}</p>
                )}
                {!achievement.earned && achievement.progress && (
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 