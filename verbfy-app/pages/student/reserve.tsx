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
}

interface Booking {
  id: string;
  teacher: Teacher;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

const StudentReservePage: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user && user.role !== 'student') {
      router.replace('/dashboard');
      return;
    }
    loadTeachers();
  }, [user, router]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
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
        toastError('Invalid response format from teachers API');
      }
    } catch (error) {
      console.error('❌ Error loading teachers:', error);
      setTeachers([]);
      toastError('Failed to load teachers');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setBookingComplete(false);
    setRecentBooking(null);
  };

  const handleBookingComplete = (booking: Booking) => {
    setBookingComplete(true);
    setRecentBooking(booking);
    toastSuccess(`Lesson booked successfully with ${booking.teacher.name}!`);
  };

  const handleViewMyBookings = () => {
    router.push('/student/bookings');
  };

  if (loadingTeachers) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Book a Lesson - Verbfy</title>
        <meta name="description" content="Book a lesson with one of our expert teachers" />
      </Head>

      <DashboardLayout allowedRoles={['student']}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Lesson</h1>
            <p className="text-gray-600">
              Choose a teacher and select an available time slot to book your lesson.
            </p>
          </div>

          {/* Success Message */}
          {bookingComplete && recentBooking && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-green-800">Booking Confirmed!</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Your lesson with <strong>{recentBooking.teacher.name}</strong> has been booked successfully.</p>
                    <p className="mt-1">
                      <strong>Date:</strong> {new Date(recentBooking.date).toLocaleDateString()} at {recentBooking.startTime}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleViewMyBookings}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 transition-colors"
                    >
                      View My Bookings
                    </button>
                    <button
                      onClick={() => {
                        setBookingComplete(false);
                        setRecentBooking(null);
                        setSelectedTeacher(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Book Another Lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Selection */}
          {!bookingComplete && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Teacher</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((teacher) => (
                  <button
                    key={teacher._id}
                    onClick={() => handleTeacherSelect(teacher)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200 text-left
                      ${selectedTeacher?._id === teacher._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {teacher.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                        <p className="text-sm text-gray-600">{teacher.specialty || 'General English'}</p>
                        {teacher.rating && (
                          <div className="flex items-center mt-1">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">{teacher.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Availability */}
          {selectedTeacher && !bookingComplete && (
            <TeacherAvailabilityView
              teacherId={selectedTeacher._id}
              teacherName={selectedTeacher.name}
              onBookingComplete={handleBookingComplete}
            />
          )}

          {/* Instructions */}
          {!selectedTeacher && !bookingComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">How to Book a Lesson</h3>
              <div className="text-sm text-blue-700 space-y-2">
                <p>1. <strong>Select a Teacher:</strong> Choose from our qualified English teachers above</p>
                <p>2. <strong>View Availability:</strong> See the teacher's available time slots</p>
                <p>3. <strong>Choose a Time:</strong> Click on an available slot that works for you</p>
                <p>4. <strong>Confirm Booking:</strong> Review and confirm your lesson booking</p>
                <p>5. <strong>Get Ready:</strong> You'll receive confirmation and can join your lesson at the scheduled time</p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentReservePage; 