import { Request, Response } from 'express';
import { LessonChat } from '../models/LessonChat';
import { LessonFile } from '../models/LessonFile';
import { Reservation } from '../models/Reservation';
import User, { IUser } from '../models/User';
import fs from 'fs';
import path from 'path';

interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class LessonChatController {
  // Get chat messages for a lesson
  async getLessonMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const messages = await LessonChat.find({ lessonId })
        .populate('userId', 'name email role')
        .sort({ createdAt: 1 })
        .limit(Number(limit) * Number(page))
        .skip((Number(page) - 1) * Number(limit));

      const totalMessages = await LessonChat.countDocuments({ lessonId });

      res.json({
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting lesson messages:', error);
      res.status(500).json({ error: 'Failed to get lesson messages' });
    }
  }

  // Send a chat message during lesson
  async sendLessonMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { message, messageType = 'text' } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message content is required' });
        return;
      }

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const chatMessage = new LessonChat({
        lessonId,
        userId: req.user!.id,
        message: message.trim(),
        messageType,
        timestamp: new Date()
      });

      await chatMessage.save();
      await chatMessage.populate('userId', 'name email role');

      // TODO: Emit to Socket.IO for real-time updates
      // socketIO.to(lessonId).emit('lesson:message', chatMessage);

      res.status(201).json(chatMessage);
    } catch (error) {
      console.error('Error sending lesson message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  // Share file during lesson
  async shareFileInLesson(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { description } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const lessonFile = new LessonFile({
        lessonId,
        uploadedBy: req.user!.id,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: description || '',
        uploadedAt: new Date()
      });

      await lessonFile.save();
      await lessonFile.populate('uploadedBy', 'name email role');

      // Create a chat message about the file share
      const chatMessage = new LessonChat({
        lessonId,
        userId: req.user!.id,
        message: `Shared file: ${file.originalname}`,
        messageType: 'file',
        fileId: lessonFile._id,
        timestamp: new Date()
      });

      await chatMessage.save();
      await chatMessage.populate('userId', 'name email role');

      // TODO: Emit to Socket.IO for real-time updates
      // socketIO.to(lessonId).emit('lesson:file-shared', { file: lessonFile, message: chatMessage });

      res.status(201).json({
        file: lessonFile,
        message: chatMessage
      });
    } catch (error) {
      console.error('Error sharing file in lesson:', error);
      res.status(500).json({ error: 'Failed to share file' });
    }
  }

  // Get shared files for a lesson
  async getLessonFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const files = await LessonFile.find({ lessonId })
        .populate('uploadedBy', 'name email role')
        .sort({ uploadedAt: -1 });

      res.json({ files });
    } catch (error) {
      console.error('Error getting lesson files:', error);
      res.status(500).json({ error: 'Failed to get lesson files' });
    }
  }

  // Download shared file
  async downloadLessonFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId, fileId } = req.params;

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const file = await LessonFile.findOne({ _id: fileId, lessonId });
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Check if file exists on disk
      if (!fs.existsSync(file.filePath)) {
        res.status(404).json({ error: 'File not found on server' });
        return;
      }

      res.download(file.filePath, file.fileName);
    } catch (error) {
      console.error('Error downloading lesson file:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  }

  // Delete shared file (teacher only)
  async deleteLessonFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId, fileId } = req.params;

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const file = await LessonFile.findOne({ _id: fileId, lessonId });
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Check if user is teacher or file uploader
      const reservation = await Reservation.findById(lessonId);
      const isTeacher = reservation?.teacher.toString() === req.user!.id;
      const isUploader = file.uploadedBy.toString() === req.user!.id;

      if (!isTeacher && !isUploader) {
        res.status(403).json({ error: 'Only teachers or file uploaders can delete files' });
        return;
      }

      // Delete file from disk
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      // Delete from database
      await LessonFile.findByIdAndDelete(fileId);

      // TODO: Emit to Socket.IO for real-time updates
      // socketIO.to(lessonId).emit('lesson:file-deleted', { fileId });

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting lesson file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  // Get lesson participants
  async getLessonParticipants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

      // Verify user has access to this lesson
      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const reservation = await Reservation.findById(lessonId)
        .populate('teacher', 'name email role avatar')
        .populate('student', 'name email role avatar');

      if (!reservation) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }

      const teacher = reservation.teacher as IUser;
      const student = reservation.student as IUser;

      const participants = [
        {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: 'teacher',
          avatar: teacher.profileImage
        },
        {
          id: student._id,
          name: student.name,
          email: student.email,
          role: 'student',
          avatar: student.profileImage
        }
      ];

      res.json({ participants });
    } catch (error) {
      console.error('Error getting lesson participants:', error);
      res.status(500).json({ error: 'Failed to get lesson participants' });
    }
  }

  // Helper method to verify lesson access
  private async verifyLessonAccess(userId: string, lessonId: string): Promise<boolean> {
    try {
      const reservation = await Reservation.findById(lessonId);
      if (!reservation) {
        return false;
      }

      const isTeacher = reservation.teacher.toString() === userId;
      const isStudent = reservation.student.toString() === userId;

      return isTeacher || isStudent;
    } catch (error) {
      console.error('Error verifying lesson access:', error);
      return false;
    }
  }
}