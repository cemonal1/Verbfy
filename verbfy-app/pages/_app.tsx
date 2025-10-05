import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/common/Toast';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AdminProvider } from '@/context/AdminContext';
import { AdminNotificationProvider } from '@/context/AdminNotificationContext';
import '@/styles/globals.css';
import { I18nProvider } from '@/lib/i18n';
import { performanceUtils } from '@/utils/performance';
import { registerServiceWorker, pwaUtils } from '@/utils/pwa';
import { InstallBanner, OfflineBanner } from '@/components/pwa';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Mark app initialization
    performanceUtils.mark('app-init');
    
    // Register service worker for PWA
    registerServiceWorker();
    
    // Request persistent storage for PWA
    pwaUtils.requestPersistentStorage();
    
    // Report navigation timing after load
    const timer = setTimeout(() => {
      const timing = performanceUtils.getNavigationTiming();
      if (timing) {
        console.log('Navigation Timing:', timing);
      }
      
      // Log PWA status
      console.log('PWA Display Mode:', pwaUtils.getDisplayMode());
      console.log('Running as PWA:', pwaUtils.isPWA());
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <ChatProvider>
            <NotificationProvider>
              <AdminProvider>
                <AdminNotificationProvider>
                  <OfflineBanner />
                  <Component {...pageProps} />
                  <InstallBanner />
                </AdminNotificationProvider>
              </AdminProvider>
            </NotificationProvider>
          </ChatProvider>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}