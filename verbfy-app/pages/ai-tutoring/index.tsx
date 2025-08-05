import React from 'react';
import Head from 'next/head';
import { AITutoringInterface } from '../../src/features/aiFeatures/view/AITutoringInterface';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AITutoringPage() {
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
        <title>AI Tutoring - Verbfy</title>
        <meta name="description" content="Start your AI-powered English tutoring session" />
      </Head>

      <AITutoringInterface
        sessionType="conversation"
        onComplete={(session) => {
          console.log('AI session completed:', session);
          router.push(`/ai-tutoring/session/${session._id}/results`);
        }}
      />
    </>
  );
} 