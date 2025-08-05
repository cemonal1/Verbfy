import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { freeMaterialsAPI } from '@/lib/api';
import { FreeMaterial, MaterialFilters } from '@/types/freeMaterials';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  BookOpenIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

function FreeMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<FreeMaterial[]>([]);
  const [featuredMaterials, setFeaturedMaterials] = useState<FreeMaterial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MaterialFilters>({
    category: 'All',
    level: 'All',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, levelsRes, featuredRes] = await Promise.all([
        freeMaterialsAPI.getCategories(),
        freeMaterialsAPI.getLevels(),
        freeMaterialsAPI.getFeaturedMaterials()
      ]);
      
      setCategories(categoriesRes.data);
      setLevels(levelsRes.data);
      setFeaturedMaterials(featuredRes.data);
    } catch (error) {
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await freeMaterialsAPI.getMaterials(filters);
      setMaterials(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load materials');
    }
  };

  const handleDownload = async (material: FreeMaterial) => {
    try {
      const blob = await freeMaterialsAPI.downloadMaterial(material._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download material');
    }
  };

  const handleRate = async (materialId: string, rating: number) => {
    try {
      await freeMaterialsAPI.rateMaterial(materialId, rating);
      toast.success('Rating submitted!');
      loadMaterials(); // Refresh to get updated ratings
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentArrowDownIcon className="w-5 h-5 text-red-500" />;
      case 'image':
        return <EyeIcon className="w-5 h-5 text-green-500" />;
      case 'video':
        return <EyeIcon className="w-5 h-5 text-blue-500" />;
      case 'audio':
        return <EyeIcon className="w-5 h-5 text-purple-500" />;
      case 'presentation':
        return <BookOpenIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <DocumentArrowDownIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStars = (rating: number, onClick?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onClick?.(star)}
            className="text-yellow-400 hover:text-yellow-500 transition-colors"
            disabled={!onClick}
          >
            {star <= rating ? (
              <StarIconSolid className="w-4 h-4" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout allowedRoles={['student', 'teacher']}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpenIcon className="w-8 h-8 text-green-600" />
            Free Learning Materials
          </h1>
          <p className="text-gray-600 mt-2">Access high-quality English learning resources for free</p>
        </div>

        {/* Featured Materials */}
        {featuredMaterials.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HeartIcon className="w-5 h-5 text-red-500" />
              Featured Materials
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMaterials.map((material) => (
                <div key={material._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(material.type)}
                      <span className="text-sm text-gray-500">{material.type.toUpperCase()}</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                      Featured
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{material.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{material.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(material.level)}`}>
                      {material.level}
                    </span>
                    <span className="text-xs text-gray-500">{formatFileSize(material.fileSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    {renderStars(Number(material.averageRating || 0))}
                    <span className="text-xs text-gray-500">{material.downloadCount} downloads</span>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(material)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Download Free
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
            
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page: 1 });
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="downloadCount-desc">Most Downloaded</option>
              <option value="title-asc">A-Z</option>
              <option value="title-desc">Z-A</option>
            </select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="All">All Levels</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {materials.map((material) => (
                <div key={material._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getFileTypeIcon(material.type)}
                      <span className="text-sm text-gray-500">{material.type.toUpperCase()}</span>
                    </div>
                    {material.isFeatured && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{material.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{material.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(material.level)}`}>
                      {material.level}
                    </span>
                    <span className="text-xs text-gray-500">{formatFileSize(material.fileSize)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {renderStars(Number(material.averageRating || 0), (rating) => handleRate(material._id, rating))}
                      <span className="text-xs text-gray-500">({material.ratingCount})</span>
                    </div>
                    <span className="text-xs text-gray-500">{material.downloadCount} downloads</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    By {material.uploadedBy.name}
                  </div>
                  
                  <button
                    onClick={() => handleDownload(material)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Download Free
                  </button>
                </div>
              ))}
            </div>

            {materials.length === 0 && (
              <div className="text-center py-12">
                <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-3 py-2 rounded-md text-sm ${
                    pagination.page === i + 1
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FreeMaterialsPage; 