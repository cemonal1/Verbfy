import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrganizationList from '@/components/organization/OrganizationList';
import OrganizationDashboard from '@/components/organization/OrganizationDashboard';
import OrganizationForm from '@/components/organization/OrganizationForm';
import { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '@/types/organization';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

type ViewMode = 'list' | 'dashboard' | 'create' | 'edit';

export default function OrganizationManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSelectOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setViewMode('dashboard');
  };

  const handleCreateNew = () => {
    setSelectedOrganization(undefined);
    setViewMode('create');
  };

  const handleEditOrganization = () => {
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setSelectedOrganization(undefined);
    setViewMode('list');
  };

  const handleCreateOrganization = async (data: CreateOrganizationRequest | UpdateOrganizationRequest) => {
    try {
      setLoading(true);
      const response = await api.post('/api/organizations', data);
      toastSuccess('Organization created successfully!');
      setSelectedOrganization(response.data.data);
      setViewMode('dashboard');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: CreateOrganizationRequest | UpdateOrganizationRequest) => {
    if (!selectedOrganization) return;

    try {
      setLoading(true);
      const response = await api.put(`/api/organizations/${selectedOrganization._id}`, data);
      toastSuccess('Organization updated successfully!');
      setSelectedOrganization(response.data.data);
      setViewMode('dashboard');
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    if (selectedOrganization) {
      setViewMode('dashboard');
    } else {
      setViewMode('list');
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <OrganizationList
            onSelectOrganization={handleSelectOrganization}
            onCreateNew={handleCreateNew}
          />
        );

      case 'dashboard':
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
                  Back to Organizations
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleEditOrganization}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Edit Organization
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            <OrganizationDashboard organizationId={selectedOrganization?._id} />
          </div>
        );

      case 'create':
        return (
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancelForm}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Organizations
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
              </div>
            </div>

            {/* Form Content */}
            <OrganizationForm
              onSubmit={handleCreateOrganization}
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
                  onClick={handleCancelForm}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>
              </div>
            </div>

            {/* Form Content */}
            <OrganizationForm
              organization={selectedOrganization}
              onSubmit={handleUpdateOrganization}
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