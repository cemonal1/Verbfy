import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

interface Booking {
  id: string;
  teacher: {
    name: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  lessonType: string;
  lessonLevel: string;
  lessonDuration: number;
  status: string;
  createdAt: string;
}

interface UpcomingReservation {
  id: string;
  teacher: {
    name: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  lessonType: string;
  lessonLevel: string;
  lessonDuration: number;
  status: string;
}

function StudentDashboardPage() {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<UpcomingReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate duration between two time strings
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  // Get time ago helper function
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch bookings and upcoming reservations in parallel
        const [bookingsResponse, upcomingResponse] = await Promise.all([
          api.get('/api/reservations/student'),
          api.get('/api/reservations/upcoming')
        ]);

        setBookings(bookingsResponse.data.bookings || []);
        setUpcomingReservations(upcomingResponse.data.upcomingReservations || []);
        
      } catch (err: any) {
        console.error('Error fetching student data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user]);

  // Calculate stats from real data
  const completedLessons = bookings.filter(b => b.status === 'completed').length;
  const upcomingLessons = upcomingReservations.length;
  const totalBookings = bookings.length;

  // Format upcoming lessons for display
  const formattedUpcomingLessons = upcomingReservations.map(reservation => {
    // Ensure date is properly formatted
    const lessonDate = new Date(reservation.date);
    const formattedDate = isNaN(lessonDate.getTime()) 
      ? 'Date not available' 
      : lessonDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

    // Ensure lesson type and level are properly displayed
    const lessonType = reservation.lessonType || 'General Lesson';
    const lessonLevel = reservation.lessonLevel || 'Intermediate';
    
    return {
      reservationId: reservation.id,
      teacher: reservation.teacher.name,
      topic: `${lessonType} - ${lessonLevel}`,
      date: formattedDate,
      time: `${reservation.startTime} - ${reservation.endTime}`,
      duration: `${reservation.lessonDuration || calculateDuration(reservation.startTime, reservation.endTime)} min`,
      status: reservation.status,
      lessonType: lessonType,
      lessonLevel: lessonLevel
    };
  });

  // Progress data for learning progress section
  const progressData = [
    { label: 'Grammar', progress: 75, icon: 'book', color: 'blue' },
    { label: 'Vocabulary', progress: 60, icon: 'language', color: 'green' },
    { label: 'Speaking', progress: 85, icon: 'microphone', color: 'purple' },
    { label: 'Listening', progress: 70, icon: 'headphones', color: 'orange' }
  ];

  const stats = [
    {
      title: 'Completed Lessons',
      value: `${completedLessons}+`,
      icon: 'fas fa-graduation-cap',
      color: 'blue',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      title: 'Upcoming Lessons',
      value: `${upcomingLessons}`,
      icon: 'fas fa-clock',
      color: 'green',
      trend: 'up',
      trendValue: '+2'
    },
    {
      title: 'Total Bookings',
      value: `${totalBookings}`,
      icon: 'fas fa-calendar-check',
      color: 'purple',
      trend: 'up',
      trendValue: '+5%'
    },
    {
      title: 'Active Teachers',
      value: `${new Set(bookings.map(b => b.teacher.email)).size}`,
      icon: 'fas fa-chalkboard-teacher',
      color: 'orange',
      trend: 'up',
      trendValue: '+1'
    }
  ];

  // Recent activities based on real data
  const recentActivities = bookings.slice(0, 4).map(booking => {
    const bookingDate = new Date(booking.createdAt);
    const timeAgo = getTimeAgo(bookingDate);
    
    return {
      type: 'reservation',
      title: `Booked lesson with ${booking.teacher.name}`,
      time: timeAgo,
      status: booking.status,
      color: booking.status === 'completed' ? 'blue' : 
             booking.status === 'booked' ? 'green' : 'orange',
      icon: booking.status === 'completed' ? 'graduation-cap' : 
            booking.status === 'booked' ? 'calendar-plus' : 'clock',
      description: `Lesson scheduled for ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime}`
    };
  });

  if (loading) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={['student']}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Hi, {user?.name || 'Student'} 👋
              </h1>
              <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                Ready to improve your English today?
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Track your progress, book lessons, and access learning materials.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/student/reserve" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base text-center">
                  Book a Lesson
                </Link>
                <Link href="/student/bookings" className="bg-white border-2 border-blue-500 text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 text-center text-sm sm:text-base">
                  View All Bookings
                </Link>
              </div>
            </div>
            <div className="hidden lg:block lg:ml-8">
              <div className="w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-graduation-cap text-2xl sm:text-4xl text-blue-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-100`}>
                  <i className={`${stat.icon} text-xl text-${stat.color}-600`}></i>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium text-${stat.color}-600 flex items-center`}>
                  <i className={`fas fa-arrow-${stat.trend} mr-1`}></i>
                  {stat.trendValue}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Lessons */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Upcoming Lessons</h2>
            <Link href="/student/reservations" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {formattedUpcomingLessons.length > 0 ? (
            <div className="space-y-4">
              {formattedUpcomingLessons.map((lesson, index) => {
                // Find the original reservation to get time data
                const originalReservation = upcomingReservations.find(r => r.id === lesson.reservationId);
                let canJoin = false;
                let statusMessage = '';
                
                if (originalReservation) {
                  const lessonDate = new Date(originalReservation.date);
                  const now = new Date();
                  
                  // Calculate lesson start and end times
                  const [startHours, startMinutes] = originalReservation.startTime.split(':');
                  const lessonStartTime = new Date(lessonDate);
                  lessonStartTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
                  
                  const [endHours, endMinutes] = originalReservation.endTime.split(':');
                  const lessonEndTime = new Date(lessonDate);
                  lessonEndTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
                  
                  // Students can only join within time window before lesson starts
                  const timeBeforeStart = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60); // minutes
                  const timeWindow = process.env.NODE_ENV === 'production' ? 15 : 120; // 15 min in prod, 2 hours in dev
                  
                  canJoin = lesson.status === 'booked' && 
                           now <= lessonEndTime && // Lesson hasn't ended
                           timeBeforeStart <= timeWindow; // Within time window before start
                  
                  if (!canJoin) {
                    if (now > lessonEndTime) {
                      statusMessage = 'Time expired';
                    } else if (timeBeforeStart > timeWindow) {
                      statusMessage = 'Not yet available';
                    } else {
                      statusMessage = 'Not available';
                    }
                  }
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-chalkboard-teacher text-blue-600"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.teacher}</h3>
                        <p className="text-sm text-gray-600">{lesson.topic}</p>
                        <p className="text-sm text-gray-500">{lesson.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {lesson.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{lesson.duration}</p>
                      {lesson.status === 'booked' && canJoin && (
                        <Link 
                          href={`/talk/${lesson.reservationId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mt-2"
                        >
                          Join Lesson
                        </Link>
                      )}
                      {lesson.status === 'booked' && !canJoin && (
                        <span className="text-xs text-gray-500 mt-2 block">
                          {statusMessage}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-4">No upcoming lessons scheduled</p>
              <Link href="/student/reserve" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Book Your First Lesson
              </Link>
            </div>
          )}
        </div>

        {/* Learning Progress */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Learning Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {progressData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className={`fas fa-${item.icon} text-xl text-${item.color}-600`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.label}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`bg-${item.color}-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{item.progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${activity.color}-100`}>
                  <i className={`fas fa-${activity.icon} text-${activity.color}-600`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${activity.color}-100 text-${activity.color}-800`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboardPage; 