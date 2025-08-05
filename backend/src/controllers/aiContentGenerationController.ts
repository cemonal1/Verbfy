import { Request, Response } from 'express';
import AIContentGeneration from '../models/AIContentGeneration';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export class AIContentGenerationController {
  // Generate new content
  static async generateContent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        contentType,
        topic,
        targetLevel,
        skillFocus,
        generationPrompt,
        customParameters
      } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Validate required fields
      if (!contentType || !topic || !targetLevel || !skillFocus) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: contentType, topic, targetLevel, skillFocus' 
        });
      }

      // Create content generation record
      const contentGeneration = new AIContentGeneration({
        userId,
        contentType,
        topic,
        targetLevel,
        skillFocus,
        generationPrompt: generationPrompt || `Generate ${contentType} content for ${topic} at ${targetLevel} level focusing on ${skillFocus}`,
        status: 'generating'
      });

      await contentGeneration.save();

      // Simulate AI content generation (in real implementation, this would call OpenAI API)
      const generatedContent = await this.simulateAIContentGeneration(
        contentType,
        topic,
        targetLevel,
        skillFocus,
        generationPrompt,
        customParameters
      );

      // Update the record with generated content
      contentGeneration.generatedContent = generatedContent;
      contentGeneration.status = 'completed';
      contentGeneration.tokensUsed = Math.floor(Math.random() * 1000) + 500;
      contentGeneration.cost = (contentGeneration.tokensUsed * 0.002) / 1000; // Approximate cost
      contentGeneration.quality = {
        relevance: Math.floor(Math.random() * 30) + 70, // 70-100
        accuracy: Math.floor(Math.random() * 20) + 80, // 80-100
        engagement: Math.floor(Math.random() * 25) + 75, // 75-100
        overall: 0
      };

      await contentGeneration.save();

      res.status(201).json({
        success: true,
        data: contentGeneration,
        message: 'Content generated successfully'
      });
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate content'
      });
    }
  }

  // Get user's generated content
  static async getUserContent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { contentType, status, page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const filter: any = { userId };
      if (contentType) filter.contentType = contentType;
      if (status) filter.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const content = await AIContentGeneration.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email');

      const total = await AIContentGeneration.countDocuments(filter);

      res.json({
        success: true,
        data: content,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching user content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content'
      });
    }
  }

  // Get content by ID
  static async getContentById(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const content = await AIContentGeneration.findById(id)
        .populate('userId', 'name email')
        .populate('approvedBy', 'name email');

      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      // Check if user has access to this content
      if (content.userId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch content'
      });
    }
  }

  // Update content quality assessment
  static async updateQualityAssessment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { relevance, accuracy, engagement } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const content = await AIContentGeneration.findById(id);

      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      if (content.userId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Update quality metrics
      if (relevance !== undefined) content.quality.relevance = relevance;
      if (accuracy !== undefined) content.quality.accuracy = accuracy;
      if (engagement !== undefined) content.quality.engagement = engagement;

      // Recalculate overall quality
      content.quality.overall = Math.round((content.quality.relevance + content.quality.accuracy + content.quality.engagement) / 3);

      await content.save();

      res.json({
        success: true,
        data: content,
        message: 'Quality assessment updated successfully'
      });
    } catch (error) {
      console.error('Error updating quality assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update quality assessment'
      });
    }
  }

  // Approve content (for admins/teachers)
  static async approveContent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { reviewNotes } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Check if user is admin or teacher
      const user = await User.findById(userId);
      if (!user || !['admin', 'teacher'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied. Admin or teacher role required.' });
      }

      const content = await AIContentGeneration.findById(id);

      if (!content) {
        return res.status(404).json({ success: false, message: 'Content not found' });
      }

      content.status = 'published';
      content.reviewNotes = reviewNotes;
      content.approvedBy = new mongoose.Types.ObjectId(userId);
      content.approvedAt = new Date();

      await content.save();

      res.json({
        success: true,
        data: content,
        message: 'Content approved successfully'
      });
    } catch (error) {
      console.error('Error approving content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve content'
      });
    }
  }

  // Get content analytics
  static async getContentAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { timeRange = '30d' } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
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
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const analytics = await AIContentGeneration.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalContent: { $sum: 1 },
            totalTokens: { $sum: '$tokensUsed' },
            totalCost: { $sum: '$cost' },
            averageQuality: { $avg: '$quality.overall' },
            contentTypeDistribution: {
              $push: '$contentType'
            },
            statusDistribution: {
              $push: '$status'
            }
          }
        }
      ]);

      const contentTypeCounts = analytics[0]?.contentTypeDistribution?.reduce((acc: any, type: string) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      const statusCounts = analytics[0]?.statusDistribution?.reduce((acc: any, status: string) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}) || {};

      res.json({
        success: true,
        data: {
          totalContent: analytics[0]?.totalContent || 0,
          totalTokens: analytics[0]?.totalTokens || 0,
          totalCost: analytics[0]?.totalCost || 0,
          averageQuality: Math.round(analytics[0]?.averageQuality || 0),
          contentTypeDistribution: contentTypeCounts,
          statusDistribution: statusCounts
        }
      });
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  }

  // Simulate AI content generation (placeholder for real AI integration)
  private static async simulateAIContentGeneration(
    contentType: string,
    topic: string,
    targetLevel: string,
    skillFocus: string,
    prompt: string,
    customParameters?: any
  ) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const contentTemplates = {
      lesson: {
        title: `${topic} - ${skillFocus} Lesson`,
        description: `A comprehensive lesson on ${topic} focusing on ${skillFocus} skills for ${targetLevel} level students.`,
        content: {
          objectives: [`Understand ${topic} concepts`, `Practice ${skillFocus} skills`, `Apply knowledge in real contexts`],
          sections: [
            {
              title: 'Introduction',
              content: `Welcome to our lesson on ${topic}. Today we'll focus on developing your ${skillFocus} skills.`
            },
            {
              title: 'Main Content',
              content: `This section covers the key aspects of ${topic} and how they relate to ${skillFocus}.`
            },
            {
              title: 'Practice Activities',
              content: `Engage in various activities to strengthen your ${skillFocus} abilities.`
            }
          ],
          exercises: [
            {
              type: 'multiple_choice',
              question: `What is the main focus of ${topic}?`,
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 0
            }
          ]
        },
        metadata: {
          estimatedDuration: 45,
          difficulty: 5,
          tags: [topic, skillFocus, targetLevel],
          learningObjectives: [`Master ${topic} concepts`, `Improve ${skillFocus} skills`]
        }
      },
      exercise: {
        title: `${topic} - ${skillFocus} Exercise`,
        description: `Practice exercises for ${topic} focusing on ${skillFocus} at ${targetLevel} level.`,
        content: {
          instructions: `Complete the following exercises to practice your ${skillFocus} skills.`,
          exercises: [
            {
              type: 'fill_blank',
              question: `Complete the sentence: "The main idea of ${topic} is..."`,
              answer: 'to improve understanding'
            }
          ]
        },
        metadata: {
          estimatedDuration: 20,
          difficulty: 4,
          tags: [topic, skillFocus, targetLevel],
          learningObjectives: [`Practice ${skillFocus}`, `Reinforce ${topic} knowledge`]
        }
      },
      assessment: {
        title: `${topic} - ${skillFocus} Assessment`,
        description: `Assessment to evaluate ${skillFocus} skills in ${topic} for ${targetLevel} level.`,
        content: {
          instructions: `This assessment will test your understanding of ${topic} and ${skillFocus} skills.`,
          questions: [
            {
              type: 'essay',
              question: `Explain how ${topic} relates to ${skillFocus}.`,
              rubric: ['Clear explanation', 'Examples provided', 'Logical structure']
            }
          ]
        },
        metadata: {
          estimatedDuration: 60,
          difficulty: 6,
          tags: [topic, skillFocus, targetLevel],
          learningObjectives: [`Assess ${skillFocus} proficiency`, `Evaluate ${topic} understanding`]
        }
      }
    };

    return contentTemplates[contentType as keyof typeof contentTemplates] || contentTemplates.lesson;
  }
} 