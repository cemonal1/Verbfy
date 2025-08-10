import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import NotificationBadge from '../notification/NotificationBadge';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationPanel from '../notification/NotificationPanel';

interface DashboardLayoutProps {
  children: ReactNode;
  allowedRoles?: ('student' | 'teacher' | 'admin')[];
  title?: string;
}

export default function DashboardLayout({ 
  children, 
  allowedRoles = ['student', 'teacher', 'admin'],
  title = 'Dashboard'
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Check if user has access
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: '🏠',
        current: router.pathname === '/dashboard'
      },
      {
        name: 'Profile',
        href: '/profile',
        icon: '👤',
        current: router.pathname === '/profile'
      },
      {
        name: 'VerbfyTalk',
        href: '/verbfy-talk',
        icon: '🎥',
        current: router.pathname.startsWith('/verbfy-talk')
      },
      {
        name: 'Free Materials',
        href: '/free-materials',
        icon: '📚',
        current: router.pathname.startsWith('/free-materials')
      },
      {
        name: 'Verbfy Lessons',
        href: '/verbfy-lessons',
        icon: '📖',
        current: router.pathname.startsWith('/verbfy-lessons')
      },
      {
        name: 'CEFR Tests',
        href: '/cefr-tests',
        icon: '📝',
        current: router.pathname.startsWith('/cefr-tests')
      },
      {
        name: 'Personalized Curriculum',
        href: '/personalized-curriculum',
        icon: '🎯',
        current: router.pathname.startsWith('/personalized-curriculum')
      },
      {
        name: 'AI Learning Assistant',
        href: '/ai-learning',
        icon: '🤖',
        current: router.pathname.startsWith('/ai-learning')
      },
      {
        name: 'Adaptive Learning',
        href: '/adaptive-learning',
        icon: '🎯',
        current: router.pathname.startsWith('/adaptive-learning')
      },
      {
        name: 'AI Content Generation',
        href: '/ai-content-generation',
        icon: '✨',
        current: router.pathname.startsWith('/ai-content-generation')
      },
      {
        name: 'Chat',
        href: '/chat',
        icon: '💬',
        current: router.pathname.startsWith('/chat')
      },
      {
        name: 'Materials',
        href: '/materials',
        icon: '📁',
        current: router.pathname.startsWith('/materials')
      },
      {
        name: 'Payments',
        href: '/payment',
        icon: '💳',
        current: router.pathname.startsWith('/payment')
      }
    ];

    // Add role-specific items
    if (user.role === 'student') {
      baseItems.splice(1, 0, {
        name: 'My Lessons',
        href: '/lessons',
        icon: '📖',
        current: router.pathname === '/lessons'
      });
      baseItems.splice(2, 0, {
        name: 'Find Teachers',
        href: '/teachers',
        icon: '👨‍🏫',
        current: router.pathname === '/teachers'
      });
    }

    if (user.role === 'teacher') {
      baseItems.splice(1, 0, {
        name: 'My Students',
        href: '/students',
        icon: '👥',
        current: router.pathname === '/students'
      });
      baseItems.splice(2, 0, {
        name: 'Schedule',
        href: '/schedule',
        icon: '📅',
        current: router.pathname === '/schedule'
      });
      baseItems.splice(3, 0, {
        name: 'Earnings',
        href: '/earnings',
        icon: '💰',
        current: router.pathname === '/earnings'
      });
      baseItems.splice(4, 0, {
        name: 'Advanced Analytics',
        href: '/teacher/analytics-advanced',
        icon: '📊',
        current: router.pathname === '/teacher/analytics-advanced'
      });
    }

    if (user.role === 'admin') {
      baseItems.splice(1, 0, {
        name: 'Users',
        href: '/admin/users',
        icon: '👥',
        current: router.pathname === '/admin/users'
      });
      baseItems.splice(2, 0, {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: '📊',
        current: router.pathname === '/admin/analytics'
      });
      baseItems.splice(3, 0, {
        name: 'Settings',
        href: '/admin/settings',
        icon: '⚙️',
        current: router.pathname === '/admin/settings'
      });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <NotificationProvider>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">📚</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Verbfy</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${item.current
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3 text-lg" aria-hidden>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur dark:bg-gray-800/80 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationBadge 
                onClick={() => setNotificationPanelOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="pt-4 pb-6 sm:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />
      </NotificationProvider>
    </div>
  );
} 