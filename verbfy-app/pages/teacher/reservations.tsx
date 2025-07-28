import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';
import { useAuthContext } from '../../src/context/AuthContext';
import api from '../../src/lib/api';
import Link from 'next/link';

interface Reservation {
  id: string; // Changed from _id to match backend response
  student: {
    _id: string;
    name: string;
    email: string;
  };
  date: string; // Changed from actualDate to match backend response
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  notes?: string;
}

function TeacherReservationsPage() {
  const { user } = useAuthContext();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  // Fetch teacher reservations
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/reservations/teacher');
        setReservations(response.data.bookings || []);
      } catch (err: any) {
        console.error('Error fetching reservations:', err);
        setError(err.response?.data?.message || 'Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReservations();
    }
  }, [user]);

  // Filter reservations based on status and date
  const filteredReservations = reservations.filter(reservation => {
    const now = new Date();
    const lessonDate = new Date(reservation.date);
    const lessonTime = new Date(lessonDate);
    const [hours, minutes] = reservation.startTime.split(':');
    lessonTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    switch (filter) {
      case 'upcoming':
        return reservation.status === 'booked' && lessonTime > now;
      case 'completed':
        return reservation.status === 'completed';
      case 'cancelled':
        return reservation.status === 'cancelled';
      default:
        return true;
    }
  });

  // Calculate duration between two time strings
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  // Format date for display
  const formatDate = (dateString: string, startTime: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const lessonTime = new Date(date);
    const [hours, minutes] = startTime.split(':');
    lessonTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const timeDiff = lessonTime.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) {
      return 'Today';
    } else if (daysDiff === 1) {
      return 'Tomorrow';
    } else if (daysDiff < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['teacher']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={['teacher']}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
              <p className="text-gray-600 mt-1">Manage your lesson bookings and view student information</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link 
                href="/teacher/availability"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Availability
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: reservations.length },
              { key: 'upcoming', label: 'Upcoming', count: reservations.filter(r => r.status === 'booked' && new Date(r.date) > new Date()).length },
              { key: 'completed', label: 'Completed', count: reservations.filter(r => r.status === 'completed').length },
              { key: 'cancelled', label: 'Cancelled', count: reservations.filter(r => r.status === 'cancelled').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Reservations List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {filteredReservations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredReservations.map((reservation) => {
                const lessonDate = new Date(reservation.date);
                const lessonTime = new Date(lessonDate);
                const [hours, minutes] = reservation.startTime.split(':');
                lessonTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const now = new Date();
                
                // Calculate time difference in minutes
                const timeDiffMinutes = (lessonTime.getTime() - now.getTime()) / (1000 * 60);
                
                // Can join if lesson is within 15 minutes before start time or during the lesson
                const canJoin = reservation.status === 'booked' && timeDiffMinutes >= -15 && timeDiffMinutes <= 60;
                
                // Check if lesson has ended (more than 1 hour after start time)
                const lessonEndTime = new Date(lessonTime);
                const [endHours, endMinutes] = reservation.endTime.split(':');
                lessonEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
                const hasEnded = now > lessonEndTime;

                return (
                  <div key={reservation.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user-graduate text-blue-600"></i>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {reservation.student.name}
                            </h3>
                            <p className="text-sm text-gray-600">{reservation.student.email}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                {formatDate(reservation.date, reservation.startTime)}
                              </span>
                              <span className="text-sm text-gray-500">
                                {reservation.startTime} - {reservation.endTime}
                              </span>
                              <span className="text-sm text-gray-500">
                                {calculateDuration(reservation.startTime, reservation.endTime)} min
                              </span>
                            </div>
                            {reservation.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                "{reservation.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                        
                        {reservation.status === 'booked' && canJoin && (
                          <Link
                            href={`/talk/${reservation.id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <i className="fas fa-video mr-2"></i>
                            Join Lesson
                          </Link>
                        )}
                        
                        {reservation.status === 'booked' && !canJoin && (
                          <span className="text-sm text-gray-500">
                            {hasEnded ? 'Time expired' : 'Not yet available'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You don't have any reservations yet."
                  : `No ${filter} reservations found.`
                }
              </p>
              <Link
                href="/teacher/availability"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Set Your Availability
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherReservationsPage; 