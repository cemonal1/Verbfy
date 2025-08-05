import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { personalizedCurriculumAPI } from '@/lib/api';
import { PersonalizedCurriculum, CurriculumRecommendation } from '@/types/personalizedCurriculum';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function PersonalizedCurriculumPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { success, error } = useToast();
  
  const [curriculum, setCurriculum] = useState<PersonalizedCurriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'recommendations'>('overview');

  useEffect(() => {
    loadCurriculum();
  }, []);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const response = await personalizedCurriculumAPI.getCurriculum();
      setCurriculum(response);
    } catch (err) {
      console.error('Error loading curriculum:', err);
      // If no curriculum exists, create one
      await createCurriculum();
    } finally {
      setLoading(false);
    }
  };

  const createCurriculum = async () => {
    try {
      const response = await personalizedCurriculumAPI.createCurriculum({
        currentCEFRLevel: (user?.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') || 'A1',
        targetCEFRLevel: 'B2',
        learningGoals: [
          { skill: 'grammar', currentLevel: 0, targetLevel: 80, priority: 'high' },
          { skill: 'reading', currentLevel: 0, targetLevel: 75, priority: 'medium' },
          { skill: 'writing', currentLevel: 0, targetLevel: 70, priority: 'medium' },
          { skill: 'speaking', currentLevel: 0, targetLevel: 75, priority: 'high' },
          { skill: 'listening', currentLevel: 0, targetLevel: 80, priority: 'medium' },
          { skill: 'vocabulary', currentLevel: 0, targetLevel: 85, priority: 'high' }
        ]
      });
      setCurriculum(response.curriculum);
      success('Personalized curriculum created!');
    } catch (err) {
      error('Failed to create curriculum');
      console.error('Error creating curriculum:', err);
    }
  };

  const handleCompleteRecommendation = async (recommendationId: string) => {
    try {
      await personalizedCurriculumAPI.completeRecommendation(recommendationId);
      success('Recommendation completed!');
      loadCurriculum(); // Reload to get updated data
    } catch (err) {
      error('Failed to complete recommendation');
      console.error('Error completing recommendation:', err);
    }
  };

  const getSkillIcon = (skill: string) => {
    const icons = {
      grammar: '📝',
      reading: '📖',
      writing: '✍️',
      speaking: '🎤',
      listening: '🎧',
      vocabulary: '📚'
    };
    return icons[skill as keyof typeof icons] || '📚';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-blue-600';
    if (progress >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBackground = (progress: number) => {
    if (progress >= 80) return 'bg-green-100';
    if (progress >= 60) return 'bg-blue-100';
    if (progress >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!curriculum) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No curriculum found</h2>
          <button
            onClick={createCurriculum}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create My Curriculum
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <Head>
        <title>My Curriculum - Verbfy</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning Path</h1>
          <p className="text-gray-600">
            Your personalized curriculum designed to help you reach {curriculum.targetCEFRLevel} level
          </p>
        </div>

        {/* Progress Overview Card */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {curriculum.progress.overallProgress}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {curriculum.progress.lessonsCompleted}
              </div>
              <div className="text-sm text-gray-600">Lessons Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {curriculum.progress.testsCompleted}
              </div>
              <div className="text-sm text-gray-600">Tests Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {curriculum.currentCEFRLevel} → {curriculum.targetCEFRLevel}
              </div>
              <div className="text-sm text-gray-600">Target Level</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'progress', label: 'Progress', icon: '📈' },
                { id: 'recommendations', label: 'Recommendations', icon: '💡' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Learning Goals */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Learning Goals</h3>
              
              <div className="space-y-4">
                {curriculum.learningGoals.map((goal, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="mr-3">{getSkillIcon(goal.skill)}</span>
                        <span className="capitalize font-medium text-gray-900">{goal.skill}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                        goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {goal.priority} priority
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Current: {goal.currentLevel}%</span>
                      <span>Target: {goal.targetLevel}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressBackground(goal.currentLevel)}`}
                        style={{ width: `${Math.min(goal.currentLevel, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Phase */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Current Phase</h3>
              
              {curriculum.curriculumPath[curriculum.progress.currentPhase] && (
                <div>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Phase {curriculum.progress.currentPhase + 1}: {curriculum.curriculumPath[curriculum.progress.currentPhase].title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Complete this phase to advance to the next level
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Lessons</span>
                        <span>
                          {curriculum.curriculumPath[curriculum.progress.currentPhase].lessons.filter(l => l.isCompleted).length}/
                          {curriculum.curriculumPath[curriculum.progress.currentPhase].lessons.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${(curriculum.curriculumPath[curriculum.progress.currentPhase].lessons.filter(l => l.isCompleted).length / curriculum.curriculumPath[curriculum.progress.currentPhase].lessons.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tests</span>
                        <span>
                          {curriculum.curriculumPath[curriculum.progress.currentPhase].tests.filter(t => t.isCompleted).length}/
                          {curriculum.curriculumPath[curriculum.progress.currentPhase].tests.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${(curriculum.curriculumPath[curriculum.progress.currentPhase].tests.filter(t => t.isCompleted).length / curriculum.curriculumPath[curriculum.progress.currentPhase].tests.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {curriculum.learningGoals.map((goal, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="mr-2">{getSkillIcon(goal.skill)}</span>
                      <span className="capitalize font-medium text-gray-900">{goal.skill}</span>
                    </div>
                    <span className={`font-semibold ${getProgressColor(goal.currentLevel)}`}>
                      {goal.currentLevel}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className={`h-3 rounded-full ${getProgressBackground(goal.currentLevel)}`}
                      style={{ width: `${Math.min(goal.currentLevel, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Target: {goal.targetLevel}% • Gap: {goal.targetLevel - goal.currentLevel}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {curriculum.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="mr-2">
                        {recommendation.type === 'lesson' && '📝'}
                        {recommendation.type === 'test' && '🧪'}
                        {recommendation.type === 'practice' && '💪'}
                        {recommendation.type === 'review' && '🔄'}
                      </span>
                      <h4 className="text-lg font-medium text-gray-900">{recommendation.title}</h4>
                      <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                        recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {recommendation.priority} priority
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{recommendation.reason}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Type: {recommendation.type}</span>
                      <span>Estimated time: 15-30 min</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCompleteRecommendation(recommendation._id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
            
            {curriculum.recommendations.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💡</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
                <p className="text-gray-600">Complete some lessons to get personalized recommendations.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/verbfy-lessons')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Lessons
          </button>
          <button
            onClick={() => router.push('/cefr-tests')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Take a Test
          </button>
          <button
            onClick={() => router.push('/personalized-curriculum/progress')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            View Detailed Progress
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
} 