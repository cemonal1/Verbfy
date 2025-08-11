import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '../src/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [message, setMessage] = useState('');

  const canSubmit = password.length >= 8 && password === confirm && typeof token === 'string';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post('/api/auth/password/reset', { token, password });
      setStatus('done');
      setMessage(res.data?.message || 'Password has been reset.');
    } catch (e: any) {
      setStatus('done');
      setMessage(e?.response?.data?.message || 'Reset failed.');
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - Verbfy</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <form onSubmit={submit} className="max-w-md w-full bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>
          <label className="block text-sm font-medium text-gray-700">New Password (min 8 chars)</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <label className="block text-sm font-medium text-gray-700 mt-3">Confirm Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !canSubmit}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Resetting…' : 'Reset Password'}
          </button>
          {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </>
  );
}


