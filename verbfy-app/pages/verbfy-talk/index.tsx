import React, { useEffect, useState, useCallback } from 'react';
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

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await verbfyTalkAPI.getRooms(filters);
      setRooms(response?.data || []);
      setPagination(response?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
      setRooms([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to create room';
      toast.error(errorMessage);
    }
  };

  const handleJoinRoom = (room: VerbfyTalkRoom) => {
    if (room.isPrivate) {
      const password = prompt('Enter room password:');
      if (password) {
        joinRoom(room._id, password);
      }
    } else {
      joinRoom(room._id);
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      // Direct navigation - room joining will be handled by the room page
      router.push(`/verbfy-talk/${roomId}`);
    } catch (error: unknown) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room');
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
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
              VerbfyTalk
            </h1>
            <p className="text-gray-600 mt-2">Join conversation rooms with up to 5 people</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/verbfy-talk/test-media')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
            >
              Test Media
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Room
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value as any })}
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
            {rooms?.map((room) => (
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
                    <span>{room.activeParticipantCount || 0}/{room.maxParticipants}</span>
                  </div>
                </div>
                
                                 <div className="text-xs text-gray-400 mb-4">
                   Created by {typeof room.createdBy === 'string' ? 'Unknown' : room.createdBy?.name || 'Unknown'}
                 </div>
                
                <button
                  onClick={() => handleJoinRoom(room)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && rooms.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rooms available</h3>
            <p className="text-gray-600 mb-6">Be the first to create a conversation room!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Room
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                  className={`px-3 py-2 rounded-md ${
                    filters.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
      </div>
    </DashboardLayout>
  );
}

export default VerbfyTalkPage; 