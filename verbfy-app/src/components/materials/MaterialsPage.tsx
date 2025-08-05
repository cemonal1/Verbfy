import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { Material, MaterialFilters } from '../../types/materials';
import MaterialCard from './MaterialCard';
import UploadMaterialModal from './UploadMaterialModal';
import { useAuth } from '../../context/AuthContext';

interface MaterialsPageProps {
  title?: string;
  description?: string;
  showUploadButton?: boolean;
  initialFilters?: Partial<MaterialFilters>;
}

export default function MaterialsPage({
  title = "Learning Materials",
  description = "Access and manage educational resources for your English learning journey",
  showUploadButton = true,
  initialFilters = {}
}: MaterialsPageProps) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<MaterialFilters>({
    type: '',
    tags: '',
    search: '',
    isPublic: '',
    page: 1,
    limit: 12,
    ...initialFilters
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Check permissions
  const canUpload = user?.role === 'teacher' || user?.role === 'admin';
  const canDelete = user?.role === 'teacher' || user?.role === 'admin';

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/api/materials?${params.toString()}`);
      
      if (response.data.success) {
        setMaterials(response.data.data.materials);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load materials';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load materials on mount and when filters change
  useEffect(() => {
    fetchMaterials();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof MaterialFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle material upload success
  const handleUploadSuccess = (newMaterial: Material) => {
    setMaterials(prev => [newMaterial, ...prev]);
    toast.success('Material uploaded successfully!');
  };

  // Handle material deletion
  const handleMaterialDelete = (materialId: string) => {
    setMaterials(prev => prev.filter(m => m._id !== materialId));
    toast.success('Material deleted successfully!');
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200 dark:bg-gray-700"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Error state
  if (error && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load materials
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchMaterials}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        
        {showUploadButton && canUpload && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Material
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search materials..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* File Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filters.tags}
              onChange={(e) => handleFilterChange('tags', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Public/Private Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <select
              value={filters.isPublic}
              onChange={(e) => handleFilterChange('isPublic', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Public</option>
              <option value="false">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `${pagination.total} material${pagination.total !== 1 ? 's' : ''} found`}
        </p>
        
        {/* Sort Options */}
                 <select
           onChange={(e) => {
             // Handle sort separately since it's not in MaterialFilters
             const sortValue = e.target.value;
             // You can implement sort logic here or add it to the filters interface
           }}
           className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
         >
          <option value="createdAt">Newest First</option>
          <option value="-createdAt">Oldest First</option>
          <option value="originalName">Name A-Z</option>
          <option value="-originalName">Name Z-A</option>
        </select>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : materials.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No materials found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search || filters.type || filters.tags || filters.isPublic
              ? 'Try adjusting your filters to see more results.'
              : 'No materials have been uploaded yet.'}
          </p>
          {canUpload && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upload First Material
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materials.map((material) => (
              <MaterialCard
                key={material._id}
                material={material}
                onDelete={handleMaterialDelete}
                canDelete={canDelete && (material.uploaderId._id === user?._id || user?.role === 'admin')}
                canDownload={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      page === pagination.page
                        ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
} 