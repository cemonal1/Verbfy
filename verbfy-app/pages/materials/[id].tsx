import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Material, getFileTypeIcon, getFileTypeLabel, formatFileSize, formatDate } from '@/types/materials';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MaterialPreviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Check permissions
  const canDelete = user?.role === 'teacher' || user?.role === 'admin';
  const isOwner = material?.uploaderId._id === user?._id;
  const canManage = canDelete && (isOwner || user?.role === 'admin');

  // Fetch material details
  const fetchMaterial = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/api/materials/${id}`);
      
      if (response.data.success) {
        setMaterial(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching material:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load material';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMaterial();
    }
  }, [id]);

  // Handle download
  const handleDownload = async () => {
    if (!material) return;

    setIsDownloading(true);
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
      console.error('Download error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to download material';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!material || !canManage) return;

    if (!confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/materials/${material._id}`);
      
      if (response.data.success) {
        toast.success('Material deleted successfully');
        router.push('/materials');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete material';
      toast.error(errorMessage);
    }
  };

  // Get preview component based on file type
  const getPreviewComponent = () => {
    if (!material) return null;

    const fileType = material.type;
    const previewUrl = `/api/materials/${material._id}/preview`;

    switch (fileType) {
      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={previewUrl} 
              alt={material.originalName}
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex justify-center">
            <video 
              controls 
              className="max-w-full h-auto rounded-lg shadow-lg"
            >
              <source src={previewUrl} type={material.mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="w-full h-96">
            <iframe
              src={previewUrl}
              className="w-full h-full border rounded-lg"
              title={material.originalName}
            />
          </div>
        );
      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              {getFileTypeIcon(material.type)}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {material.originalName}
            </h3>
            <p className="text-gray-600 mb-4">
              This file type cannot be previewed directly.
            </p>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !material) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Material Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'The requested material could not be found.'}
            </p>
            <button
              onClick={() => router.push('/materials')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Materials
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {material.originalName}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                {getFileTypeIcon(material.type)}
                <span className="ml-1">{getFileTypeLabel(material.type)}</span>
              </span>
              <span>{formatFileSize(material.fileSize)}</span>
              <span>Uploaded {formatDate(material.createdAt)}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
            
            {canManage && (
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {material.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
          {getPreviewComponent()}
        </div>
      </div>
    </DashboardLayout>
  );
} 