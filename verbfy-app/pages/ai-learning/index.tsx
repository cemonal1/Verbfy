import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiLearningAPI } from '@/lib/api';
import { AILearningSession, CreateAISessionData, AIResponseData, Recommendation } from '@/types/aiLearning';
import { 
  ChatBubbleLeftRightIcon, 
  AcademicCapIcon, 
  LightBulbIcon,
  ClockIcon,
  StarIcon,
  ChartBarIcon,
  PlusIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const AILearningPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AILearningSession[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<AILearningSession | null>(null);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionType, setSessionType] = useState<'conversation' | 'exercise' | 'recommendation' | 'feedback'>('conversation');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, recommendationsRes] = await Promise.all([
        aiLearningAPI.getSessions({ limit: 10 }),
        aiLearningAPI.generateRecommendations({ limit: 5 })
      ]);
      
      setSessions(sessionsRes.sessions);
      setRecommendations(recommendationsRes.recommendations);
    } catch (error) {
      console.error('Error loading AI learning data:', error);
      toast.error('Failed to load AI learning data');
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      const sessionData: CreateAISessionData = {
        sessionType,
        topic: topic.trim(),
        difficulty,
        learningObjectives: []
      };

      const response = await aiLearningAPI.createSession(sessionData);
      setActiveSession(response.session);
      setTopic('');
      toast.success('New AI learning session created!');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !activeSession) return;

    const currentInput = userInput;
    setUserInput('');
    setIsTyping(true);

    try {
      const responseData: AIResponseData = {
        sessionId: activeSession._id,
        userInput: currentInput,
        context: activeSession.content.aiResponse
      };

      const response = await aiLearningAPI.getAIResponse(responseData);
      setAiResponse(response.response);
      
      // Update the active session with new content
      setActiveSession(prev => prev ? {
        ...prev,
        content: {
          ...prev.content,
          userInput: currentInput,
          aiResponse: response.response
        }
      } : null);

      toast.success('AI response received!');
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  const startRecommendation = async (recommendation: Recommendation) => {
    try {
      const sessionData: CreateAISessionData = {
        sessionType: recommendation.type as any,
        topic: recommendation.title,
        difficulty: recommendation.difficulty,
        learningObjectives: [recommendation.description]
      };

      const response = await aiLearningAPI.createSession(sessionData);
      setActiveSession(response.session);
      toast.success(`Started ${recommendation.title}!`);
    } catch (error) {
      console.error('Error starting recommendation:', error);
      toast.error('Failed to start recommendation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI Learning Assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600 mr-3" />
            AI Learning Assistant
          </h1>
          <p className="mt-2 text-gray-600">
            Your personalized AI tutor for English learning. Practice conversations, exercises, and get instant feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main AI Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Session Header */}
              <div className="p-6 border-b border-gray-200">
                {activeSession ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeSession.topic}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {activeSession.sessionType} • {activeSession.difficulty} level
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveSession(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Start a New Session
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Type
                        </label>
                        <select
                          value={sessionType}
                          onChange={(e) => setSessionType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="conversation">Conversation Practice</option>
                          <option value="exercise">Exercise</option>
                          <option value="recommendation">Recommendation</option>
                          <option value="feedback">Feedback</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Topic
                        </label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Business English, Travel Vocabulary, Grammar Practice"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty Level
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <button
                        onClick={createNewSession}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Start Session
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Area */}
              {activeSession && (
                <div className="p-6">
                  <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                    {activeSession.content.aiResponse && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 bg-blue-50 rounded-lg p-3">
                          <p className="text-gray-900">{activeSession.content.aiResponse}</p>
                        </div>
                      </div>
                    )}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 bg-blue-50 rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message or question..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!userInput.trim() || isTyping}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LightBulbIcon className="h-5 w-5 text-yellow-500 mr-2" />
                AI Recommendations
              </h3>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                    <h4 className="font-medium text-gray-900 text-sm">{recommendation.title}</h4>
                    <p className="text-gray-600 text-xs mt-1">{recommendation.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {recommendation.estimatedDuration} min • {recommendation.difficulty}
                      </span>
                      <button
                        onClick={() => startRecommendation(recommendation)}
                        className="text-blue-600 hover:text-blue-700 text-xs flex items-center"
                      >
                        <PlayIcon className="h-3 w-3 mr-1" />
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session._id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer">
                    <h4 className="font-medium text-gray-900 text-sm">{session.topic}</h4>
                    <p className="text-gray-600 text-xs mt-1">
                      {session.sessionType} • {session.difficulty}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center text-xs text-gray-500">
                        <StarIcon className="h-3 w-3 mr-1" />
                        {session.metadata.sessionRating || 'No rating'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-green-500 mr-2" />
                Your Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Sessions</span>
                  <span className="text-sm font-medium">{sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <span className="text-sm font-medium">
                    {sessions.length > 0 
                      ? (sessions.reduce((acc, s) => acc + (s.metadata.sessionRating || 0), 0) / sessions.length).toFixed(1)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Time</span>
                  <span className="text-sm font-medium">
                    {sessions.reduce((acc, s) => acc + s.metadata.duration, 0)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILearningPage; 