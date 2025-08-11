import React, { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
  const [message, setMessage] = useState('Verifying...');

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('Invalid or missing token'); return; }
    (async () => {
      try {
        const res = await api.post('/api/auth/verify-email', { token });
        if (res.data.success) { setStatus('success'); setMessage('Email verified. You can now log in.'); }
        else { setStatus('error'); setMessage(res.data.message || 'Verification failed'); }
      } catch (e:any) {
        setStatus('error'); setMessage(e.response?.data?.message || 'Verification failed');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-xl shadow max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-2">Email Verification</h1>
        <p className={status==='success' ? 'text-green-700' : status==='error' ? 'text-red-700' : 'text-gray-600'}>{message}</p>
      </div>
    </div>
  );
}


