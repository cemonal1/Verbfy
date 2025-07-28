import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';

function StudentMaterialsPage() {
  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Study Materials</h1>
          <p className="text-xl text-gray-600">Coming Soon - Access learning materials and resources</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentMaterialsPage; 