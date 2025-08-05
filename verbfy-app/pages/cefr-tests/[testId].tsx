import React from 'react';
import Head from 'next/head';
import { CEFRTestInterface } from '../../src/features/cefrTesting/view/CEFRTestInterface';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CEFRTestPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const { testId } = router.query;

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

  if (!testId || typeof testId !== 'string') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Invalid test ID</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Taking CEFR Test - Verbfy</title>
        <meta name="description" content="Complete your CEFR English proficiency test" />
      </Head>

      <CEFRTestInterface 
        testId={testId}
        onComplete={(result: any) => {
          console.log('Test completed:', result);
          // The interface will handle navigation to results
        }}
      />
    </>
  );
} 