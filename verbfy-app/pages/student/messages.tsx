import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

function StudentMessagesPage() {
  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <p>Messages content will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
}

export default StudentMessagesPage; 