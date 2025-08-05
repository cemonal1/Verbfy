import React, { useState, useEffect } from 'react';
import { Organization, CreateOrganizationRequest, UpdateOrganizationRequest } from '@/types/organization';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationRequest | UpdateOrganizationRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function OrganizationForm({ organization, onSubmit, onCancel, loading = false }: OrganizationFormProps) {
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    type: 'school',
    contact: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      }
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      theme: 'light',
      language: 'en',
      timezone: 'UTC'
    },
    subscription: {
      plan: 'free',
      maxUsers: 10,
      maxStorage: 1,
      features: ['basic_features'],
      billingCycle: 'monthly'
    },
    settings: {
      allowUserRegistration: true,
      requireEmailVerification: true,
      requireAdminApproval: false,
      allowFileUploads: true,
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      sessionTimeout: 480,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      aiFeatures: {
        enabled: true,
        dailyLimit: 100,
        modelAccess: ['gpt-3.5-turbo']
      }
    }
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        type: organization.type,
        contact: organization.contact,
        branding: organization.branding,
        subscription: organization.subscription,
        settings: organization.settings
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        address: {
          street: prev.contact.address?.street || '',
          city: prev.contact.address?.city || '',
          state: prev.contact.address?.state || '',
          country: prev.contact.address?.country || '',
          postalCode: prev.contact.address?.postalCode || '',
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
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
              Organization Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="school">School</option>
              <option value="university">University</option>
              <option value="language_center">Language Center</option>
              <option value="corporate">Corporate</option>
              <option value="individual">Individual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Address */}
        <div className="mt-4">
          <h4 className="text-md font-medium mb-3">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                value={formData.contact.address?.street || ''}
                onChange={(e) => handleAddressChange('street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.contact.address?.city || ''}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
              <input
                type="text"
                value={formData.contact.address?.state || ''}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.contact.address?.country || ''}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP/Postal Code</label>
              <input
                type="text"
                value={formData.contact.address?.postalCode || ''}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
            <input
              type="color"
              value={formData.branding?.primaryColor || '#3B82F6'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                branding: { ...prev.branding, primaryColor: e.target.value }
              }))}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
            <input
              type="color"
              value={formData.branding?.secondaryColor || '#1F2937'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                branding: { ...prev.branding, secondaryColor: e.target.value }
              }))}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <select
              value={formData.branding?.theme || 'light'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                branding: { ...prev.branding, theme: e.target.value as 'light' | 'dark' | 'auto' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={formData.branding?.language || 'en'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                branding: { ...prev.branding, language: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Subscription</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
            <select
              value={formData.subscription?.plan || 'free'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, plan: e.target.value as 'free' | 'basic' | 'professional' | 'enterprise' | 'custom' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
            <input
              type="number"
              value={formData.subscription?.maxUsers || 10}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, maxUsers: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Storage (GB)</label>
            <input
              type="number"
              value={formData.subscription?.maxStorage || 1}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, maxStorage: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Cycle</label>
            <select
              value={formData.subscription?.billingCycle || 'monthly'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                subscription: { ...prev.subscription, billingCycle: e.target.value as 'monthly' | 'yearly' | 'custom' }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow User Registration</label>
              <p className="text-sm text-gray-500">Allow new users to register themselves</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings?.allowUserRegistration || true}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, allowUserRegistration: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
              <p className="text-sm text-gray-500">Require email verification for new accounts</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings?.requireEmailVerification || true}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, requireEmailVerification: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow File Uploads</label>
              <p className="text-sm text-gray-500">Allow users to upload files</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings?.allowFileUploads || true}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, allowFileUploads: e.target.checked }
              }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
            <input
              type="number"
              value={formData.settings?.maxFileSize || 10}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, maxFileSize: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <input
              type="number"
              value={formData.settings?.sessionTimeout || 480}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: { ...prev.settings, sessionTimeout: parseInt(e.target.value) }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="15"
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
          {loading ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
} 