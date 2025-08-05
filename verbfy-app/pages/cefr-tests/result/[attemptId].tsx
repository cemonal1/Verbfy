import React from 'react';
import Head from 'next/head';
import { CEFRTestResults } from '../../../src/features/cefrTesting/view/CEFRTestResults';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CEFRTestResultPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const { attemptId } = router.query;

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

  if (!attemptId || typeof attemptId !== 'string') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Invalid attempt ID</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Test Results - Verbfy</title>
        <meta name="description" content="View your CEFR test results and detailed feedback" />
      </Head>

      <CEFRTestResults 
        attemptId={attemptId}
        onRetake={() => {
          // Navigate back to the test
          router.push('/cefr-tests');
        }}
      />
    </>
  );
} 