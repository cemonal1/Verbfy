import React from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';

function StudentMessagesPage() {
  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Messages</h1>
          <p className="text-xl text-gray-600">Coming Soon - Communicate with your teachers</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentMessagesPage; 