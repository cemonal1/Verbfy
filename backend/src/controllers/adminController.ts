import { Request, Response } from 'express';
import User from '../models/User';
import { Material } from '../models/Material';
import { Reservation } from '../models/Reservation';
import { Notification } from '../models/Notification';
import AuditLog from '../models/AuditLog';

// User Management
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student, teacher, or admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clean up related data
    await Reservation.deleteMany({ $or: [{ teacher: id }, { student: id }] });
    await Material.deleteMany({ uploaderId: id });
    await Notification.deleteMany({ recipient: id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
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
    console.error('Error listing pending teachers:', error);
    res.status(500).json({ success: false, message: 'Failed to list pending teachers' });
  }
};

export const approveTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'teacher' },
      { isApproved: true, approvalStatus: 'approved' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Teacher not found' });
    try {
      await AuditLog.createLog({
        userId: (req as any).user?.id,
        event: {
          type: 'user.approval',
          category: 'authorization',
          action: 'approve',
          resource: 'teacher',
          resourceId: id,
          description: `Teacher ${id} approved`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['teacher', 'approval'] }
      });
    } catch (e) { /* non-blocking */ }
    // Notify teacher
    try {
      await Notification.createNotification({
        recipient: id,
        type: 'admin',
        title: 'Teacher application approved',
        body: 'Congratulations! Your teacher account has been approved. You now have full teacher access.',
        link: '/teacher/dashboard'
      });
    } catch (e) { /* non-blocking */ }
    res.json({ success: true, data: user, message: 'Teacher approved' });
  } catch (error) {
    console.error('Error approving teacher:', error);
    res.status(500).json({ success: false, message: 'Failed to approve teacher' });
  }
};

export const rejectTeacher = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'teacher' },
      { isApproved: false, approvalStatus: 'rejected' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Teacher not found' });
    try {
      await AuditLog.createLog({
        userId: (req as any).user?.id,
        event: {
          type: 'user.approval',
          category: 'authorization',
          action: 'reject',
          resource: 'teacher',
          resourceId: id,
          description: `Teacher ${id} rejected`,
          severity: 'medium'
        },
        request: { method: req.method, url: req.originalUrl, ip: req.ip, userAgent: req.get('user-agent') || '' },
        response: { statusCode: 200, statusMessage: 'OK', responseTime: 0 },
        metadata: { tags: ['teacher', 'approval'] }
      });
    } catch (e) { /* non-blocking */ }
    // Notify teacher
    try {
      await Notification.createNotification({
        recipient: id,
        type: 'admin',
        title: 'Teacher application rejected',
        body: `Your teacher application has been rejected${reason ? `: ${reason}` : ''}.`,
        link: '/profile'
      });
    } catch (e) { /* non-blocking */ }
    res.json({ success: true, data: user, message: `Teacher rejected${reason ? ': ' + reason : ''}` });
  } catch (error) {
    console.error('Error rejecting teacher:', error);
    res.status(500).json({ success: false, message: 'Failed to reject teacher' });
  }
};

// Material Moderation
export const getMaterials = async (req: Request, res: Response) => {
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
    console.error('Error getting materials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve materials'
    });
  }
};

export const approveMaterial = async (req: Request, res: Response) => {
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
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
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
    console.error('Error approving material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve material'
    });
  }
};

export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const material = await Material.findByIdAndDelete(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete material'
    });
  }
};

// Payment Management
export const getPayments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, userId, status, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (userId) {
      query.$or = [{ teacher: userId }, { student: userId }];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    // Get payments with pagination
    const payments = await Reservation.find(query)
      .populate('teacher', 'name email')
      .populate('student', 'name email')
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
    console.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
};

export const refundPayment = async (req: Request, res: Response) => {
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
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
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
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund payment'
    });
  }
};

// Logs & Activity
export const getLogs = async (req: Request, res: Response) => {
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
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs'
    });
  }
};

// Analytics/Overview
export const getOverview = async (req: Request, res: Response) => {
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
    console.error('Error getting overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overview data'
    });
  }
}; 