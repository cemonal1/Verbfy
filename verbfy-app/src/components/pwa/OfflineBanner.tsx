import React from 'react';
import { useOnlineStatus } from '@/utils/pwa';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface OfflineBannerProps {
  onRetry?: () => void;
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  onRetry,
  className = ''
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
    onRetry?.();
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-yellow-500 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            You&apos;re offline. Some features may not be available.
          </span>
        </div>
        
        <button
          onClick={handleRetry}
          className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          <WifiIcon className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;