import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as availabilityService from '../services/availabilityService';

// Test endpoint to verify route is working
export const testEndpoint = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('=== TEST ENDPOINT HIT ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  console.log('=== END TEST ENDPOINT ===');
  
  res.json({ 
    message: 'Test endpoint working',
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user
  });
};

// Set teacher availability for the week
export const setAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { availabilitySlots, teacherTimezone } = req.body;

    console.log('Setting availability for teacher:', teacherId, 'with', availabilitySlots?.length, 'slots');

    if (!availabilitySlots || !Array.isArray(availabilitySlots)) {
      console.error('Invalid availabilitySlots:', availabilitySlots);
      res.status(400).json({ message: 'Availability slots array is required' });
      return;
    }

    // Validate slots structure
    for (let i = 0; i < availabilitySlots.length; i++) {
      const slot = availabilitySlots[i];
      
      if (slot.dayOfWeek === undefined || slot.dayOfWeek === null || slot.startTime === undefined || slot.startTime === null || slot.endTime === undefined || slot.endTime === null) {
        console.error(`Slot ${i} validation failed:`, {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slot: slot,
          dayOfWeekExists: slot.dayOfWeek !== undefined && slot.dayOfWeek !== null,
          startTimeExists: slot.startTime !== undefined && slot.startTime !== null,
          endTimeExists: slot.endTime !== undefined && slot.endTime !== null
        });
        res.status(400).json({ 
          message: 'Each slot must have dayOfWeek, startTime, and endTime' 
        });
      return;
      }

      // Validate data types
      if (typeof slot.dayOfWeek !== 'number' || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
        console.error(`Slot ${i} type validation failed:`, {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          dayOfWeekType: typeof slot.dayOfWeek,
          startTimeType: typeof slot.startTime,
          endTimeType: typeof slot.endTime
        });
        res.status(400).json({ 
          message: 'Invalid data types: dayOfWeek must be number, startTime and endTime must be strings' 
        });
      return;
      }
      
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        console.error(`Slot ${i} dayOfWeek out of range:`, slot.dayOfWeek);
        res.status(400).json({ 
          message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' 
        });
      return;
      }
    }

    // Add timezone to each slot
    const slotsWithTimezone = availabilitySlots.map(slot => ({
      ...slot,
      teacherTimezone: teacherTimezone || 'UTC'
    }));

    const result = await availabilityService.setTeacherAvailability(teacherId, slotsWithTimezone);
    res.status(200).json({ 
      message: 'Availability updated successfully',
      slots: result 
    });
  } catch (error: any) {
    console.error('Error setting availability:', error);
    res.status(500).json({ message: error.message || 'Failed to set availability' });
  }
};

// Get teacher availability
export const getTeacherAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.params.teacherId || req.user!.id;
    const { studentTimezone } = req.query;
    
    const availability = await availabilityService.getTeacherAvailability(
      teacherId, 
      studentTimezone as string
    );
    res.json(availability);
  } catch (error: any) {
    console.error('Error getting availability:', error);
    res.status(500).json({ message: error.message || 'Failed to get availability' });
  }
};

// Get current teacher's availability
export const getMyAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { studentTimezone } = req.query;
    
    const availability = await availabilityService.getTeacherAvailability(
      teacherId, 
      studentTimezone as string
    );
    res.json(availability);
  } catch (error: any) {
    console.error('Error getting my availability:', error);
    res.status(500).json({ message: error.message || 'Failed to get availability' });
  }
};

// Get available slots for booking (for students)
export const getAvailableSlotsForBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.params.teacherId;
    const { studentTimezone } = req.query;
    
    if (!teacherId) {
      res.status(400).json({ message: 'Teacher ID is required' });
      return;
    }
    
    const availableSlots = await availabilityService.getAvailableSlotsForBooking(
      teacherId, 
      studentTimezone as string
    );
    res.json(availableSlots);
  } catch (error: any) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ message: error.message || 'Failed to get available slots' });
  }
};

// Delete specific availability slot
export const deleteAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { slotId } = req.params;
    
    await availabilityService.deleteAvailabilitySlot(teacherId, slotId);
    res.json({ message: 'Availability slot deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ message: error.message || 'Failed to delete availability slot' });
  }
}; 