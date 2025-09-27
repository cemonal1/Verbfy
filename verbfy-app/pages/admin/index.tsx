import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRoleGuard } from '../../src/hooks/useAuth';
import { useAdmin } from '../../src/context/AdminContext';
import AdminSidebar from '../../src/components/admin/AdminSidebar';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../../src/types/admin';

export default function AdminDashboard() {
  useRoleGuard(['admin']);

  const { state, loadOverview } = useAdmin();
  const { overview, overviewLoading, overviewError } = state;

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const stats = [
    {
      name: 'Total Users',
      value: overview?.stats.totalUsers || 0,
      icon: UsersIcon,
      change: overview?.stats.userGrowth || 0,
      changeType: 'percentage'
    },
    {
      name: 'Teachers',
      value: overview?.stats.totalTeachers || 0,
      icon: AcademicCapIcon,
      change: 0,
      changeType: 'number'
    },
    {
      name: 'Students',
      value: overview?.stats.totalStudents || 0,
      icon: UserGroupIcon,
      change: 0,
      changeType: 'number'
    },
    {
      name: 'Materials',
      value: overview?.stats.totalMaterials || 0,
      icon: DocumentTextIcon,
      change: 0,
      changeType: 'number'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(overview?.stats.totalRevenue || 0),
      icon: CurrencyDollarIcon,
      change: overview?.stats.revenueGrowth || 0,
      changeType: 'percentage'
    },
    {
      name: 'Lessons',
      value: overview?.stats.totalReservations || 0,
      icon: ClockIcon,
      change: 0,
      changeType: 'number'
    }
  ];

  // Error state
  if (overviewError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar className="w-64" />
        <div className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{overviewError}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => loadOverview()}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (overviewLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar className="w-64" />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Platform overview and management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.change >= 0;
              
              return (
                <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  
                  {stat.change !== 0 && (
                    <div className="mt-4 flex items-center">
                      {isPositive ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{stat.change}
                        {stat.changeType === 'percentage' ? '%' : ''}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              </div>
              <div className="p-6">
                {overview?.recent.users && overview.recent.users.length > 0 ? (
                  <div className="space-y-4">
                    {overview.recent.users.map((user) => (
                      <div key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent users</p>
                )}
              </div>
            </div>

            {/* Recent Materials */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Materials</h3>
              </div>
              <div className="p-6">
                {overview?.recent.materials && overview.recent.materials.length > 0 ? (
                  <div className="space-y-4">
                    {overview.recent.materials.map((material) => (
                      <div key={material._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                            <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{material.title}</p>
                            <p className="text-sm text-gray-500">by {material.uploaderId.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.status === 'approved' ? 'bg-green-100 text-green-800' :
                            material.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {material.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(material.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent materials</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 