import { Availability, IAvailability } from '../models/Availability';
import { Reservation, IReservation } from '../models/Reservation';
import mongoose from 'mongoose';

export const createAvailability = async (teacherId: string, dayOfWeek: number, startTime: string, endTime: string) => {
  try {
    const slot = new Availability({ 
      teacher: teacherId, 
      dayOfWeek, 
      startTime, 
      endTime,
      isRecurring: true 
    });
    await slot.save();
    return slot;
  } catch (error) {
    throw error;
  }
};

export const getAvailabilityByTeacher = async (teacherId: string) => {
  try {
    return await Availability.find({ teacher: teacherId }).sort({ dayOfWeek: 1, startTime: 1 });
  } catch (error) {
    throw error;
  }
};

export const getAvailableSlots = async () => {
  try {
    return await Availability.find({ isBooked: false }).sort({ dayOfWeek: 1, startTime: 1 });
  } catch (error) {
    throw error;
  }
};

export const bookReservation = async (studentId: string, slotId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const slot = await Availability.findById(slotId).session(session);
    if (!slot || slot.isBooked) {
      throw new Error('Slot not available');
    }
    
    // Mark the slot as booked
    slot.isBooked = true;
    await slot.save({ session });
    
    // Create the reservation
    const reservation = new Reservation({
      student: studentId,
      teacher: slot.teacher,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'booked',
    });
    await reservation.save({ session });
    
    await session.commitTransaction();
    return reservation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getReservationsByUser = async (userId: string, role: 'student' | 'teacher') => {
  try {
    if (role === 'student') {
      return await Reservation.find({ student: userId })
        .populate('teacher', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return await Reservation.find({ teacher: userId })
        .populate('student', 'name email')
        .sort({ createdAt: -1 });
    }
  } catch (error) {
    throw error;
  }
};

export const submitFeedback = async (reservationId: string, feedback: string) => {
  try {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw new Error('Reservation not found');
    reservation.feedback = feedback;
    reservation.status = 'completed';
    await reservation.save();
    return reservation;
  } catch (error) {
    throw error;
  }
};

// Helper function to get upcoming reservations
export const getUpcomingReservations = async (userId: string, role: 'student' | 'teacher') => {
  try {
    const query = role === 'student' ? { student: userId } : { teacher: userId };
    return await Reservation.find({ ...query, status: 'booked' })
      .populate(role === 'student' ? 'teacher' : 'student', 'name email')
      .sort({ createdAt: 1 });
  } catch (error) {
    throw error;
  }
};

// Helper function to cancel a reservation
export const cancelReservation = async (reservationId: string, userId: string, role: 'student' | 'teacher') => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    
    // Check if user is authorized to cancel this reservation
    const isAuthorized = role === 'student' 
      ? reservation.student.toString() === userId
      : reservation.teacher.toString() === userId;
    
    if (!isAuthorized) {
      throw new Error('Not authorized to cancel this reservation');
    }
    
    // Update reservation status
    reservation.status = 'cancelled';
    await reservation.save({ session });
    
    // Free up the availability slot
    await Availability.findOneAndUpdate(
      {
        teacher: reservation.teacher,
        dayOfWeek: reservation.dayOfWeek,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        isBooked: true
      },
      { isBooked: false },
      { session }
    );
    
    await session.commitTransaction();
    return reservation;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}; 