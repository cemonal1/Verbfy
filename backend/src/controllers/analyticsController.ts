import { Request, Response } from 'express';
import User from '../models/User';
import { Lesson } from '../models/Lesson';
import { Payment } from '../models/Payment';

// Teacher Analytics
export const getTeacherAnalytics = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Verify user is a teacher
    if (userRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only teachers can view teacher analytics.'
      });
    }

    // Get current date and 6 months ago
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    // Aggregate teacher data
    const teacherStats = await Lesson.aggregate([
      {
        $match: {
          teacherId: teacherId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalLessons: { $sum: 1 },
          totalStudents: { $addToSet: '$studentId' },
          totalEarnings: { $sum: '$price' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          totalLessons: 1,
          totalStudents: { $size: '$totalStudents' },
          totalEarnings: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    // Get monthly lesson trend (last 6 months)
    const monthlyTrend = await Lesson.aggregate([
      {
        $match: {
          teacherId: teacherId,
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          lessonCount: { $sum: 1 },
          earnings: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent ratings
    const recentRatings = await Lesson.aggregate([
      {
        $match: {
          teacherId: teacherId,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
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
          rating: 1,
          review: 1,
          createdAt: 1,
          'student.name': 1
        }
      }
    ]);

    // Get lesson type breakdown
    const lessonTypeBreakdown = await Lesson.aggregate([
      {
        $match: {
          teacherId: teacherId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          earnings: { $sum: '$price' }
        }
      }
    ]);

    const stats = teacherStats[0] || {
      totalLessons: 0,
      totalStudents: 0,
      totalEarnings: 0,
      averageRating: 0
    };

    res.json({
      success: true,
      data: {
        ...stats,
        monthlyTrend,
        recentRatings,
        lessonTypeBreakdown
      },
      message: 'Teacher analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting teacher analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve teacher analytics'
    });
  }
};

// Student Analytics
export const getStudentAnalytics = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // Verify user is a student
    if (userRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only students can view student analytics.'
      });
    }

    // Get current date and 30 days ago for streak calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate student data
    const studentStats = await Lesson.aggregate([
      {
        $match: {
          studentId: studentId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalLessons: { $sum: 1 },
          totalHours: { $sum: '$duration' },
          totalSpent: { $sum: '$price' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          _id: 0,
          totalLessons: 1,
          totalHours: { $round: ['$totalHours', 2] },
          totalSpent: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    // Calculate activity streak
    const activityStreak = await Lesson.aggregate([
      {
        $match: {
          studentId: studentId,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          lessonCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 }
      }
    ]);

    // Get skill progress (based on lesson types)
    const skillProgress = await Lesson.aggregate([
      {
        $match: {
          studentId: studentId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalHours: { $sum: '$duration' },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $project: {
          skill: '$_id',
          count: 1,
          totalHours: { $round: ['$totalHours', 2] },
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await Lesson.aggregate([
      {
        $match: {
          studentId: studentId,
          status: 'completed'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'users',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $unwind: '$teacher'
      },
      {
        $project: {
          _id: 1,
          type: 1,
          duration: 1,
          rating: 1,
          createdAt: 1,
          'teacher.name': 1
        }
      }
    ]);

    const stats = studentStats[0] || {
      totalLessons: 0,
      totalHours: 0,
      totalSpent: 0,
      averageRating: 0
    };

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const hasActivity = activityStreak.some(day => 
        day._id.year === checkDate.getFullYear() &&
        day._id.month === checkDate.getMonth() + 1 &&
        day._id.day === checkDate.getDate()
      );
      
      if (hasActivity) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        ...stats,
        currentStreak,
        skillProgress,
        recentActivity
      },
      message: 'Student analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting student analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student analytics'
    });
  }
};

// Admin Analytics
export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    // Verify user is an admin
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can view admin analytics.'
      });
    }

    // Get current date and 12 months ago
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    // Get total users by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total revenue
    const revenueStats = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    // Get monthly growth trend
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get top 5 teachers by earnings
    const topTeachers = await Lesson.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$teacherId',
          totalEarnings: { $sum: '$price' },
          totalLessons: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { totalEarnings: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $unwind: '$teacher'
      },
      {
        $project: {
          _id: 1,
          name: '$teacher.name',
          email: '$teacher.email',
          totalEarnings: 1,
          totalLessons: 1,
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    // Get top 5 students by activity
    const topStudents = await Lesson.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$studentId',
          totalLessons: { $sum: 1 },
          totalHours: { $sum: '$duration' },
          totalSpent: { $sum: '$price' }
        }
      },
      {
        $sort: { totalLessons: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
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
          name: '$student.name',
          email: '$student.email',
          totalLessons: 1,
          totalHours: { $round: ['$totalHours', 2] },
          totalSpent: 1
        }
      }
    ]);

    // Get lesson type distribution
    const lessonTypeDistribution = await Lesson.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      }
    ]);

    // Calculate totals
    const totalUsers = userStats.reduce((sum: number, stat) => sum + stat.count, 0);
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalPayments = revenueStats[0]?.totalPayments || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRevenue,
        totalPayments,
        userStats,
        monthlyGrowth,
        topTeachers,
        topStudents,
        lessonTypeDistribution
      },
      message: 'Admin analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting admin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin analytics'
    });
  }
}; 