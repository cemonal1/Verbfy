import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { useLogoutViewModel } from '@/features/auth/viewmodel/useLogoutViewModel';
import HomeButton from '@/components/shared/HomeButton';
import LandingPageButton from '@/components/shared/LandingPageButton';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, allowedRoles }) => {
  const { user, loading: authLoading } = useAuthContext();
  const { logout } = useLogoutViewModel();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);

  // Show loading spinner while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    router.replace('/login');
    return null;
  }

  // Redirect if role not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    router.replace('/unauthorized');
    return null;
  }

  const studentNavItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: 'fas fa-home' },
    { name: 'Book Lessons', href: '/student/reserve', icon: 'fas fa-calendar-plus' },
    { name: 'My Lessons', href: '/student/reservations', icon: 'fas fa-calendar-check' },
    { name: 'Study Materials', href: '/student/materials', icon: 'fas fa-book' },
    { name: 'Conversation Rooms', href: '/student/conversation', icon: 'fas fa-comments' },
    { name: 'Progress', href: '/student/progress', icon: 'fas fa-chart-line' },
    { name: 'Messages', href: '/student/messages', icon: 'fas fa-envelope' },
  ];

  const teacherNavItems = [
    { name: 'Dashboard', href: '/teacher/dashboard', icon: 'fas fa-home' },
    { name: 'My Students', href: '/teacher/students', icon: 'fas fa-graduation-cap' },
    { name: 'Availability', href: '/teacher/availability', icon: 'fas fa-calendar' },
    { name: 'Reservations', href: '/teacher/reservations', icon: 'fas fa-calendar-check' },
    { name: 'Teaching Materials', href: '/teacher/materials', icon: 'fas fa-book' },
    { name: 'Earnings', href: '/teacher/earnings', icon: 'fas fa-dollar-sign' },
    { name: 'Analytics', href: '/teacher/analytics', icon: 'fas fa-chart-bar' },
    { name: 'Messages', href: '/teacher/messages', icon: 'fas fa-comments' },
  ];

  const navItems = user.role === 'student' ? studentNavItems : teacherNavItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-language text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold text-gray-900">Verbfy</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-sm ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <i className={`${item.icon} w-5 h-5 mr-3`}></i>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings Section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Settings
            </div>
            <Link href="/profile" className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200">
              <i className="fas fa-user-cog w-5 h-5 mr-3"></i>
              Account Settings
            </Link>
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 w-full text-left"
            >
              <i className="fas fa-sign-out-alt w-5 h-5 mr-3"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all duration-200"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Home Button */}
              <HomeButton />

              {/* Landing Page Button */}
              <LandingPageButton />

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <i className="fas fa-bell text-xl"></i>
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                )}
              </button>

              {/* Language/Global */}
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <i className="fas fa-globe text-xl"></i>
              </button>

              {/* User Profile */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white text-sm"></i>
                    </div>
                    <div className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Home Button - Floating */}
      <div className="lg:hidden">
        <HomeButton />
        <LandingPageButton />
      </div>
    </div>
  );
};

export default DashboardLayout; 