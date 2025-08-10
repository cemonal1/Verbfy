import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api from '@/lib/api';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function AdminUsersPage() {
  const [pendingTeachers, setPendingTeachers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/teachers/pending');
      setPendingTeachers(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    await api.patch(`/api/admin/teachers/${id}/approve`);
    await load();
  };
  const reject = async (id: string) => {
    await api.patch(`/api/admin/teachers/${id}/reject`, { reason: 'Not meeting requirements' });
    await load();
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title="User Management">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Teacher Applications</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : pendingTeachers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No pending applications</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingTeachers.map(u => (
                    <tr key={u._id}>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => approve(u._id)} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">Approve</button>
                        <button onClick={() => reject(u._id)} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


