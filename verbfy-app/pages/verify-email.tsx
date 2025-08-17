import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '../src/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token: queryToken } = router.query as { token?: string };
  const token = typeof queryToken === 'string' ? queryToken : undefined;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setStatus('loading');
      try {
        const res = await api.get(`/api/auth/verify-email/confirm`, { params: { token } });
        if (res.data?.success) {
          setStatus('success');
          setMessage('Email verified');
        } else {
          setStatus('error');
          setMessage(res.data?.message || 'Verification failed');
        }
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.response?.data?.message || 'Verification failed');
      }
    };
    run();
  }, [token]);

  return (
    <>
      <Head>
        <title>Verify Email - Verbfy</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Verify Email</h1>
          {status === 'loading' && <p>Verifying your email…</p>}
          {status !== 'loading' && (
            <p className={status === 'success' ? 'text-green-700' : 'text-red-600'}>{message}</p>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </>
  );
}


