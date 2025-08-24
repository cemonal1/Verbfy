import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { verbfyTalkAPI } from '@/lib/api';
import { 
  UsersIcon, 
  LockClosedIcon, 
  GlobeAltIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function VerbfyTalkRoomPage() {
  const router = useRouter();
  const { roomId } = router.query as { roomId?: string };
  const { t } = useI18n();
  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      try {
        const res: any = await verbfyTalkAPI.getRoomDetails(roomId);
        setRoom(res.data || res);
        // Check if user is already in the room
        if (res.data?.participants || res?.participants) {
          const participants = res.data?.participants || res?.participants;
          const isInRoom = participants.some((p: any) => p.isActive);
          setJoined(isInRoom);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomId]);

  const handleJoin = async () => {
    if (!roomId) return;
    
    if (room?.isPrivate && !joinPassword) {
      setShowPasswordModal(true);
      return;
    }
    
    try {
      setJoining(true);
      const res: any = await verbfyTalkAPI.joinRoom(roomId, { password: joinPassword });
      if (res.success) {
        setJoined(true);
        setJoinPassword('');
        setShowPasswordModal(false);
        // Reload room data to show updated participants
        const updatedRes = await verbfyTalkAPI.getRoomDetails(roomId);
        setRoom(updatedRes.data || updatedRes);
      }
    } catch (error: any) {
      console.error('Failed to join room:', error);
      alert(error.response?.data?.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      await verbfyTalkAPI.leaveRoom(roomId);
      setJoined(false);
      // Reload room data
      const res = await verbfyTalkAPI.getRoomDetails(roomId);
      setRoom(res.data || res);
    } catch (error: any) {
      console.error('Failed to leave room:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Beginner':
        return <AcademicCapIcon className="w-4 h-4 text-green-500" />;
      case 'Intermediate':
        return <AcademicCapIcon className="w-4 h-4 text-yellow-500" />;
      case 'Advanced':
        return <AcademicCapIcon className="w-4 h-4 text-red-500" />;
      default:
        return <AcademicCapIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Loading Room...">
        <div className="p-8 text-center text-gray-500">Loading room details...</div>
      </DashboardLayout>
    );
  }

  if (!room) {
    return (
      <DashboardLayout title="Room Not Found">
        <div className="p-8 text-center text-gray-500">Room not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={room.name || 'VerbfyTalk Room'}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Room Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
                {room.name}
              </h1>
              <p className="text-gray-600 mt-2">{room.description}</p>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {room.isPrivate ? (
                    <LockClosedIcon className="w-4 h-4" />
                  ) : (
                    <GlobeAltIcon className="w-4 h-4" />
                  )}
                  <span>{room.isPrivate ? 'Private' : 'Public'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getLevelIcon(room.level)}
                  <span>{room.level}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4 h-4" />
                  <span>{room.participants?.filter((p: any) => p.isActive).length || 0}/{room.maxParticipants}</span>
                </div>
                
                {room.startedAt && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Started {formatDate(room.startedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {!joined ? (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join Room'}
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Leave Room
                </button>
              )}
            </div>
          </div>
          
          {room.topic && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Discussion Topic</h3>
              <p className="text-blue-800">{room.topic}</p>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Participants ({room.participants?.filter((p: any) => p.isActive).length || 0})
          </h2>
          
          {room.participants && room.participants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.participants
                .filter((p: any) => p.isActive)
                .map((participant: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {participant.userId?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.userId?.name || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">
                        Joined {formatDate(participant.joinedAt)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No participants yet</p>
          )}
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Room Password</h3>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setJoinPassword('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {joining ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}