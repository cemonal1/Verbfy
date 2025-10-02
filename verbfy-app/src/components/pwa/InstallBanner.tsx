import React, { useState } from 'react';
import { useInstallPrompt } from '@/utils/pwa';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface InstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({
  onInstall,
  onDismiss,
  className = ''
}) => {
  const { isInstallable, installApp } = useInstallPrompt();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ArrowDownTrayIcon className="h-6 w-6 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Install Verbfy</h3>
            <p className="text-xs opacity-90">
              Add to your home screen for a better experience
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-blue-200 transition-colors"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;