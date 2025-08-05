import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuditLogViewer from '@/components/audit/AuditLogViewer';

export default function AuditLogPage() {
  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AuditLogViewer />
      </div>
    </DashboardLayout>
  );
} 