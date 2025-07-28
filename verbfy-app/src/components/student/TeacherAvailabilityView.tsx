import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';
import { useAuthContext } from '@/context/AuthContext';

interface TimeSlot {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherTimezone: string;
  studentTimezone?: string;
  originalStartTime?: string;
  originalEndTime?: string;
  originalDayOfWeek?: number;
}

interface TeacherAvailabilityViewProps {
  teacherId: string;
  teacherName: string;
  onBookingComplete?: (booking: any) => void;
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

const LESSON_TYPES = [
  { value: 'VerbfySpeak', label: 'VerbfySpeak', description: 'Conversation & Speaking Practice' },
  { value: 'VerbfyListen', label: 'VerbfyListen', description: 'Listening Comprehension' },
  { value: 'VerbfyRead', label: 'VerbfyRead', description: 'Reading & Comprehension' },
  { value: 'VerbfyWrite', label: 'VerbfyWrite', description: 'Writing & Composition' },
  { value: 'VerbfyGrammar', label: 'VerbfyGrammar', description: 'Grammar & Structure' },
  { value: 'VerbfyExam', label: 'VerbfyExam', description: 'Exam Preparation' },
];

const LESSON_LEVELS = [
  { value: 'Beginner', label: 'Beginner', description: 'Basic English skills' },
  { value: 'Intermediate', label: 'Intermediate', description: 'Intermediate English skills' },
  { value: 'Advanced', label: 'Advanced', description: 'Advanced English skills' },
];

const TeacherAvailabilityView: React.FC<TeacherAvailabilityViewProps> = ({
  teacherId,
  teacherName,
  onBookingComplete
}) => {
  const { user } = useAuthContext();
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [studentTimezone, setStudentTimezone] = useState<string>('');
  const [selectedLessonType, setSelectedLessonType] = useState<string>('VerbfySpeak');
  const [selectedLessonLevel, setSelectedLessonLevel] = useState<string>('Intermediate');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setStudentTimezone(timezone);
    loadAvailability(timezone);
  }, [teacherId]);

  const loadAvailability = async (timezone: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/api/availability/${teacherId}/available`, {
        params: { studentTimezone: timezone }
      });
      setAvailability(response.data);
    } catch (error) {
      console.error('Error loading teacher availability:', error);
      toastError('Failed to load teacher availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    // Calculate the next occurrence of this day
    const nextDate = getNextOccurrenceOfDay(slot.dayOfWeek, slot.startTime);
    setSelectedDate(nextDate.toISOString().split('T')[0]);
  };

  const getNextOccurrenceOfDay = (dayOfWeek: number, time: string): Date => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const currentDay = now.getDay();
    let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
    
    if (daysToAdd === 0 && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes))) {
      daysToAdd = 7;
    }
    
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(hours, minutes, 0, 0);
    
    return targetDate;
  };

  const handleBookLesson = async () => {
    if (!selectedSlot || !selectedDate) {
      toastError('Please select a time slot and date');
      return;
    }

    setBooking(true);
    
    try {
      console.log('Booking lesson:', {
        teacherId,
        slotId: selectedSlot._id,
        actualDate: selectedDate,
        studentTimezone,
        lessonType: selectedLessonType,
        lessonLevel: selectedLessonLevel
      });

      const response = await api.post('/api/reservations/reserve', {
        teacherId,
        slotId: selectedSlot._id,
        actualDate: selectedDate,
        studentTimezone,
        lessonType: selectedLessonType,
        lessonLevel: selectedLessonLevel
      });

      console.log('Booking successful:', response.data);
      
      toastSuccess('Lesson booked successfully!');
      
      if (onBookingComplete) {
        onBookingComplete(response.data.reservation);
      }
      
      // Clear selection
      setSelectedSlot(null);
      setSelectedDate('');
      setSelectedLessonType('VerbfySpeak');
      setSelectedLessonLevel('Intermediate');
      
      // Reload availability to reflect the booking
      await loadAvailability(studentTimezone);
      
    } catch (error: any) {
      console.error('Error booking lesson:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        const errorMessage = error.response?.data?.message || 'This time slot is no longer available';
        toastError(errorMessage);
        
        // Reload availability to get updated slot status
        await loadAvailability(studentTimezone);
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid booking request';
        toastError(errorMessage);
      } else if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || 'You are not authorized to book this lesson';
        toastError(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to book lesson. Please try again.';
        toastError(errorMessage);
      }
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS.find(day => day.value === dayOfWeek)?.name || 'Unknown';
  };

  const slotsByDay = availability.reduce((acc, slot) => {
    const day = slot.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (availability.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-2">No available time slots</div>
          <p className="text-gray-400 text-sm">
            {teacherName} hasn't set their availability yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with Timezone Info */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Available Time Slots</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600 text-sm">
            All times are shown in your local timezone: <strong>{studentTimezone}</strong>
          </p>
          {availability.length > 0 && (
            <div className="text-sm text-gray-500">
              {availability.length} available slot{availability.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Timezone Conversion Notice */}
      {availability.some(slot => slot.teacherTimezone !== studentTimezone) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">⏰ Timezone Conversion</div>
            <div className="text-xs">
              Times have been converted from teacher's timezone ({availability[0]?.teacherTimezone})
              to your timezone ({studentTimezone})
            </div>
          </div>
        </div>
      )}

      {/* Available Slots */}
      <div className="space-y-4">
        {DAYS.map(day => {
          const daySlots = slotsByDay[day.value] || [];
          if (daySlots.length === 0) return null;

          return (
            <div key={day.value} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-900">{day.name}</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {daySlots.map(slot => (
                    <button
                      key={slot._id}
                      onClick={() => handleSlotSelect(slot)}
                      className={`
                        p-3 text-left rounded-lg border transition-all duration-200
                        ${selectedSlot?._id === slot._id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }
                      `}
                    >
                      <div className="font-medium">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slot.originalStartTime && slot.originalEndTime && (
                          <span>
                            Teacher's time: {formatTime(slot.originalStartTime)} - {formatTime(slot.originalEndTime)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Section */}
      {selectedSlot && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="font-medium text-green-800">Selected Time Slot</div>
                <div className="text-sm text-green-700">
                  {getDayName(selectedSlot.dayOfWeek)} at {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Next occurrence: {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Calculating...'}
                </div>
              </div>
            </div>

            {/* Lesson Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {LESSON_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedLessonType(type.value)}
                    className={`
                      p-3 text-left rounded-lg border transition-all duration-200
                      ${selectedLessonType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lesson Level Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LESSON_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedLessonLevel(level.value)}
                    className={`
                      p-3 text-center rounded-lg border transition-all duration-200
                      ${selectedLessonLevel === level.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{level.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{level.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setSelectedDate('');
                  setSelectedLessonType('VerbfySpeak');
                  setSelectedLessonLevel('Intermediate');
                }}
                className="px-3 py-1.5 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-100 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBookLesson}
                disabled={booking || !selectedDate}
                className={`
                  px-4 py-1.5 text-sm font-medium text-white rounded-md transition-colors
                  ${booking || !selectedDate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                  }
                `}
              >
                {booking ? (
                  <span className="flex items-center gap-1.5">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Booking...
                  </span>
                ) : (
                  'Book Lesson'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">How to Book</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Click on any available time slot to select it</p>
          <p>• The selected slot will be highlighted in blue</p>
          <p>• Click "Book Lesson" to confirm your booking</p>
          <p>• All times are shown in your local timezone</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherAvailabilityView; 