import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { verbfyTalkAPI } from '@/lib/api';
import { VerbfyTalkRoom, CreateRoomData, RoomFilters } from '@/types/verbfyTalk';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  UsersIcon, 
  LockClosedIcon, 
  GlobeAltIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

function VerbfyTalkPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<VerbfyTalkRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<{ roomId: string; isPrivate: boolean } | null>(null);
  const [filters, setFilters] = useState<RoomFilters>({
    level: 'All',
    isPrivate: false,
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [form, setForm] = useState<CreateRoomData>({
    name: '',
    description: '',
    isPrivate: false,
    password: '',
    topic: '',
    level: 'Mixed',
    maxParticipants: 5
  });
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    loadRooms();
  }, [filters]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await verbfyTalkAPI.getRooms(filters);
      setRooms(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const roomData = { ...form };
      if (!roomData.isPrivate) {
        delete roomData.password;
      }
      
      const response = await verbfyTalkAPI.createRoom(roomData);
      toast.success('Room created successfully!');
      setShowCreateModal(false);
      setForm({
        name: '',
        description: '',
        isPrivate: false,
        password: '',
        topic: '',
        level: 'Mixed',
        maxParticipants: 5
      });
      loadRooms();
      
      // Navigate to the new room
      router.push(`/verbfy-talk/${response.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId: string, isPrivate: boolean) => {
    if (isPrivate) {
      setShowJoinModal({ roomId, isPrivate });
    } else {
      await joinRoom(roomId);
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      await verbfyTalkAPI.joinRoom(roomId, password ? { password } : undefined);
      toast.success('Joined room successfully!');
      setShowJoinModal(null);
      setJoinPassword('');
      router.push(`/verbfy-talk/${roomId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    }
  };

  const handleJoinWithPassword = async () => {
    if (showJoinModal) {
      await joinRoom(showJoinModal.roomId, joinPassword);
    }
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <DashboardLayout allowedRoles={['student', 'teacher']}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
              VerbfyTalk
            </h1>
            <p className="text-gray-600 mt-2">Join conversation rooms with up to 5 people</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create Room
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Mixed">Mixed</option>
            </select>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.isPrivate}
                onChange={(e) => setFilters({ ...filters, isPrivate: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Show private rooms</span>
            </label>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">{room.name}</h3>
                  {room.isPrivate ? (
                    <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <GlobeAltIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                
                {room.topic && (
                  <div className="text-sm text-blue-600 mb-3">
                    Topic: {room.topic}
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(room.level)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(room.level)}`}>
                      {room.level}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <UsersIcon className="w-4 h-4" />
                    <span>{room.currentParticipants || room.participants.filter(p => p.isActive).length}/{room.maxParticipants}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-4">
                  Created by {room.createdBy.name}
                </div>
                
                <button
                  onClick={() => handleJoinRoom(room._id, room.isPrivate)}
                  disabled={(room.currentParticipants || room.participants.filter(p => p.isActive).length) >= room.maxParticipants}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    (room.currentParticipants || room.participants.filter(p => p.isActive).length) >= room.maxParticipants
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {(room.currentParticipants || room.participants.filter(p => p.isActive).length) >= room.maxParticipants
                    ? 'Room Full'
                    : 'Join Room'
                  }
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-500">Be the first to create a conversation room!</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-3 py-2 rounded-md text-sm ${
                    pagination.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Create VerbfyTalk Room</h3>
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic (Optional)</label>
                    <input
                      type="text"
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Travel, Business, Daily Life"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                    <select
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Mixed">Mixed</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <select
                      value={form.maxParticipants}
                      onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={2}>2 people</option>
                      <option value={3}>3 people</option>
                      <option value={4}>4 people</option>
                      <option value={5}>5 people</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isPrivate}
                      onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                      className="rounded"
                    />
                    <label className="text-sm text-gray-700">Private room</label>
                  </div>
                  
                  {form.isPrivate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      Create Room
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Join Room Password Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Enter Room Password</h3>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinWithPassword}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Join Room
                  </button>
                  <button
                    onClick={() => setShowJoinModal(null)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default VerbfyTalkPage; 