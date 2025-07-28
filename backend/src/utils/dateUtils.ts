/**
 * Date utility functions for the booking system
 */

/**
 * Get the next occurrence of a specific day of the week
 */
export const getNextOccurrenceOfDay = (dayOfWeek: number, time: string): Date => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date for the next occurrence of this day
  const currentDay = now.getDay();
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  
  // If it's the same day and the time has passed, go to next week
  if (daysToAdd === 0 && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes))) {
    daysToAdd = 7;
  }
  
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysToAdd);
  targetDate.setHours(hours, minutes, 0, 0);
  
  return targetDate;
};

/**
 * Get the next occurrence of a specific day of the week after a given date
 */
export const getNextOccurrenceAfterDate = (dayOfWeek: number, time: string, afterDate: Date): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date for the next occurrence of this day after the given date
  const currentDay = afterDate.getDay();
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  
  // If it's the same day and the time has passed, go to next week
  if (daysToAdd === 0 && (afterDate.getHours() > hours || (afterDate.getHours() === hours && afterDate.getMinutes() >= minutes))) {
    daysToAdd = 7;
  }
  
  const targetDate = new Date(afterDate);
  targetDate.setDate(afterDate.getDate() + daysToAdd);
  targetDate.setHours(hours, minutes, 0, 0);
  
  return targetDate;
};

/**
 * Format a date for display
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time for display
 */
export const formatTimeForDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};

/**
 * Check if a time slot is in the past for a given date
 */
export const isTimeSlotInPast = (date: Date, time: string): boolean => {
  const [hours, minutes] = time.split(':').map(Number);
  const slotDate = new Date(date);
  slotDate.setHours(hours, minutes, 0, 0);
  
  const now = new Date();
  return slotDate < now;
}; 