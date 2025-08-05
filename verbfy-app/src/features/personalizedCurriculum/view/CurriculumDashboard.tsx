import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PersonalizedCurriculum, CurriculumAnalytics } from '@/types/personalizedCurriculum';
import { personalizedCurriculumAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';

export const CurriculumDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();
  const [curriculum, setCurriculum] = useState<PersonalizedCurriculum | null>(null);
  const [analytics, setAnalytics] = useState<CurriculumAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurriculumData();
  }, []);

  const fetchCurriculumData = async () => {
    try {
      setLoading(true);
      const [curriculumResponse, analyticsResponse] = await Promise.all([
        personalizedCurriculumAPI.getCurriculum(),
        personalizedCurriculumAPI.getAnalytics()
      ]);
      setCurriculum(curriculumResponse);
      setAnalytics(analyticsResponse.analytics);
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
    } finally {
      setLoading(false);
    }
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

  const getSkillIcon = (skill: string) => {
    const icons = {
      grammar: '📝',
      reading: '📖',
      writing: '✍️',
      speaking: '🗣️',
      listening: '👂',
      vocabulary: '📚'
    };
    return icons[skill as keyof typeof icons] || '📊';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your curriculum...</p>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Your Personalized Curriculum</h1>
            <p className="text-gray-600 mb-6">
              Get a customized learning path designed specifically for your goals and current level.
            </p>
            <button
              onClick={() => router.push('/curriculum/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md transition-colors"
            >
              Start Creating
            </button>
          </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Your Learning Journey</h1>
              <p className="text-gray-600 mt-1">
                From {curriculum.currentCEFRLevel} to {curriculum.targetCEFRLevel}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(curriculum.currentCEFRLevel)}`}>
                Current: {curriculum.currentCEFRLevel}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(curriculum.targetCEFRLevel)}`}>
                Target: {curriculum.targetCEFRLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Progress</h2>
              
              {analytics && (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm font-medium text-gray-700">{analytics.overallProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${analytics.overallProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analytics.lessonsCompleted}</div>
                      <div className="text-sm text-gray-600">Lessons Completed</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics.testsCompleted}</div>
                      <div className="text-sm text-gray-600">Tests Completed</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{analytics.currentPhase}</div>
                      <div className="text-sm text-gray-600">Current Phase</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.currentStreak ? analytics.currentStreak.title : '0'}
                      </div>
                      <div className="text-sm text-gray-600">Current Streak</div>
                    </div>
                  </div>

                  {/* Skill Progress */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Skill Progress</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(analytics.skillProgress).map(([skill, progress]) => (
                        <div key={skill} className="text-center p-3 border border-gray-200 rounded-lg">
                          <div className="text-xl mb-1">{getSkillIcon(skill)}</div>
                          <div className="font-medium text-gray-900 capitalize">{skill}</div>
                          <div className="text-sm font-bold text-blue-600">{progress}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Phase */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Phase</h2>
              {curriculum.curriculumPath[curriculum.progress.currentPhase - 1] && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Phase {curriculum.progress.currentPhase}: {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].title}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].estimatedDuration} days
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].description}
                  </p>
                  
                  {/* Phase Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Lessons: {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].lessons.filter(l => l.isCompleted).length} / {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].lessons.length}</span>
                      <span>Tests: {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].tests.filter(t => t.isCompleted).length} / {curriculum.curriculumPath[curriculum.progress.currentPhase - 1].tests.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((curriculum.curriculumPath[curriculum.progress.currentPhase - 1].lessons.filter(l => l.isCompleted).length + curriculum.curriculumPath[curriculum.progress.currentPhase - 1].tests.filter(t => t.isCompleted).length) / (curriculum.curriculumPath[curriculum.progress.currentPhase - 1].lessons.length + curriculum.curriculumPath[curriculum.progress.currentPhase - 1].tests.length)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/curriculum/next-lesson')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
                >
                  Continue Learning
                </button>
                <button
                  onClick={() => router.push('/cefr-tests')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
                >
                  Take Progress Test
                </button>
                <button
                  onClick={() => router.push('/curriculum/schedule')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
                >
                  View Schedule
                </button>
              </div>
            </div>

            {/* Recent Achievements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {curriculum.achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                  </div>
                ))}
                {curriculum.achievements.length === 0 && (
                  <p className="text-gray-500 text-sm">No achievements yet. Keep learning!</p>
                )}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
              <div className="space-y-3">
                {curriculum.learningGoals.map((goal, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getSkillIcon(goal.skill)}</span>
                        <span className="font-medium capitalize">{goal.skill}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                        goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {goal.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Level {goal.currentLevel} → {goal.targetLevel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 