import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as availabilityService from '../services/availabilityService';

// Get teacher's availability
export const getTeacherAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const availability = await availabilityService.getTeacherAvailability(teacherId);
    
    res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error: any) {
    console.error('Error getting teacher availability:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to get availability' 
    });
  }
};

// Set/Update teacher's availability
export const setTeacherAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { availabilitySlots, teacherTimezone } = req.body;

    if (!availabilitySlots || !Array.isArray(availabilitySlots)) {
      res.status(400).json({ 
        success: false,
        message: 'Availability slots array is required' 
      });
      return;
    }

    // Validate slots structure
    for (let i = 0; i < availabilitySlots.length; i++) {
      const slot = availabilitySlots[i];
      
      if (!slot.dayOfWeek && slot.dayOfWeek !== 0 || !slot.startTime || !slot.endTime) {
        res.status(400).json({ 
          success: false,
          message: 'Each slot must have dayOfWeek, startTime, and endTime' 
        });
        return;
      }

      if (typeof slot.dayOfWeek !== 'number' || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
        res.status(400).json({ 
          success: false,
          message: 'Invalid data types: dayOfWeek must be number, startTime and endTime must be strings' 
        });
        return;
      }
      
      if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
        res.status(400).json({ 
          success: false,
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
      success: true,
      message: 'Availability updated successfully',
      data: result 
    });
  } catch (error: any) {
    console.error('Error setting teacher availability:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to set availability' 
    });
  }
};

// Update specific availability slot
export const updateAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { slotId } = req.params;
    const { dayOfWeek, startTime, endTime, teacherTimezone } = req.body;

    if (!slotId) {
      res.status(400).json({ 
        success: false,
        message: 'Slot ID is required' 
      });
      return;
    }

    const updatedSlot = await availabilityService.updateAvailabilitySlot(
      teacherId, 
      slotId, 
      { dayOfWeek, startTime, endTime, teacherTimezone }
    );
    
    res.status(200).json({ 
      success: true,
      message: 'Availability slot updated successfully',
      data: updatedSlot 
    });
  } catch (error: any) {
    console.error('Error updating availability slot:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update availability slot' 
    });
  }
};

// Delete specific availability slot
export const deleteAvailabilitySlot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { slotId } = req.params;

    if (!slotId) {
      res.status(400).json({ 
        success: false,
        message: 'Slot ID is required' 
      });
      return;
    }

    await availabilityService.deleteAvailabilitySlot(teacherId, slotId);
    
    res.status(200).json({ 
      success: true,
      message: 'Availability slot deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete availability slot' 
    });
  }
};