import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminMaterialsPage() {
  return (
    <DashboardLayout allowedRoles={['admin']} title="Admin Materials">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Materials Management</h1>
        <p className="text-gray-600">Materials management interface will be implemented here.</p>
      </div>
    </DashboardLayout>
  );
}


