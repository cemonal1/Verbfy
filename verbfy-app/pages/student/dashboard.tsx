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

        setBookings(bookingsResponse.data?.data?.bookings || []);
        setUpcomingReservations(upcomingResponse.data?.upcomingReservations || []);
        
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
  const completedLessons = (bookings || []).filter(b => b?.status === 'completed').length;
  const upcomingLessons = (upcomingReservations || []).length;
  const totalBookings = (bookings || []).length;

  // Format upcoming lessons for display
  const formattedUpcomingLessons = (upcomingReservations || []).map(reservation => {
    // Ensure reservation and required fields exist
    if (!reservation || !reservation.teacher) {
      return null;
    }

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
      teacher: reservation.teacher?.name || 'Unknown Teacher',
      topic: `${lessonType} - ${lessonLevel}`,
      date: formattedDate,
      time: `${reservation.startTime || '00:00'} - ${reservation.endTime || '00:00'}`,
      duration: `${reservation.lessonDuration || calculateDuration(reservation.startTime || '00:00', reservation.endTime || '00:00')} min`,
      status: reservation.status || 'unknown',
      lessonType: lessonType,
      lessonLevel: lessonLevel
    };
  }).filter(Boolean); // Remove any null entries

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
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Error loading dashboard</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={['student']}>
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Hi, {user?.name} 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Ready to improve your English today? Track your progress, book lessons, and access learning materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/student/reserve"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Book a Lesson
                <i className="fas fa-arrow-right ml-2"></i>
              </Link>
              <Link
                href="/student/reservations"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
              >
                View All Bookings
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center">
              <i className="fas fa-graduation-cap text-4xl text-blue-600 dark:text-blue-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 dark:from-${stat.color}-900/30 dark:to-${stat.color}-900/20 rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-xl text-${stat.color}-600 dark:text-${stat.color}-400`}></i>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`text-${stat.trend === 'up' ? 'green' : 'red'}-600 dark:text-${stat.trend === 'up' ? 'green' : 'red'}-400 font-medium`}>
                {stat.trendValue}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

        {/* Upcoming Lessons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Upcoming Lessons</h2>
            <Link href="/student/reservations" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              View All →
            </Link>
          </div>
          
          {upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {formattedUpcomingLessons.map((lesson, index) => {
                const canJoin = new Date(lesson.date + ' ' + lesson.time.split(' - ')[0]) <= new Date();
                let statusMessage = '';
                
                if (!canJoin) {
                  const lessonTime = new Date(lesson.date + ' ' + lesson.time.split(' - ')[0]);
                  const now = new Date();
                  const diffMs = lessonTime.getTime() - now.getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  
                  if (diffMins > 60) {
                    const diffHours = Math.floor(diffMins / 60);
                    statusMessage = `Available in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                  } else if (diffMins > 0) {
                    statusMessage = `Available in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
                  } else {
                    statusMessage = 'Not available';
                  }
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <i className="fas fa-chalkboard-teacher text-blue-600 dark:text-blue-400"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{lesson.teacher}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{lesson.topic}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        {lesson.status}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lesson.duration}</p>
                      {lesson.status === 'booked' && canJoin && (
                        <Link 
                          href={`/talk/${lesson.reservationId}`}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mt-2 transition-colors"
                        >
                          Join Lesson
                        </Link>
                      )}
                      {lesson.status === 'booked' && !canJoin && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
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
              <i className="fas fa-calendar-times text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming lessons scheduled</p>
              <Link href="/student/reserve" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Book Your First Lesson
              </Link>
            </div>
          )}
        </div>

        {/* Learning Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Learning Progress</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {progressData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <i className={`fas fa-${item.icon} text-xl text-${item.color}-600 dark:text-${item.color}-400`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.label}</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                  <div 
                    className={`bg-${item.color}-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${activity.color}-100 dark:bg-${activity.color}-900/30`}>
                    <i className={`fas fa-${activity.icon} text-${activity.color}-600 dark:text-${activity.color}-400`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${activity.color}-100 dark:bg-${activity.color}-900/30 text-${activity.color}-800 dark:text-${activity.color}-200`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-info-circle text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

export default StudentDashboardPage;