import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { Material, getFileTypeIcon, getFileTypeLabel, formatFileSize, formatDate } from '../../types/materials';

interface PreviewComponentProps {
  material: Material;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewComponent({ material, isOpen, onClose }: PreviewComponentProps) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if file type is previewable
  const isPreviewable = ['pdf', 'image'].includes(material.type);

  // Load preview URL
  useEffect(() => {
    if (isOpen && isPreviewable) {
      loadPreview();
    }
  }, [isOpen, material._id]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/materials/${material._id}/preview`, {
        responseType: 'blob'
      });
      
      const url = URL.createObjectURL(response.data);
      setPreviewUrl(url);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      setError('Failed to load preview. The file may not be available.');
    } finally {
      setLoading(false);
    }
  };

  // Download file
  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/materials/${material._id}/download`, {
        responseType: 'blob'
      });
      
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
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">
                    {getFileTypeIcon(material.type)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {material.originalName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getFileTypeLabel(material.type)} • {formatFileSize(material.fileSize)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  📥 Download
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Material Info */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">File Information</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Type:</dt>
                    <dd className="text-gray-900 dark:text-white">{getFileTypeLabel(material.type)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Size:</dt>
                    <dd className="text-gray-900 dark:text-white">{formatFileSize(material.fileSize)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Downloads:</dt>
                    <dd className="text-gray-900 dark:text-white">{material.downloadCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Uploaded:</dt>
                    <dd className="text-gray-900 dark:text-white">{formatDate(material.createdAt)}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Uploader Information</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Name:</dt>
                    <dd className="text-gray-900 dark:text-white">{material.uploaderId.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Role:</dt>
                    <dd className="text-gray-900 dark:text-white capitalize">{material.uploaderId.role}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Visibility:</dt>
                    <dd className="text-gray-900 dark:text-white">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        material.isPublic
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {material.isPublic ? 'Public' : 'Private'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Description */}
            {material.description && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-300">{material.description}</p>
              </div>
            )}

            {/* Tags */}
            {material.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {material.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Content */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Preview</h4>
              
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading preview...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-2">⚠️</div>
                  <p className="text-gray-600 dark:text-gray-400">{error}</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Download Instead
                  </button>
                </div>
              )}

              {!loading && !error && isPreviewable && previewUrl && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  {material.type === 'pdf' && (
                    <iframe
                      src={previewUrl}
                      className="w-full h-96"
                      title={material.originalName}
                    />
                  )}
                  
                  {material.type === 'image' && (
                    <img
                      src={previewUrl}
                      alt={material.originalName}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  )}
                </div>
              )}

              {!loading && !error && !isPreviewable && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">
                    {material.type === 'video' ? '🎥' : material.type === 'audio' ? '🎵' : '📄'}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Preview Not Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    This file type cannot be previewed in the browser. Please download the file to view it.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    📥 Download File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 