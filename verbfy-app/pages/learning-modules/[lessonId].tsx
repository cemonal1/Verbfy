import React from 'react';
import Head from 'next/head';
import { StudentLearningInterface } from '../../src/features/learningModules/view/StudentLearningInterface';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function TakeLessonPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const { lessonId } = router.query;

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

  if (!user || typeof lessonId !== 'string') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Take Lesson - Verbfy</title>
        <meta name="description" content="Start your Verbfy learning lesson" />
      </Head>

      <StudentLearningInterface
        lessonId={lessonId}
        onComplete={(result: any) => {
          console.log('Lesson completed:', result);
          // The interface will handle navigation to results
        }}
      />
    </>
  );
} 