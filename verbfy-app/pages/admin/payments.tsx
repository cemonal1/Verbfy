import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminPaymentsPage() {
  return (
    <DashboardLayout allowedRoles={['admin']} title="Admin Payments">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Payments Management</h1>
        <p className="text-gray-600">Payments management interface will be implemented here.</p>
      </div>
    </DashboardLayout>
  );
}


