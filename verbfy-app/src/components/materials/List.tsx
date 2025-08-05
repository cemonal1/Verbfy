import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { Material, MaterialFilters, getFileTypeIcon, getFileTypeLabel, formatFileSize, formatDate } from '../../types/materials';

interface ListComponentProps {
  filters: MaterialFilters;
  onMaterialSelect: (material: Material) => void;
  onMaterialDelete: (materialId: string) => void;
  canDelete: boolean;
}

export default function ListComponent({ 
  filters, 
  onMaterialSelect, 
  onMaterialDelete, 
  canDelete 
}: ListComponentProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Fetch materials
  const fetchMaterials = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.type) params.append('type', filters.type);
      if (filters.tags) params.append('tags', filters.tags);
      if (filters.search) params.append('search', filters.search);
      if (filters.isPublic) params.append('isPublic', filters.isPublic);
      if (filters.uploaderId) params.append('uploaderId', filters.uploaderId);
      
      // Add pagination
      params.append('page', page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/api/materials?${params.toString()}`);
      
      if (response.data.success) {
        setMaterials(response.data.data.materials);
        setPagination(response.data.data.pagination);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load materials';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete material
  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/materials/${materialId}`);
      
      if (response.data.success) {
        toast.success('Material deleted successfully');
        onMaterialDelete(materialId);
        // Refresh the list
        fetchMaterials(pagination.page);
      }
    } catch (error: any) {
      console.error('Error deleting material:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete material';
      toast.error(errorMessage);
    }
  };

  // Download material
  const handleDownload = async (material: Material) => {
    try {
      const response = await api.get(`/api/materials/${material._id}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error: any) {
      console.error('Error downloading material:', error);
      const errorMessage = error.response?.data?.message || 'Failed to download material';
      toast.error(errorMessage);
    }
  };

  // Fetch materials when filters change
  useEffect(() => {
    fetchMaterials(1);
  }, [filters]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchMaterials(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading materials...</span>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No materials found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {Object.values(filters).some(f => f) 
            ? 'Try adjusting your filters to see more results.'
            : 'No materials have been uploaded yet.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {materials.map((material) => (
          <MaterialCard
            key={material._id}
            material={material}
            onSelect={onMaterialSelect}
            onDelete={handleDelete}
            onDownload={handleDownload}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === pagination.page
                    ? 'text-white bg-blue-600 border border-blue-600'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Results Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} materials
      </div>
    </div>
  );
}

// Material Card Component
interface MaterialCardProps {
  material: Material;
  onSelect: (material: Material) => void;
  onDelete: (materialId: string) => void;
  onDownload: (material: Material) => void;
  canDelete: boolean;
}

function MaterialCard({ material, onSelect, onDelete, onDownload, canDelete }: MaterialCardProps) {
  const isOwner = material.uploaderId._id === localStorage.getItem('verbfy_user_id');
  const canDeleteThis = canDelete && (isOwner || material.uploaderId.role === 'admin');

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-lg">
                {getFileTypeIcon(material.type)}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {material.originalName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getFileTypeLabel(material.type)}
            </p>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* File Info */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Size: {formatFileSize(material.fileSize)}</span>
            <span>Downloads: {material.downloadCount}</span>
          </div>
          
          {material.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {material.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
            {material.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                +{material.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Uploader Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>By {material.uploaderId.name}</span>
          <span>{formatDate(material.createdAt)}</span>
        </div>

        {/* Visibility Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            material.isPublic
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {material.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border-t border-gray-200 dark:border-gray-500">
        <div className="flex items-center justify-between space-x-2">
          <button
            onClick={() => onSelect(material)}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            Preview
          </button>
          
          <button
            onClick={() => onDownload(material)}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            📥
          </button>
          
          {canDeleteThis && (
            <button
              onClick={() => onDelete(material._id)}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-800"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 