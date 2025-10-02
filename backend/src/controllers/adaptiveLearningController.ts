import { Request, Response } from 'express';
import AdaptivePath, { IAdaptivePath } from '../models/AdaptivePath';
import { VerbfyLesson, IVerbfyLesson } from '../models/VerbfyLesson';
import User from '../models/User';
import { createLogger } from '../utils/logger';

const logger = createLogger('AdaptiveLearningController');

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Get all adaptive learning paths for a user
export const getAdaptivePaths = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const paths = await AdaptivePath.find({ userId })
      .populate('modules.moduleId', 'title description difficulty estimatedDuration')
      .sort({ 'progress.lastActivity': -1 });

    logger.info(`Retrieved ${paths.length} adaptive paths for user ${userId}`);
    
    res.json({
      success: true,
      data: paths,
      count: paths.length
    });
  } catch (error) {
    logger.error('Error getting adaptive paths:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve adaptive learning paths',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create a new adaptive learning path
export const createAdaptivePath = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const {
      pathName,
      description,
      targetCEFRLevel,
      currentCEFRLevel,
      estimatedDuration,
      focusAreas = []
    } = req.body;

    // Validate required fields
    if (!pathName || !description || !targetCEFRLevel || !currentCEFRLevel) {
      res.status(400).json({ 
        error: 'Missing required fields: pathName, description, targetCEFRLevel, currentCEFRLevel' 
      });
      return;
    }

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find appropriate lessons based on CEFR level and focus areas
    const lessonQuery: any = {
      difficulty: currentCEFRLevel,
      isActive: true
    };

    if (focusAreas.length > 0) {
      lessonQuery.category = { $in: focusAreas };
    }

    const availableLessons = await VerbfyLesson.find(lessonQuery)
      .limit(20) // Limit to 20 lessons for initial path
      .sort({ order: 1 });

    // Create modules from lessons
    const modules = availableLessons.map((lesson: IVerbfyLesson, index: number) => ({
      moduleId: lesson._id,
      moduleType: lesson.category || 'grammar',
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty || 'beginner',
      estimatedDuration: lesson.estimatedDuration || 30,
      prerequisites: index > 0 ? [availableLessons[index - 1]._id] : [],
      isCompleted: false,
      performance: {
        score: 0,
        attempts: 0,
        timeSpent: 0
      }
    }));

    // Create the adaptive path
    const adaptivePath = new AdaptivePath({
      userId,
      pathName,
      description,
      targetCEFRLevel,
      currentCEFRLevel,
      estimatedDuration: estimatedDuration || 30,
      progress: {
        completedLessons: 0,
        totalLessons: modules.length,
        currentModule: 0,
        overallProgress: 0,
        lastActivity: new Date()
      },
      modules,
      adaptiveRules: {
        difficultyAdjustment: 'auto',
        paceAdjustment: 'normal',
        focusAreas,
        skipPrerequisites: false
      },
      analytics: {
        timeToComplete: 0,
        averageScore: 0,
        retentionRate: 0,
        engagementScore: 0,
        difficultyProgression: []
      },
      status: 'active'
    });

    await adaptivePath.save();

    logger.info(`Created adaptive path ${pathName} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      data: adaptivePath,
      message: 'Adaptive learning path created successfully'
    });
  } catch (error) {
    logger.error('Error creating adaptive path:', error);
    res.status(500).json({ 
      error: 'Failed to create adaptive learning path',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get current recommendations for a user
export const getCurrentRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Find the user's active adaptive path
    const activePath = await AdaptivePath.findOne({ 
      userId, 
      status: 'active' 
    }).populate('modules.moduleId', 'title description difficulty estimatedDuration category');

    if (!activePath) {
      res.json({
        success: true,
        data: {
          hasActivePath: false,
          recommendations: [],
          message: 'No active adaptive learning path found. Create one to get personalized recommendations.'
        }
      });
      return;
    }

    // Get current module and next recommendations
    const currentModuleIndex = activePath.progress.currentModule;
    const modules = activePath.modules;
    
    // Get next 3 modules as recommendations
    const recommendations = modules
      .slice(currentModuleIndex, currentModuleIndex + 3)
      .map((module, index) => ({
        moduleId: module.moduleId,
        title: module.title,
        description: module.description,
        difficulty: module.difficulty,
        estimatedDuration: module.estimatedDuration,
        moduleType: module.moduleType,
        isNext: index === 0,
        isCompleted: module.isCompleted,
        prerequisites: module.prerequisites,
        performance: module.performance
      }));

    // Calculate path analytics
    const pathAnalytics = {
      overallProgress: activePath.progress.overallProgress,
      completedLessons: activePath.progress.completedLessons,
      totalLessons: activePath.progress.totalLessons,
      currentCEFRLevel: activePath.currentCEFRLevel,
      targetCEFRLevel: activePath.targetCEFRLevel,
      effectiveness: activePath.calculateEffectiveness(),
      lastActivity: activePath.progress.lastActivity
    };

    logger.info(`Generated ${recommendations.length} recommendations for user ${userId}`);
    
    res.json({
      success: true,
      data: {
        hasActivePath: true,
        pathId: activePath._id,
        pathName: activePath.pathName,
        recommendations,
        analytics: pathAnalytics,
        adaptiveRules: activePath.adaptiveRules
      }
    });
  } catch (error) {
    logger.error('Error getting current recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get current recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update path progress
export const updatePathProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { pathId } = req.params;
    const { moduleId, score, timeSpent } = req.body;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!moduleId) {
      res.status(400).json({ error: 'Module ID is required' });
      return;
    }

    const adaptivePath = await AdaptivePath.findOne({ 
      _id: pathId, 
      userId 
    });

    if (!adaptivePath) {
      res.status(404).json({ error: 'Adaptive path not found' });
      return;
    }

    // Find the module and update its performance
    const moduleIndex = adaptivePath.modules.findIndex(
      (m: any) => m.moduleId.toString() === moduleId
    );

    if (moduleIndex === -1) {
      res.status(404).json({ error: 'Module not found in path' });
      return;
    }

    const module = adaptivePath.modules[moduleIndex];
    
    // Update module performance
    module.performance.attempts += 1;
    module.performance.timeSpent += timeSpent || 0;
    
    if (score !== undefined) {
      module.performance.score = Math.max(module.performance.score, score);
    }

    // Mark as completed if score is above threshold (70%)
    if (score >= 70 && !module.isCompleted) {
      adaptivePath.updateProgress(module.moduleId);
    }

    // Update analytics
    const completedModules = adaptivePath.modules.filter((m: any) => m.isCompleted);
    if (completedModules.length > 0) {
      adaptivePath.analytics.averageScore = completedModules.reduce(
        (sum: number, m: any) => sum + m.performance.score, 0
      ) / completedModules.length;
    }

    await adaptivePath.save();

    logger.info(`Updated progress for path ${pathId}, module ${moduleId}, user ${userId}`);
    
    res.json({
      success: true,
      data: {
        pathId: adaptivePath._id,
        moduleId,
        progress: adaptivePath.progress,
        analytics: adaptivePath.analytics,
        isCompleted: module.isCompleted
      },
      message: 'Path progress updated successfully'
    });
  } catch (error) {
    logger.error('Error updating path progress:', error);
    res.status(500).json({ 
      error: 'Failed to update path progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get path analytics
export const getPathAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { pathId } = req.params;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const adaptivePath = await AdaptivePath.findOne({ 
      _id: pathId, 
      userId 
    }).populate('modules.moduleId', 'title category');

    if (!adaptivePath) {
      res.status(404).json({ error: 'Adaptive path not found' });
      return;
    }

    // Calculate detailed analytics
    const moduleAnalytics = adaptivePath.modules.map((module: any) => ({
      moduleId: module.moduleId._id,
      title: module.moduleId.title,
      category: module.moduleId.category,
      difficulty: module.difficulty,
      isCompleted: module.isCompleted,
      performance: module.performance,
      completionDate: module.completionDate
    }));

    const analytics = {
      pathInfo: {
        id: adaptivePath._id,
        name: adaptivePath.pathName,
        status: adaptivePath.status,
        currentCEFRLevel: adaptivePath.currentCEFRLevel,
        targetCEFRLevel: adaptivePath.targetCEFRLevel
      },
      progress: adaptivePath.progress,
      overallAnalytics: adaptivePath.analytics,
      effectiveness: adaptivePath.calculateEffectiveness(),
      moduleAnalytics,
      adaptiveRules: adaptivePath.adaptiveRules
    };

    logger.info(`Retrieved analytics for path ${pathId}, user ${userId}`);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting path analytics:', error);
    res.status(500).json({ 
      error: 'Failed to get path analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};