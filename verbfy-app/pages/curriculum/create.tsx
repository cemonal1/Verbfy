import React from 'react';
import Head from 'next/head';
import { CurriculumCreationTool } from '../../src/features/personalizedCurriculum/view/CurriculumCreationTool';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function CurriculumCreationPage() {
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
        <title>Create Curriculum - Verbfy</title>
        <meta name="description" content="Create your personalized English learning curriculum" />
      </Head>

      <CurriculumCreationTool />
    </>
  );
} 