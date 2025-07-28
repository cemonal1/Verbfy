import { useState, useEffect } from 'react';
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
  Users,
  Share2,
  Settings,
  LogOut,
  UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TalkRoomData {
  id: string;
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export default function TalkRoom() {
  const router = useRouter();
  const { roomId } = router.query;
  
  const [roomData, setRoomData] = useState<TalkRoomData | null>(null);
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [participants, setParticipants] = useState<Array<{
    id: string;
    name: string;
    joinedAt: Date;
  }>>([]);

  // Fetch room data and token
  useEffect(() => {
    if (!roomId) return;

    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch room data
        const roomResponse = await fetch(`/api/talk/${roomId}`);
        if (!roomResponse.ok) {
          throw new Error('Failed to fetch room data');
        }
        const room = await roomResponse.json();

        // Fetch LiveKit token
        const tokenResponse = await fetch(`/api/livekit/token?roomName=talk-${roomId}&roomType=talk`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to get room access token');
        }
        
        const tokenData = await tokenResponse.json();
        
        setRoomData(room.data);
        setToken(tokenData.data.token);
        
      } catch (err: any) {
        console.error('Error fetching room data:', err);
        setError(err.message);
        toast.error('Failed to load talk room');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading talk room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Error Loading Room</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/talk')}
            className="btn-primary"
          >
            Return to Talk Rooms
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have permission to join this room.</p>
          <button
            onClick={() => router.push('/talk')}
            className="btn-primary"
          >
            Return to Talk Rooms
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
              {roomData?.name}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{roomData?.currentParticipants || 0}/{roomData?.maxParticipants || 5} participants</span>
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
              onClick={() => router.push('/talk')}
              className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {roomData?.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {roomData.description}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Video Conference */}
        <div className={`flex-1 ${isChatOpen ? 'mr-80' : ''}`}>
          <LiveKitRoom
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            video={true}
            audio={true}
            onConnected={() => {
              toast.success('Connected to talk room');
            }}
            onDisconnected={() => {
              toast.error('Disconnected from talk room');
            }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
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
                
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-2">Start the conversation!</p>
                  </div>
                )}
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
          </div>
        )}
      </div>
    </div>
  );
} 