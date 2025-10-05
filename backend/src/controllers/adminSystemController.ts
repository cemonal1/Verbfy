import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { Material } from '../models/Material';
import { Reservation } from '../models/Reservation';
import AuditLog from '../models/AuditLog';
import { cacheService } from '../services/cacheService';
import { createLogger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

const adminSystemLogger = createLogger('admin-system');

/**
 * Get system health and status
 * GET /api/admin/system/health
 */
export const getSystemHealth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();

    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check cache service
    let cacheStatus = 'unknown';
    try {
      await cacheService.set('health-check', 'ok', 10);
      const cacheTest = await cacheService.get('health-check');
      cacheStatus = cacheTest === 'ok' ? 'connected' : 'error';
    } catch (error) {
      cacheStatus = 'error';
    }

    // Get basic system metrics
    const [userCount, materialCount, reservationCount] = await Promise.all([
      User.countDocuments(),
      Material.countDocuments(),
      Reservation.countDocuments()
    ]);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          connection: mongoose.connection.name || 'unknown'
        },
        cache: {
          status: cacheStatus
        }
      },
      metrics: {
        responseTime: `${responseTime}ms`,
        totalUsers: userCount,
        totalMaterials: materialCount,
        totalReservations: reservationCount
      },
      uptime: process.uptime()
    };

    adminSystemLogger.info('System health check performed', {
      adminId: req.user?.id,
      responseTime,
      dbStatus,
      cacheStatus
    });

    res.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    adminSystemLogger.error('System health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
};

/**
 * Get system statistics and metrics
 * GET /api/admin/system/stats
 */
export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get user registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Get material upload trends
    const materialTrends = await Material.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Get reservation trends
    const reservationTrends = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Get top active users
    const topUsers = await User.find({
      lastLoginAt: { $gte: startDate }
    })
    .select('name email role lastLoginAt')
    .sort({ lastLoginAt: -1 })
    .limit(10)
    .lean();

    const stats = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      trends: {
        users: userTrends,
        materials: materialTrends,
        reservations: reservationTrends
      },
      topActiveUsers: topUsers
    };

    adminSystemLogger.info('System stats retrieved', {
      adminId: req.user?.id,
      period,
      userTrendsCount: userTrends.length,
      materialTrendsCount: materialTrends.length
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    adminSystemLogger.error('Failed to retrieve system stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics'
    });
  }
};

/**
 * Clear system cache
 * POST /api/admin/system/cache/clear
 */
export const clearCache = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pattern } = req.body;

    let clearedKeys = 0;
    
    if (pattern) {
      // Clear specific pattern
      clearedKeys = await cacheService.deletePattern(pattern);
    } else {
      // Clear all cache
      await cacheService.flushAll();
      clearedKeys = -1; // Indicates full flush
    }

    adminSystemLogger.info('Cache cleared by admin', {
      adminId: req.user?.id,
      pattern: pattern || 'all',
      clearedKeys,
      ip: req.ip
    });

    res.json({
      success: true,
      message: pattern ? `Cleared ${clearedKeys} cache entries matching pattern: ${pattern}` : 'All cache cleared',
      data: {
        pattern: pattern || 'all',
        clearedKeys
      }
    });

  } catch (error) {
    adminSystemLogger.error('Failed to clear cache', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id,
      pattern: req.body.pattern
    });

    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

/**
 * Get audit logs with advanced filtering
 * GET /api/admin/system/audit-logs
 */
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      adminId, 
      targetType, 
      startDate, 
      endDate 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (action) query['event.action'] = action;
    if (adminId) query.userId = adminId;
    if (targetType) query['event.resource'] = targetType;
    
    if (startDate || endDate) {
      query['context.timestamp'] = {};
      if (startDate) query['context.timestamp'].$gte = new Date(startDate as string);
      if (endDate) query['context.timestamp'].$lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ 'context.timestamp': -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    adminSystemLogger.info('Audit logs retrieved', {
      adminId: req.user?.id,
      query,
      resultCount: logs.length,
      totalCount: total
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    adminSystemLogger.error('Failed to retrieve audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
};

/**
 * Get security alerts and suspicious activities
 * GET /api/admin/system/security-alerts
 */
export const getSecurityAlerts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, severity } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (pageNum - 1) * limitNum;

    // Get recent failed login attempts
    const recentFailedLogins = await AuditLog.find({
      action: 'failed_login',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // Get suspicious user activities (multiple role changes, etc.)
    const suspiciousActivities = await AuditLog.find({
      action: { $in: ['update_user_role', 'update_user_status', 'delete_user'] },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    // Get users with multiple failed login attempts
    const suspiciousUsers = await User.find({
      failedLoginAttempts: { $gte: 3 },
      lastFailedLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .select('name email failedLoginAttempts lastFailedLogin')
    .sort({ failedLoginAttempts: -1 })
    .limit(10)
    .lean();

    const alerts = {
      summary: {
        recentFailedLogins: recentFailedLogins.length,
        suspiciousActivities: suspiciousActivities.length,
        suspiciousUsers: suspiciousUsers.length
      },
      details: {
        failedLogins: recentFailedLogins,
        suspiciousActivities,
        suspiciousUsers
      }
    };

    adminSystemLogger.info('Security alerts retrieved', {
      adminId: req.user?.id,
      alertCounts: alerts.summary
    });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    adminSystemLogger.error('Failed to retrieve security alerts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security alerts'
    });
  }
};