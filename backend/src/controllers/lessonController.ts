import { Request, Response } from 'express';
import { Lesson } from '../models/Lesson';
import User from '../models/User';
import { cacheService } from '../services/cacheService';

export class LessonController {
  // Get student's lessons with filters
  static async getStudentLessons(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { status, level, page = 1, limit = 10 } = req.query;

      // Build query
      const query: any = { studentId: userId };
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (level && level !== 'all') {
        // Note: Current Lesson model doesn't have level field, 
        // but we can add it or use teacher's level
        // For now, we'll skip level filtering
      }

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      // Get lessons with pagination
      const lessons = await Lesson.find(query)
        .populate('teacherId', 'name email avatar')
        .populate('studentId', 'name email')
        .populate('materials', 'title type fileUrl')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      // Get total count for pagination
      const total = await Lesson.countDocuments(query);
      const pages = Math.ceil(total / parseInt(limit as string));

      // Transform lessons to match frontend expectations
      const transformedLessons = lessons.map(lesson => {
        const teacher = lesson.teacherId as any;
        const student = lesson.studentId as any;
        
        return {
          _id: lesson._id,
          title: lesson.type, // Use type as title for now
          topic: lesson.type,
          description: lesson.notes || `Lesson on ${lesson.type}`,
          status: lesson.status === 'scheduled' ? 'upcoming' : lesson.status,
          scheduledAt: lesson.startTime,
          duration: lesson.duration * 60, // Convert hours to minutes
          level: 'intermediate', // Default level for now
          teacher: {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            avatar: teacher.avatar
          },
          student: {
            _id: student._id,
            name: student.name,
            email: student.email
          },
          lessonType: 'one-on-one',
          materials: lesson.materials || [],
          notes: lesson.notes,
          rating: lesson.rating,
          feedback: lesson.review,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt
        };
      });

      res.json({
        success: true,
        data: transformedLessons,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages
        }
      });
    } catch (error: any) {
      console.error('Error getting student lessons:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get student lessons' 
      });
    }
  }

  // Get lesson details
  static async getLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const cacheKey = `lesson:${id}`;

      const lesson = await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await Lesson.findById(id)
            .populate('teacherId', 'name email avatar')
            .populate('studentId', 'name email')
            .populate('materials', 'title type fileUrl');
        },
        300 // Cache for 5 minutes
      );

      if (!lesson) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
      return;
      }

      // Check if user has access to this lesson
      if (lesson.studentId.toString() !== userId && lesson.teacherId.toString() !== userId) {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      return;
      }

              // Transform lesson to match frontend expectations
        const teacher = lesson.teacherId as any;
        const student = lesson.studentId as any;
        
        const transformedLesson = {
          _id: lesson._id,
          title: lesson.type,
          topic: lesson.type,
          description: lesson.notes || `Lesson on ${lesson.type}`,
          status: lesson.status === 'scheduled' ? 'upcoming' : lesson.status,
          scheduledAt: lesson.startTime,
          duration: lesson.duration * 60,
          level: 'intermediate',
          teacher: {
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            avatar: teacher.avatar
          },
          student: {
            _id: student._id,
            name: student.name,
            email: student.email
          },
          lessonType: 'one-on-one',
          materials: lesson.materials || [],
          notes: lesson.notes,
          rating: lesson.rating,
          feedback: lesson.review,
          createdAt: lesson.createdAt,
          updatedAt: lesson.updatedAt
        };

      res.json({
        success: true,
        data: transformedLesson
      });
    } catch (error: any) {
      console.error('Error getting lesson:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get lesson' 
      });
    }
  }

  // Join lesson (mark as in-progress)
  static async joinLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const lesson = await Lesson.findById(id);
      if (!lesson) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
      return;
      }

      // Check if user is the student for this lesson
      if (lesson.studentId.toString() !== userId) {
        res.status(403).json({ 
          success: false, 
          message: 'Only the student can join this lesson' 
        });
      return;
      }

      // Check if lesson can be joined
      if (lesson.status !== 'scheduled') {
        res.status(400).json({ 
          success: false, 
          message: 'Lesson cannot be joined at this time' 
        });
      return;
      }

      // Check if it's time to join (within 15 minutes of start time)
      const now = new Date();
      const startTime = new Date(lesson.startTime);
      const timeDiff = Math.abs(now.getTime() - startTime.getTime()) / (1000 * 60); // minutes

      if (timeDiff > 15) {
        res.status(400).json({ 
          success: false, 
          message: 'Lesson can only be joined within 15 minutes of start time' 
        });
      return;
      }

      // Update lesson status
      lesson.status = 'in-progress';
      await lesson.save();

      res.json({
        success: true,
        message: 'Successfully joined lesson',
        data: { lessonId: lesson._id, status: lesson.status }
      });
    } catch (error: any) {
      console.error('Error joining lesson:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to join lesson' 
      });
    }
  }

  // Leave lesson (mark as completed or cancelled)
  static async leaveLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { status = 'completed' } = req.body;

      const lesson = await Lesson.findById(id);
      if (!lesson) {
        res.status(404).json({ 
          success: false, 
          message: 'Lesson not found' 
        });
      return;
      }

      // Check if user is the student for this lesson
      if (lesson.studentId.toString() !== userId) {
        res.status(403).json({ 
          success: false, 
          message: 'Only the student can leave this lesson' 
        });
      return;
      }

      // Check if lesson can be left
      if (lesson.status !== 'in-progress') {
        res.status(400).json({ 
          success: false, 
          message: 'Lesson is not in progress' 
        });
      return;
      }

      // Update lesson status
      lesson.status = status;
      await lesson.save();

      res.json({
        success: true,
        message: `Successfully left lesson (${status})`,
        data: { lessonId: lesson._id, status: lesson.status }
      });
    } catch (error: any) {
      console.error('Error leaving lesson:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to leave lesson' 
      });
    }
  }

  // Create a new lesson (for testing/demo purposes)
  static async createLesson(req: Request, res: Response): Promise<void> {
    try {
      const { topic, description, scheduledAt, duration, teacherId, lessonType, materials, notes } = req.body;
      const studentId = (req as any).user.id;

      // Validate required fields
      if (!topic || !scheduledAt || !duration || !teacherId) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      return;
      }

      // Check if teacher exists and is approved
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher' || !teacher.isApproved) {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid teacher' 
        });
      return;
      }

      // Create lesson
      const lesson = new Lesson({
        teacherId,
        studentId,
        type: topic,
        status: 'scheduled',
        startTime: new Date(scheduledAt),
        endTime: new Date(new Date(scheduledAt).getTime() + duration * 60 * 1000), // duration in minutes
        duration: duration / 60, // Convert to hours
        price: 0, // Default price
        notes: notes || description,
        materials: materials || []
      });

      await lesson.save();

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        data: { lessonId: lesson._id }
      });
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create lesson' 
      });
    }
  }
}
