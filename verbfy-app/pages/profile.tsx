import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { userAPI } from '@/lib/api';
import Image from 'next/image';
import api from '@/lib/api';

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', bio: '', phone: '', specialties: '' as any, experience: '' as any, education: '', certifications: '' as any, cvUrl: '', introVideoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        bio: (user as any).bio || '',
        phone: (user as any).phone || '',
        specialties: Array.isArray((user as any).specialties) ? (user as any).specialties.join(', ') : '',
        experience: (user as any).experience ?? '',
        education: (user as any).education || '',
        certifications: Array.isArray((user as any).certifications) ? (user as any).certifications.join(', ') : '',
        cvUrl: (user as any).cvUrl || '',
        introVideoUrl: (user as any).introVideoUrl || '',
      });
    }
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userAPI.updateProfile({
        ...form,
        specialties: typeof form.specialties === 'string' ? form.specialties.split(',').map(s => s.trim()).filter(Boolean) : form.specialties,
        certifications: typeof form.certifications === 'string' ? form.certifications.split(',').map(s => s.trim()).filter(Boolean) : form.certifications,
        experience: form.experience ? Number(form.experience) : undefined,
      });
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = () => fileInput.current?.click();

  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await userAPI.uploadAvatar(file);
      await refreshUser();
    } finally {
      setUploading(false);
      ev.target.value = '';
    }
  };

  const avatarSrc = (user as any)?.profileImage || (user as any)?.avatar || '/images/default-avatar.png';

  return (
    <DashboardLayout allowedRoles={['teacher', 'student']} title="Profile">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex flex-col items-center sm:items-start">
              <div className="relative w-28 h-28 rounded-full overflow-hidden ring-2 ring-blue-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button
                onClick={onPickAvatar}
                className="mt-3 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                {uploading ? 'Uploading...' : 'Change Avatar'}
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </div>

            <form onSubmit={onSave} className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email verification status */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between rounded-md border p-3 bg-gray-50">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email verification</div>
                    <div className="text-xs text-gray-600">{(user as any)?.emailVerified ? 'Your email is verified.' : 'Your email is not verified.'}</div>
                    {verifyMsg && <div className="text-xs text-gray-700 mt-1">{verifyMsg}</div>}
                  </div>
                  {!(user as any)?.emailVerified && (
                    <button
                      type="button"
                      onClick={async ()=>{
                        try {
                          setVerifying(true);
                          setVerifyMsg('');
                          const res = await api.post('/api/auth/verify-email/request');
                          setVerifyMsg(res.data?.message || 'Verification email sent if your email is eligible.');
                        } catch (e: any) {
                          setVerifyMsg(e?.response?.data?.message || 'Failed to send verification email');
                        } finally {
                          setVerifying(false);
                        }
                      }}
                      disabled={verifying}
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {verifying ? 'Sending…' : 'Resend verification'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              {/* Teacher application fields */}
              <div className="sm:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Teacher Application Details</h3>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Specialties (comma-separated)</label>
                <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.specialties as any} onChange={(e)=>setForm({ ...form, specialties: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Experience (years)</label>
                <input type="number" min={0} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.experience as any} onChange={(e)=>setForm({ ...form, experience: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Education</label>
                <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.education} onChange={(e)=>setForm({ ...form, education: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Certifications (comma-separated)</label>
                <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.certifications as any} onChange={(e)=>setForm({ ...form, certifications: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">CV URL</label>
                <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.cvUrl} onChange={(e)=>setForm({ ...form, cvUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Intro Video URL</label>
                <input className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.introVideoUrl} onChange={(e)=>setForm({ ...form, introVideoUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Bio</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage; 