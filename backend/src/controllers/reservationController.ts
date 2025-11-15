import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Reservation, IReservation } from '../models/Reservation';
import { Availability, IAvailability } from '../models/Availability';
import { Notification } from '../models/Notification';
import UserModel from '../models/User';
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const reservationLogger = createLogger('ReservationController');

// Book a lesson slot
export const bookReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const studentId = req.user!.id;
    const { 
      teacherId, 
      slotId, 
      actualDate, 
      studentTimezone, 
      lessonType = 'VerbfySpeak',
      lessonLevel = 'Intermediate',
      notes 
    } = req.body;

    // Validate required fields
    if (!teacherId || !slotId || !actualDate) {
      await session.abortTransaction();
      res.status(400).json({ 
        message: 'teacherId, slotId, and actualDate are required' 
      });
      return;
    }

    // Validate lesson type
    const validLessonTypes = ['VerbfySpeak', 'VerbfyListen', 'VerbfyRead', 'VerbfyWrite', 'VerbfyGrammar', 'VerbfyExam'];
    if (!validLessonTypes.includes(lessonType)) {
      await session.abortTransaction();
      res.status(400).json({ 
        message: 'Invalid lesson type. Must be one of: ' + validLessonTypes.join(', ') 
      });
      return;
    }

    // Validate lesson level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(lessonLevel)) {
      await session.abortTransaction();
      res.status(400).json({ 
        message: 'Invalid lesson level. Must be one of: ' + validLevels.join(', ') 
      });
      return;
    }

    // Verify student role
    if (req.user!.role !== 'student') {
      await session.abortTransaction();
      res.status(403).json({ 
        message: 'Only students can book lessons' 
      });
      return;
    }

    // Validate teacher exists
    const teacher = await UserModel.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      await session.abortTransaction();
      res.status(404).json({ 
        message: 'Teacher not found' 
      });
      return;
    }

    // Get the availability slot with session
    const availabilitySlot = await Availability.findById(slotId).session(session);
    if (!availabilitySlot) {
      await session.abortTransaction();
      res.status(404).json({ 
        message: 'Time slot not available' 
      });
      return;
    }

    // Verify the slot belongs to the teacher
    if (availabilitySlot.teacher.toString() !== teacherId) {
      await session.abortTransaction();
      res.status(403).json({ 
        message: 'Invalid time slot for this teacher' 
      });
      return;
    }

    // Check if slot is already booked (with session for consistency)
    if (availabilitySlot.isBooked) {
      await session.abortTransaction();
      res.status(409).json({ 
        message: 'This time slot is already booked' 
      });
      return;
    }

    // Parse the actual date
    const lessonDate = new Date(actualDate);
    if (isNaN(lessonDate.getTime())) {
      await session.abortTransaction();
      res.status(400).json({ 
        message: 'Invalid date format' 
      });
      return;
    }

    // Calculate lesson duration
    const [startHour, startMin] = availabilitySlot.startTime.split(':').map(Number);
    const [endHour, endMin] = availabilitySlot.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const lessonDuration = endMinutes - startMinutes;

    // Check for double-booking on the same date and time (with session)
    const existingBooking = await Reservation.findOne({
      teacher: teacherId,
      actualDate: lessonDate,
      startTime: availabilitySlot.startTime,
      status: { $in: ['booked', 'completed'] }
    }).session(session);

    if (existingBooking) {
      await session.abortTransaction();
      res.status(409).json({ 
        message: 'This time slot is already booked by another student' 
      });
      return;
    }

    // Check if this student already has a booking at this time
    const studentExistingBooking = await Reservation.findOne({
      student: studentId,
      actualDate: lessonDate,
      startTime: availabilitySlot.startTime,
      status: { $in: ['booked', 'completed'] }
    }).session(session);

    if (studentExistingBooking) {
      await session.abortTransaction();
      res.status(409).json({ 
        message: 'You already have a lesson booked at this time' 
      });
      return;
    }

    // Create the reservation
    const reservation = new Reservation({
      student: studentId,
      teacher: teacherId,
      dayOfWeek: availabilitySlot.dayOfWeek,
      startTime: availabilitySlot.startTime,
      endTime: availabilitySlot.endTime,
      actualDate: lessonDate,
      teacherTimezone: availabilitySlot.teacherTimezone,
      studentTimezone: studentTimezone || 'UTC',
      lessonType,
      lessonLevel,
      lessonDuration,
      notes,
      status: 'booked'
    });

    await reservation.save({ session });

    // Mark the availability slot as booked
    availabilitySlot.isBooked = true;
    await availabilitySlot.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Create notification for teacher
    try {
      const notification = new Notification({
        recipient: teacherId,
        sender: studentId,
        type: 'booking',
        title: 'New Lesson Booking',
        message: `A student has booked a ${lessonType} lesson for ${new Date(actualDate).toLocaleDateString()} at ${availabilitySlot.startTime}`,
        relatedReservation: reservation._id,
        isRead: false
      });
      
      await notification.save();
      reservationLogger.info('Log', { requestId: req.requestId, data: `Notification created for teacher ${teacherId} about new booking` });
    } catch (notificationError) {
      reservationLogger.error('Error', { requestId: req.requestId, error: 'Error creating notification:', notificationError });
      // Don't fail the booking if notification fails
    }

    // Populate teacher and student details for response
    await reservation.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'student', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Lesson booked successfully',
      reservation: {
        id: reservation._id,
        teacher: reservation.teacher,
        student: reservation.student,
        date: reservation.actualDate,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        lessonType: reservation.lessonType,
        lessonLevel: reservation.lessonLevel,
        lessonDuration: reservation.lessonDuration,
        status: reservation.status
      }
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error booking reservation:', error });
    
    // Abort transaction on error
    await session.abortTransaction();
    
    res.status(500).json({ 
      message: error.message || 'Failed to book lesson' 
    });
  } finally {
    session.endSession();
  }
};

// Get student's bookings
export const getStudentBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    reservationLogger.info('Log', { requestId: req.requestId, data: '[getStudentBookings] Fetching bookings for student:', studentId });

    const now = new Date();

    const allBookings = await Reservation.find({ 
      student: studentId 
    })
    .populate('teacher', 'name email')
    .sort({ actualDate: 1, startTime: 1 });

    reservationLogger.info('Log', { requestId: req.requestId, data: '[getStudentBookings] Found bookings:', allBookings.length });

    // Filter out lessons that have ended
    const activeBookings = allBookings.filter(booking => {
      const lessonDate = new Date(booking.actualDate);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const lessonEndTime = new Date(lessonDate);
      lessonEndTime.setHours(endHour, endMin, 0, 0);
      
      return now <= lessonEndTime; // Only include lessons that haven't ended
    });

    reservationLogger.info('Log', { requestId: req.requestId, data: '[getStudentBookings] Active bookings after filtering:', activeBookings.length });

    res.json({
      bookings: activeBookings.map(booking => ({
        id: booking._id,
        teacher: booking.teacher,
        date: booking.actualDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        createdAt: booking.createdAt
      }))
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: '[getStudentBookings] Error fetching student bookings:', error });
    reservationLogger.error('Error', { requestId: req.requestId, error: '[getStudentBookings] Error stack:', error.stack });
    res.status(500).json({ 
      message: error.message || 'Failed to fetch bookings' 
    });
  }
};

// Get teacher's bookings
export const getTeacherBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;

    // Verify teacher role
    if (req.user!.role !== 'teacher') {
      res.status(403).json({ 
        message: 'Only teachers can access this endpoint' 
      });
      return;
    }

    const now = new Date();
    
    // Get all bookings and filter out ended lessons
    const allBookings = await Reservation.find({ 
      teacher: teacherId 
    })
    .populate('student', 'name email')
    .sort({ actualDate: 1, startTime: 1 });

    // Filter out lessons that have ended
    const activeBookings = allBookings.filter(booking => {
      const lessonDate = new Date(booking.actualDate);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      const lessonEndTime = new Date(lessonDate);
      lessonEndTime.setHours(endHour, endMin, 0, 0);
      
      return now <= lessonEndTime; // Only include lessons that haven't ended
    });

    res.json({
      bookings: activeBookings.map(booking => ({
        id: booking._id,
        student: booking.student,
        date: booking.actualDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        createdAt: booking.createdAt
      }))
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error fetching teacher bookings:', error });
    res.status(500).json({ 
      message: error.message || 'Failed to fetch bookings' 
    });
  }
};

// Cancel a reservation
export const cancelReservation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    const userId = req.user!.id;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      res.status(404).json({ 
        message: 'Reservation not found' 
      });
      return;
    }

    // Check if user owns the reservation (student) or is the teacher
    const isOwner = reservation.student.toString() === userId;
    const isTeacher = reservation.teacher.toString() === userId;

    if (!isOwner && !isTeacher) {
      res.status(403).json({ 
        message: 'You can only cancel your own reservations' 
      });
      return;
    }

    // Check if reservation can be cancelled
    if (reservation.status !== 'booked') {
      res.status(400).json({ 
        message: 'Only booked reservations can be cancelled' 
      });
      return;
    }

    // Update reservation status
    reservation.status = 'cancelled';
    await reservation.save();

    // Free up the availability slot
    const availabilitySlot = await Availability.findOne({
      teacher: reservation.teacher,
      dayOfWeek: reservation.dayOfWeek,
      startTime: reservation.startTime,
      endTime: reservation.endTime
    });

    if (availabilitySlot) {
      availabilitySlot.isBooked = false;
      await availabilitySlot.save();
    }

    res.json({
      message: 'Reservation cancelled successfully',
      reservation: {
        id: reservation._id,
        status: reservation.status
      }
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error cancelling reservation:', error });
    res.status(500).json({ 
      message: error.message || 'Failed to cancel reservation' 
    });
  }
};

// Get upcoming reservations for a user
export const getUpcomingReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    let query: any = {};
    
    if (req.user!.role === 'student') {
      query.student = userId;
    } else if (req.user!.role === 'teacher') {
      query.teacher = userId;
    }

    query.status = { $in: ['booked'] };

    const allReservations = await Reservation.find(query)
      .populate(req.user!.role === 'student' ? 'teacher' : 'student', 'name email')
      .sort({ actualDate: 1, startTime: 1 })
      .limit(20);

    // Filter out lessons that have ended and ensure they're in the future
    const upcomingReservations = allReservations.filter(reservation => {
      const lessonDate = new Date(reservation.actualDate);
      const [endHour, endMin] = reservation.endTime.split(':').map(Number);
      const lessonEndTime = new Date(lessonDate);
      lessonEndTime.setHours(endHour, endMin, 0, 0);
      
      // Only include lessons that haven't ended yet
      return now <= lessonEndTime;
    }).slice(0, 10); // Limit to 10 after filtering

    res.json({
      upcomingReservations: upcomingReservations.map(reservation => ({
        id: reservation._id,
        [req.user!.role === 'student' ? 'teacher' : 'student']: reservation[req.user!.role === 'student' ? 'teacher' : 'student'],
        date: reservation.actualDate,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        lessonType: reservation.lessonType || 'General Lesson',
        lessonLevel: reservation.lessonLevel || 'Intermediate',
        lessonDuration: reservation.lessonDuration || 60
      }))
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error fetching upcoming reservations:', error });
    res.status(500).json({ 
      message: error.message || 'Failed to fetch upcoming reservations' 
    });
  }
}; 

// Get student reservations (for dashboard)
export const getStudentReservations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const reservations = await Reservation.find({ student: studentId })
      .populate('teacher', 'name email profileImage')
      .sort({ actualDate: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Reservation.countDocuments({ student: studentId });
    
    res.json({
      success: true,
      data: {
        bookings: reservations.map(reservation => ({
          id: reservation._id,
          teacher: reservation.teacher,
          date: reservation.actualDate,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          status: reservation.status,
          lessonType: reservation.lessonType,
          lessonLevel: reservation.lessonLevel,
          createdAt: reservation.createdAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error getting student reservations:', error });
    res.status(500).json({
      success: false,
      message: 'Failed to get reservations'
    });
  }
};

// Get reservation by ID
export const getReservationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    const userId = req.user!.id;

    const reservation = await Reservation.findById(reservationId)
      .populate('student', 'name email')
      .populate('teacher', 'name email');

    if (!reservation) {
      res.status(404).json({ 
        message: 'Reservation not found' 
      });
      return;
    }

    // Check if user is part of this reservation
    const isStudent = reservation.student._id.toString() === userId;
    const isTeacher = reservation.teacher._id.toString() === userId;

    if (!isStudent && !isTeacher) {
      res.status(403).json({ 
        message: 'Access denied to this reservation' 
      });
      return;
    }

    res.json(reservation);
  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error fetching reservation:', error });
    res.status(500).json({ 
      message: error.message || 'Failed to fetch reservation' 
    });
  }
};

// Start lesson (create LiveKit room)
export const startLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    const userId = req.user!.id;

    const reservation = await Reservation.findById(reservationId)
      .populate('student', 'name email')
      .populate('teacher', 'name email');

    if (!reservation) {
      res.status(404).json({ 
        success: false,
        message: 'Reservation not found' 
      });
      return;
    }

    // Check if user is part of this reservation
    const isStudent = reservation.student._id.toString() === userId;
    const isTeacher = reservation.teacher._id.toString() === userId;

    if (!isStudent && !isTeacher) {
      res.status(403).json({ 
        success: false,
        message: 'Access denied to this reservation' 
      });
      return;
    }

    // Check if reservation is booked
    if (reservation.status !== 'booked') {
      res.status(400).json({ 
        success: false,
        message: 'Lesson cannot be started. Status: ' + reservation.status 
      });
      return;
    }

    // Check time window (15 minutes before to 15 minutes after start time)
    const now = new Date();
    const lessonDate = new Date(reservation.actualDate);
    const [startHour, startMin] = reservation.startTime.split(':').map(Number);
    const [endHour, endMin] = reservation.endTime.split(':').map(Number);
    
    const lessonStartTime = new Date(lessonDate);
    lessonStartTime.setHours(startHour, startMin, 0, 0);
    
    const lessonEndTime = new Date(lessonDate);
    lessonEndTime.setHours(endHour, endMin, 0, 0);

    const timeBeforeStart = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60);
    const timeAfterEnd = (now.getTime() - lessonEndTime.getTime()) / (1000 * 60);

    // Allow starting 15 minutes before and prevent starting after lesson ends
    if (timeBeforeStart > 15) {
      res.status(400).json({ 
        success: false,
        message: 'Lesson can only be started 15 minutes before the scheduled time' 
      });
      return;
    }

    if (timeAfterEnd > 0) {
      res.status(400).json({ 
        success: false,
        message: 'Lesson time has already ended' 
      });
      return;
    }

    // Update reservation status to in-progress
    reservation.status = 'inProgress';
    await reservation.save();

    // Generate room name
    const roomName = `lesson-${reservationId}`;

    res.json({
      success: true,
      message: 'Lesson started successfully',
      data: {
        reservationId: reservation._id,
        roomName,
        status: reservation.status,
        student: reservation.student,
        teacher: reservation.teacher,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        lessonType: reservation.lessonType,
        lessonLevel: reservation.lessonLevel
      }
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error starting lesson:', error });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to start lesson' 
    });
  }
};

// End lesson
export const endLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.params;
    const userId = req.user!.id;
    const { feedback, rating } = req.body;

    const reservation = await Reservation.findById(reservationId)
      .populate('student', 'name email')
      .populate('teacher', 'name email');

    if (!reservation) {
      res.status(404).json({ 
        success: false,
        message: 'Reservation not found' 
      });
      return;
    }

    // Check if user is part of this reservation
    const isStudent = reservation.student._id.toString() === userId;
    const isTeacher = reservation.teacher._id.toString() === userId;

    if (!isStudent && !isTeacher) {
      res.status(403).json({ 
        success: false,
        message: 'Access denied to this reservation' 
      });
      return;
    }

    // Check if lesson is in progress
    if (reservation.status !== 'inProgress') {
      res.status(400).json({ 
        success: false,
        message: 'Lesson is not in progress' 
      });
      return;
    }

    // Update reservation status to completed
    reservation.status = 'completed';
    
    // Add feedback if provided
    if (feedback) {
      reservation.feedback = feedback;
    }

    await reservation.save();

    // Update teacher's total lessons and rating if student provided rating
    if (isStudent && rating && rating >= 1 && rating <= 5) {
      const teacher = await UserModel.findById(reservation.teacher._id);
      if (teacher) {
        const currentRating = teacher.rating || 0;
        const currentLessons = teacher.totalLessons || 0;
        
        // Calculate new average rating
        const newTotalLessons = currentLessons + 1;
        const newRating = ((currentRating * currentLessons) + rating) / newTotalLessons;
        
        teacher.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
        teacher.totalLessons = newTotalLessons;
        
        await teacher.save();
      }
    }

    // Update student's total lessons taken
    if (isTeacher) {
      const student = await UserModel.findById(reservation.student._id);
      if (student) {
        student.totalLessonsTaken = (student.totalLessonsTaken || 0) + 1;
        await student.save();
      }
    }

    res.json({
      success: true,
      message: 'Lesson completed successfully',
      data: {
        reservationId: reservation._id,
        status: reservation.status,
        feedback: reservation.feedback
      }
    });

  } catch (error: any) {
    reservationLogger.error('Error', { requestId: req.requestId, error: 'Error ending lesson:', error });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to end lesson' 
    });
  }
};