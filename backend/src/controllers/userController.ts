import { Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthRequest } from '../middleware/auth';
import UserModel from '../models/User';
import path from 'path';

// Get all teachers
export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await UserModel.find({ role: 'teacher' })
      .select('name email specialty rating')
      .sort({ name: 1 });

    res.json({ success: true, teachers });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch teachers' 
    });
  }
};

// Get all students
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const students = await UserModel.find({ role: 'student' })
      .select('name email')
      .sort({ name: 1 });

    res.json({ success: true, students });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch students' 
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.id)
      .select('-password -refreshTokenVersion');

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch user profile' 
    });
  }
};

// Update current user profile
export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, bio, phone, specialties, experience, education, certifications, cvUrl, introVideoUrl } = req.body;
    const userId = req.user!.id;

    // Validate minimal input (allow partial updates)
    if (!name && !email && !bio && !phone && !specialties && !experience && !education && !certifications && !cvUrl && !introVideoUrl) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already taken' });
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { 
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
      } },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenVersion');

    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update user profile' });
  }
}; 

// Upload avatar for current user
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user!.id;
    // Build public URL for avatar
    const publicPath = `/uploads/avatars/${req.file.filename}`;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { profileImage: publicPath } },
      { new: true }
    ).select('-password -refreshTokenVersion');

    return res.json({ success: true, user: updated, avatarUrl: publicPath });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};

// Generate S3 presigned upload URL for teacher documents (cv/video)
export const getPresignedUploadUrl = async (req: AuthRequest, res: Response) => {
  try {
    const key = (req.query.key as string) || '';
    const contentType = (req.query.contentType as string) || '';
    if (!key || !contentType) {
      return res.status(400).json({ success: false, message: 'key and contentType are required' });
    }
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.S3_BUCKET as string;
    if (!bucket) return res.status(500).json({ success: false, message: 'S3 is not configured' });
    const s3 = new S3Client({ region });
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    return res.json({ success: true, url });
  } catch (error: any) {
    console.error('getPresignedUploadUrl error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};