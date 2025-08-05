import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function TeacherMaterialsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Teaching Materials</h1>
        <p>Materials content will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
}

export default TeacherMaterialsPage; 