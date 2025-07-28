import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';

function TeacherMaterialsPage() {
  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Teaching Materials</h1>
          <p className="text-xl text-gray-600">Coming Soon - Manage and upload your teaching materials</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherMaterialsPage; 