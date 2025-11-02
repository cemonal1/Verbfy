import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TeacherAvailabilityView from '@/components/student/TeacherAvailabilityView';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
  rating?: number;
  bio?: string;
  specializations?: string[];
  totalLessons?: number;
  profileImage?: string;
}

interface AvailabilitySlot {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  teacherTimezone: string;
}

interface BookingData {
  teacherId: string;
  slotId: string;
  actualDate: string;
  studentTimezone: string;
  lessonType: string;
  lessonLevel: string;
  notes?: string;
}

interface Booking {
  id: string;
  teacher: Teacher;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const LESSON_TYPES = [
  'VerbfySpeak',
  'VerbfyListen', 
  'VerbfyRead',
  'VerbfyWrite',
  'VerbfyGrammar',
  'VerbfyExam'
];

const LESSON_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced'
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const StudentReservePage: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData>({
    teacherId: '',
    slotId: '',
    actualDate: '',
    studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lessonType: 'VerbfySpeak',
    lessonLevel: 'Intermediate',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Select Teacher, 2: Select Time, 3: Confirm Booking

  // Fetch teachers on component mount
  useEffect(() => {
    if (user && user.role !== 'student') {
      router.replace('/dashboard');
      return;
    }
    fetchTeachers();
  }, [user, router]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/teachers');
      console.log('🔍 Teachers API Response:', response);
      
      // Check if response has the expected structure
      if (response.data && response.data.success && Array.isArray(response.data.teachers)) {
        setTeachers(response.data.teachers);
      } else if (Array.isArray(response.data)) {
        // Fallback: if response.data is directly an array
        setTeachers(response.data);
      } else {
        console.error('❌ Unexpected teachers API response structure:', response.data);
        setTeachers([]);
      }
    } catch (err: any) {
      setError('Failed to load teachers');
      console.error('Error fetching teachers:', err);
      toastError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  // Deep-link: preselect teacher from query param
  useEffect(() => {
    const { teacherId } = router.query as { teacherId?: string };
    if (!teacherId) return;
    if (teachers.length === 0) return;
    const found = teachers.find(t => t._id === teacherId || (t as any).id === teacherId);
    if (found) {
      handleTeacherSelect(found);
    }
  }, [router.query, teachers]);

  const fetchAvailability = async (teacherId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/availability/teacher/${teacherId}`);
      setAvailabilitySlots(response.data.availability || []);
    } catch (err: any) {
      setError('Failed to load teacher availability');
      console.error('Error fetching availability:', err);
      toastError('Failed to load teacher availability');
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setBookingData(prev => ({ ...prev, teacherId: teacher._id }));
    await fetchAvailability(teacher._id);
    setStep(2);
  };

  const handleSlotSelect = (slot: AvailabilitySlot, date: string) => {
    setSelectedSlot(slot);
    setSelectedDate(date);
    setBookingData(prev => ({
      ...prev,
      slotId: slot._id,
      actualDate: date
    }));
    setStep(3);
  };

  const handleBookingSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/api/reservations/book', bookingData);
      
      if (response.data.success) {
        setSuccess('Lesson booked successfully!');
        toastSuccess('Lesson booked successfully!');
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to book lesson';
      setError(errorMessage);
      toastError(errorMessage);
      console.error('Error booking lesson:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNextAvailableDates = (dayOfWeek: number, count: number = 7) => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) { // Check next 30 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() === dayOfWeek && date >= today) {
        dates.push(date.toISOString().split('T')[0]);
        if (dates.length >= count) break;
      }
    }
    
    return dates;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!user) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== 'student') {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to students.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Book a Lesson - Verbfy</title>
        <meta name="description" content="Book a lesson with one of our qualified English teachers" />
      </Head>
      
      <DashboardLayout allowedRoles={['student']}>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Book a Lesson
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your teacher and schedule your 30-minute English lesson
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2 space-x-8 text-sm text-gray-600">
              <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Select Teacher</span>
              <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Choose Time</span>
              <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Confirm Booking</span>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Step 1: Select Teacher */}
          {step === 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
                Choose Your Teacher
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading teachers...</p>
                </div>
              ) : teachers.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-user-times text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No teachers available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleTeacherSelect(teacher)}
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className="fas fa-user text-blue-600"></i>
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {teacher.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {teacher.specialty || 'English Teacher'}
                          </p>
                        </div>
                      </div>
                      
                      {teacher.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {teacher.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {teacher.totalLessons || 0} lessons
                        </span>
                        <span className="text-blue-600 font-medium">
                          Select →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && selectedTeacher && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Choose Time with {selectedTeacher.name}
                </h2>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Change Teacher
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading availability...</p>
                </div>
              ) : availabilitySlots.length > 0 ? (
                <div className="space-y-6">
                  {DAYS_OF_WEEK.map((dayName, dayIndex) => {
                    const daySlots = availabilitySlots.filter(
                      slot => slot.dayOfWeek === dayIndex && !slot.isBooked
                    );
                    
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={dayIndex} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                          {dayName}
                        </h3>
                        
                        {daySlots.map((slot) => {
                          const availableDates = getNextAvailableDates(dayIndex);
                          
                          return (
                            <div key={slot._id} className="mb-4">
                              <div className="flex items-center mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                {availableDates.map((date) => (
                                  <button
                                    key={date}
                                    onClick={() => handleSlotSelect(slot, date)}
                                    className="p-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-colors"
                                  >
                                    {new Date(date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No available time slots</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm Booking */}
          {step === 3 && selectedTeacher && selectedSlot && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Your Booking
                </h2>
                <button
                  onClick={() => setStep(2)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Change Time
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Booking Summary */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Lesson Details</h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Teacher:</span>
                      <span className="font-medium">{selectedTeacher.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="font-medium">
                        {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="font-medium">30 minutes</span>
                    </div>
                  </div>
                </div>

                {/* Lesson Preferences */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Lesson Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Lesson Type
                      </label>
                      <select
                        value={bookingData.lessonType}
                        onChange={(e) => setBookingData(prev => ({ ...prev, lessonType: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      >
                        {LESSON_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Level
                      </label>
                      <select
                        value={bookingData.lessonLevel}
                        onChange={(e) => setBookingData(prev => ({ ...prev, lessonLevel: e.target.value }))}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      >
                        {LESSON_LEVELS.map((level) => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={bookingData.notes}
                        onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any specific topics or goals for this lesson?"
                        rows={3}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleBookingSubmit}
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
         </div>
       </DashboardLayout>
     </>
   );
 };

 export default StudentReservePage;