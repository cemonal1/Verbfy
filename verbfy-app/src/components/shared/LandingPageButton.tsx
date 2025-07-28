import React from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';

interface LandingPageButtonProps {
  className?: string;
  showText?: boolean;
}

const LandingPageButton: React.FC<LandingPageButtonProps> = ({ 
  className = '', 
  showText = false 
}) => {
  const { user } = useAuthContext();
  
  // Link to the public landing page
  const landingPageUrl = '/landing';

  return (
    <>
      {/* Desktop version */}
      <Link
        href={landingPageUrl}
        className={`hidden lg:flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 ${className}`}
        title="Landing Page"
      >
        <i className="fas fa-external-link-alt w-5 h-5 mr-2"></i>
        {showText && <span>Landing Page</span>}
      </Link>

      {/* Mobile version - smaller floating button */}
      <Link
        href={landingPageUrl}
        className="lg:hidden fixed bottom-6 right-20 z-50 w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        title="Landing Page"
      >
        <i className="fas fa-external-link-alt text-white text-sm"></i>
      </Link>
    </>
  );
};

export default LandingPageButton; 