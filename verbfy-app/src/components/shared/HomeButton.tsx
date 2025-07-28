import React from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';

interface HomeButtonProps {
  className?: string;
  showText?: boolean;
}

const HomeButton: React.FC<HomeButtonProps> = ({ 
  className = '', 
  showText = false 
}) => {
  const { user } = useAuthContext();
  
  // Determine the home destination based on authentication status
  const homeDestination = user ? 
    (user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard') : 
    '/';

  return (
    <>
      {/* Desktop version - shows in header/navbar */}
      <Link
        href={homeDestination}
        className={`hidden lg:flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 ${className}`}
        title={user ? 'Dashboard' : 'Anasayfa'}
      >
        <i className="fas fa-home w-5 h-5 mr-2"></i>
        {showText && <span>{user ? 'Dashboard' : 'Anasayfa'}</span>}
      </Link>

      {/* Mobile version - floating button */}
      <Link
        href={homeDestination}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        title={user ? 'Dashboard' : 'Anasayfa'}
      >
        <span className="text-white text-xl">🏠</span>
      </Link>
    </>
  );
};

export default HomeButton; 