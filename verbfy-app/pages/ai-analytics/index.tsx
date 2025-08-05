import React from 'react';
import Head from 'next/head';
import { AIAnalyticsDashboard } from '../../src/features/aiFeatures/view/AIAnalyticsDashboard';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AIAnalyticsPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only allow teachers and admins to access this page
  if (user.role !== 'teacher' && user.role !== 'admin') {
    router.push('/unauthorized');
    return null;
  }

  return (
    <>
      <Head>
        <title>AI Analytics - Verbfy</title>
        <meta name="description" content="Comprehensive AI performance analytics and insights" />
      </Head>

      <AIAnalyticsDashboard userRole={user.role as 'admin' | 'teacher'} />
    </>
  );
} 