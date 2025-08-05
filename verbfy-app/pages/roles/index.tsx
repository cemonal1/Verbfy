import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleList from '@/components/roles/RoleList';
import RoleForm from '@/components/roles/RoleForm';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types/roles';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

type ViewMode = 'list' | 'create' | 'edit';

export default function RoleManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>(''); // This should come from user context or props

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setViewMode('edit');
  };

  const handleCreateNew = () => {
    setSelectedRole(undefined);
    setViewMode('create');
  };

  const handleBackToList = () => {
    setSelectedRole(undefined);
    setViewMode('list');
  };

  const handleCreateRole = async (data: CreateRoleRequest | UpdateRoleRequest) => {
    try {
      setLoading(true);
      const response = await api.post(`/api/roles/${organizationId}`, data);
      toastSuccess('Role created successfully!');
      setViewMode('list');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (data: CreateRoleRequest | UpdateRoleRequest) => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/roles/${selectedRole._id}`, data);
      toastSuccess('Role updated successfully!');
      setViewMode('list');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setViewMode('list');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <RoleList
            organizationId={organizationId}
            onSelectRole={handleSelectRole}
            onCreateNew={handleCreateNew}
          />
        );

      case 'create':
        return (
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Roles
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Create Role</h1>
              </div>
            </div>

            {/* Form Content */}
            <RoleForm
              organizationId={organizationId}
              onSubmit={handleCreateRole}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        );

      case 'edit':
        return (
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToList}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Roles
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
              </div>
            </div>

            {/* Form Content */}
            <RoleForm
              role={selectedRole}
              organizationId={organizationId}
              onSubmit={handleUpdateRole}
              onCancel={handleCancelForm}
              loading={loading}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
} 