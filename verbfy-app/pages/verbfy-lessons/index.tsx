import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../src/components/layout/DashboardLayout';
import { verbfyLessonsAPI } from '../../src/lib/api';
import { VerbfyLesson, LessonFilters } from '../../src/types/verbfyLessons';
import { useToast } from '../../src/components/common/Toast';

export default function VerbfyLessonsPage() {
  const router = useRouter();
  const { error, success } = useToast();
  const [lessons, setLessons] = useState<VerbfyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<LessonFilters>({
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchLessons();
    fetchCategories();
  }, [filters]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await verbfyLessonsAPI.getLessons(filters);
      setLessons(response.lessons || []);
      setPagination(response.pagination || { page: 1, limit: 12, total: 0, pages: 0 });
    } catch (err) {
      error('Failed to fetch lessons');
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await verbfyLessonsAPI.getCategories();
      setCategories(response || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleFilterChange = (key: keyof LessonFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getLessonTypeIcon = (lessonType: string) => {
    const icons = {
      VerbfyGrammar: '📝',
      VerbfyRead: '📖',
      VerbfyWrite: '✍️',
      VerbfySpeak: '🗣️',
      VerbfyListen: '👂',
      VerbfyVocab: '📚'
    };
    return icons[lessonType as keyof typeof icons] || '📝';
  };

  const getCEFRLevelColor = (level: string) => {
    const colors = {
      A1: 'bg-green-100 text-green-800',
      A2: 'bg-blue-100 text-blue-800',
      B1: 'bg-yellow-100 text-yellow-800',
      B2: 'bg-orange-100 text-orange-800',
      C1: 'bg-red-100 text-red-800',
      C2: 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner: 'bg-green-100 text-green-800',
      Intermediate: 'bg-yellow-100 text-yellow-800',
      Advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout title="Verbfy Lessons">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verbfy Lessons
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Master English with our comprehensive lesson modules
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search lessons..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Lesson Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lesson Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.lessonType || ''}
                onChange={(e) => handleFilterChange('lessonType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="VerbfyGrammar">Grammar</option>
                <option value="VerbfyRead">Reading</option>
                <option value="VerbfyWrite">Writing</option>
                <option value="VerbfySpeak">Speaking</option>
                <option value="VerbfyListen">Listening</option>
                <option value="VerbfyVocab">Vocabulary</option>
              </select>
            </div>

            {/* CEFR Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CEFR Level
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.cefrLevel || ''}
                onChange={(e) => handleFilterChange('cefrLevel', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lessons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No lessons found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or check back later for new lessons.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {lessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/verbfy-lessons/${lesson._id}`)}
                >
                  <div className="p-6">
                    {/* Lesson Type Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{getLessonTypeIcon(lesson.lessonType)}</span>
                      {lesson.isPremium && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {lesson.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {lesson.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCEFRLevelColor(lesson.cefrLevel)}`}>
                        {lesson.cefrLevel}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>⏱️ {lesson.estimatedDuration} min</span>
                      <span>⭐ {lesson.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  
                  {[...Array(pagination.pages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 