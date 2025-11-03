import React, { useEffect, useState, useRef } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  useToken,
  PreJoin
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Room, RoomEvent, DisconnectReason } from 'livekit-client';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface VideoLessonProps {
  reservationId: string;
  onLessonEnd?: () => void;
  onError?: (error: string) => void;
}

interface LessonData {
  reservationId: string;
  roomName: string;
  status: string;
  student: { _id: string; name: string; email: string };
  teacher: { _id: string; name: string; email: string };
  startTime: string;
  endTime: string;
  lessonType: string;
  lessonLevel: string;
}

export default function VideoLesson({ reservationId, onLessonEnd, onError }: VideoLessonProps) {
  const { user } = useAuth();
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [lessonStarted, setLessonStarted] = useState(false);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    initializeLesson();
  }, [reservationId]);

  const initializeLesson = async () => {
    try {
      setLoading(true);
      setError('');

      // Start the lesson first
      const startResponse = await api.post(`/api/reservations/${reservationId}/start`);
      
      if (!startResponse.data.success) {
        throw new Error(startResponse.data.message || 'Failed to start lesson');
      }

      const lesson = startResponse.data.data;
      setLessonData(lesson);
      setLessonStarted(true);

      // Get LiveKit token
      const tokenResponse = await api.post(`/api/livekit/token/${lesson.roomName}`, {
        metadata: JSON.stringify({
          reservationId,
          role: user?.role,
          lessonType: lesson.lessonType,
          lessonLevel: lesson.lessonLevel
        })
      });

      if (!tokenResponse.data.token || !tokenResponse.data.url) {
        throw new Error('Failed to get video conference credentials');
      }

      setToken(tokenResponse.data.token);
      setServerUrl(tokenResponse.data.url);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize lesson';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnected = (reason?: DisconnectReason) => {
    console.log('Disconnected from room:', reason);
    setIsConnected(false);
    
    if (reason === DisconnectReason.ROOM_DELETED || reason === DisconnectReason.SERVER_SHUTDOWN) {
      // Room was ended by teacher or server
      handleLessonEnd();
    }
  };

  const handleLessonEnd = async () => {
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }

      // End the lesson on the server
      await api.post(`/api/reservations/${reservationId}/end`, {
        feedback: 'Lesson completed via video conference',
        rating: user?.role === 'student' ? 5 : undefined // Students can rate
      });

      onLessonEnd?.();
    } catch (err: any) {
      console.error('Error ending lesson:', err);
      onError?.(err.response?.data?.message || 'Failed to end lesson properly');
    }
  };

  const handleConnected = (room: Room) => {
    console.log('Connected to room:', room.name);
    roomRef.current = room;
    setIsConnected(true);

    // Set up room event listeners
    room.on(RoomEvent.Disconnected, handleDisconnected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Starting your lesson...</div>
          <div className="text-sm text-gray-600 mt-2">Please wait while we prepare your video conference</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <div className="text-lg font-medium text-gray-900 mb-2">Unable to Start Lesson</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl || !lessonData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">Preparing video conference...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black">
      {/* Lesson Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="font-medium text-gray-900">
              {lessonData.lessonType} - {lessonData.lessonLevel}
            </div>
            <div className="text-sm text-gray-600">
              {user?.role === 'student' 
                ? `Teacher: ${lessonData.teacher.name}`
                : `Student: ${lessonData.student.name}`
              }
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {lessonData.startTime} - {lessonData.endTime}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          
          <button
            onClick={handleLessonEnd}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            End Lesson
          </button>
        </div>
      </div>

      {/* Video Conference */}
      <div className="h-full">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          data-lk-theme="default"
          style={{ height: 'calc(100vh - 64px)' }}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}