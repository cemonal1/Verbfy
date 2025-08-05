import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider, setToastContext } from '@/components/common/Toast';
import { ChatProvider } from '@/context/ChatContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AdminProvider } from '@/context/AdminContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ChatProvider>
          <NotificationProvider>
            <AdminProvider>
              <Component {...pageProps} />
            </AdminProvider>
          </NotificationProvider>
        </ChatProvider>
      </ToastProvider>
    </AuthProvider>
  );
} 