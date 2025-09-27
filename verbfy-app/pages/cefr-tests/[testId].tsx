import React from 'react';
import { CEFRTestInterface } from '../../src/features/cefrTesting/view/CEFRTestInterface';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRouter } from 'next/router';

export default function CEFRTestPage() {
  const router = useRouter();
  const { testId } = router.query;

  if (!testId || typeof testId !== 'string') {
    return (
      <DashboardLayout title="Invalid Test">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Invalid test ID</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="CEFR Test">
      <CEFRTestInterface 
        testId={testId}
        onComplete={(result: any) => {
          console.log('Test completed:', result);
          // The interface will handle navigation to results
        }}
      />
    </DashboardLayout>
  );
} 