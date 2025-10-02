import { Router } from 'express';
import { LessonChatController } from '../controllers/lessonChatController';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();
const controller = new LessonChatController();

// Configure multer for file uploads during lessons
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/lesson-materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow documents, images, audio, and video files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Get chat messages for a lesson
router.get('/lesson/:lessonId/messages', auth, async (req, res) => {
  await controller.getLessonMessages(req, res);
});

// Send a chat message during lesson
router.post('/lesson/:lessonId/message', auth, async (req, res) => {
  await controller.sendLessonMessage(req, res);
});

// Upload and share file during lesson
router.post('/lesson/:lessonId/share-file', auth, upload.single('file'), async (req, res) => {
  await controller.shareFileInLesson(req, res);
});

// Get shared files for a lesson
router.get('/lesson/:lessonId/files', auth, async (req, res) => {
  await controller.getLessonFiles(req, res);
});

// Download shared file
router.get('/lesson/:lessonId/file/:fileId/download', auth, async (req, res) => {
  await controller.downloadLessonFile(req, res);
});

// Delete shared file (teacher only)
router.delete('/lesson/:lessonId/file/:fileId', auth, async (req, res) => {
  await controller.deleteLessonFile(req, res);
});

// Get lesson participants for chat
router.get('/lesson/:lessonId/participants', auth, async (req, res) => {
  await controller.getLessonParticipants(req, res);
});

export default router;