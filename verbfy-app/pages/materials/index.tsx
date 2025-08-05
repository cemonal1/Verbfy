import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth, useRoleGuard } from '@/context/AuthContext';
import { useCanUploadMaterials, useCanManageMaterials } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UploadComponent from '@/components/materials/Upload';
import ListComponent from '@/components/materials/List';
import PreviewComponent from '@/components/materials/Preview';
import { Material } from '@/types/materials';

export default function MaterialsPage() {
  const { user } = useAuth();
  const { hasAccess, isLoading } = useRoleGuard(['student', 'teacher', 'admin']);
  const canUpload = useCanUploadMaterials();
  const canManage = useCanManageMaterials();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    tags: '',
    search: '',
    isPublic: ''
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the materials page.
          </p>
        </div>
      </div>
    );
  }

  const handleMaterialSelect = (material: Material) => {
    setSelectedMaterial(material);
    setShowPreview(true);
  };

  const handleUploadSuccess = (newMaterial: Material) => {
    setMaterials(prev => [newMaterial, ...prev]);
  };

  const handleMaterialDelete = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m._id !== materialId));
  };

  return (
    <>
      <Head>
        <title>Materials - Verbfy</title>
        <meta name="description" content="Learning materials and resources" />
      </Head>

      <DashboardLayout 
        allowedRoles={['student', 'teacher', 'admin']}
        title="Learning Materials"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Learning Materials
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Access and manage educational resources for your English learning journey
            </p>
          </div>

          {/* Upload Section - Only for teachers and admins */}
          {canUpload && (
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Upload New Material
                </h2>
                <UploadComponent onUploadSuccess={handleUploadSuccess} />
              </div>
            </div>
          )}

          {/* Materials List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Available Materials
              </h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="document">Documents</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by tags..."
                    value={filters.tags}
                    onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={filters.isPublic}
                    onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All</option>
                    <option value="true">Public</option>
                    <option value="false">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              <ListComponent
                filters={filters}
                onMaterialSelect={handleMaterialSelect}
                onMaterialDelete={handleMaterialDelete}
                canDelete={canManage}
              />
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && selectedMaterial && (
          <PreviewComponent
            material={selectedMaterial}
            isOpen={showPreview}
            onClose={() => {
              setShowPreview(false);
              setSelectedMaterial(null);
            }}
          />
        )}
      </DashboardLayout>
    </>
  );
} 