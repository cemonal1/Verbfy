import { Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthRequest } from '../middleware/auth';
import UserModel from '../models/User';
import * as path from 'path';
import { cacheService } from '../services/cacheService';

// Get all teachers
export const getTeachers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const cacheKey = `teachers:approved:active:${search || 'all'}:${limit}:${page}`;
    
    const result = await cacheService.getOrSet(
      cacheKey,
      async () => {
        let query: any = { 
          role: 'teacher', 
          isApproved: true, 
          isActive: true,
          approvalStatus: 'approved'
        };

        // Add search functionality
        if (search && typeof search === 'string') {
          query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { bio: { $regex: search, $options: 'i' } },
            { specialties: { $in: [new RegExp(search, 'i')] } },
            { education: { $regex: search, $options: 'i' } }
          ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        const [teachers, total] = await Promise.all([
          UserModel.find(query)
            .select('name email profileImage bio specialties rating totalLessons hourlyRate languages education experience certifications timezone nativeLanguage')
            .sort({ rating: -1, totalLessons: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string)),
          UserModel.countDocuments(query)
        ]);

        return { teachers, total, page: parseInt(page as string), limit: parseInt(limit as string) };
      },
      600 // Cache for 10 minutes
    );

    res.json({ 
      success: true, 
      teachers: result.teachers,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teachers' });
  }
};

// Get all students
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cacheKey = 'students:active';
    
    const students = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await UserModel.find({ role: 'student', isActive: true })
          .select('name email profileImage totalLessons createdAt')
          .sort({ name: 1 });
      },
      1200 // Cache for 20 minutes
    );

    res.json({ success: true, students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch students' });
  }
};

// Admin: Get all users with basic pagination
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find({}).select('name email role isActive createdAt').skip(skip).limit(limit).sort({ createdAt: -1 }),
      UserModel.countDocuments({})
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
};

// Get teacher by ID (public endpoint for students)
export const getTeacherById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `teacher:public:${id}`;
    
    const teacher = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await UserModel.findOne({ 
          _id: id, 
          role: 'teacher', 
          isApproved: true, 
          isActive: true,
          approvalStatus: 'approved'
        }).select('name email profileImage bio specialties rating totalLessons hourlyRate languages education experience certifications timezone nativeLanguage createdAt');
      },
      1800 // Cache for 30 minutes
    );
    
    if (!teacher) {
      res.status(404).json({ 
        success: false,
        message: 'Teacher not found or not approved' 
      });
      return;
    }

    res.json({ success: true, data: teacher });
  } catch (error: any) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch teacher' });
  }
};

// Get current user profile
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cacheKey = `user:profile:${userId}`;
    
    const user = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await UserModel.findById(userId).select('-password -refreshTokenVersion');
      },
      600 // Cache for 10 minutes
    );
    
    if (!user) {
      res.status(404).json({ 
        message: 'User not found' 
      });
      return;
    }

    // Return plain user object for compatibility with integration tests
    res.json(user);
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch user profile' });
  }
};

// Update current user profile
export const updateCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, bio, phone, specialties, experience, education, certifications, cvUrl, introVideoUrl } = req.body;
    const userId = req.user!.id;

    // Validate minimal input (allow partial updates)
    if (!name && !email && !bio && !phone && !specialties && !experience && !education && !certifications && !cvUrl && !introVideoUrl) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({ success: false, message: 'Email is already taken' });
        return;
      }
    }

    const updateData = { 
      ...(name && { name }), 
      ...(email && { email }), 
      ...(bio && { bio }), 
      ...(phone && { phone }),
      ...(specialties && { specialties }),
      ...(typeof experience !== 'undefined' && { experience }),
      ...(education && { education }),
      ...(certifications && { certifications }),
      ...(cvUrl && { cvUrl }),
      ...(introVideoUrl && { introVideoUrl }),
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { ...updateData } },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenVersion');

    if (!updatedUser) {
      res.status(404).json({ 
        message: 'User not found' 
      });
      return;
    }

    // Invalidate user cache
    const userCacheKey = `user:profile:${userId}`;
    await cacheService.del(userCacheKey);
    
    // Invalidate role-based caches if role changed
    if (updateData.role) {
      await cacheService.del('teachers:approved:active');
      await cacheService.del('students:active');
    }

    // Return plain updated user object for compatibility with integration tests
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update user profile' });
  }
}; 

// Upload avatar for current user
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const userId = req.user!.id;
    // Build public URL for avatar
    const publicPath = `/uploads/avatars/${req.file.filename}`;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { profileImage: publicPath } },
      { new: true }
    ).select('-password -refreshTokenVersion');

    res.json({ success: true, user: updated, avatarUrl: publicPath });
      return;
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
      return;
  }
};

// Generate S3 presigned upload URL for teacher documents (cv/video)
export const getPresignedUploadUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = (req.query.key as string) || '';
    const contentType = (req.query.contentType as string) || '';
    if (!key || !contentType) {
      res.status(400).json({ success: false, message: 'key and contentType are required' });
      return;
    }
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.S3_BUCKET as string;
    if (!bucket) {
      res.status(500).json({ success: false, message: 'S3 is not configured' });
      return;
    }
    const s3 = new S3Client({ region });
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ success: true, url });
    return;
  } catch (error: any) {
    console.error('getPresignedUploadUrl error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
      return;
  }
};