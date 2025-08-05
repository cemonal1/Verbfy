import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function TeacherEarningsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Earnings</h1>
        <p>Earnings content will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
}

export default TeacherEarningsPage; 