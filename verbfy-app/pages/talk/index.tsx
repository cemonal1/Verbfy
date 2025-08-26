import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface VerbfyTalkRoom {
  id: string;
  name: string;
  description: string;
  participants: number;
  isPrivate: boolean;
  createdAt: string;
}

export default function VerbfyTalkPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    password: ''
  });

  // Mock rooms data (replace with API call)
  const [rooms] = useState<VerbfyTalkRoom[]>([
    {
      id: 'english-conversation',
      name: 'English Conversation',
      description: 'Practice English speaking with other learners',
      participants: 3,
      isPrivate: false,
      createdAt: '2024-01-15'
    },
    {
      id: 'business-english',
      name: 'Business English',
      description: 'Professional English for business contexts',
      participants: 2,
      isPrivate: false,
      createdAt: '2024-01-14'
    },
    {
      id: 'casual-chat',
      name: 'Casual Chat',
      description: 'Relaxed conversation about daily topics',
      participants: 4,
      isPrivate: false,
      createdAt: '2024-01-13'
    }
  ]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) return;

    try {
      // Generate room ID
      const roomId = form.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      
      // Here you would typically make an API call to create the room
      console.log('Creating room:', { ...form, roomId });
      
      // Redirect to the new room
      router.push(`/talk/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/talk/${roomId}`);
  };

  return (
    <DashboardLayout allowedRoles={['teacher', 'student']}>
      <Head>
        <title>VerbfyTalk - Audio Conversation Rooms</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎤 VerbfyTalk
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join audio-only conversation rooms to practice English speaking with other learners. 
            No video, just voice - perfect for focused language practice.
          </p>
        </div>

        {/* Create Room Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            🆕 Create New Room
          </button>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                  {room.isPrivate && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      🔒 Private
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{room.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>👥 {room.participants}/5 participants</span>
                  <span>📅 {new Date(room.createdAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.participants >= 5}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    room.participants >= 5
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {room.participants >= 5 ? 'Room Full' : 'Join Room'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why VerbfyTalk?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Audio Only</h3>
              <p className="text-gray-600">Focus on speaking without video distractions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">P2P Connection</h3>
              <p className="text-gray-600">Direct peer-to-peer audio for low latency</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Small Groups</h3>
              <p className="text-gray-600">Maximum 5 people for focused conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Room</h2>
            
            <form onSubmit={handleCreateRoom}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter room name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the room's purpose"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={form.isPrivate}
                    onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                    Make room private
                  </label>
                </div>
                
                {form.isPrivate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter room password"
                      required={form.isPrivate}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
