import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import api, { adminAPI } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [pendingTeachers, setPendingTeachers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all'|'student'|'teacher'|'admin'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/teachers/pending');
      setPendingTeachers(res.data.data || []);
      const list = await adminAPI.getUsers({ search: q, role: roleFilter === 'all' ? undefined : roleFilter, limit: 50 });
      setUsers((list as any).data?.users ?? (list as any).data ?? (list as any).users ?? []);
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

  const changeRole = async (id: string, role: UserItem['role']) => {
    try { await adminAPI.updateUserRole(id, role); await load(); } catch {}
  };
  const changeStatus = async (id: string, status: string) => {
    try { await adminAPI.updateUserStatus(id, status); await load(); } catch {}
  };

  return (
    <DashboardLayout allowedRoles={['admin']} title={t('admin.users.title','User Management')}>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{t('admin.users.pending','Pending Teacher Applications')}</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
          ) : pendingTeachers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">{t('admin.users.noPending','No pending applications')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2">
                      <input type="checkbox" aria-label="Select all" checked={pendingTeachers.length>0 && pendingTeachers.every(u=>selected[u._id])} onChange={(e)=>{
                        const checked = e.target.checked; const next: Record<string, boolean> = {}; pendingTeachers.forEach(u=> next[u._id]=checked); setSelected(prev=>({...prev, ...next}));
                      }} />
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.name','Name')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.email','Email')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.actions','Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingTeachers.map(u => (
                    <tr key={u._id}>
                      <td className="px-4 py-2">
                        <input type="checkbox" checked={!!selected[u._id]} onChange={(e)=> setSelected(prev=> ({...prev, [u._id]: e.target.checked}))} />
                      </td>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => approve(u._id)} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">{t('admin.approve','Approve')}</button>
                        <button onClick={() => reject(u._id)} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">{t('admin.reject','Reject')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={async()=>{ const ids = Object.keys(selected).filter(id=>selected[id]); for (const id of ids) { await approve(id);} }} className="px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700">{t('admin.approve','Approve')} ({Object.values(selected).filter(Boolean).length})</button>
                <button onClick={async()=>{ const ids = Object.keys(selected).filter(id=>selected[id]); for (const id of ids) { await reject(id);} }} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">{t('admin.reject','Reject')} ({Object.values(selected).filter(Boolean).length})</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('admin.users.all','All Users')}</h2>
            <div className="flex items-center gap-2">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t('admin.search','Search...')} className="border rounded-md px-3 py-2" />
              <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value as any)} className="border rounded-md px-3 py-2">
                <option value="all">{t('admin.all','All')}</option>
                <option value="student">{t('admin.student','Student')}</option>
                <option value="teacher">{t('admin.teacher','Teacher')}</option>
                <option value="admin">{t('admin.admin','Admin')}</option>
              </select>
              <button onClick={load} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">{t('admin.refresh','Refresh')}</button>
            </div>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-500">{t('common.loading','Loading...')}</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">{t('admin.users.empty','No users found')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.name','Name')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.email','Email')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.role','Role')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.status','Status')}</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">{t('admin.actions','Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2">
                        <select value={u.role} onChange={(e)=>changeRole(u._id, e.target.value as any)} className="border rounded-md px-2 py-1 text-sm">
                          <option value="student">{t('admin.student','Student')}</option>
                          <option value="teacher">{t('admin.teacher','Teacher')}</option>
                          <option value="admin">{t('admin.admin','Admin')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select value={u.approvalStatus || 'approved'} onChange={(e)=>changeStatus(u._id, e.target.value)} className="border rounded-md px-2 py-1 text-sm">
                          <option value="approved">{t('admin.approved','Approved')}</option>
                          <option value="pending">{t('admin.pending','Pending')}</option>
                          <option value="rejected">{t('admin.rejected','Rejected')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={()=>changeStatus(u._id, 'approved')} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 mr-2">{t('admin.approve','Approve')}</button>
                        <button onClick={()=>changeStatus(u._id, 'rejected')} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">{t('admin.reject','Reject')}</button>
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


