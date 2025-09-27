import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { AxiosProgressEvent } from 'axios';
import api from '../../lib/api';
import { Material, MAX_FILE_SIZE, FILE_TYPES } from '../../types/materials';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (material: Material) => void;
}

export default function UploadMaterialModal({ 
  isOpen, 
  onClose, 
  onUploadSuccess 
}: UploadMaterialModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    isPublic: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file type
    const allowedMimeTypes = Object.values(FILE_TYPES).flatMap(type => type.mimeTypes);
    if (!allowedMimeTypes.includes(file.type as any)) {
      return 'File type not supported. Please upload PDF, image, video, document, or audio files.';
    }

    return null;
  };

  // Handle file selection
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        toast.error('File type not supported. Please upload PDF, image, video, document, or audio files.');
      } else {
        toast.error('File upload failed. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setSelectedFile(file);
    }
  }, []);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.avi'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title for the material');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('title', formData.title.trim());
      
      if (formData.description) {
        formDataToSend.append('description', formData.description.trim());
      }
      
      if (formData.tags) {
        formDataToSend.append('tags', formData.tags);
      }
      
      formDataToSend.append('isPublic', formData.isPublic.toString());

      const response = await api.post('/api/materials/upload', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      if (response.data.success) {
        toast.success('Material uploaded successfully!');
        onUploadSuccess(response.data.data);
        
        // Reset form
        setSelectedFile(null);
        setFormData({
          title: '',
          description: '',
          tags: '',
          isPublic: false
        });
        setUploadProgress(0);
        onClose();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change (fallback)
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      setSelectedFile(file);
    }
  };

  // Reset form
  const handleCancel = () => {
    setSelectedFile(null);
    setFormData({
      title: '',
      description: '',
      tags: '',
      isPublic: false
    });
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload New Material
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="Enter material title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter material description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              placeholder="grammar, beginner, exercises (comma-separated)"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate tags with commas
            </p>
          </div>

          {/* File Upload Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive && !isDragReject
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : isDragReject
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="text-4xl">
                {isDragActive && !isDragReject ? '📁' : '📤'}
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {isDragActive && !isDragReject
                    ? 'Drop your file here'
                    : isDragReject
                    ? 'File type not supported'
                    : 'Drag & drop a file here, or click to select'
                  }
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  PDF, Images, Videos, Documents, Audio (max 50MB)
                </p>
              </div>

              {!isDragActive && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Choose File
                </button>
              )}
            </div>
          </div>

          {/* Fallback File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.ogg,.avi,.doc,.docx,.txt,.mp3,.wav"
            className="hidden"
          />

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">
                      {getFileTypeIcon(selectedFile.type)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">Uploading...</span>
                <span className="text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Make this material public (visible to all users)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedFile || !formData.title.trim() || uploading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Material'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get file type icon
function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '��';
  return '📝';
} 