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
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Mark app initialization
    performanceUtils.mark('app-init');
    
    // Unregister any existing service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          console.log('Unregistering service worker:', registration.scope);
          registration.unregister();
        }
      });
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              console.log('Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
          );
        });
      }
    }
    
    // Report navigation timing after load
    const timer = setTimeout(() => {
      const timing = performanceUtils.getNavigationTiming();
      if (timing) {
        console.log('Navigation Timing:', timing);
      }
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
                  <Component {...pageProps} />
                </AdminNotificationProvider>
              </AdminProvider>
            </NotificationProvider>
          </ChatProvider>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}