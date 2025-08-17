import { useState } from 'react';
import Head from 'next/head';
import api from '../src/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await api.post('/api/auth/password/forgot', { email });
      setStatus('done');
      setMessage(res.data?.message || 'If that account exists, you will receive an email shortly.');
    } catch (e: any) {
      setStatus('done');
      setMessage(e?.response?.data?.message || 'If that account exists, you will receive an email shortly.');
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Verbfy</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <form onSubmit={submit} className="max-w-md w-full bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold mb-4">Forgot Password</h1>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
          </button>
          {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </>
  );
}

// Removed duplicate component export and legacy UI