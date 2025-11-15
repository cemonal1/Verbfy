import { createLogger } from '../utils/logger';
const timezoneLogger = createLogger('Timezone');
/**
 * Timezone utility functions for handling timezone conversions
 * and time calculations in the availability system
 */

export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherTimezone: string;
}

export interface ConvertedTimeSlot extends TimeSlot {
  convertedStartTime: string;
  convertedEndTime: string;
  convertedDayOfWeek: number;
  studentTimezone: string;
}

/**
 * Get the current timezone of the user
 */
export const getUserTimezone = (): string => {
  // This would typically come from the user's browser or settings
  // For now, we'll use a default
  return 'UTC';
};

/**
 * Convert time from one timezone to another
 */
export const convertTimeBetweenTimezones = (
  time: string, // HH:MM format
  fromTimezone: string,
  toTimezone: string,
  dayOfWeek: number
): { convertedTime: string; convertedDayOfWeek: number } => {
  try {
    // Create a date object for the specific day and time
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create a date for the next occurrence of this day
    const now = new Date();
    const currentDay = now.getDay();
    let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    if (daysToAdd === 0 && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes))) {
      daysToAdd = 7; // Next week
    }
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Convert to the target timezone
    const convertedDate = new Date(targetDate.toLocaleString('en-US', { timeZone: toTimezone }));
    
    const convertedHours = convertedDate.getHours().toString().padStart(2, '0');
    const convertedMinutes = convertedDate.getMinutes().toString().padStart(2, '0');
    const convertedTime = `${convertedHours}:${convertedMinutes}`;
    const convertedDayOfWeek = convertedDate.getDay();
    
    return { convertedTime, convertedDayOfWeek };
  } catch (error) {
    timezoneLogger.error('Error converting timezone:', error);
    // Fallback to original time if conversion fails
    return { convertedTime: time, convertedDayOfWeek: dayOfWeek };
  }
};

/**
 * Convert availability slots from teacher's timezone to student's timezone
 */
export const convertAvailabilityToStudentTimezone = (
  slots: TimeSlot[],
  studentTimezone: string
): ConvertedTimeSlot[] => {
  return slots.map(slot => {
    const startConversion = convertTimeBetweenTimezones(
      slot.startTime,
      slot.teacherTimezone,
      studentTimezone,
      slot.dayOfWeek
    );
    
    const endConversion = convertTimeBetweenTimezones(
      slot.endTime,
      slot.teacherTimezone,
      studentTimezone,
      slot.dayOfWeek
    );
    
    return {
      ...slot,
      convertedStartTime: startConversion.convertedTime,
      convertedEndTime: endConversion.convertedTime,
      convertedDayOfWeek: startConversion.convertedDayOfWeek,
      studentTimezone
    };
  });
};

/**
 * Check if a time slot is in the past
 */
export const isSlotInPast = (dayOfWeek: number, time: string, timezone: string = 'UTC'): boolean => {
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toLocaleTimeString('en-US', { 
      timeZone: timezone,
      hour12: false 
    }).slice(0, 5);
    
    if (dayOfWeek < currentDay) return true;
    if (dayOfWeek === currentDay) {
      return time < currentTime;
    }
    return false;
  } catch (error) {
    timezoneLogger.error('Error checking if slot is in past:', error);
    return false;
  }
};

/**
 * Get the current time in a specific timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: false
    }).slice(0, 5);
  } catch (error) {
    timezoneLogger.error('Error getting current time in timezone:', error);
    return new Date().toTimeString().slice(0, 5);
  }
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate timezone string
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get timezone offset in minutes
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const date = new Date();
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (0 * 60000));
    const targetOffset = targetTime.toLocaleString('en-US', { timeZone: timezone });
    return new Date(targetOffset).getTimezoneOffset();
  } catch (error) {
    timezoneLogger.error('Error getting timezone offset:', error);
    return 0;
  }
}; 