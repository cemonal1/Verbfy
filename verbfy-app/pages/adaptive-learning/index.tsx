import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { adaptiveLearningAPI } from '@/lib/api';
import { AdaptivePath, CreateAdaptivePathData, AdaptiveRecommendation } from '@/types/adaptiveLearning';
import { 
  AcademicCapIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  PlusIcon,
  ArrowRightIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AdaptiveLearningPage: React.FC = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<AdaptivePath[]>([]);
  const [currentPath, setCurrentPath] = useState<AdaptivePath | null>(null);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateAdaptivePathData>({
    targetCEFRLevel: 'B1',
    currentCEFRLevel: 'A2',
    learningGoals: [],
    preferredPace: 'moderate'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pathsRes, recommendationsRes] = await Promise.all([
        adaptiveLearningAPI.getPaths(),
        adaptiveLearningAPI.getRecommendations('current') // Assuming current path ID
      ]);
      
      setPaths(pathsRes.paths);
      if (pathsRes.paths.length > 0) {
        setCurrentPath(pathsRes.paths[0]);
        // Load recommendations for the first path
        try {
          const recRes = await adaptiveLearningAPI.getRecommendations(pathsRes.paths[0]._id);
          setRecommendations(recRes.recommendations);
        } catch (error) {
          console.error('Error loading recommendations:', error);
        }
      }
    } catch (error) {
      console.error('Error loading adaptive learning data:', error);
      toast.error('Failed to load adaptive learning data');
    } finally {
      setLoading(false);
    }
  };

  const createNewPath = async () => {
    try {
      const response = await adaptiveLearningAPI.createPath(formData);
      setPaths(prev => [response.path, ...prev]);
      setCurrentPath(response.path);
      setShowCreateForm(false);
      setFormData({
        targetCEFRLevel: 'B1',
        currentCEFRLevel: 'A2',
        learningGoals: [],
        preferredPace: 'moderate'
      });
      toast.success('New adaptive learning path created!');
    } catch (error) {
      console.error('Error creating path:', error);
      toast.error('Failed to create learning path');
    }
  };

  const selectPath = async (path: AdaptivePath) => {
    setCurrentPath(path);
    try {
      const recRes = await adaptiveLearningAPI.getRecommendations(path._id);
      setRecommendations(recRes.recommendations);
    } catch (error) {
      console.error('Error loading path recommendations:', error);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    if (progress >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student', 'teacher']}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Adaptive Learning...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student', 'teacher']}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            Adaptive Learning Paths
          </h1>
          <p className="mt-2 text-gray-600">
            Your personalized learning journey that adapts to your progress and learning style.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Learning Paths Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Learning Paths</h3>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">Create New Path</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Level
                      </label>
                      <select
                        value={formData.currentCEFRLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentCEFRLevel: e.target.value as any }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="A1">A1 - Beginner</option>
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper Intermediate</option>
                        <option value="C1">C1 - Advanced</option>
                        <option value="C2">C2 - Mastery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Level
                      </label>
                      <select
                        value={formData.targetCEFRLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetCEFRLevel: e.target.value as any }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="A2">A2 - Elementary</option>
                        <option value="B1">B1 - Intermediate</option>
                        <option value="B2">B2 - Upper Intermediate</option>
                        <option value="C1">C1 - Advanced</option>
                        <option value="C2">C2 - Mastery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Learning Pace
                      </label>
                      <select
                        value={formData.preferredPace}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredPace: e.target.value as any }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="slow">Slow</option>
                        <option value="moderate">Moderate</option>
                        <option value="fast">Fast</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={createNewPath}
                        className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-sm hover:bg-blue-700"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-1 px-2 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {paths.map((path) => (
                  <div
                    key={path._id}
                    onClick={() => selectPath(path)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      currentPath?._id === path._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {path.currentCEFRLevel} → {path.targetCEFRLevel}
                        </p>
                        <p className="text-xs text-gray-500">
                          {path.progress.overall}% complete
                        </p>
                      </div>
                      <div className={`text-xs font-medium ${getProgressColor(path.progress.overall)}`}>
                        {path.progress.overall}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentPath ? (
              <div className="space-y-6">
                {/* Path Overview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {currentPath.currentCEFRLevel} → {currentPath.targetCEFRLevel} Learning Path
                      </h2>
                      <p className="text-gray-600">
                        {currentPath.modules.filter(m => m.isCompleted).length} of {currentPath.modules.length} modules completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentPath.progress.overall}%
                      </div>
                      <div className="text-sm text-gray-500">Overall Progress</div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(currentPath.progress).map(([skill, progress]) => (
                      skill !== 'overall' && (
                        <div key={skill} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize">{skill}</span>
                            <span className={getProgressColor(progress)}>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressBarColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Adaptive Rules */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Adaptive Adjustments</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Difficulty: </span>
                        <span className="font-medium capitalize">{currentPath.adaptiveRules.difficultyAdjustment}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Pace: </span>
                        <span className="font-medium capitalize">{currentPath.adaptiveRules.paceAdjustment}</span>
                      </div>
                    </div>
                    <p className="text-blue-700 text-xs mt-2">
                      {currentPath.adaptiveRules.adjustmentReason}
                    </p>
                  </div>
                </div>

                {/* Modules */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Modules</h3>
                  <div className="space-y-3">
                    {currentPath.modules.map((module, index) => (
                      <div
                        key={module.lessonId}
                        className={`p-4 border rounded-lg ${
                          module.isCompleted
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              module.isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {module.isCompleted ? (
                                <CheckCircleIcon className="h-5 w-5" />
                              ) : (
                                <span className="text-sm font-medium">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{module.lessonType}</h4>
                              <p className="text-sm text-gray-500">
                                {module.isCompleted ? 'Completed' : 'Not started'}
                                {module.score && ` • Score: ${module.score}%`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {module.isCompleted && module.score && (
                              <span className="text-sm font-medium text-green-600">
                                {module.score}%
                              </span>
                            )}
                            {!module.isCompleted && (
                              <button className="text-blue-600 hover:text-blue-700">
                                <PlayIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
                  <div className="space-y-3">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{recommendation.description}</p>
                            <p className="text-gray-500 text-xs mt-2">{recommendation.reason}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {recommendation.estimatedDuration} min
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                recommendation.priority === 'high' ? 'bg-red-100 text-red-700' :
                                recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {recommendation.priority} priority
                              </span>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 ml-4">
                            <ArrowRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Path Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a learning path from the sidebar or create a new one to get started.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create New Path
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdaptiveLearningPage;