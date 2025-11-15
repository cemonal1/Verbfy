import { Request, Response } from 'express';
import AILearningSession from '../models/AILearningSession';
import AdaptivePath from '../models/AdaptivePath';
import { VerbfyLesson } from '../models/VerbfyLesson';
import { CEFRTest } from '../models/CEFRTest';
import { PersonalizedCurriculum } from '../models/PersonalizedCurriculum';
import User from '../models/User';
import { generateToken } from '../utils/generateToken';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const aiLearningLogger = createLogger('AiLearningController');

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const createAISession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionType, topic, difficulty, learningObjectives } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const session = new AILearningSession({
      userId,
      sessionType,
      topic,
      difficulty,
      metadata: {
        learningObjectives: learningObjectives || []
      }
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session,
      message: 'AI learning session created successfully'
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error creating AI session:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to create AI learning session'
    });
  }
};

export const getAIResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, userInput, context } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const session = await AILearningSession.findById(sessionId);
    if (!session || !session.userId.equals(userId)) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Simulate AI response (in production, this would integrate with OpenAI API)
    const aiResponse = await generateAIResponse(userInput, context, session.difficulty);
    
    // Update session with user input and AI response
    session.content.userInput = userInput;
    session.content.aiResponse = aiResponse;
    session.metadata.questionsAnswered += 1;
    await session.save();

    res.json({
      success: true,
      data: {
        response: aiResponse,
        sessionId: session._id,
        tokensUsed: session.tokensUsed,
        cost: session.cost
      }
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error getting AI response:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response'
    });
  }
};

export const generateRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { topic, difficulty, limit = 5 } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Get user's learning history
    const recentSessions = await AILearningSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get user's lesson progress
    const lessonProgress = await VerbfyLesson.find({
      'progress.userId': userId
    }).populate('progress');

    // Generate personalized recommendations
    const recommendations = await generatePersonalizedRecommendations(
      user,
      recentSessions,
      lessonProgress,
      topic,
      difficulty,
      limit
    );

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error generating recommendations:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
};

export const updateSessionProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, correctAnswers, duration, rating } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const session = await AILearningSession.findById(sessionId);
    if (!session || !session.userId.equals(userId)) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Update session metadata
    session.metadata.correctAnswers = correctAnswers || session.metadata.correctAnswers;
    session.metadata.duration = duration || session.metadata.duration;
    session.metadata.sessionRating = rating || session.metadata.sessionRating;

    await session.save();

    res.json({
      success: true,
      data: session,
      message: 'Session progress updated successfully'
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error updating session progress:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to update session progress'
    });
  }
};

export const getUserAISessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, sessionType, difficulty } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const filter: any = { userId };
    if (sessionType) filter.sessionType = sessionType;
    if (difficulty) filter.difficulty = difficulty;

    const sessions = await AILearningSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await AILearningSession.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error getting user AI sessions:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to get AI sessions'
    });
  }
};

export const getAISessionAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const sessions = await AILearningSession.find({
      userId,
      createdAt: { $gte: startDate }
    });

    const analytics = calculateSessionAnalytics(sessions);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    aiLearningLogger.error('Error', { error: 'Error getting AI session analytics:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to get session analytics'
    });
  }
};

// Helper functions
const generateAIResponse = async (userInput: string, context: string, difficulty: string): Promise<string> => {
  // Simulate AI response generation
  // In production, this would integrate with OpenAI API
  const responses = {
    beginner: [
      "Great question! Let me explain this in simple terms...",
      "That's a good point. Here's what you need to know...",
      "I understand your question. Let me break this down for you..."
    ],
    intermediate: [
      "Excellent question! This involves understanding the concept of...",
      "You're on the right track. Let me elaborate on this...",
      "That's an interesting perspective. Here's what you should consider..."
    ],
    advanced: [
      "That's a sophisticated question. This relates to advanced concepts in...",
      "You're delving into complex territory. Let me provide a detailed explanation...",
      "This touches on advanced principles. Here's a comprehensive analysis..."
    ]
  };

  const difficultyResponses = responses[difficulty as keyof typeof responses] || responses.beginner;
  const randomResponse = difficultyResponses[Math.floor(Math.random() * difficultyResponses.length)];
  
  return `${randomResponse} ${userInput} ${context}`;
};

const generatePersonalizedRecommendations = async (
  user: any,
  recentSessions: any[],
  lessonProgress: any[],
  topic: string,
  difficulty: string,
  limit: number
) => {
  // Analyze user's learning patterns
  const sessionTypes = recentSessions.map(s => s.sessionType);
  const commonTopics = recentSessions.map(s => s.topic);
  
  // Generate recommendations based on patterns
  const recommendations = [
    {
      type: 'lesson',
      title: 'Advanced Grammar Practice',
      description: 'Based on your recent sessions, you might benefit from this advanced grammar lesson.',
      difficulty: 'intermediate',
      estimatedDuration: 30,
      relevance: 0.9
    },
    {
      type: 'exercise',
      title: 'Vocabulary Building Exercise',
      description: 'Expand your vocabulary with this targeted exercise.',
      difficulty: 'beginner',
      estimatedDuration: 15,
      relevance: 0.8
    },
    {
      type: 'conversation',
      title: 'Speaking Practice Session',
      description: 'Practice your speaking skills with our AI conversation partner.',
      difficulty: 'intermediate',
      estimatedDuration: 20,
      relevance: 0.85
    }
  ];

  return recommendations.slice(0, limit);
};

const calculateSessionAnalytics = (sessions: any[]) => {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      totalDuration: 0,
      averageRating: 0,
      sessionTypeDistribution: {},
      difficultyDistribution: {},
      topicDistribution: {}
    };
  }

  const totalSessions = sessions.length;
  const totalAccuracy = sessions.reduce((sum, session) => sum + session.accuracyPercentage, 0);
  const averageAccuracy = totalAccuracy / totalSessions;
  
  const totalDuration = sessions.reduce((sum, session) => sum + session.metadata.duration, 0);
  const totalRating = sessions.reduce((sum, session) => sum + (session.metadata.sessionRating || 0), 0);
  const averageRating = totalRating / sessions.filter(s => s.metadata.sessionRating).length;

  const sessionTypeDistribution = sessions.reduce((acc, session) => {
    acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
    return acc;
  }, {} as any);

  const difficultyDistribution = sessions.reduce((acc, session) => {
    acc[session.difficulty] = (acc[session.difficulty] || 0) + 1;
    return acc;
  }, {} as any);

  const topicDistribution = sessions.reduce((acc, session) => {
    acc[session.topic] = (acc[session.topic] || 0) + 1;
    return acc;
  }, {} as any);

  return {
    totalSessions,
    averageAccuracy,
    totalDuration,
    averageRating,
    sessionTypeDistribution,
    difficultyDistribution,
    topicDistribution
  };
}; 