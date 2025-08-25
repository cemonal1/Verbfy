import React from 'react';
import { CEFRTestResults } from '../../../src/features/cefrTesting/view/CEFRTestResults';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/router';

export default function CEFRTestResultPage() {
  const router = useRouter();
  const { attemptId } = router.query;

  if (!attemptId || typeof attemptId !== 'string') {
    return (
      <DashboardLayout title="Invalid Attempt">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Invalid attempt ID</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Test Results">
      <CEFRTestResults 
        attemptId={attemptId}
        onRetake={() => {
          // Navigate back to the test
          router.push('/cefr-tests');
        }}
      />
    </DashboardLayout>
  );
} 