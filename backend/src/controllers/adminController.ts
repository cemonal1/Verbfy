import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UserModel from '../models/User';
import { Reservation } from '../models/Reservation';
import { LessonMaterial } from '../models/LessonMaterial';

// Get admin statistics
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get counts
    const totalUsers = await UserModel.countDocuments();
    const totalTeachers = await UserModel.countDocuments({ role: 'teacher' });
    const totalStudents = await UserModel.countDocuments({ role: 'student' });
    const totalReservations = await Reservation.countDocuments();
    const totalMaterials = await LessonMaterial.countDocuments();
    
    // Get active lessons (reservations happening now or within the next hour)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const activeLessons = await Reservation.countDocuments({
      actualDate: { $gte: now, $lte: oneHourFromNow },
      status: 'booked'
    });

    res.json({
      totalUsers,
      totalTeachers,
      totalStudents,
      totalReservations,
      totalMaterials,
      activeLessons
    });

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch admin statistics' 
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    // Get recent user registrations
    const recentUsers = await UserModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Get recent reservations
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('teacher', 'name email')
      .populate('student', 'name email')
      .select('lessonType lessonLevel status createdAt');

    // Get recent materials
    const recentMaterials = await LessonMaterial.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name email')
      .select('title type lessonType createdAt');

    // Combine and format activities
    const activities = [
      ...recentUsers.map(user => ({
        id: user._id.toString(),
        type: 'user_registration' as const,
        description: `New ${user.role} registered: ${user.name}`,
        timestamp: user.createdAt,
        user: { name: user.name, email: user.email }
      })),
      ...recentReservations.map(reservation => ({
        id: reservation._id.toString(),
        type: 'lesson_booking' as const,
        description: `${reservation.lessonType} lesson booked by ${(reservation.student as any).name} with ${(reservation.teacher as any).name}`,
        timestamp: reservation.createdAt,
        user: { name: (reservation.student as any).name, email: (reservation.student as any).email }
      })),
      ...recentMaterials.map(material => ({
        id: material._id.toString(),
        type: 'material_upload' as const,
        description: `${material.type} material uploaded: ${material.title}`,
        timestamp: material.createdAt,
        user: { name: (material.uploadedBy as any).name, email: (material.uploadedBy as any).email }
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

    res.json({ activities });

  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch recent activities' 
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await UserModel.find(query)
      .select('-password -refreshTokenVersion')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await UserModel.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch users' 
    });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    // Verify admin role
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password -refreshTokenVersion');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User status updated successfully',
      user
    });

  } catch (error: any) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update user status' 
    });
  }
}; 