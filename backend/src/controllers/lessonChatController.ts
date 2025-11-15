import { Request, Response } from 'express';
import { LessonChat } from '../models/LessonChat';
import { LessonFile } from '../models/LessonFile';
import { Reservation } from '../models/Reservation';
import User, { IUser } from '../models/User';
import fs from 'fs';
import path from 'path';
import { getSocketIO } from '../socket';
import { createLogger } from '../utils/logger';

const lessonChatLogger = createLogger('LessonChat');

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
      lessonChatLogger.error('Error getting lesson messages:', error);
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

      try {
        const io = getSocketIO();
        io.to(`lesson:${lessonId}`).emit('lesson:message', {
          message: chatMessage,
          userId: req.user!.id,
          userName: req.user!.name,
          timestamp: chatMessage.timestamp
        });
        lessonChatLogger.info(`Message emitted to lesson room: lesson:${lessonId}`);
      } catch (socketError) {
        lessonChatLogger.warn('Failed to emit message via Socket.IO:', socketError);
      }

      res.status(201).json(chatMessage);
    } catch (error) {
      lessonChatLogger.error('Error sending lesson message:', error);
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

      try {
        const io = getSocketIO();
        io.to(`lesson:${lessonId}`).emit('lesson:file-shared', {
          file: lessonFile,
          message: chatMessage,
          userId: req.user!.id,
          userName: req.user!.name,
          timestamp: chatMessage.timestamp
        });
        lessonChatLogger.info(`File share emitted to lesson room: lesson:${lessonId}`);
      } catch (socketError) {
        lessonChatLogger.warn('Failed to emit file share via Socket.IO:', socketError);
      }

      res.status(201).json({
        file: lessonFile,
        message: chatMessage
      });
    } catch (error) {
      lessonChatLogger.error('Error sharing file in lesson:', error);
      res.status(500).json({ error: 'Failed to share file' });
    }
  }

  // Get shared files for a lesson
  async getLessonFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

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
      lessonChatLogger.error('Error getting lesson files:', error);
      res.status(500).json({ error: 'Failed to get lesson files' });
    }
  }

  // Download shared file
  async downloadLessonFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId, fileId } = req.params;

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

      if (!fs.existsSync(file.filePath)) {
        res.status(404).json({ error: 'File not found on server' });
        return;
      }

      res.download(file.filePath, file.fileName);
    } catch (error) {
      lessonChatLogger.error('Error downloading lesson file:', error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  }

  // Delete shared file (teacher only)
  async deleteLessonFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId, fileId } = req.params;

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

      const reservation = await Reservation.findById(lessonId);
      const isTeacher = reservation?.teacher.toString() === req.user!.id;
      const isUploader = file.uploadedBy.toString() === req.user!.id;

      if (!isTeacher && !isUploader) {
        res.status(403).json({ error: 'Only teachers or file uploaders can delete files' });
        return;
      }

      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      await LessonFile.findByIdAndDelete(fileId);

      try {
        const io = getSocketIO();
        io.to(`lesson:${lessonId}`).emit('lesson:file-deleted', {
          fileId,
          deletedBy: req.user!.id,
          deletedByName: req.user!.name,
          timestamp: new Date()
        });
        lessonChatLogger.info(`File deletion emitted to lesson room: lesson:${lessonId}`);
      } catch (socketError) {
        lessonChatLogger.warn('Failed to emit file deletion via Socket.IO:', socketError);
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      lessonChatLogger.error('Error deleting lesson file:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }

  // Get lesson participants
  async getLessonParticipants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;

      const hasAccess = await this.verifyLessonAccess(req.user!.id, lessonId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this lesson' });
        return;
      }

      const reservation = await Reservation.findById(lessonId)
        .populate('teacher', 'name email role profileImage')
        .populate('student', 'name email role profileImage');

      if (!reservation) {
        res.status(404).json({ error: 'Lesson not found' });
        return;
      }

      if (typeof reservation.teacher !== 'object' || typeof reservation.student !== 'object' ||
          !reservation.teacher || !reservation.student ||
          typeof (reservation.teacher as Record<string, unknown>).name !== 'string' ||
          typeof (reservation.student as Record<string, unknown>).name !== 'string') {
        res.status(500).json({ error: 'Lesson participants not found' });
        return;
      }

      const teacher = reservation.teacher as unknown as IUser;
      const student = reservation.student as unknown as IUser;

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
      lessonChatLogger.error('Error getting lesson participants:', error);
      res.status(500).json({ error: 'Failed to get lesson participants' });
    }
  }

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
      lessonChatLogger.error('Error verifying lesson access:', error);
      return false;
    }
  }
}
