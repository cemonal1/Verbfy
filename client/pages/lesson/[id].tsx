import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { LiveKitRoom, VideoConference, useRoomContext } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';
import { format } from 'date-fns';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MessageSquare, 
  FileText, 
  Clock, 
  Users,
  Share2,
  Settings,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LessonData {
  id: string;
  reservationId: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  startTime: string;
  endTime: string;
  status: string;
  materials: Material[];
}

interface Material {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function LessonRoom() {
  const router = useRouter();
  const { id } = router.query;
  
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
    type: 'text' | 'material';
  }>>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch lesson data and token
  useEffect(() => {
    if (!id) return;

    const fetchLessonData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch lesson data
        const lessonResponse = await fetch(`/api/reservations/${id}`);
        if (!lessonResponse.ok) {
          throw new Error('Failed to fetch lesson data');
        }
        const lesson = await lessonResponse.json();

        // Fetch LiveKit token
        const tokenResponse = await fetch(`/api/livekit/token?roomName=lesson-${id}&roomType=lesson&reservationId=${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get room access token');
        }
        
        const tokenData = await tokenResponse.json();
        
        setLessonData(lesson.data);
        setToken(tokenData.data.token);
        
        // Calculate time remaining
        const endTime = new Date(lesson.data.endTime);
        const now = new Date();
        const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        setTimeRemaining(remaining);
        
      } catch (err: any) {
        console.error('Error fetching lesson data:', err);
        setError(err.message);
        toast.error('Failed to load lesson room');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Lesson time is up
          toast.error('Lesson time has ended');
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, router]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lesson room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Lesson</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have permission to join this lesson.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Lesson with {lessonData?.teacher.name}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatTimeRemaining(timeRemaining)} remaining</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isChatOpen 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsMaterialsOpen(!isMaterialsOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isMaterialsOpen 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <FileText className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Video Conference */}
        <div className={`flex-1 ${isChatOpen || isMaterialsOpen ? 'mr-80' : ''}`}>
          <LiveKitRoom
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            video={true}
            audio={true}
            onConnected={() => {
              toast.success('Connected to lesson room');
            }}
            onDisconnected={() => {
              toast.error('Disconnected from lesson room');
            }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>

        {/* Sidebar */}
        {(isChatOpen || isMaterialsOpen) && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Chat Panel */}
            {isChatOpen && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chat</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {message.sender}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(message.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 input-field text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          // Handle send message
                        }
                      }}
                    />
                    <button className="btn-primary text-sm px-3 py-2">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Materials Panel */}
            {isMaterialsOpen && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Materials</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {lessonData?.materials && lessonData.materials.length > 0 ? (
                    <div className="space-y-3">
                      {lessonData.materials.map((material) => (
                        <div
                          key={material.id}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {material.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {material.type.toUpperCase()} • {format(new Date(material.uploadedAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No materials available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 