import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { toastError, toastSuccess } from '@/lib/toast';

interface Booking {
  id: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

const StudentBookingsPage: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'student') {
      router.replace('/dashboard');
      return;
    }
    loadBookings();
  }, [user, router]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/reservations/student');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toastError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this lesson?')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await api.delete(`/api/reservations/${bookingId}`);
      toastSuccess('Booking cancelled successfully');
      await loadBookings(); // Reload the list
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel booking';
      toastError(errorMessage);
    } finally {
      setCancellingId(null);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return 'Booked';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no-show':
        return 'No Show';
      default:
        return status;
    }
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  if (loading) {
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
        <title>My Bookings - Verbfy</title>
        <meta name="description" content="View and manage your lesson bookings" />
      </Head>

      <DashboardLayout allowedRoles={['student']}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-600">
                  View and manage your upcoming and past lesson bookings.
                </p>
              </div>
              <button
                onClick={() => router.push('/student/reserve')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book New Lesson
              </button>
            </div>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500 text-lg mb-2">No bookings found</div>
              <p className="text-gray-400 text-sm mb-4">
                You haven't booked any lessons yet.
              </p>
              <button
                onClick={() => router.push('/student/reserve')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Book Your First Lesson
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Bookings ({bookings.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {booking.teacher.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {booking.teacher.name}
                            </h3>
                            <p className="text-sm text-gray-600">{booking.teacher.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(booking.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium text-gray-900">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                          {isUpcoming(booking.date) && booking.status === 'booked' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 flex flex-col space-y-2">
                        {booking.status === 'booked' && isUpcoming(booking.date) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className={`
                              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                              ${cancellingId === booking.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                              }
                            `}
                          >
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/talk/${booking.id}`)}
                          className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 rounded-md transition-colors"
                        >
                          Join Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Need Help?</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>• <strong>Upcoming lessons:</strong> You can cancel these up to 24 hours before the lesson</p>
              <p>• <strong>Completed lessons:</strong> These are past lessons that have been conducted</p>
              <p>• <strong>Cancelled lessons:</strong> These were cancelled by you or the teacher</p>
              <p>• <strong>Questions?</strong> Contact support if you need assistance with your bookings</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default StudentBookingsPage; 