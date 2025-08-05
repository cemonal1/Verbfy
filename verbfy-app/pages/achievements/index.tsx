import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function AchievementsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { error } = useToast();
  
  const [achievements, setAchievements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'in-progress' | 'locked'>('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // const response = await fetch('/api/achievements');
      // setAchievements(response.achievements);
      
      // Simulated data for demonstration
      setAchievements({
        totalAchievements: 25,
        earnedCount: 12,
        totalPoints: 850,
        level: 8,
        nextLevelPoints: 1000,
        currentLevelPoints: 850,
        recentAchievements: [
          { id: 1, name: 'Grammar Master', description: 'Achieved 80% in grammar skills', earned: true, date: '2024-01-15', points: 100, icon: '📝' },
          { id: 2, name: 'Week Warrior', description: 'Studied for 7 consecutive days', earned: true, date: '2024-01-22', points: 50, icon: '🔥' },
          { id: 3, name: 'Test Champion', description: 'Passed 10 tests', earned: true, date: '2024-02-01', points: 75, icon: '🏆' }
        ],
        categories: [
          {
            name: 'Learning Milestones',
            achievements: [
              { id: 1, name: 'First Lesson', description: 'Complete your first lesson', earned: true, date: '2024-01-10', points: 25, icon: '🎯', rarity: 'common' },
              { id: 2, name: 'Lesson Master', description: 'Complete 50 lessons', earned: false, progress: 35, target: 50, points: 100, icon: '📚', rarity: 'rare' },
              { id: 3, name: 'Century Club', description: 'Complete 100 lessons', earned: false, progress: 35, target: 100, points: 200, icon: '💎', rarity: 'epic' }
            ]
          },
          {
            name: 'Study Habits',
            achievements: [
              { id: 4, name: 'Week Warrior', description: 'Study for 7 consecutive days', earned: true, date: '2024-01-22', points: 50, icon: '🔥', rarity: 'common' },
              { id: 5, name: 'Month Master', description: 'Study for 30 consecutive days', earned: false, progress: 22, target: 30, points: 150, icon: '🌟', rarity: 'rare' },
              { id: 6, name: 'Dedication King', description: 'Study for 100 consecutive days', earned: false, progress: 22, target: 100, points: 500, icon: '👑', rarity: 'legendary' }
            ]
          },
          {
            name: 'Skill Mastery',
            achievements: [
              { id: 7, name: 'Grammar Master', description: 'Achieve 80% in grammar skills', earned: true, date: '2024-01-15', points: 100, icon: '📝', rarity: 'rare' },
              { id: 8, name: 'Reading Expert', description: 'Achieve 90% in reading skills', earned: false, progress: 75, target: 90, points: 150, icon: '📖', rarity: 'rare' },
              { id: 9, name: 'Vocabulary Expert', description: 'Learn 500 new words', earned: false, progress: 320, target: 500, points: 200, icon: '📚', rarity: 'epic' },
              { id: 10, name: 'Polyglot', description: 'Achieve 90% in all skills', earned: false, progress: 68, target: 90, points: 1000, icon: '🌍', rarity: 'legendary' }
            ]
          },
          {
            name: 'Testing & Assessment',
            achievements: [
              { id: 11, name: 'Test Champion', description: 'Pass 10 tests', earned: true, date: '2024-02-01', points: 75, icon: '🏆', rarity: 'common' },
              { id: 12, name: 'Perfect Score', description: 'Get 100% on any test', earned: false, progress: 0, target: 1, points: 200, icon: '💯', rarity: 'epic' },
              { id: 13, name: 'CEFR Climber', description: 'Advance to the next CEFR level', earned: false, progress: 0, target: 1, points: 300, icon: '📈', rarity: 'rare' }
            ]
          },
          {
            name: 'Social & Community',
            achievements: [
              { id: 14, name: 'Study Buddy', description: 'Join a study group', earned: false, progress: 0, target: 1, points: 50, icon: '👥', rarity: 'common' },
              { id: 15, name: 'Mentor', description: 'Help 5 other students', earned: false, progress: 0, target: 5, points: 150, icon: '🤝', rarity: 'rare' },
              { id: 16, name: 'Community Leader', description: 'Create and lead a study group', earned: false, progress: 0, target: 1, points: 300, icon: '👑', rarity: 'epic' }
            ]
          }
        ],
        leaderboard: [
          { rank: 1, name: 'Sarah Johnson', points: 1250, level: 12, avatar: '👩‍🎓' },
          { rank: 2, name: 'Mike Chen', points: 1100, level: 11, avatar: '👨‍🎓' },
          { rank: 3, name: 'Emma Davis', points: 950, level: 10, avatar: '👩‍🎓' },
          { rank: 4, name: 'Alex Thompson', points: 850, level: 8, avatar: '👨‍🎓' },
          { rank: 5, name: 'Lisa Wang', points: 800, level: 8, avatar: '👩‍🎓' }
        ]
      });
    } catch (err) {
      error('Failed to load achievements');
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-300',
      rare: 'bg-blue-100 text-blue-800 border-blue-300',
      epic: 'bg-purple-100 text-purple-800 border-purple-300',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getRarityBadge = (rarity: string) => {
    const badges = {
      common: '⚪',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    };
    return badges[rarity as keyof typeof badges] || badges.common;
  };

  const getProgressPercentage = (achievement: any) => {
    if (achievement.earned) return 100;
    if (!achievement.progress || !achievement.target) return 0;
    return Math.min((achievement.progress / achievement.target) * 100, 100);
  };

  const filterAchievements = (category: any) => {
    const allAchievements = category.achievements;
    
    switch (activeTab) {
      case 'earned':
        return allAchievements.filter((a: any) => a.earned);
      case 'in-progress':
        return allAchievements.filter((a: any) => !a.earned && a.progress > 0);
      case 'locked':
        return allAchievements.filter((a: any) => !a.earned && (!a.progress || a.progress === 0));
      default:
        return allAchievements;
    }
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

  if (!achievements) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No achievements available</h2>
          <p className="text-gray-600 mb-4">Start learning to unlock achievements.</p>
          <button
            onClick={() => router.push('/verbfy-lessons')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <Head>
        <title>Achievements - Verbfy</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievements</h1>
              <p className="text-gray-600">
                Track your progress and unlock rewards for your learning journey
              </p>
            </div>
            <button
              onClick={() => router.push('/personalized-curriculum')}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Curriculum
            </button>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Level {achievements.level}</h2>
              <p className="text-gray-600">Keep learning to reach the next level!</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{achievements.totalPoints} pts</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to Level {achievements.level + 1}</span>
              <span>{achievements.currentLevelPoints}/{achievements.nextLevelPoints} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((achievements.currentLevelPoints - (achievements.level - 1) * 100) / 100) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                <p className="text-2xl font-bold text-gray-900">{achievements.totalAchievements}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Earned</p>
                <p className="text-2xl font-bold text-gray-900">{achievements.earnedCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {achievements.categories.reduce((total: number, cat: any) => 
                    total + cat.achievements.filter((a: any) => !a.earned && a.progress > 0).length, 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🔄</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((achievements.earnedCount / achievements.totalAchievements) * 100)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.recentAchievements.map((achievement: any) => (
              <div key={achievement.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{achievement.icon}</span>
                  <span className="text-sm font-semibold text-green-600">+{achievement.points} pts</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{achievement.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <p className="text-xs text-green-600">Earned {achievement.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'all', label: 'All Achievements', count: achievements.totalAchievements },
                { id: 'earned', label: 'Earned', count: achievements.earnedCount },
                { id: 'in-progress', label: 'In Progress', count: achievements.categories.reduce((total: number, cat: any) => total + cat.achievements.filter((a: any) => !a.earned && a.progress > 0).length, 0) },
                { id: 'locked', label: 'Locked', count: achievements.totalAchievements - achievements.earnedCount - achievements.categories.reduce((total: number, cat: any) => total + cat.achievements.filter((a: any) => !a.earned && a.progress > 0).length, 0) }
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
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Achievement Categories */}
        <div className="space-y-8">
          {achievements.categories.map((category: any) => {
            const filteredAchievements = filterAchievements(category);
            if (filteredAchievements.length === 0) return null;

            return (
              <div key={category.name} className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">{category.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement: any) => (
                    <div 
                      key={achievement.id} 
                      className={`p-4 border rounded-lg transition-all duration-200 ${
                        achievement.earned 
                          ? 'bg-green-50 border-green-200 hover:shadow-md' 
                          : 'bg-gray-50 border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{achievement.icon}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRarityColor(achievement.rarity)}`}>
                            {getRarityBadge(achievement.rarity)} {achievement.rarity}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">+{achievement.points} pts</span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2">{achievement.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      
                      {achievement.earned ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600 font-medium">✓ Earned</span>
                          <span className="text-xs text-gray-500">{achievement.date}</span>
                        </div>
                      ) : (
                        <div>
                          {achievement.progress !== undefined && achievement.target && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.target}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${getProgressPercentage(achievement)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          <span className="text-sm text-gray-500">🔒 Locked</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Leaderboard</h3>
          <div className="space-y-3">
            {achievements.leaderboard.map((player: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                    <span className="text-sm font-bold text-gray-600">{player.rank}</span>
                  </div>
                  <span className="text-2xl">{player.avatar}</span>
                  <div>
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <p className="text-sm text-gray-500">Level {player.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{player.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 