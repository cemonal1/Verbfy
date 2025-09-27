import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import TeacherApprovalSection from '@/components/admin/TeacherApprovalSection';

interface AdminStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalReservations: number;
  totalMaterials: number;
  activeLessons: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'lesson_booking' | 'material_upload';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'admin') {
        router.replace('/unauthorized');
      } else {
        fetchAdminData();
      }
    }
  }, [user, loading, router]);

  const fetchAdminData = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch admin statistics
      const statsResponse = await api.get('/api/admin/stats');
      setStats(statsResponse.data);
      
      // Fetch recent activities
      const activitiesResponse = await api.get('/api/admin/activities');
      setRecentActivities(activitiesResponse.data.activities || []);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <DashboardLayout allowedRoles={['admin']}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['admin']}>
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard 🛡️
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Welcome back, {user?.name}! Manage your platform with full administrative control.
            </p>
            <div className="flex items-center mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                🔧 Administrator
              </span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-red-100 dark:from-purple-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-shield-alt text-4xl text-purple-600 dark:text-purple-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-users text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-chalkboard-teacher text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Teachers</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalTeachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-graduate text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-check text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reservations</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalReservations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-alt text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Materials</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMaterials}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <i className="fas fa-video text-white"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Lessons</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activeLessons}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Teacher Approval Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Teacher Approval Requests</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and approve new teacher applications</p>
        </div>
        <div className="p-6">
          <TeacherApprovalSection />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activities</h2>
        </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <i className="fas fa-info text-blue-600 dark:text-blue-400"></i>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                      {activity.user && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          by {activity.user.name} ({activity.user.email})
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-info-circle text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            )}
          </div>
        </div>
    </DashboardLayout>
  );
} 