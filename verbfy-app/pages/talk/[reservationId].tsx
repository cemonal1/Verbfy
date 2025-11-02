import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthContext } from '../../src/context/AuthContext';
import api from '../../src/lib/api';
import { toastError, toastSuccess } from '../../src/utils/toast';

// LiveKit imports
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Room, RoomEvent, Participant, RemoteParticipant } from 'livekit-client';

interface Reservation {
  _id: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  student: {
    _id: string;
    name: string;
    email: string;
  };
  actualDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  lessonType: string;
  lessonLevel: string;
  notes?: string;
  roomName?: string;
}

interface LiveKitToken {
  token: string;
  roomName: string;
}

const LessonRoom: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const { reservationId } = router.query;
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonEnded, setLessonEnded] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [lessonDuration, setLessonDuration] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (reservationId && user) {
      fetchReservation();
    }
  }, [reservationId, user]);

  useEffect(() => {
    if (reservation && user) {
      generateLiveKitToken();
    }
  }, [reservation, user]);

  // Timer effect
  useEffect(() => {
    if (lessonStarted && !lessonEnded && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleLessonEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lessonStarted, lessonEnded, timeRemaining]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reservations/${reservationId}`);
      
      if (response.data.success) {
        const reservationData = response.data.reservation;
        setReservation(reservationData);
        
        // Calculate lesson duration and time remaining
        const startTime = new Date(`${reservationData.actualDate}T${reservationData.startTime}`);
        const endTime = new Date(`${reservationData.actualDate}T${reservationData.endTime}`);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
        setLessonDuration(duration);
        
        const now = new Date();
        const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTimeRemaining(Math.max(0, remaining));
        
        // Check if lesson should be started
        const canStart = now >= startTime && now <= endTime;
        if (canStart) {
          setLessonStarted(true);
        }
      }
    } catch (err: any) {
      setError('Failed to load lesson details');
      console.error('Error fetching reservation:', err);
      toastError('Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  };

  const generateLiveKitToken = async () => {
    try {
      if (!reservation) return;
      // Ensure LiveKit server URL is configured
      const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!livekitUrl) {
        setError('LiveKit yapılandırması eksik. Lütfen .env dosyasına NEXT_PUBLIC_LIVEKIT_URL değerini ekleyin.');
        return;
      }
      
      const roomName = `lesson-${reservation._id}`;
      const response = await api.post(`/api/livekit/token/${roomName}`, {
        metadata: {
          participantName: user?.name || 'User',
          participantId: user?._id,
          role: user?.role,
        },
      });
      
      if (response.data.token) {
        setLiveKitToken(response.data.token);
        setRoomName(roomName);
      }
    } catch (err: any) {
      setError('Failed to generate video call token');
      console.error('Error generating LiveKit token:', err);
      toastError('Failed to initialize video call');
    }
  };

  const handleLessonStart = () => {
    setLessonStarted(true);
    toastSuccess('Lesson started!');
  };

  const handleLessonEnd = async () => {
    setLessonEnded(true);
    setLessonStarted(false);
    
    try {
      // Update reservation status to completed
      await api.patch(`/api/reservations/${reservationId}`, {
        status: 'completed'
      });
      
      toastSuccess('Lesson completed successfully!');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating lesson status:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canJoinLesson = (): boolean => {
    if (!reservation || !user) return false;
    
    const now = new Date();
    const lessonStart = new Date(`${reservation.actualDate}T${reservation.startTime}`);
    const lessonEnd = new Date(`${reservation.actualDate}T${reservation.endTime}`);
    
    // Allow joining 5 minutes before lesson starts
    const joinTime = new Date(lessonStart.getTime() - 5 * 60 * 1000);
    
    return now >= joinTime && now <= lessonEnd;
  };

  const isUserAuthorized = (): boolean => {
    if (!reservation || !user) return false;
    return reservation.teacher._id === user._id || reservation.student._id === user._id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Lesson Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The lesson you're looking for doesn't exist or you don't have access to it.
          </p>
          {!process.env.NEXT_PUBLIC_LIVEKIT_URL && (
            <p className="text-sm text-red-600 mb-6">
              LiveKit URL yapılandırılmamış. .env dosyasına şu satırı ekleyin:
              <br />
              <code className="bg-red-100 text-red-700 px-1">NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-host</code>
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isUserAuthorized()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-red-600 text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this lesson.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!canJoinLesson()) {
    const lessonStart = new Date(`${reservation.actualDate}T${reservation.startTime}`);
    const now = new Date();
    const isBeforeLesson = now < lessonStart;
    
    return (
      <>
        <Head>
          <title>Lesson Room - Verbfy</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-blue-600 text-2xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {isBeforeLesson ? 'Lesson Not Started Yet' : 'Lesson Has Ended'}
            </h1>
            
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p><strong>Teacher:</strong> {reservation.teacher.name}</p>
              <p><strong>Student:</strong> {reservation.student.name}</p>
              <p><strong>Date:</strong> {new Date(reservation.actualDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {reservation.startTime} - {reservation.endTime}</p>
            </div>
            
            {isBeforeLesson && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You can join the lesson 5 minutes before it starts.
              </p>
            )}
            
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  if (lessonEnded) {
    return (
      <>
        <Head>
          <title>Lesson Completed - Verbfy</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-2xl"></i>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Lesson Completed!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for using Verbfy. Your lesson has been completed successfully.
            </p>
            
            <button
              onClick={() => router.push(user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Lesson Room - Verbfy</title>
        <meta name="description" content="Join your English lesson" />
      </Head>
      
      <div className="min-h-screen bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                English Lesson
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {user?.role === 'teacher' ? `with ${reservation.student.name}` : `with ${reservation.teacher.name}`}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Timer */}
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {/* End Lesson Button */}
              {(user?.role === 'teacher' || timeRemaining <= 0) && (
                <button
                  onClick={handleLessonEnd}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  End Lesson
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Conference */}
        {liveKitToken && roomName ? (
          <div className="h-[calc(100vh-80px)]">
            <LiveKitRoom
              video={true}
              audio={true}
              token={liveKitToken}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
              data-lk-theme="default"
              style={{ height: '100%' }}
              onConnected={() => {
                setIsConnected(true);
                toastSuccess('Connected to lesson room');
              }}
              onDisconnected={() => {
                setIsConnected(false);
              }}
            >
              <VideoConference />
              <RoomAudioRenderer />
            </LiveKitRoom>
          </div>
        ) : (
          <div className="h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-white">Connecting to lesson room...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LessonRoom;