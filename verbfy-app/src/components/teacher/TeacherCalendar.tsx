import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface SavedSlot {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface TimezoneInfo {
  timezone: string;
  offset: number;
  currentTime: string;
}

const DAYS = [
  { name: 'Sunday', value: 0, short: 'Sun' },
  { name: 'Monday', value: 1, short: 'Mon' },
  { name: 'Tuesday', value: 2, short: 'Tue' },
  { name: 'Wednesday', value: 3, short: 'Wed' },
  { name: 'Thursday', value: 4, short: 'Thu' },
  { name: 'Friday', value: 5, short: 'Fri' },
  { name: 'Saturday', value: 6, short: 'Sat' },
];

// Generate 30-minute time slots for 24 hours
const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
})();

const TeacherCalendar: React.FC = () => {
  const { user } = useAuthContext();
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [savedSlots, setSavedSlots] = useState<SavedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: new Date().getTimezoneOffset(),
    currentTime: new Date().toLocaleTimeString()
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setTimezoneInfo(prev => ({
        ...prev,
        currentTime: now.toLocaleTimeString()
      }));
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load existing availability on component mount
  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.get('/api/availability/my-availability');
      const slots = response.data;
      setSavedSlots(slots);
      
      // Convert saved slots to selected slots format
      const selectedSet = new Set<string>();
      slots.forEach((slot: SavedSlot) => {
        selectedSet.add(`${slot.dayOfWeek}-${slot.startTime}`);
      });
      setSelectedSlots(selectedSet);
    } catch (error) {
      console.error('Error loading availability:', error);
      toastError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const toggleSlot = useCallback((dayOfWeek: number, startTime: string) => {
    const slotKey = `${dayOfWeek}-${startTime}`;
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slotKey)) {
        newSet.delete(slotKey);
      } else {
        newSet.add(slotKey);
      }
      return newSet;
    });
  }, []);

  const saveAvailability = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Convert selected slots to API format
      const availabilitySlots: TimeSlot[] = [];
      selectedSlots.forEach(slotKey => {
        const [dayOfWeek, startTime] = slotKey.split('-');
        const startTimeIndex = TIME_SLOTS.indexOf(startTime);
        const endTime = TIME_SLOTS[startTimeIndex + 1] || '23:30';
        
        const slot = {
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
        };
        
        // Validate slot before adding
        if (isNaN(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
          console.error('Invalid dayOfWeek:', slot.dayOfWeek, 'from slotKey:', slotKey);
          return;
        }
        
        if (!slot.startTime || !slot.endTime) {
          console.error('Invalid time format:', slot, 'from slotKey:', slotKey);
          return;
        }
        
        availabilitySlots.push(slot);
      });

      const requestData = { 
        availabilitySlots,
        teacherTimezone: timezoneInfo.timezone
      };

      console.log('Saving availability:', {
        slotsCount: availabilitySlots.length,
        timezone: timezoneInfo.timezone
      });

      // Test the data structure
      testDataStructure(availabilitySlots);

      // Additional validation before sending
      if (availabilitySlots.length === 0) {
        toastError('No time slots selected. Please select at least one time slot.');
        return;
      }

      await api.post('/api/availability/set', requestData);
      await loadAvailability(); // Reload to get updated data
      toastSuccess('Availability saved successfully!');
    } catch (error: any) {
      console.error('=== ERROR DEBUG ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('=== END ERROR DEBUG ===');
      
      const errorMessage = error.response?.data?.message || 'Failed to save availability';
      toastError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const isSlotSelected = (dayOfWeek: number, startTime: string) => {
    return selectedSlots.has(`${dayOfWeek}-${startTime}`);
  };

  const getSelectedSlotsCount = () => {
    return selectedSlots.size;
  };

  // Get current day and time for highlighting
  const currentDayOfWeek = currentTime.getDay();
  const currentTimeString = currentTime.toTimeString().slice(0, 5);

  // Check if a slot is in the past for the current day
  const isSlotInPast = (dayOfWeek: number, time: string) => {
    if (dayOfWeek < currentDayOfWeek) return true;
    if (dayOfWeek === currentDayOfWeek) {
      return time < currentTimeString;
    }
    return false;
  };

  // Test function to verify data structure
  const testDataStructure = (slots: TimeSlot[]) => {
    console.log('=== TESTING DATA STRUCTURE ===');
    slots.forEach((slot, index) => {
      console.log(`Slot ${index}:`, {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeekType: typeof slot.dayOfWeek,
        startTimeType: typeof slot.startTime,
        endTimeType: typeof slot.endTime,
        dayOfWeekValid: typeof slot.dayOfWeek === 'number' && !isNaN(slot.dayOfWeek),
        startTimeValid: typeof slot.startTime === 'string' && slot.startTime.length > 0,
        endTimeValid: typeof slot.endTime === 'string' && slot.endTime.length > 0
      });
    });
    console.log('=== END TESTING ===');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with Timezone Info */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Availability</h2>
            <p className="text-gray-600">
              Select your available time slots for the week. Students will be able to book lessons during these times.
            </p>
          </div>
          
          {/* Timezone and Current Time Display */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium">Your Timezone: {timezoneInfo.timezone}</div>
              <div className="text-xs mt-1">Current Time: {timezoneInfo.currentTime}</div>
              <div className="text-xs">Today: {currentTime.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid with Scrollbar */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-4xl mx-auto">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Time slots header */}
            <div className="grid grid-cols-8 gap-0 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <div className="p-3 font-semibold text-gray-700 text-sm bg-white border-r border-gray-200">
                Time
              </div>
              {DAYS.map(day => (
                <div key={day.value} className="p-3 font-semibold text-gray-700 text-sm text-center border-r border-gray-200 last:border-r-0">
                  <div className="font-medium text-sm">{day.short}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{day.name}</div>
                </div>
              ))}
            </div>

            {/* Scrollable Time Slots */}
            <div className="max-h-[500px] overflow-y-auto">
              {TIME_SLOTS.map((time, index) => (
                <div key={time} className={`grid grid-cols-8 gap-0 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="p-2 text-sm text-gray-600 font-medium bg-gray-50 border-r border-gray-200 flex items-center justify-center" data-time={time}>
                    {time}
                  </div>
                  {DAYS.map(day => {
                    const isPast = isSlotInPast(day.value, time);
                    const isSelected = isSlotSelected(day.value, time);
                    const isCurrentDay = day.value === currentDayOfWeek;
                    const isCurrentTime = isCurrentDay && time === currentTimeString;

                    return (
                      <button
                        key={`${day.value}-${time}`}
                        data-time={time}
                        onClick={() => !isPast && toggleSlot(day.value, time)}
                        disabled={isPast}
                        className={`
                          p-2 text-xs rounded-md transition-all duration-200 relative border-r border-gray-200 last:border-r-0 min-h-[40px] flex items-center justify-center
                          ${isPast
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : isSelected
                              ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600 border border-blue-400'
                              : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                          }
                          ${isCurrentDay ? 'ring-1 ring-blue-300' : ''}
                          ${isCurrentTime ? 'ring-2 ring-red-400' : ''}
                        `}
                        title={isPast ? 'This time has passed' : `Select ${day.name} at ${time}`}
                      >
                        {isSelected && (
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-semibold">✓</span>
                          </div>
                        )}
                        {isCurrentTime && (
                          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary and Actions */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="text-sm text-gray-700">
              Selected: <span className="font-semibold text-blue-600 text-base">{getSelectedSlotsCount()}</span> time slots
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Each slot represents 30 minutes • 24-hour format • Timezone: {timezoneInfo.timezone}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSlots(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              Clear All
            </button>
            <button
              onClick={() => {
                const currentTimeElement = document.querySelector(`[data-time="${currentTimeString}"]`);
                if (currentTimeElement) {
                  currentTimeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
              Current Time
            </button>
            <button
              onClick={saveAvailability}
              disabled={saving}
              className={`
                px-4 py-1.5 text-sm font-medium text-white rounded-md transition-colors shadow-sm
                ${saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                }
              `}
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                'Save Availability'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Selection Buttons */}
      <div className="mt-4 max-w-4xl mx-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Quick Selection</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              const morningSlots = new Set<string>();
              DAYS.forEach(day => {
                TIME_SLOTS.slice(12, 24).forEach(time => { // 6 AM to 12 PM
                  morningSlots.add(`${day.value}-${time}`);
                });
              });
              setSelectedSlots(morningSlots);
            }}
            className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors border border-green-200"
          >
            Morning (6 AM - 12 PM)
          </button>
          <button
            onClick={() => {
              const afternoonSlots = new Set<string>();
              DAYS.forEach(day => {
                TIME_SLOTS.slice(24, 36).forEach(time => { // 12 PM to 6 PM
                  afternoonSlots.add(`${day.value}-${time}`);
                });
              });
              setSelectedSlots(afternoonSlots);
            }}
            className="px-2.5 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors border border-yellow-200"
          >
            Afternoon (12 PM - 6 PM)
          </button>
          <button
            onClick={() => {
              const eveningSlots = new Set<string>();
              DAYS.forEach(day => {
                TIME_SLOTS.slice(36, 44).forEach(time => { // 6 PM to 10 PM
                  eveningSlots.add(`${day.value}-${time}`);
                });
              });
              setSelectedSlots(eveningSlots);
            }}
            className="px-2.5 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors border border-purple-200"
          >
            Evening (6 PM - 10 PM)
          </button>
          <button
            onClick={() => {
              const weekdaySlots = new Set<string>();
              DAYS.slice(1, 6).forEach(day => { // Monday to Friday
                TIME_SLOTS.slice(12, 44).forEach(time => { // 6 AM to 10 PM
                  weekdaySlots.add(`${day.value}-${time}`);
                });
              });
              setSelectedSlots(weekdaySlots);
            }}
            className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors border border-blue-200"
          >
            Weekdays (6 AM - 10 PM)
          </button>
          <button
            onClick={() => {
              const weekendSlots = new Set<string>();
              [DAYS[0], DAYS[6]].forEach(day => { // Sunday and Saturday
                TIME_SLOTS.slice(12, 44).forEach(time => { // 6 AM to 10 PM
                  weekendSlots.add(`${day.value}-${time}`);
                });
              });
              setSelectedSlots(weekendSlots);
            }}
            className="px-2.5 py-1 text-xs bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors border border-orange-200"
          >
            Weekends (6 AM - 10 PM)
          </button>
        </div>
      </div>

      {/* Timezone Information */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-4xl mx-auto">
        <h3 className="text-sm font-semibold text-blue-800 mb-1">⏰ Timezone Information</h3>
        <div className="text-xs text-blue-700 space-y-0.5">
          <p>• Your availability is saved in your local timezone: <strong>{timezoneInfo.timezone}</strong></p>
          <p>• Students will see your availability converted to their local timezone</p>
          <p>• Past time slots are automatically disabled and cannot be selected</p>
          <p>• Current time is highlighted with a red dot indicator</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherCalendar;