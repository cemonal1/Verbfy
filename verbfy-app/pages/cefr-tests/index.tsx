import React from 'react';
import Head from 'next/head';
import { CEFRTestList } from '../../src/features/cefrTesting/view/CEFRTestList';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CEFRTestsPage() {
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

  return (
    <>
      <Head>
        <title>CEFR Tests - Verbfy</title>
        <meta name="description" content="Take CEFR-aligned English proficiency tests to assess your skills" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CEFR Tests</h1>
            <p className="text-gray-600">
              Assess your English proficiency with our comprehensive CEFR-aligned tests
            </p>
          </div>

          {/* Test List */}
          <CEFRTestList />
        </div>
      </div>
    </>
  );
} 