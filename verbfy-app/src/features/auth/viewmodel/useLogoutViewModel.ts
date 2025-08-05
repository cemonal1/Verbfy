import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import api, { setApiAccessToken } from '@/lib/api';
import { toastError } from '@/lib/toast';

export function useLogoutViewModel() {
  const { setUser, setAccessToken } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/logout');
      setApiAccessToken('');
      setUser(null);
      setAccessToken('');
      router.push('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Logout failed';
      setError(msg);
      toastError(msg);
      // Even if logout fails on server, clear local state
      setApiAccessToken('');
      setUser(null);
      setAccessToken('');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [setUser, setAccessToken, router]);

  return { logout, loading, error };
} 