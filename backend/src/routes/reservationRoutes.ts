import { Router } from 'express';
import { auth, requireRole } from '../middleware/auth';
import * as reservationController from '../controllers/reservationController';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

// Book a lesson (student only)
router.post('/reserve', auth, requireRole('student'), idempotencyMiddleware, reservationController.bookReservation);

// Get student's bookings
router.get('/student', auth, requireRole('student'), reservationController.getStudentBookings);

// Get teacher's bookings
router.get('/teacher', auth, requireRole('teacher'), reservationController.getTeacherBookings);

// Get upcoming reservations
router.get('/upcoming', auth, reservationController.getUpcomingReservations);

// Get reservation by ID (for video room access) - must be after specific routes
router.get('/:reservationId', auth, reservationController.getReservationById);

// Cancel reservation
router.delete('/:reservationId', auth, idempotencyMiddleware, reservationController.cancelReservation);

export default router; 