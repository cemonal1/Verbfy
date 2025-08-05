import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { personalizedCurriculumAPI } from '@/lib/api';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/common/Toast';

export default function StudySchedulePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { success, error } = useToast();
  
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    date: '',
    time: '',
    duration: 30,
    type: 'lesson',
    goal: ''
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API
      // const response = await personalizedCurriculumAPI.getStudySchedule();
      // setSchedule(response.schedule);
      
      // Simulated data for demonstration
      setSchedule({
        weeklyGoal: 5,
        completedThisWeek: 3,
        dailyGoal: 45,
        averageTimePerDay: 38,
        studySessions: [
          {
            id: 1,
            date: '2024-01-15',
            time: '18:00',
            duration: 45,
            type: 'lesson',
            title: 'Grammar Practice',
            completed: true,
            goal: 'Complete 3 grammar exercises'
          },
          {
            id: 2,
            date: '2024-01-16',
            time: '19:30',
            duration: 30,
            type: 'test',
            title: 'CEFR Progress Test',
            completed: true,
            goal: 'Achieve 80% or higher'
          },
          {
            id: 3,
            date: '2024-01-17',
            time: '17:00',
            duration: 60,
            type: 'lesson',
            title: 'Reading Comprehension',
            completed: false,
            goal: 'Read and analyze 2 passages'
          },
          {
            id: 4,
            date: '2024-01-18',
            time: '20:00',
            duration: 30,
            type: 'practice',
            title: 'Vocabulary Review',
            completed: false,
            goal: 'Review 50 new words'
          },
          {
            id: 5,
            date: '2024-01-19',
            time: '16:30',
            duration: 45,
            type: 'lesson',
            title: 'Speaking Practice',
            completed: false,
            goal: 'Practice pronunciation exercises'
          }
        ],
        studyGoals: [
          { id: 1, title: 'Complete 5 lessons this week', progress: 60, target: 5, current: 3 },
          { id: 2, title: 'Study for 45 minutes daily', progress: 84, target: 45, current: 38 },
          { id: 3, title: 'Take 2 CEFR tests', progress: 50, target: 2, current: 1 },
          { id: 4, title: 'Achieve 80% in all skills', progress: 75, target: 80, current: 60 }
        ],
        recommendedTimes: [
          { day: 'Monday', time: '18:00', reason: 'Based on your evening study pattern' },
          { day: 'Wednesday', time: '17:00', reason: 'Your most productive day' },
          { day: 'Friday', time: '19:30', reason: 'Weekend preparation' }
        ]
      });
    } catch (err) {
      error('Failed to load schedule');
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    try {
      // This would need to be implemented in the API
      // await personalizedCurriculumAPI.addStudySession(newSession);
      success('Study session added successfully!');
      setShowAddSession(false);
      setNewSession({ date: '', time: '', duration: 30, type: 'lesson', goal: '' });
      loadSchedule(); // Reload to get updated data
    } catch (err) {
      error('Failed to add study session');
      console.error('Error adding study session:', err);
    }
  };

  const handleCompleteSession = async (sessionId: number) => {
    try {
      // This would need to be implemented in the API
      // await personalizedCurriculumAPI.completeStudySession(sessionId);
      success('Session marked as completed!');
      loadSchedule(); // Reload to get updated data
    } catch (err) {
      error('Failed to complete session');
      console.error('Error completing session:', err);
    }
  };

  const getSessionTypeIcon = (type: string) => {
    const icons = {
      lesson: '📝',
      test: '🧪',
      practice: '💪',
      review: '🔄'
    };
    return icons[type as keyof typeof icons] || '📚';
  };

  const getSessionTypeColor = (type: string) => {
    const colors = {
      lesson: 'bg-blue-100 text-blue-800',
      test: 'bg-purple-100 text-purple-800',
      practice: 'bg-green-100 text-green-800',
      review: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getSessionsForDate = (date: Date) => {
    if (!schedule) return [];
    const dateString = date.toISOString().split('T')[0];
    return schedule.studySessions.filter((session: any) => session.date === dateString);
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

  if (!schedule) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No schedule found</h2>
          <p className="text-gray-600 mb-4">Create your study schedule to get started.</p>
          <button
            onClick={() => setShowAddSession(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Schedule
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const selectedDateSessions = getSessionsForDate(selectedDate);

  return (
    <DashboardLayout allowedRoles={['student']}>
      <Head>
        <title>Study Schedule - Verbfy</title>
      </Head>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Schedule</h1>
              <p className="text-gray-600">
                Plan your learning journey and track your study goals
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddSession(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Session
              </button>
              <button
                onClick={() => router.push('/personalized-curriculum')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Curriculum
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Goal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedule.completedThisWeek}/{schedule.weeklyGoal}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Goal</p>
                <p className="text-2xl font-bold text-gray-900">{schedule.dailyGoal} min</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">⏰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Time</p>
                <p className="text-2xl font-bold text-gray-900">{schedule.averageTimePerDay} min</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedule.studySessions.filter((s: any) => !s.completed).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Study Calendar</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ←
                </button>
                <span className="font-medium text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2"></div>;
                }

                const sessions = getSessionsForDate(day);
                const isSelected = selectedDate.toDateString() === day.toDateString();
                const isToday = new Date().toDateString() === day.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`p-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="text-right mb-1">
                      <span className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </span>
                    </div>
                    {sessions.length > 0 && (
                      <div className="space-y-1">
                        {sessions.slice(0, 2).map((session: any) => (
                          <div
                            key={session.id}
                            className={`w-full h-1 rounded-full ${
                              session.completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          ></div>
                        ))}
                        {sessions.length > 2 && (
                          <div className="text-xs text-gray-500">+{sessions.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {formatDate(selectedDate.toISOString())}
            </h3>

            {selectedDateSessions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📅</div>
                <p className="text-gray-600 mb-4">No study sessions scheduled</p>
                <button
                  onClick={() => {
                    setNewSession({
                      ...newSession,
                      date: selectedDate.toISOString().split('T')[0]
                    });
                    setShowAddSession(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateSessions.map((session: any) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span>{getSessionTypeIcon(session.type)}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSessionTypeColor(session.type)}`}>
                          {session.type}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{session.time}</span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">{session.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{session.goal}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{session.duration} minutes</span>
                      {session.completed ? (
                        <span className="text-sm text-green-600 font-medium">✓ Completed</span>
                      ) : (
                        <button
                          onClick={() => handleCompleteSession(session.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Study Goals */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Study Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schedule.studyGoals.map((goal: any) => (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                  <span className="text-sm font-semibold text-gray-600">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Study Times */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommended Study Times</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedule.recommendedTimes.map((recommendation: any, index: number) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-blue-900">{recommendation.day}</span>
                  <span className="text-sm text-blue-700">{recommendation.time}</span>
                </div>
                <p className="text-sm text-blue-600">{recommendation.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Session Modal */}
        {showAddSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Study Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <select
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSession.type}
                    onChange={(e) => setNewSession({ ...newSession, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lesson">Lesson</option>
                    <option value="test">Test</option>
                    <option value="practice">Practice</option>
                    <option value="review">Review</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                  <input
                    type="text"
                    value={newSession.goal}
                    onChange={(e) => setNewSession({ ...newSession, goal: e.target.value })}
                    placeholder="e.g., Complete 3 grammar exercises"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddSession(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSession}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 