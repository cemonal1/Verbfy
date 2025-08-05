import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function TeacherStudentsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Students</h1>
        <p>Students content will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
}

export default TeacherStudentsPage; 