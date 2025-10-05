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

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  cache: {
    status: 'connected' | 'disconnected';
    memoryUsage: number;
  };
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'multiple_failures';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  details?: any;
}

export default function AdminDashboard() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loadingHealth, setLoadingHealth] = useState(true);

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
      setLoadingHealth(true);
      
      // Fetch admin statistics
      const statsResponse = await api.get('/api/admin/stats');
      setStats(statsResponse.data);
      
      // Fetch recent activities
      const activitiesResponse = await api.get('/api/admin/activities');
      setRecentActivities(activitiesResponse.data.activities || []);
      
      // Fetch system health
      try {
        const healthResponse = await api.get('/api/admin/system/health');
        setSystemHealth(healthResponse.data);
      } catch (healthError) {
        console.error('Error fetching system health:', healthError);
      }
      
      // Fetch security alerts
      try {
        const alertsResponse = await api.get('/api/admin/system/security-alerts?limit=5');
        setSecurityAlerts(alertsResponse.data.alerts || []);
      } catch (alertsError) {
        console.error('Error fetching security alerts:', alertsError);
      }
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoadingStats(false);
      setLoadingHealth(false);
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

      {/* System Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <i className="fas fa-heartbeat mr-2 text-red-500"></i>
              System Health
            </h2>
          </div>
          <div className="p-6">
            {loadingHealth ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : systemHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemHealth.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    systemHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {systemHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Database</div>
                    <div className={`text-lg font-semibold ${
                      systemHealth.database.status === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {systemHealth.database.responseTime}ms
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Memory</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round(systemHealth.memoryUsage)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Unable to load system health</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <i className="fas fa-bolt mr-2 text-yellow-500"></i>
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/admin/users')}
                className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <i className="fas fa-users text-blue-600 dark:text-blue-400 text-xl mb-2"></i>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Manage Users</span>
              </button>
              <button
                onClick={() => router.push('/admin/materials')}
                className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <i className="fas fa-file-alt text-green-600 dark:text-green-400 text-xl mb-2"></i>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Materials</span>
              </button>
              <button
                onClick={() => router.push('/admin/payments')}
                className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <i className="fas fa-credit-card text-purple-600 dark:text-purple-400 text-xl mb-2"></i>
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Payments</span>
              </button>
              <button
                onClick={() => router.push('/admin/logs')}
                className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
              >
                <i className="fas fa-list-alt text-orange-600 dark:text-orange-400 text-xl mb-2"></i>
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <i className="fas fa-shield-alt mr-2 text-red-500"></i>
              Security Alerts
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                {securityAlerts.length}
              </span>
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {securityAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'high' ? 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-500' :
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500' :
                  'bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.severity === 'high' ? 'text-red-800 dark:text-red-200' :
                        alert.severity === 'medium' ? 'text-yellow-800 dark:text-yellow-200' :
                        'text-blue-800 dark:text-blue-200'
                      }`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {securityAlerts.length > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/admin/security')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                >
                  View all {securityAlerts.length} alerts →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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