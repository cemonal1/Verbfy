import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function TeacherAnalyticsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Analytics</h1>
        <p>Analytics content will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
}

export default TeacherAnalyticsPage; 