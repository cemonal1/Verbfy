import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { userDataCache } from '../middleware/cacheMiddleware';
import * as teacherController from '../controllers/teacherController';

const router = Router();

// All routes require authentication and teacher role
router.use(auth);
router.use(requireRole('teacher'));

// Get teacher's availability
router.get('/availability', userDataCache, teacherController.getTeacherAvailability);

// Set/Update teacher's availability
router.post('/availability', idempotencyMiddleware, teacherController.setTeacherAvailability);

// Update specific availability slot
router.put('/availability/:slotId', idempotencyMiddleware, teacherController.updateAvailabilitySlot);

// Delete specific availability slot
router.delete('/availability/:slotId', idempotencyMiddleware, teacherController.deleteAvailabilitySlot);

export default router;