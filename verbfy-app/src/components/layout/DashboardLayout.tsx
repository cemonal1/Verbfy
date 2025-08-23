import React, { useState, ReactNode, useEffect } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/shared/BrandLogo';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import NotificationBadge from '../notification/NotificationBadge';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationPanel from '../notification/NotificationPanel';
import { useI18n } from '@/lib/i18n';

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
  const { user, logout, isLoading } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { success } = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);

  // Prevent browser back button from going to login page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Allow page refresh but prevent navigation away
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = (e: PopStateEvent) => {
      // If user tries to go back and we're on a protected page, prevent it
      if (user && !isLoading) {
        e.preventDefault();
        // Push current route to history to prevent back navigation
        window.history.pushState(null, '', router.asPath);
        
        // Show warning toast
        success('Back button is disabled for security');
      }
    };

    if (user && !isLoading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      
      // Push current route to history to prevent back navigation
      window.history.pushState(null, '', router.asPath);
      
      // Add more history entries to make back navigation harder
      window.history.pushState(null, '', router.asPath);
      window.history.pushState(null, '', router.asPath);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, isLoading, router.asPath, success]);

  // While auth is loading, render a lightweight loader instead of Access Denied
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user has access after loading
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
        name: t('nav.dashboard','Dashboard'),
        href: '/dashboard',
        icon: '🏠',
        current: router.pathname === '/dashboard'
      },
        {
          name: 'Placement',
          href: '/placement',
          icon: '🧭',
          current: router.pathname.startsWith('/placement')
        },
        {
          name: 'VerbfyGames',
          href: '/verbfy-games',
          icon: '🎮',
          current: router.pathname.startsWith('/verbfy-games')
        },
      {
        name: t('nav.profile','Profile'),
        href: '/profile',
        icon: '👤',
        current: router.pathname === '/profile'
      },
      {
        name: t('nav.verbfytalk','VerbfyTalk'),
        href: '/verbfy-talk',
        icon: '🎥',
        current: router.pathname.startsWith('/verbfy-talk')
      },
      {
        name: t('nav.freeMaterials','Free Materials'),
        href: '/free-materials',
        icon: '📚',
        current: router.pathname.startsWith('/free-materials')
      },
      {
        name: t('nav.verbfyLessons','Verbfy Lessons'),
        href: '/verbfy-lessons',
        icon: '📖',
        current: router.pathname.startsWith('/verbfy-lessons')
      },
      {
        name: t('nav.cefrTests','CEFR Tests'),
        href: '/cefr-tests',
        icon: '📝',
        current: router.pathname.startsWith('/cefr-tests')
      },
      {
        name: t('nav.curriculum','Personalized Curriculum'),
        href: '/personalized-curriculum',
        icon: '🎯',
        current: router.pathname.startsWith('/personalized-curriculum')
      },
      {
        name: t('nav.aiLearning','AI Learning Assistant'),
        href: '/ai-learning',
        icon: '🤖',
        current: router.pathname.startsWith('/ai-learning')
      },
      {
        name: t('nav.adaptive','Adaptive Learning'),
        href: '/adaptive-learning',
        icon: '🎯',
        current: router.pathname.startsWith('/adaptive-learning')
      },
      {
        name: t('nav.aiContent','AI Content Generation'),
        href: '/ai-content-generation',
        icon: '✨',
        current: router.pathname.startsWith('/ai-content-generation')
      },
      {
        name: t('nav.chat','Chat'),
        href: '/chat',
        icon: '💬',
        current: router.pathname.startsWith('/chat')
      },
      {
        name: t('nav.materials','Materials'),
        href: '/materials',
        icon: '📁',
        current: router.pathname.startsWith('/materials')
      },
      {
        name: t('nav.payments','Payments'),
        href: '/payment',
        icon: '💳',
        current: router.pathname.startsWith('/payment')
      }
    ];

    // Add role-specific items
    if (user.role === 'student') {
      baseItems.splice(1, 0, {
        name: t('student.myLessons','My Lessons'),
        href: '/lessons',
        icon: '📖',
        current: router.pathname === '/lessons'
      });
      baseItems.splice(2, 0, {
        name: t('student.findTeachers','Find Teachers'),
        href: '/teachers',
        icon: '👨‍🏫',
        current: router.pathname === '/teachers'
      });
    }

    if (user.role === 'teacher') {
      baseItems.splice(1, 0, {
        name: t('teacher.myStudents','My Students'),
        href: '/students',
        icon: '👥',
        current: router.pathname === '/students'
      });
      baseItems.splice(2, 0, {
        name: t('teacher.schedule','Schedule'),
        href: '/schedule',
        icon: '📅',
        current: router.pathname === '/schedule'
      });
      baseItems.splice(3, 0, {
        name: t('teacher.earnings','Earnings'),
        href: '/earnings',
        icon: '💰',
        current: router.pathname === '/earnings'
      });
      baseItems.splice(4, 0, {
        name: t('teacher.analyticsAdvanced','Advanced Analytics'),
        href: '/teacher/analytics-advanced',
        icon: '📊',
        current: router.pathname === '/teacher/analytics-advanced'
      });
    }

    if (user.role === 'admin') {
      baseItems.splice(1, 0, {
        name: t('admin.users','Users'),
        href: '/admin/users',
        icon: '👥',
        current: router.pathname === '/admin/users'
      });
      baseItems.splice(2, 0, {
        name: t('admin.analytics','Analytics'),
        href: '/admin/analytics',
        icon: '📊',
        current: router.pathname === '/admin/analytics'
      });
      baseItems.splice(3, 0, {
        name: t('admin.settings','Settings'),
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <NotificationProvider>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - optimized width */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <BrandLogo size={44} withTitle={false} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${item.current
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <span className="mr-3 text-lg" aria-hidden>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
      <div className="lg:pl-56 h-full bg-gray-50 dark:bg-gray-900 grid grid-rows-[auto,1fr]">
        {/* Top bar */}
        <div className="z-30 bg-white/80 backdrop-blur dark:bg-gray-800/80 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-12 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title - reduced size */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="hidden sm:block text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Verbing Up Your Language Skills!</p>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Language toggle */}
              <button
                onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
                className="px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle language"
                title={locale === 'en' ? 'Türkçe' : 'English'}
              >
                {locale === 'en' ? 'TR' : 'EN'}
              </button>
              <NotificationBadge 
                onClick={() => setNotificationPanelOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="overflow-y-auto min-h-0 overscroll-contain">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {children}
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