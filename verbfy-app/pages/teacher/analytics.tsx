import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';

function TeacherAnalyticsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Analytics & Insights</h1>
          <p className="text-xl text-gray-600">Coming Soon - Track your teaching performance and student progress</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherAnalyticsPage; 