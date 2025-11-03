import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import VideoLesson from '@/components/lesson/VideoLesson';
import api from '@/lib/api';

interface Reservation {
  _id: string;
  student: { _id: string; name: string; email: string };
  teacher: { _id: string; name: string; email: string };
  actualDate: string;
  startTime: string;
  endTime: string;
  status: string;
  lessonType: string;
  lessonLevel: string;
}

export default function LessonPage() {
  const router = useRouter();
  const { reservationId } = router.query as { reservationId?: string };
  const { user, loading: authLoading } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!reservationId) return;

    checkAccess();
  }, [reservationId, user, authLoading]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      setError('');

      // Get reservation details and check access
      const response = await api.get(`/api/reservations/${reservationId}`);
      const reservationData = response.data;

      if (!reservationData) {
        throw new Error('Reservation not found');
      }

      // Check if user is part of this reservation
      const isStudent = reservationData.student._id === user?.id;
      const isTeacher = reservationData.teacher._id === user?.id;

      if (!isStudent && !isTeacher) {
        throw new Error('You do not have access to this lesson');
      }

      // Check if reservation is in valid status
      if (!['booked', 'inProgress'].includes(reservationData.status)) {
        throw new Error(`Lesson cannot be accessed. Status: ${reservationData.status}`);
      }

      // Check time window
      const now = new Date();
      const lessonDate = new Date(reservationData.actualDate);
      const [endHour, endMin] = reservationData.endTime.split(':').map(Number);
      const lessonEndTime = new Date(lessonDate);
      lessonEndTime.setHours(endHour, endMin, 0, 0);

      if (now > lessonEndTime) {
        throw new Error('This lesson has already ended');
      }

      // For students, check if they're trying to join too early
      if (isStudent) {
        const [startHour, startMin] = reservationData.startTime.split(':').map(Number);
        const lessonStartTime = new Date(lessonDate);
        lessonStartTime.setHours(startHour, startMin, 0, 0);
        
        const timeBeforeStart = (lessonStartTime.getTime() - now.getTime()) / (1000 * 60);
        
        if (timeBeforeStart > 15) {
          throw new Error('You can only join the lesson 15 minutes before the scheduled time');
        }
      }

      setReservation(reservationData);
      setAccessChecked(true);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to access lesson';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonEnd = () => {
    // Redirect to appropriate dashboard
    if (user?.role === 'student') {
      router.push('/student/dashboard');
    } else if (user?.role === 'teacher') {
      router.push('/teacher/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Loading lesson...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <div className="text-lg font-medium text-gray-900 mb-2">Access Denied</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <div className="space-x-3">
            <button
              onClick={() => router.back()}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!accessChecked || !reservation || !reservationId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Preparing lesson...</div>
        </div>
      </div>
    );
  }

  return (
    <VideoLesson
      reservationId={reservationId}
      onLessonEnd={handleLessonEnd}
      onError={handleError}
    />
  );
}