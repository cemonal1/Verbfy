import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../src/layouts/DashboardLayout';
import { useConversationRoomViewModel } from '../../src/features/conversation/viewmodel/useConversationRoomViewModel';

function RoomsPage() {
  const {
    rooms,
    getAvailableRooms,
    joinRoom,
    createRoom,
  } = useConversationRoomViewModel();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<{ roomId: string; isPrivate: boolean } | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isPrivate: false, password: '' });
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
    getAvailableRooms();
  }, [getAvailableRooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRoom(form.name, form.description, form.isPrivate, form.isPrivate ? form.password : undefined);
    setShowCreateModal(false);
    setForm({ name: '', description: '', isPrivate: false, password: '' });
  };

  const handleJoin = async (roomId: string, isPrivate: boolean) => {
    if (isPrivate) {
      setShowJoinModal({ roomId, isPrivate });
    } else {
      await joinRoom(roomId);
    }
  };

  const handleJoinWithPassword = async () => {
    if (showJoinModal) {
      await joinRoom(showJoinModal.roomId, joinPassword);
      setShowJoinModal(null);
      setJoinPassword('');
    }
  };

  return (
    <DashboardLayout allowedRoles={['teacher', 'student']}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Conversation Rooms</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">Create Room</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.filter(r => r.participants.length < r.maxParticipants).map(room => (
            <div key={room.id} className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <div className="font-bold text-lg">{room.name}</div>
              <div className="text-gray-600 text-sm">{room.description}</div>
              <div className="text-xs text-gray-400">Created by: {room.createdBy}</div>
              <div className="text-xs text-gray-400">Participants: {room.participants.length}/{room.maxParticipants}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleJoin(room.id, room.isPrivate)} className="bg-green-500 text-white px-3 py-1 rounded">Join</button>
                {room.isPrivate && <span className="text-xs text-red-500">Private</span>}
              </div>
            </div>
          ))}
          {rooms.length === 0 && <div className="text-gray-500 col-span-2">No open rooms found.</div>}
        </div>
        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h3 className="font-bold mb-2">Create Room</h3>
              <form onSubmit={handleCreate} className="flex flex-col gap-2">
                <input type="text" placeholder="Room Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="p-2 border rounded" required />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))} /> Private Room
                </label>
                {form.isPrivate && <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="p-2 border rounded" required />}
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="bg-gray-300 text-black px-3 py-1 rounded">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Join Room Password Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h3 className="font-bold mb-2">Enter Room Password</h3>
              <input type="password" placeholder="Password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} className="p-2 border rounded w-full mb-2" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleJoinWithPassword} className="bg-green-600 text-white px-3 py-1 rounded">Join</button>
                <button onClick={() => setShowJoinModal(null)} className="bg-gray-300 text-black px-3 py-1 rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default RoomsPage; 