import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import BrandLogo from '@/components/shared/BrandLogo';
import api from '@/lib/api';
import { createLogger } from '@/utils/logger';

const adminAuthLogger = createLogger('AdminAuth');

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading: authLoading, setAccessToken, setUser } = useAuthContext();
  const router = useRouter();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/unauthorized');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      adminAuthLogger.info('Admin login attempt', { email });
      
      const response = await api.post('/api/admin/login', {
        email: email.toLowerCase().trim(),
        password
      });

      if (response.data.success) {
        adminAuthLogger.info('Admin login successful', { email });
        
        // Store token and user in AuthContext/secure storage for app-wide auth
        try {
          if (response.data.token) {
            setAccessToken(response.data.token);
          }
          if (response.data.user) {
            setUser(response.data.user);
          }
        } catch (e) {
          adminAuthLogger.warn('Failed to set auth context after admin login', { error: (e as Error)?.message });
        }
        
        // Redirect to admin dashboard
        router.replace('/admin/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      adminAuthLogger.error('Admin login error', { 
        email, 
        error: error.response?.data?.message || error.message 
      });
      
      setError(
        error.response?.data?.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <BrandLogo size={88} withTitle={false} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Admin Portal
          </h2>
          <p className="text-purple-200 text-sm sm:text-base">
            Secure administrative access
          </p>
          <div className="flex items-center justify-center mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100/10 text-purple-200 border border-purple-300/20">
              🛡️ Administrator Only
            </span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <form
            className="space-y-4 sm:space-y-6"
            onSubmit={handleSubmit}
            data-testid="admin-login-form"
          >
            {error && (
              <div
                role="alert"
                aria-live="polite"
                aria-atomic="true"
                className="bg-red-500/10 border border-red-400/20 text-red-200 px-4 py-3 rounded-xl text-sm"
              >
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {error}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user-shield text-purple-300"></i>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  placeholder="admin@verbfy.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-purple-300"></i>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-2.5 sm:py-3 border border-white/20 rounded-xl bg-white/5 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                <>
                  <i className="fas fa-shield-alt mr-2"></i>
                  Secure Login
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-xl">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-yellow-300 mt-0.5 mr-3"></i>
              <div className="text-yellow-200 text-xs">
                <p className="font-medium mb-1">Security Notice</p>
                <p>This is a secure admin portal. All login attempts are monitored and logged. Only authorized administrators should access this page.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to main site */}
        <div className="text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-200 hover:text-white transition-colors text-sm"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Verbfy
          </Link>
        </div>
      </div>
    </div>
  );
}