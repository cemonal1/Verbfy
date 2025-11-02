import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (hasRedirectedRef.current) return;

    if (!loading) {
      hasRedirectedRef.current = true;
      if (user) {
        // Authenticated users -> dashboard
        const dashboardPath = user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard';
        router.replace(dashboardPath);
      } else {
        // Unauthenticated users -> landing
        router.replace('/landing');
      }
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Yönlendiriliyor...</p>
      </div>
    </div>
  );
}