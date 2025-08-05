import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PerformanceDashboard from '@/components/performance/PerformanceDashboard';

export default function PerformanceMonitoringPage() {
  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PerformanceDashboard />
      </div>
    </DashboardLayout>
  );
} 