import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import { Material } from '../models/Material';
import { Reservation } from '../models/Reservation';
import { Notification } from '../models/Notification';
import AuditLog from '../models/AuditLog';
import { cacheService } from '../services/cacheService';
import { adminNotificationService } from '../services/adminNotificationService';
import { createLogger } from '../utils/logger';

const adminLogger = createLogger('AdminController');

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// User Management
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Limit max page size
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$text = { $search: search }; // Use text index instead of regex
    }

    // Create cache key based on query parameters
    const cacheKey = `admin:users:${JSON.stringify({ page: pageNum, limit: limitNum, role, status, search })}`;
    
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Use Promise.all for parallel execution
        const [users, total] = await Promise.all([
          User.find(query)
            .select('-password -refreshTokenVersion')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
          User.countDocuments(query)
        ]);

        return {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        };
      },
      300 // Cache for 5 minutes
    );

    res.json({
      success: true,
      data: result,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting users', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    const user = await User.findById(id)
      .select('-password')
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting user', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    if (!['student', 'teacher', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student, teacher, or admin'
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Emit admin notification for role change
    const adminReq = req as AuthenticatedRequest;
    adminNotificationService.emitUserActivity({
      type: 'user_activity',
      activityType: 'role_change',
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      timestamp: new Date(),
      details: {
        action: 'Role updated from ' + user.role + ' to ' + role,
        previousRole: user.role,
        newRole: role,
        adminId: adminReq.user?.id,
        adminName: `Admin ${adminReq.user?.id}`
      }
    });

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        event: {
          type: 'user.role_update',
          category: 'authorization',
          action: 'update_role',
          resource: 'user',
          resourceId: id,
          description: `User ${user.name} role updated from ${user.role} to ${role}`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['user', 'role'] }
      } as any);
    } catch (e) { /* non-blocking */ }

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    adminLogger.error('Error updating user role', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active or inactive'
      });
      return;
    }

    const isActive = status === 'active';
    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Emit admin notification for status change
    const adminReq = req as AuthenticatedRequest;
    
    adminNotificationService.emitUserActivity({
      type: 'user_activity',
      activityType: 'profile_update',
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      timestamp: new Date(),
      details: {
        action: `User account status changed to ${status}`,
        newStatus: status,
        adminId: adminReq.user?.id,
        adminName: `Admin ${adminReq.user?.id}`
      }
    });

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        event: {
          type: 'user.status_update',
          category: 'authorization',
          action: 'update_status',
          resource: 'user',
          resourceId: id,
          description: `User ${user.name} status changed to ${status}`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['user', 'status'] }
      } as any);
    } catch (e) { /* non-blocking */ }

    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully'
    });
  } catch (error) {
    adminLogger.error('Error updating user status:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Emit admin notification for user deletion
    const adminReq = req as AuthenticatedRequest;
    adminNotificationService.emitUserActivity({
      type: 'user_activity',
      activityType: 'profile_update',
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      timestamp: new Date(),
      details: {
        action: 'User account deleted',
        deletionTime: new Date(),
        adminId: adminReq.user?.id,
        adminName: `Admin ${adminReq.user?.id}`
      }
    });

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        event: {
          type: 'user.delete',
          category: 'data_modification',
          action: 'delete_user',
          resource: 'user',
          resourceId: id,
          description: `User ${user.name} (${user.email}) deleted`,
          severity: 'high'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['user', 'delete'] },
        targetUserId: id
      } as any);
    } catch (e) { /* non-blocking */ }

    // Clean up related data
    await Reservation.deleteMany({ $or: [{ teacher: id }, { student: id }] });
    await Material.deleteMany({ uploaderId: id });
    await Notification.deleteMany({ recipient: id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    adminLogger.error('Error deleting user:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

// Generic update handler to support PUT /admin/users/:id
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID format' });
      return;
    }

    const update: any = {};

    if (typeof role !== 'undefined') {
      if (!['student', 'teacher', 'admin'].includes(role)) {
        res.status(400).json({ success: false, message: 'Invalid role. Must be student, teacher, or admin' });
        return;
      }
      update.role = role;
    }

    if (typeof status !== 'undefined') {
      if (!['active', 'inactive'].includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid status. Must be active or inactive' });
        return;
      }
      update.isActive = status === 'active';
    }

    if (Object.keys(update).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const adminReq = req as AuthenticatedRequest;

    // Emit notifications and audit logs for role change
    try {
      if (typeof role !== 'undefined') {
        adminNotificationService.emitUserActivity({
          type: 'user_activity',
          activityType: 'role_change',
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date(),
          details: {
            action: `Role updated to ${role}`,
            newRole: role,
            adminId: adminReq.user?.id,
            adminName: `Admin ${adminReq.user?.id}`
          }
        });

        await AuditLog.create({
          userId: (req as any).user?.id,
          event: {
            type: 'user.role_update',
            category: 'authorization',
            action: 'update_role',
            resource: 'user',
            resourceId: id,
            description: `User ${user.name} role updated to ${role}`,
            severity: 'medium'
          },
          request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
          response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
          metadata: { tags: ['user', 'role'] }
        } as any);
      }
    } catch (e) { /* non-blocking */ }

    // Emit notifications and audit logs for status change
    try {
      if (typeof status !== 'undefined') {
        adminNotificationService.emitUserActivity({
          type: 'user_activity',
          activityType: 'profile_update',
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date(),
          details: {
            action: `User account status changed to ${status}`,
            newStatus: status,
            adminId: adminReq.user?.id,
            adminName: `Admin ${adminReq.user?.id}`
          }
        });

        await AuditLog.create({
          userId: (req as any).user?.id,
          event: {
            type: 'user.status_update',
            category: 'authorization',
            action: 'update_status',
            resource: 'user',
            resourceId: id,
            description: `User ${user.name} status changed to ${status}`,
            severity: 'medium'
          },
          request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
          response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
          metadata: { tags: ['user', 'status'] }
        } as any);
      }
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, data: user, message: 'User updated successfully' });
  } catch (error) {
    adminLogger.error('Error updating user:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// Teacher approval workflow
export const listPendingTeachers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 'teacher', approvalStatus: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (error) {
    adminLogger.error('Error listing pending teachers:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ success: false, message: 'Failed to list pending teachers' });
  }
};

export const approveTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'teacher' },
      { isApproved: true, approvalStatus: 'approved' },
      { new: true }
    ).select('-password');
    
    if (!user) {
      res.status(404).json({ success: false, message: 'Teacher not found or not a teacher' });
      return;
    }

    // Create notification for the teacher
    try {
      await Notification.createNotification({
        recipient: (user as any)._id.toString(),
        type: 'admin',
        title: 'Teacher Application Approved',
        body: 'Your teacher application has been approved',
        link: `/teachers/${(user as any)._id}`,
        meta: { approvalStatus: 'approved' }
      });
    } catch (_e) { /* non-blocking */ }

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        event: {
          type: 'teacher.approve',
          category: 'authorization',
          action: 'approve_teacher',
          resource: 'teacher',
          resourceId: id,
          description: `Teacher ${user.name} (${user.email}) approved`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['teacher', 'approve'] }
      } as any);
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, data: user, message: 'Teacher approved' });
  } catch (error) {
    adminLogger.error('Error approving teacher:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ success: false, message: 'Failed to approve teacher' });
  }
};

export const rejectTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };

    // Require rejection reason
    if (!reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'teacher' },
      { isApproved: false, approvalStatus: 'rejected' },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'Teacher not found or not a teacher' });
      return;
    }

    // Create notification for the teacher including rejection reason
    try {
      await Notification.createNotification({
        recipient: (user as any)._id.toString(),
        type: 'admin',
        title: 'Teacher Application Rejected',
        body: `Your teacher application has been rejected: ${reason}`,
        link: `/teachers/${(user as any)._id}`,
        meta: { approvalStatus: 'rejected', reason }
      });
    } catch (_e) { /* non-blocking */ }

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req as any).user?.id,
        event: {
          type: 'teacher.reject',
          category: 'authorization',
          action: 'reject_teacher',
          resource: 'teacher',
          resourceId: id,
          description: `Teacher ${user.name} (${user.email}) rejected: ${reason}`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['teacher', 'reject'], reason }
      } as any);
    } catch (e) { /* non-blocking */ }

    res.json({ success: true, data: user, message: `Teacher rejected: ${reason}` });
  } catch (error) {
    adminLogger.error('Error rejecting teacher:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({ success: false, message: 'Failed to reject teacher' });
  }
};

// Material Moderation
export const getMaterials = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get materials with pagination
    const materials = await Material.find(query)
      .populate('uploaderId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Material.countDocuments(query);

    res.json({
      success: true,
      data: {
        materials,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Materials retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting materials:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials'
    });
  }
};

export const approveMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    const material = await Material.findByIdAndUpdate(
      id,
      { 
        status: approved ? 'approved' : 'rejected',
        moderationNote: reason,
        moderatedAt: new Date(),
        moderatedBy: (req as any).user.id
      },
      { new: true }
    ).populate('uploaderId', 'name email');

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    // Notify uploader
    if (material.uploaderId) {
      await Notification.createNotification({
        recipient: material.uploaderId._id.toString(),
        type: 'material',
        title: `Material ${approved ? 'Approved' : 'Rejected'}`,
        body: `Your material "${(material as any).title || 'Untitled'}" has been ${approved ? 'approved' : 'rejected'}${reason ? `: ${reason}` : ''}`,
        link: `/materials/${material._id}`,
        meta: { materialId: material._id, approved }
      });
    }

    res.json({
      success: true,
      data: material,
      message: `Material ${approved ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    adminLogger.error('Error approving material:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to approve material'
    });
  }
};

export const deleteMaterial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      res.status(404).json({
        success: false,
        message: 'Material not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    adminLogger.error('Error deleting material:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to delete material'
    });
  }
};

// Payment Management functions moved to end of file

export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Reservation.findByIdAndUpdate(
      id,
      { 
        status: 'refunded',
        refundReason: reason,
        refundedAt: new Date(),
        refundedBy: (req as any).user.id
      },
      { new: true }
    ).populate('teacher', 'name email')
     .populate('student', 'name email');

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    // Notify users
    if (payment.student) {
      await Notification.createNotification({
        recipient: payment.student._id.toString(),
        type: 'payment',
        title: 'Payment Refunded',
        body: `Your payment for lesson with ${(payment.teacher as any)?.name || 'Unknown Teacher'} has been refunded${reason ? `: ${reason}` : ''}`,
        link: `/reservations/${payment._id}`,
        meta: { paymentId: payment._id, refunded: true }
      });
    }

    if (payment.teacher) {
      await Notification.createNotification({
        recipient: payment.teacher._id.toString(),
        type: 'payment',
        title: 'Payment Refunded',
        body: `Payment for lesson with ${(payment.student as any)?.name || 'Unknown Student'} has been refunded${reason ? `: ${reason}` : ''}`,
        link: `/reservations/${payment._id}`,
        meta: { paymentId: payment._id, refunded: true }
      });
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    adminLogger.error('Error refunding payment:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment'
    });
  }
};

// Logs & Activity
export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Get logs with pagination (combine from multiple collections)
    const logs = await Promise.all([
      User.find({}, { _id: 1, name: 1, email: 1, role: 1, createdAt: 1, lastLoginAt: 1 })
        .sort({ lastLoginAt: -1 })
        .limit(20)
        .lean()
        .then(users => users.map(user => ({
          _id: user._id,
          type: 'user_activity',
          action: 'login',
          user: user.name,
          email: user.email,
          details: `User ${user.name} logged in`,
          createdAt: (user as any).lastLoginAt || user.createdAt
        }))),
      Material.find({}, { _id: 1, title: 1, uploaderId: 1, status: 1, createdAt: 1 })
        .populate('uploaderId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .then(materials => materials.map(material => ({
          _id: material._id,
          type: 'material_upload',
          action: 'upload',
          user: (material.uploaderId as any)?.name || 'Unknown',
          details: `Material "${(material as any).title || 'Untitled'}" uploaded`,
          createdAt: material.createdAt
        }))),
      Reservation.find({}, { _id: 1, teacher: 1, student: 1, status: 1, createdAt: 1 })
        .populate('teacher', 'name')
        .populate('student', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .then(reservations => reservations.map(reservation => ({
          _id: reservation._id,
          type: 'lesson_booking',
          action: 'book',
          user: (reservation.student as any)?.name || 'Unknown',
          details: `Lesson booked with ${(reservation.teacher as any)?.name || 'Unknown'}`,
          createdAt: reservation.createdAt
        })))
    ]);

    // Combine and sort all logs
    const allLogs = logs.flat().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedLogs = allLogs.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: allLogs.length,
          pages: Math.ceil(allLogs.length / limitNum)
        }
      },
      message: 'Logs retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting logs:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs'
    });
  }
};

// Analytics/Overview
export const getOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalMaterials,
      totalReservations,
      totalRevenue,
      recentUsers,
      recentMaterials,
      recentReservations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      Material.countDocuments(),
      Reservation.countDocuments(),
      Reservation.aggregate([
        { $match: { status: 'completed', isPaid: true } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
      Material.find().sort({ createdAt: -1 }).limit(5).populate('uploaderId', 'name').lean(),
      Reservation.find().sort({ createdAt: -1 }).limit(5).populate('teacher', 'name').populate('student', 'name').lean()
    ]);

    // Calculate growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      recentUsersCount,
      previousUsersCount,
      recentRevenue,
      previousRevenue
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      Reservation.aggregate([
        { $match: { status: 'completed', isPaid: true, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]),
      Reservation.aggregate([
        { $match: { status: 'completed', isPaid: true, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    const userGrowth = previousUsersCount > 0 ? ((recentUsersCount - previousUsersCount) / previousUsersCount) * 100 : 0;
    const revenueGrowth = previousRevenue[0]?.total > 0 ? ((recentRevenue[0]?.total - previousRevenue[0]?.total) / previousRevenue[0]?.total) * 100 : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTeachers,
          totalStudents,
          totalMaterials,
          totalReservations,
          totalRevenue: totalRevenue[0]?.total || 0,
          userGrowth: Math.round(userGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100
        },
        recent: {
          users: recentUsers,
          materials: recentMaterials,
          reservations: recentReservations
        }
      },
      message: 'Overview data retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting overview:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overview data'
    });
  }
}; 

// Payment Management
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.notes = { $regex: search, $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Get payments with pagination
    const payments = await Reservation.find(query)
      .populate('student', 'name email')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    adminLogger.error('Error getting payments:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
};

export const approvePayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    // Find the payment/reservation
    const payment = await Reservation.findById(id);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.isPaid = true;
    payment.paymentApprovedBy = adminId ? new mongoose.Types.ObjectId(adminId) : undefined;
    payment.paymentApprovedAt = new Date();
    await payment.save();

    // Create audit log
    await AuditLog.create({
      adminId,
      action: 'approve_payment',
      targetType: 'Reservation',
      targetId: id,
      details: {
        paymentId: id,
        amount: payment.price,
        previousStatus: 'pending',
        newStatus: 'completed'
      }
    });

    // Send notification to user
    // You can implement notification logic here

    res.json({
      success: true,
      message: 'Payment approved successfully'
    });
  } catch (error) {
    adminLogger.error('Error approving payment:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
};

export const rejectPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    // Find the payment/reservation
    const payment = await Reservation.findById(id);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
      return;
    }

    // Update payment status
    payment.status = 'cancelled';
    payment.isPaid = false;
    payment.paymentRejectedBy = adminId ? new mongoose.Types.ObjectId(adminId) : undefined;
    payment.paymentRejectedAt = new Date();
    payment.rejectionReason = reason;
    await payment.save();

    // Create audit log
    await AuditLog.create({
      adminId,
      action: 'reject_payment',
      targetType: 'Reservation',
      targetId: id,
      details: {
        paymentId: id,
        amount: payment.price,
        reason,
        previousStatus: 'pending',
        newStatus: 'cancelled'
      }
    });

    // Send notification to user
    // You can implement notification logic here

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });
  } catch (error) {
    adminLogger.error('Error rejecting payment:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
};

// Temporary admin creation function
export const createTempAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const bcrypt = require('bcrypt');
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      res.json({
        success: true,
        message: 'Admin already exists',
        admin: {
          email: existingAdmin.email,
          role: existingAdmin.role,
          isActive: existingAdmin.isActive
        }
      });
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new User({
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();

    res.json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive
      }
    });
  } catch (error) {
    adminLogger.error('Error creating admin:', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      message: 'Failed to create admin'
    });
  }
};