import React, { useState, useEffect } from 'react';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types/roles';

interface RoleFormProps {
  role?: Role;
  organizationId: string;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function RoleForm({ role, organizationId, onSubmit, onCancel, loading = false }: RoleFormProps) {
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    type: 'custom',
    parentRoleId: undefined,
    permissions: {
      users: { view: false, create: false, edit: false, delete: false, bulk_operations: false },
      content: { view: false, create: false, edit: false, delete: false, approve: false, publish: false },
      lessons: { view: false, create: false, edit: false, delete: false, assign: false, grade: false },
      analytics: { view: false, export: false, custom_reports: false, system_analytics: false },
      organization: { view_settings: false, edit_settings: false, manage_billing: false, manage_branding: false, manage_integrations: false },
      roles: { view: false, create: false, edit: false, delete: false, assign: false },
      ai: { use_content_generation: false, use_learning_assistant: false, use_analytics: false, manage_ai_settings: false },
      communication: { send_messages: false, create_rooms: false, moderate_chat: false, send_notifications: false },
      financial: { view_payments: false, process_refunds: false, view_reports: false, manage_subscriptions: false },
      system: { view_logs: false, manage_backups: false, system_settings: false, security_settings: false }
    },
    constraints: {
      maxUsers: undefined,
      maxContent: undefined,
      maxStorage: undefined,
      allowedFileTypes: [],
      maxFileSize: undefined,
      sessionTimeout: undefined,
      aiDailyLimit: undefined
    }
  });

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        type: role.type,
        parentRoleId: role.parentRoleId,
        permissions: role.permissions,
        constraints: role.constraints
      });
    }
  }, [role]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (category: string, permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions?.[category as keyof typeof prev.permissions],
          [permission]: value
        }
      }
    }));
  };

  const handleConstraintChange = (constraint: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        [constraint]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const permissionCategories = [
    {
      name: 'users',
      label: 'User Management',
      description: 'Manage users and their accounts',
      permissions: [
        { key: 'view', label: 'View Users' },
        { key: 'create', label: 'Create Users' },
        { key: 'edit', label: 'Edit Users' },
        { key: 'delete', label: 'Delete Users' },
        { key: 'bulk_operations', label: 'Bulk Operations' }
      ]
    },
    {
      name: 'content',
      label: 'Content Management',
      description: 'Manage learning materials and content',
      permissions: [
        { key: 'view', label: 'View Content' },
        { key: 'create', label: 'Create Content' },
        { key: 'edit', label: 'Edit Content' },
        { key: 'delete', label: 'Delete Content' },
        { key: 'approve', label: 'Approve Content' },
        { key: 'publish', label: 'Publish Content' }
      ]
    },
    {
      name: 'lessons',
      label: 'Lesson Management',
      description: 'Manage lessons and learning sessions',
      permissions: [
        { key: 'view', label: 'View Lessons' },
        { key: 'create', label: 'Create Lessons' },
        { key: 'edit', label: 'Edit Lessons' },
        { key: 'delete', label: 'Delete Lessons' },
        { key: 'assign', label: 'Assign Lessons' },
        { key: 'grade', label: 'Grade Lessons' }
      ]
    },
    {
      name: 'analytics',
      label: 'Analytics & Reports',
      description: 'Access to analytics and reporting features',
      permissions: [
        { key: 'view', label: 'View Analytics' },
        { key: 'export', label: 'Export Reports' },
        { key: 'custom_reports', label: 'Create Custom Reports' },
        { key: 'system_analytics', label: 'System Analytics' }
      ]
    },
    {
      name: 'organization',
      label: 'Organization Settings',
      description: 'Manage organization configuration',
      permissions: [
        { key: 'view_settings', label: 'View Settings' },
        { key: 'edit_settings', label: 'Edit Settings' },
        { key: 'manage_billing', label: 'Manage Billing' },
        { key: 'manage_branding', label: 'Manage Branding' },
        { key: 'manage_integrations', label: 'Manage Integrations' }
      ]
    },
    {
      name: 'roles',
      label: 'Role Management',
      description: 'Manage roles and permissions',
      permissions: [
        { key: 'view', label: 'View Roles' },
        { key: 'create', label: 'Create Roles' },
        { key: 'edit', label: 'Edit Roles' },
        { key: 'delete', label: 'Delete Roles' },
        { key: 'assign', label: 'Assign Roles' }
      ]
    },
    {
      name: 'ai',
      label: 'AI Features',
      description: 'Access to AI-powered features',
      permissions: [
        { key: 'use_content_generation', label: 'Use Content Generation' },
        { key: 'use_learning_assistant', label: 'Use Learning Assistant' },
        { key: 'use_analytics', label: 'Use AI Analytics' },
        { key: 'manage_ai_settings', label: 'Manage AI Settings' }
      ]
    },
    {
      name: 'communication',
      label: 'Communication',
      description: 'Manage communication features',
      permissions: [
        { key: 'send_messages', label: 'Send Messages' },
        { key: 'create_rooms', label: 'Create Rooms' },
        { key: 'moderate_chat', label: 'Moderate Chat' },
        { key: 'send_notifications', label: 'Send Notifications' }
      ]
    },
    {
      name: 'financial',
      label: 'Financial Management',
      description: 'Manage financial operations',
      permissions: [
        { key: 'view_payments', label: 'View Payments' },
        { key: 'process_refunds', label: 'Process Refunds' },
        { key: 'view_reports', label: 'View Financial Reports' },
        { key: 'manage_subscriptions', label: 'Manage Subscriptions' }
      ]
    },
    {
      name: 'system',
      label: 'System Administration',
      description: 'System-level administration',
      permissions: [
        { key: 'view_logs', label: 'View Logs' },
        { key: 'manage_backups', label: 'Manage Backups' },
        { key: 'system_settings', label: 'System Settings' },
        { key: 'security_settings', label: 'Security Settings' }
      ]
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System</option>
              <option value="custom">Custom</option>
              <option value="inherited">Inherited</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the role and its purpose..."
            />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Permissions</h3>
        <div className="space-y-6">
          {permissionCategories.map((category) => (
            <div key={category.name} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-900">{category.label}</h4>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${category.name}-${permission.key}`}
                      checked={Boolean((formData.permissions?.[category.name as keyof typeof formData.permissions] as any)?.[permission.key])}
                      onChange={(e) => handlePermissionChange(category.name, permission.key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`${category.name}-${permission.key}`} className="ml-2 text-sm text-gray-700">
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Constraints */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Constraints & Limitations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
            <input
              type="number"
              value={formData.constraints?.maxUsers || ''}
              onChange={(e) => handleConstraintChange('maxUsers', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Content</label>
            <input
              type="number"
              value={formData.constraints?.maxContent || ''}
              onChange={(e) => handleConstraintChange('maxContent', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Storage (GB)</label>
            <input
              type="number"
              value={formData.constraints?.maxStorage || ''}
              onChange={(e) => handleConstraintChange('maxStorage', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
            <input
              type="number"
              value={formData.constraints?.maxFileSize || ''}
              onChange={(e) => handleConstraintChange('maxFileSize', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={formData.constraints?.sessionTimeout || ''}
              onChange={(e) => handleConstraintChange('sessionTimeout', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Daily Limit</label>
            <input
              type="number"
              value={formData.constraints?.aiDailyLimit || ''}
              onChange={(e) => handleConstraintChange('aiDailyLimit', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
} 