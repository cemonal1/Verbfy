import { Router } from 'express';
import { VerbfyLessonController } from '../controllers/verbfyLessonController';
import { auth } from '../middleware/auth';

const router = Router();

// Get all lessons (public)
router.get('/', VerbfyLessonController.getLessons);

// Get lesson categories (public)
router.get('/categories', VerbfyLessonController.getCategories);

// Get lesson by ID (public)
router.get('/:id', VerbfyLessonController.getLesson);

// Get lesson statistics (public)
router.get('/:id/stats', VerbfyLessonController.getLessonStats);

// Create lesson (authenticated, teachers/admins only)
router.post('/', auth, VerbfyLessonController.createLesson);

// Update lesson (authenticated, owner only)
router.put('/:id', auth, VerbfyLessonController.updateLesson);

// Delete lesson (authenticated, owner only)
router.delete('/:id', auth, VerbfyLessonController.deleteLesson);

// Start lesson attempt (authenticated)
router.post('/:lessonId/start', auth, VerbfyLessonController.startLesson);

// Submit lesson attempt (authenticated)
router.post('/attempt/:attemptId/submit', auth, VerbfyLessonController.submitLesson);

export default router; 