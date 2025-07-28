import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import UserModel from '../models/User';

// Get all teachers
export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await UserModel.find({ role: 'teacher' })
      .select('name email specialty rating')
      .sort({ name: 1 });

    res.json(teachers);
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

    res.json(students);
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

    res.json(user);
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
    const { name, email } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Name and email are required' 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await UserModel.findOne({ 
      email, 
      _id: { $ne: userId } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email is already taken' 
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password -refreshTokenVersion');

    if (!updatedUser) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to update user profile' 
    });
  }
}; 