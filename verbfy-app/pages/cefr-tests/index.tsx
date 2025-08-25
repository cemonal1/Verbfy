import React from 'react';
import Head from 'next/head';
import { CEFRTestList } from '../../src/features/cefrTesting/view/CEFRTestList';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CEFRTestsPage() {

  return (
    <DashboardLayout title="CEFR Tests">
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
    </DashboardLayout>
  );
} 