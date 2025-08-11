import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'idle'|'done'|'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const url = new URL(window.location.href);
    setToken(url.searchParams.get('token') || '');
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setStatus('error'); setMessage('Invalid or missing token'); return; }
    if (password.length < 8) { setStatus('error'); setMessage('Password must be at least 8 characters'); return; }
    try {
      const res = await api.post('/api/auth/password/reset', { token, password });
      if (res.data.success) { setStatus('done'); setMessage('Password updated. You may now log in.'); }
      else { setStatus('error'); setMessage(res.data.message || 'Failed to reset password'); }
    } catch (e:any) {
      setStatus('error'); setMessage(e.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" className="w-full border rounded px-3 py-2" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white rounded py-2">Reset</button>
        </form>
        {message && <p className={`mt-3 ${status==='error'?'text-red-700':'text-green-700'}`}>{message}</p>}
      </div>
    </div>
  );
}


