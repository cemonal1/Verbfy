import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { VerbfyLesson, LessonFilters } from '@/types/verbfyLessons';
import { verbfyLessonsAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

interface ModuleManagementInterfaceProps {
  userRole: 'teacher' | 'admin';
}

export const ModuleManagementInterface: React.FC<ModuleManagementInterfaceProps> = ({
  userRole
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [lessons, setLessons] = useState<VerbfyLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LessonFilters>({
    page: 1,
    limit: 10
  });
  const [selectedLesson, setSelectedLesson] = useState<VerbfyLesson | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [filters]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await verbfyLessonsAPI.getLessons(filters);
      setLessons(response.lessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    setShowCreateModal(true);
  };

  const handleEditLesson = (lesson: VerbfyLesson) => {
    setSelectedLesson(lesson);
    setShowEditModal(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        await verbfyLessonsAPI.deleteLesson(lessonId);
        fetchLessons();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  const getLessonTypeIcon = (type: string) => {
    const icons = {
      VerbfyGrammar: '📝',
      VerbfyRead: '📖',
      VerbfyWrite: '✍️',
      VerbfySpeak: '🗣️',
      VerbfyListen: '👂',
      VerbfyVocab: '📚'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      A1: 'bg-red-100 text-red-800',
      A2: 'bg-orange-100 text-orange-800',
      B1: 'bg-yellow-100 text-yellow-800',
      B2: 'bg-green-100 text-green-800',
      C1: 'bg-blue-100 text-blue-800',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Module Management</h1>
              <p className="text-gray-600 mt-1">
                Create, edit, and manage Verbfy learning modules
              </p>
            </div>
            <button
              onClick={handleCreateLesson}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md transition-colors"
            >
              Create New Module
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.lessonType || ''}
              onChange={(e) => setFilters({ ...filters, lessonType: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="VerbfyGrammar">Grammar</option>
              <option value="VerbfyRead">Reading</option>
              <option value="VerbfyWrite">Writing</option>
              <option value="VerbfySpeak">Speaking</option>
              <option value="VerbfyListen">Listening</option>
              <option value="VerbfyVocab">Vocabulary</option>
            </select>

            <select
              value={filters.cefrLevel || ''}
              onChange={(e) => setFilters({ ...filters, cefrLevel: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Proficient</option>
            </select>

            <select
              value={filters.difficulty || ''}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value || undefined })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            <input
              type="text"
              placeholder="Search modules..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div key={lesson._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getLessonTypeIcon(lesson.lessonType)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-500">{lesson.category}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(lesson.cefrLevel)}`}>
                      {lesson.cefrLevel}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {lesson.description}
                </p>

                <div className="space-y-2 mb-4 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{lesson.estimatedDuration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exercises:</span>
                    <span>{lesson.content.exercises?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span>{lesson.content.materials?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>⭐ {lesson.averageRating.toFixed(1)}</span>
                    <span>👥 {lesson.totalRatings} ratings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.isPremium ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {lesson.isPremium ? 'Premium' : 'Free'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lesson.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {lesson.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>Completion: {lesson.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLesson(lesson)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => router.push(`/verbfy-lessons/${lesson._id}`)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson._id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lessons.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new module.</p>
          </div>
        )}

        {/* Create/Edit Modals would go here */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Module</h2>
              {/* Module creation form would go here */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create Module
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Module</h2>
              {/* Module editing form would go here */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 