import { Router } from 'express';
import * as availabilityController from '../controllers/availabilityController';
import { auth, requireRole } from '../middleware/auth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { shortCache, userDataCache } from '../middleware/cacheMiddleware';

const router = Router();

// Test endpoint to verify route is working
router.get('/test', auth, availabilityController.testEndpoint);

// Teacher sets their availability
router.post('/set', auth, requireRole('teacher'), idempotencyMiddleware, availabilityController.setAvailability);

// Get teacher's own availability
router.get('/my-availability', auth, requireRole('teacher'), userDataCache, availabilityController.getMyAvailability);

// Get specific teacher's availability (for students)
router.get('/:teacherId', auth, shortCache, availabilityController.getTeacherAvailability);

// Get available slots for booking (for students)
router.get('/:teacherId/available', auth, shortCache, availabilityController.getAvailableSlotsForBooking);

// Delete specific availability slot
router.delete('/slot/:slotId', auth, requireRole('teacher'), idempotencyMiddleware, availabilityController.deleteAvailabilitySlot);

export default router;