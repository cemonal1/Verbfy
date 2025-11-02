import React, { useEffect, useState } from 'react';
import { useRoleGuard } from '../../src/hooks/useAuth';
import { useAdmin } from '../../src/context/AdminContext';
import AdminSidebar from '../../src/components/admin/AdminSidebar';
import { materialsAPI } from '../../src/lib/api';
import { 
  CheckIcon, 
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function MaterialsPage() {
  const { hasAccess, isLoading: authLoading } = useRoleGuard(['admin']);
  const { state, loadMaterials, approveMaterial, deleteMaterial, setMaterialFilters } = useAdmin();
  const { materials, materialsLoading, materialFilters, materialsPagination } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (hasAccess) {
      // Debounce search to prevent forced reflow
      const timer = setTimeout(() => {
        loadMaterials(1, { 
          ...materialFilters, 
          search: searchTerm, 
          status: statusFilter === 'all' ? undefined : statusFilter as 'pending' | 'approved' | 'rejected'
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [hasAccess, loadMaterials, searchTerm, statusFilter, materialFilters]);

  const handleTogglePublic = async (materialId: string, isPublic: boolean) => {
    try {
      setProcessingId(materialId);
      // This would need to be implemented in the AdminContext
      // For now, we'll just log the action
      console.log(`Toggle material ${materialId} to ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error toggling material visibility:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        setProcessingId(materialId);
        await deleteMaterial(materialId);
      } catch (error) {
        console.error('Error deleting material:', error);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Debounce search to prevent forced reflow
    setMaterialFilters({ ...materialFilters, search: searchTerm });
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Additional security check
  if (!hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar className="w-64" />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Materials Management</h1>
            <p className="text-gray-600 mt-2">Review and manage uploaded materials</p>
          </div>

          {/* Upload Form */}
          <AdminUploadForm onUploaded={() => {
            loadMaterials(1, { ...materialFilters, search: searchTerm, status: statusFilter === 'all' ? undefined : statusFilter as any });
          }} />

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {materialsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No materials found</h3>
                <p className="mt-1 text-sm text-gray-500">No materials match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materials.map((material) => (
                      <tr key={material._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {material.title || material.originalName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {material.description?.substring(0, 50)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{material.uploaderId?.name}</div>
                          <div className="text-sm text-gray-500">{material.uploaderId?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {material.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.status === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : material.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : material.isPublic
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {material.status || (material.isPublic ? 'public' : 'private')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(material.createdAt).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* View Button */}
                            <button
                              onClick={() => window.open(`/api/materials/${material._id}/preview`, '_blank')}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View Material"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>

                            {/* Toggle Public Button */}
                            <button
                              onClick={() => handleTogglePublic(material._id, !material.isPublic)}
                              disabled={processingId === material._id}
                              className={`p-1 rounded disabled:opacity-50 ${
                                material.isPublic 
                                  ? 'text-orange-600 hover:text-orange-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={material.isPublic ? 'Make Private' : 'Make Public'}
                            >
                              {processingId === material._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(material._id)}
                              disabled={processingId === material._id}
                              className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                              title="Delete Material"
                            >
                              {processingId === material._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {materialsPagination && materialsPagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => loadMaterials(materialsPagination.page - 1, materialFilters)}
                    disabled={materialsPagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadMaterials(materialsPagination.page + 1, materialFilters)}
                    disabled={materialsPagination.page >= materialsPagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(materialsPagination.page - 1) * materialsPagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(materialsPagination.page * materialsPagination.limit, materialsPagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{materialsPagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => loadMaterials(materialsPagination.page - 1, materialFilters)}
                        disabled={materialsPagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadMaterials(materialsPagination.page + 1, materialFilters)}
                        disabled={materialsPagination.page >= materialsPagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Lütfen bir dosya seçin.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      if (tags) formData.append('tags', tags);
      if (description) formData.append('description', description);
      formData.append('isPublic', isPublic ? 'true' : 'false');
      // Axios tabanlı API helper ile yükleme (CSRF ve oturum başlıkları dahil)
      const data = await materialsAPI.uploadMaterial(formData);
      if (!data?.success) {
        throw new Error(data?.message || 'Yükleme başarısız');
      }
      setSuccess('Materyal başarıyla yüklendi.');
      setFile(null);
      setTags('');
      setDescription('');
      setIsPublic(false);
      onUploaded();
    } catch (err: any) {
      setError(err?.message || 'Beklenmeyen bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Material</h2>
      {error && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-4 py-2">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded bg-green-50 border border-green-200 text-green-700 px-4 py-2">{success}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Desteklenen türler: PDF, görüntü, video, doküman, ses. 50MB limit.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="grammar, reading, A2"
            />
          </div>
          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">Public</label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Kısa açıklama"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </div>
      </form>
    </div>
  );
}


