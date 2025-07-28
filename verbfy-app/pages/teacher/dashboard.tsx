import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';
import { useAuthContext } from '../../src/context/AuthContext';
import api from '../../src/lib/api';
import Link from 'next/link';

interface Booking {
  id: string;
  student: {
    name: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

interface UpcomingReservation {
  id: string;
  student: {
    name: string;
    email: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string;
    email: string;
  };
  relatedReservation?: {
    actualDate: string;
    startTime: string;
    endTime: string;
    lessonType: string;
    lessonLevel: string;
  };
}

function TeacherDashboardPage() {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<UpcomingReservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Fetch bookings, upcoming reservations, and notifications in parallel
        const [bookingsResponse, upcomingResponse, notificationsResponse, unreadCountResponse] = await Promise.all([
          api.get('/api/reservations/teacher'),
          api.get('/api/reservations/upcoming'),
          api.get('/api/notifications?limit=5'),
          api.get('/api/notifications/unread-count')
        ]);

        setBookings(bookingsResponse.data.bookings || []);
        setUpcomingReservations(upcomingResponse.data.upcomingReservations || []);
        setNotifications(notificationsResponse.data.notifications || []);
        setUnreadCount(unreadCountResponse.data.unreadCount || 0);
        
      } catch (err: any) {
        console.error('Error fetching teacher data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  // Calculate stats from real data
  const completedLessons = bookings.filter(b => b.status === 'completed').length;
  const upcomingLessons = upcomingReservations.length;
  const totalBookings = bookings.length;
  const uniqueStudents = new Set(bookings.map(b => b.student.email)).size;

  const stats = [
    {
      title: 'Total Students',
      value: `${uniqueStudents}+`,
      icon: 'fas fa-user-graduate',
      color: 'blue',
      trend: 'up',
      trendValue: '+8%'
    },
    {
      title: 'Completed Lessons',
      value: `${completedLessons}+`,
      icon: 'fas fa-graduation-cap',
      color: 'green',
      trend: 'up',
      trendValue: '+15%'
    },
    {
      title: 'Upcoming Lessons',
      value: `${upcomingLessons}`,
      icon: 'fas fa-clock',
      color: 'purple',
      trend: 'up',
      trendValue: '+5'
    },
    {
      title: 'Total Bookings',
      value: `${totalBookings}`,
      icon: 'fas fa-calendar-check',
      color: 'orange',
      trend: 'up',
      trendValue: '+12%'
    }
  ];

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

    return {
      reservationId: reservation.id,
      student: reservation.student.name,
      topic: 'General Lesson',
      date: formattedDate,
      time: `${reservation.startTime} - ${reservation.endTime}`,
      duration: `${calculateDuration(reservation.startTime, reservation.endTime)} min`,
      status: reservation.status
    };
  });

  // Get recent students from bookings
  const recentStudents = bookings
    .filter(booking => booking.status === 'completed')
    .reduce((acc, booking) => {
      const existing = acc.find(s => s.email === booking.student.email);
      if (!existing) {
        acc.push({
          name: booking.student.name,
          email: booking.student.email,
          level: 'Intermediate', // This would come from student profile in real app
          lessons: bookings.filter(b => b.student.email === booking.student.email).length,
          lastSeen: getTimeAgo(new Date(booking.date))
        });
      }
      return acc;
    }, [] as Array<{
      name: string;
      email: string;
      level: string;
      lessons: number;
      lastSeen: string;
    }>)
    .slice(0, 4);

  const teachingStats = [
    { label: 'Teaching Hours', value: `${Math.round(completedLessons * 0.75)}`, unit: 'hrs', color: 'blue' },
    { label: 'Student Satisfaction', value: '96', unit: '%', color: 'green' },
    { label: 'Lesson Completion', value: `${Math.round((completedLessons / totalBookings) * 100)}`, unit: '%', color: 'purple' },
    { label: 'Response Rate', value: '98', unit: '%', color: 'orange' }
  ];

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
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Hi, {user?.name || 'Teacher'} 👋
              </h1>
              <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                Ready to inspire your students today?
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Manage your schedule, track student progress, and grow your teaching business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/teacher/availability" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base text-center">
                  Manage Availability
                </Link>
                <Link href="/teacher/reservations" className="bg-white border-2 border-blue-500 text-blue-600 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 text-center text-sm sm:text-base">
                  View All Bookings
                </Link>
              </div>
            </div>
            <div className="hidden lg:block lg:ml-8">
              <div className="w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-chalkboard-teacher text-2xl sm:text-4xl text-green-600"></i>
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
            <Link href="/teacher/reservations" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
                  
                  // Teachers can join anytime before the lesson ends
                  canJoin = lesson.status === 'booked' && now <= lessonEndTime;
                  
                  if (!canJoin) {
                    statusMessage = now > lessonEndTime ? 'Time expired' : 'Not available';
                  }
                }
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-user-graduate text-green-600"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.student}</h3>
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
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mt-2"
                        >
                          Start Lesson
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
              <Link href="/teacher/availability" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Set Your Availability
              </Link>
            </div>
          )}
        </div>

        {/* Teaching Statistics */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Teaching Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {teachingStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-3 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <i className={`fas fa-chart-line text-xl text-${stat.color}-600`}></i>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{stat.label}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Students</h2>
            <Link href="/teacher/students" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All →
            </Link>
          </div>
          
          {recentStudents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentStudents.map((student, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-blue-600"></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{student.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{student.level}</p>
                  <p className="text-xs text-gray-500">{student.lessons} lessons</p>
                  <p className="text-xs text-gray-400 mt-1">{student.lastSeen}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No students yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TeacherDashboardPage; 