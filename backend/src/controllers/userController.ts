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
    const cacheKey = 'teachers:approved:active';
    
    const teachers = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await UserModel.find({ role: 'teacher', isApproved: true, isActive: true })
          .select('name email profileImage bio specialties rating totalLessons hourlyRate languages')
          .sort({ rating: -1, totalLessons: -1 });
      },
      900 // Cache for 15 minutes
    );

    res.json({ success: true, teachers });
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

    res.json({ success: true, user });
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
      { $set: updateData },
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

    res.json({ success: true, user: updatedUser });
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