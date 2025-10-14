import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '@/components/common/Toast';
import api from '../../src/lib/api';

interface TimeSlot {
  _id?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  lessonTypes: string[]; // ['conversation', 'grammar', 'vocabulary', etc.]
}

interface AvailabilityData {
  teacherId: string;
  timeSlots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const LESSON_TYPES = [
  { value: 'conversation', label: 'Conversation Practice' },
  { value: 'grammar', label: 'Grammar Lessons' },
  { value: 'vocabulary', label: 'Vocabulary Building' },
  { value: 'pronunciation', label: 'Pronunciation' },
  { value: 'business', label: 'Business English' },
  { value: 'exam_prep', label: 'Exam Preparation' },
  { value: 'writing', label: 'Writing Skills' },
  { value: 'reading', label: 'Reading Comprehension' }
];

const TeacherAvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default to Monday

  // Redirect if not teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Load existing availability
  useEffect(() => {
    if (user?.role === 'teacher') {
      loadAvailability();
    }
  }, [user]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teachers/availability');
      
      if (response.data.success && response.data.availability) {
        setTimeSlots(response.data.availability.timeSlots || []);
      }
    } catch (error: any) {
      console.error('Error loading availability:', error);
      toastError('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      dayOfWeek: selectedDay,
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
      lessonTypes: ['conversation']
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    const updatedSlots = timeSlots.map((slot, i) => 
      i === index ? { ...slot, ...updates } : slot
    );
    setTimeSlots(updatedSlots);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const toggleLessonType = (slotIndex: number, lessonType: string) => {
    const slot = timeSlots[slotIndex];
    const updatedTypes = slot.lessonTypes.includes(lessonType)
      ? slot.lessonTypes.filter(type => type !== lessonType)
      : [...slot.lessonTypes, lessonType];
    
    updateTimeSlot(slotIndex, { lessonTypes: updatedTypes });
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      
      const availabilityData: AvailabilityData = {
        teacherId: user?._id || '',
        timeSlots: timeSlots
      };

      const response = await api.post('/api/teachers/availability', availabilityData);
      
      if (response.data.success) {
        toastSuccess('Availability settings saved successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to save availability');
      }
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toastError(error.response?.data?.message || 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  const getTimeSlotsForDay = (dayOfWeek: number) => {
    return timeSlots
      .map((slot, index) => ({ ...slot, originalIndex: index }))
      .filter(slot => slot.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Manage Availability - Verbfy</title>
          <meta name="description" content="Manage your teaching availability and schedule" />
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading availability settings...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Availability - Verbfy</title>
        <meta name="description" content="Manage your teaching availability and schedule" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Availability Settings</h1>
                <p className="mt-2 text-gray-600">
                  Set your weekly availability for students to book lessons
                </p>
              </div>
              <button
                onClick={saveAvailability}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Availability'
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Day Selector */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Day</h3>
                <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDay(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedDay === index
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{day}</span>
                        <span className="text-sm text-gray-500">
                          {getTimeSlotsForDay(index).length} slots
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Slots for Selected Day */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {DAYS_OF_WEEK[selectedDay]} Time Slots
                  </h3>
                  <button
                    onClick={addTimeSlot}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Time Slot
                  </button>
                </div>

                <div className="space-y-4">
                  {getTimeSlotsForDay(selectedDay).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No time slots set for {DAYS_OF_WEEK[selectedDay]}</p>
                      <p className="text-sm">Click "Add Time Slot" to get started</p>
                    </div>
                  ) : (
                    getTimeSlotsForDay(selectedDay).map((slot) => (
                      <div key={slot.originalIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                          {/* Time Range */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Time Range</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateTimeSlot(slot.originalIndex!, { startTime: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateTimeSlot(slot.originalIndex!, { endTime: e.target.value })}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          {/* Availability Toggle */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={slot.isAvailable}
                                onChange={(e) => updateTimeSlot(slot.originalIndex!, { isAvailable: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Available for booking</span>
                            </label>
                          </div>

                          {/* Lesson Types */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Lesson Types</label>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {LESSON_TYPES.map((lessonType) => (
                                <label key={lessonType.value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={slot.lessonTypes.includes(lessonType.value)}
                                    onChange={() => toggleLessonType(slot.originalIndex!, lessonType.value)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-xs text-gray-700">{lessonType.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Actions</label>
                            <button
                              onClick={() => removeTimeSlot(slot.originalIndex!)}
                              className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS_OF_WEEK.map((day, index) => {
                const daySlots = getTimeSlotsForDay(index);
                const availableSlots = daySlots.filter(slot => slot.isAvailable);
                
                return (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">{day}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {availableSlots.length} available
                    </p>
                    <p className="text-xs text-gray-500">
                      {daySlots.length} total slots
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
           <div className="mt-8 bg-blue-50 rounded-lg p-6">
             <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
             <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
               <div>
                 <h4 className="font-medium mb-2">Setting Your Schedule</h4>
                 <ul className="space-y-1">
                   <li>• Select a day from the left sidebar</li>
                   <li>• Add time slots for when you're available</li>
                   <li>• Choose which lesson types you offer during each slot</li>
                   <li>• Toggle availability on/off as needed</li>
                   <li>• Save your changes to update your schedule</li>
                 </ul>
               </div>
               <div>
                 <h4 className="font-medium mb-2">Student Booking</h4>
                 <ul className="space-y-1">
                   <li>• Students can only book available time slots</li>
                   <li>• They'll see your lesson types for each slot</li>
                   <li>• Bookings are confirmed automatically</li>
                   <li>• You'll receive notifications for new bookings</li>
                   <li>• Update your schedule anytime</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       </div>
     </>
   );
 };
 
 export default TeacherAvailabilityPage;