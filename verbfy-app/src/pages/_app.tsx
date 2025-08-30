import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ToastProvider } from '../components/common/Toast';
import '../styles/globals.css';
import Head from 'next/head';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <title>Verbfy - English Learning Platform</title>
        <meta name="description" content="Learn English with native speakers through interactive lessons and real-time conversations." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Socket.IO client script */}
        <script
          src="https://cdn.socket.io/4.7.2/socket.io.min.js"
          integrity="sha384-mZLF4UVrpi/QTWPA7BjNPEnkIfRFn5qEOw1W1eMEPNy0I0jnCLshSJC7qj6Jj/Ka"
          crossOrigin="anonymous"
        />
      </Head>
      
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <ChatProvider>
              <Component {...pageProps} />
            </ChatProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
