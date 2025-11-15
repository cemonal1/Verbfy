import { Request, Response } from 'express';
import TeacherAnalytics from '../models/TeacherAnalytics';
import { VerbfyLesson } from '../models/VerbfyLesson';
import { LessonProgress } from '../models/LessonProgress';
import { LessonAttempt } from '../models/LessonAttempt';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const teacherAnalyticsLogger = createLogger('TeacherAnalyticsController');

export class TeacherAnalyticsController {
  // Generate comprehensive teacher analytics
  static async generateTeacherAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const teacherId = req.user.id;
      const { timeRange = '30d' } = req.query;

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

      // Get teacher's lessons
      const lessons = await VerbfyLesson.find({
        createdBy: teacherId,
        createdAt: { $gte: startDate }
      });

      // Get lesson attempts for teacher's lessons
      const lessonIds = lessons.map(lesson => lesson._id);
      const lessonProgress = await LessonProgress.find({
        lessonId: { $in: lessonIds },
        createdAt: { $gte: startDate }
      });

      // Get lesson attempts
      const lessonAttempts = await LessonAttempt.find({
        lessonId: { $in: lessonIds },
        createdAt: { $gte: startDate }
      });

      // Calculate analytics
      const analytics = {
        totalLessons: lessons.length,
        totalStudents: new Set(lessonProgress.map(p => p.student.toString())).size,
        totalEarnings: this.calculateTotalEarnings(lessonAttempts),
        averageRating: this.calculateAverageRating(lessonProgress),
        monthlyTrend: await this.calculateMonthlyTrend(teacherId, startDate),
        recentRatings: await this.getRecentRatings(teacherId, startDate),
        lessonTypeBreakdown: this.calculateLessonTypeBreakdown(lessons),
        studentPerformance: this.calculateStudentPerformance(lessonProgress),
        lessonAnalytics: this.calculateLessonAnalytics(lessons, lessonProgress),
        engagementMetrics: this.calculateEngagementMetrics(lessonAttempts)
      };

      // Save analytics
      const teacherAnalytics = new TeacherAnalytics({
        teacherId,
        analytics,
        timeRange: timeRange as string,
        generatedAt: new Date()
      });

      await teacherAnalytics.save();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      teacherAnalyticsLogger.error('Error', { error: 'Error generating teacher analytics:', error });
      res.status(500).json({
        success: false,
        message: 'Failed to generate analytics'
      });
    }
  }

  // Get teacher analytics
  static async getTeacherAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const teacherId = req.user.id;
      const { timeRange = '30d' } = req.query;

      const analytics = await TeacherAnalytics.findOne({
        teacherId,
        timeRange
      }).sort({ generatedAt: -1 });

      if (!analytics) {
        res.status(404).json({
          success: false,
          message: 'Analytics not found'
        });
        return;
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      teacherAnalyticsLogger.error('Error', { error: 'Error fetching teacher analytics:', error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  }

  // Get student performance analytics
  static async getStudentPerformance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const teacherId = req.user.id;
      const { studentId } = req.params;

      // Get teacher's lessons
      const lessons = await VerbfyLesson.find({ createdBy: teacherId });
      const lessonIds = lessons.map(lesson => lesson._id);

      // Get student's progress for teacher's lessons
      const lessonProgress = await LessonProgress.find({
        student: studentId,
        lessonId: { $in: lessonIds }
      });

      const performance = this.calculateStudentPerformance(lessonProgress);

      res.json({
        success: true,
        data: performance
      });
    } catch (error: any) {
      teacherAnalyticsLogger.error('Error', { error: 'Error fetching student performance:', error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student performance'
      });
    }
  }

  // Get lesson analytics
  static async getLessonAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const teacherId = req.user.id;
      const { lessonId } = req.params;

      // Verify lesson belongs to teacher
      const lesson = await VerbfyLesson.findOne({
        _id: lessonId,
        createdBy: teacherId
      });

      if (!lesson) {
        res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
        return;
      }

      // Get lesson progress
      const lessonProgress = await LessonProgress.find({ lessonId });

      const analytics = this.calculateLessonAnalytics([lesson], lessonProgress);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      teacherAnalyticsLogger.error('Error', { error: 'Error fetching lesson analytics:', error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lesson analytics'
      });
    }
  }

  // Get engagement metrics
  static async getEngagementMetrics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const teacherId = req.user.id;
      const { timeRange = '30d' } = req.query;

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

      // Get teacher's lessons
      const lessons = await VerbfyLesson.find({
        createdBy: teacherId,
        createdAt: { $gte: startDate }
      });

      const lessonIds = lessons.map(lesson => lesson._id);

      // Get lesson attempts
      const lessonAttempts = await LessonAttempt.find({
        lessonId: { $in: lessonIds },
        createdAt: { $gte: startDate }
      });

      const metrics = this.calculateEngagementMetrics(lessonAttempts);

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      teacherAnalyticsLogger.error('Error', { error: 'Error fetching engagement metrics:', error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch engagement metrics'
      });
    }
  }

  // Helper methods
  private static calculateTotalEarnings(lessonAttempts: any[]): number {
    return lessonAttempts.reduce((total: number, attempt: any) => {
      return total + (attempt.earnings || 0);
    }, 0);
  }

  private static calculateAverageRating(lessonProgress: any[]): number {
    return lessonProgress.length > 0
      ? lessonProgress.reduce((sum: number, progress: any) => sum + progress.score, 0) / lessonProgress.length
      : 0;
  }

  private static async calculateMonthlyTrend(teacherId: string, startDate: Date) {
    const lessons = await VerbfyLesson.aggregate([
      {
        $match: {
          createdBy: teacherId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          lessonCount: { $sum: 1 },
          earnings: { $sum: '$hourlyRate' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    return lessons;
  }

  private static async getRecentRatings(teacherId: string, startDate: Date) {
    const lessons = await VerbfyLesson.find({
      createdBy: teacherId,
      createdAt: { $gte: startDate }
    });

    const lessonIds = lessons.map(lesson => lesson._id);

    const recentRatings = await LessonProgress.aggregate([
      {
        $match: {
          lessonId: { $in: lessonIds },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          _id: 1,
          rating: '$score',
          review: '$feedback',
          createdAt: 1,
          student: {
            name: '$student.name'
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return recentRatings;
  }

  private static calculateLessonTypeBreakdown(lessons: any[]) {
    const breakdown = lessons.reduce((acc: any, lesson: any) => {
      const type = lesson.lessonType;
      if (!acc[type]) {
        acc[type] = { count: 0, earnings: 0 };
      }
      acc[type].count += 1;
      acc[type].earnings += lesson.hourlyRate || 0;
      return acc;
    }, {});

    return Object.entries(breakdown).map(([type, data]: [string, any]) => ({
      _id: type,
      count: data.count,
      earnings: data.earnings
    }));
  }

  private static calculateStudentPerformance(lessonProgress: any[]) {
    const averageScore = lessonProgress.length > 0
      ? lessonProgress.reduce((sum: number, progress: any) => sum + progress.score, 0) / lessonProgress.length
      : 0;

    const completedLessons = lessonProgress.filter((progress: any) => progress.isCompleted).length;
    const totalLessons = lessonProgress.length;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return {
      averageScore: Math.round(averageScore),
      completionRate: Math.round(completionRate),
      totalLessons,
      completedLessons
    };
  }

  private static calculateLessonAnalytics(lessons: any[], lessonProgress: any[]) {
    const lessonAnalytics = lessons.map(lesson => {
      const progress = lessonProgress.filter((p: any) => p.lessonId.equals(lesson._id));
      
      const averageScore = progress.length > 0
        ? progress.reduce((sum: number, p: any) => sum + p.score, 0) / progress.length
        : 0;

      const completedLessons = progress.filter((p: any) => p.isCompleted).length;
      const totalAttempts = progress.length;
      const completionRate = totalAttempts > 0 ? (completedLessons / totalAttempts) * 100 : 0;

      return {
        lessonId: lesson._id,
        title: lesson.title,
        averageScore: Math.round(averageScore),
        completionRate: Math.round(completionRate),
        totalAttempts,
        completedAttempts: completedLessons
      };
    });

    return lessonAnalytics;
  }

  private static calculateEngagementMetrics(lessonAttempts: any[]) {
    const totalAttempts = lessonAttempts.length;
    const completedAttempts = lessonAttempts.filter((progress: any) => progress.isCompleted).length;
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;

    const averageScore = lessonAttempts.length > 0
      ? lessonAttempts.reduce((sum: number, progress: any) => sum + progress.score, 0) / lessonAttempts.length
      : 0;

    const averageTimeSpent = lessonAttempts.length > 0
      ? lessonAttempts.reduce((sum: number, progress: any) => sum + (progress.timeSpent || 0), 0) / lessonAttempts.length
      : 0;

    const difficultyDistribution = {
      easy: lessonAttempts.filter((p: any) => p.score >= 80).length,
      medium: lessonAttempts.filter((p: any) => p.score >= 60 && p.score < 80).length,
      hard: lessonAttempts.filter((p: any) => p.score < 60).length
    };

    return {
      totalAttempts,
      completedAttempts,
      completionRate: Math.round(completionRate),
      averageScore: Math.round(averageScore),
      averageTimeSpent: Math.round(averageTimeSpent),
      difficultyDistribution
    };
  }
}