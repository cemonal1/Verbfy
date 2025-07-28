import { Availability, IAvailability } from '../models/Availability';
import { Reservation } from '../models/Reservation';
import { convertAvailabilityToStudentTimezone, isValidTimeFormat, isValidTimezone } from '../utils/timezone';
import mongoose from 'mongoose';

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherTimezone?: string;
}

interface AvailabilityWithConversion {
  _id: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherTimezone: string;
  isRecurring: boolean;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
  originalStartTime?: string;
  originalEndTime?: string;
  originalDayOfWeek?: number;
  studentTimezone?: string;
}

export const setTeacherAvailability = async (teacherId: string, slots: TimeSlot[]): Promise<IAvailability[]> => {
  try {
    // Clear existing availability for this teacher
    await Availability.deleteMany({ teacher: teacherId });

    // Validate and prepare slots
    const validatedSlots = slots.map(slot => {
      if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) {
        throw new Error(`Invalid time format for slot: ${slot.startTime}-${slot.endTime}`);
      }
      
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        throw new Error(`Invalid day of week: ${slot.dayOfWeek}`);
      }

      return {
        teacher: new mongoose.Types.ObjectId(teacherId),
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacherTimezone: slot.teacherTimezone || 'UTC',
        isRecurring: true,
        isBooked: false
      };
    });

    // Create new availability slots
    const availabilitySlots = await Availability.insertMany(validatedSlots);
    return availabilitySlots;
  } catch (error) {
    throw error;
  }
};

export const getTeacherAvailability = async (teacherId: string, studentTimezone?: string): Promise<AvailabilityWithConversion[]> => {
  try {
    const availability = await Availability.find({ teacher: teacherId })
      .sort({ dayOfWeek: 1, startTime: 1 });

    // If student timezone is provided, convert times
    if (studentTimezone && isValidTimezone(studentTimezone)) {
      const slotsWithTimezone = availability.map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacherTimezone: slot.teacherTimezone
      }));

      const convertedSlots = convertAvailabilityToStudentTimezone(slotsWithTimezone, studentTimezone);
      
      // Return converted slots with original IDs
      return availability.map((slot, index) => ({
        _id: slot._id,
        teacher: slot.teacher,
        dayOfWeek: convertedSlots[index].convertedDayOfWeek,
        startTime: convertedSlots[index].convertedStartTime,
        endTime: convertedSlots[index].convertedEndTime,
        teacherTimezone: slot.teacherTimezone,
        isRecurring: slot.isRecurring,
        isBooked: slot.isBooked,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        originalStartTime: slot.startTime,
        originalEndTime: slot.endTime,
        originalDayOfWeek: slot.dayOfWeek,
        studentTimezone: studentTimezone
      }));
    }

    return availability.map(slot => ({
      _id: slot._id,
      teacher: slot.teacher,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      teacherTimezone: slot.teacherTimezone,
      isRecurring: slot.isRecurring,
      isBooked: slot.isBooked,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt
    }));
  } catch (error) {
    throw error;
  }
};

export const deleteAvailabilitySlot = async (teacherId: string, slotId: string): Promise<void> => {
  try {
    const result = await Availability.findOneAndDelete({
      _id: slotId,
      teacher: teacherId
    });

    if (!result) {
      throw new Error('Availability slot not found or not authorized to delete');
    }
  } catch (error) {
    throw error;
  }
};

export const getAvailableSlotsForBooking = async (teacherId: string, studentTimezone?: string): Promise<AvailabilityWithConversion[]> => {
  try {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Get all availability slots for the teacher
    const allSlots = await Availability.find({
      teacher: teacherId
    }).sort({ dayOfWeek: 1, startTime: 1 });

    // Get existing reservations for this teacher to check for conflicts
    const existingReservations = await Reservation.find({
      teacher: teacherId,
      status: { $in: ['booked', 'completed'] }
    });

    // Filter out slots that are marked as booked, have existing reservations, or are in the past
    const availableSlots = allSlots.filter(slot => {
      // Check if slot is marked as booked
      if (slot.isBooked) {
        return false;
      }

      // Check if there are existing reservations for this slot
      const hasExistingReservation = existingReservations.some(reservation => 
        reservation.dayOfWeek === slot.dayOfWeek &&
        reservation.startTime === slot.startTime &&
        reservation.endTime === slot.endTime
      );

      if (hasExistingReservation) {
        return false;
      }

      // Filter out past time slots
      if (slot.dayOfWeek < currentDayOfWeek) {
        return false; // Past days
      }
      
      if (slot.dayOfWeek === currentDayOfWeek && slot.startTime <= currentTime) {
        return false; // Past times today
      }

      return true;
    });

    // Convert to student timezone if provided
    if (studentTimezone && isValidTimezone(studentTimezone)) {
      const slotsWithTimezone = availableSlots.map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        teacherTimezone: slot.teacherTimezone
      }));

      const convertedSlots = convertAvailabilityToStudentTimezone(slotsWithTimezone, studentTimezone);
      
      return availableSlots.map((slot, index) => ({
        _id: slot._id,
        teacher: slot.teacher,
        dayOfWeek: convertedSlots[index].convertedDayOfWeek,
        startTime: convertedSlots[index].convertedStartTime,
        endTime: convertedSlots[index].convertedEndTime,
        teacherTimezone: slot.teacherTimezone,
        isRecurring: slot.isRecurring,
        isBooked: slot.isBooked,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt,
        originalStartTime: slot.startTime,
        originalEndTime: slot.endTime,
        originalDayOfWeek: slot.dayOfWeek,
        studentTimezone: studentTimezone
      }));
    }

    return availableSlots.map(slot => ({
      _id: slot._id,
      teacher: slot.teacher,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      teacherTimezone: slot.teacherTimezone,
      isRecurring: slot.isRecurring,
      isBooked: slot.isBooked,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt
    }));
  } catch (error) {
    throw error;
  }
}; 