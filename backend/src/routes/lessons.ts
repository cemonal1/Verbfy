import express from 'express';
import { LessonController } from '../controllers/lessonController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Student lesson routes
router.get('/student', auth, LessonController.getStudentLessons);
router.get('/:id', auth, LessonController.getLesson);
router.post('/:id/join', auth, LessonController.joinLesson);
router.post('/:id/leave', auth, LessonController.leaveLesson);

// Create lesson (for testing/demo)
router.post('/', auth, LessonController.createLesson);

export default router;
