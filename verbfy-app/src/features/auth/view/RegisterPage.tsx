import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import api, { setApiAccessToken } from '@/lib/api';
import { toastSuccess, toastError } from '@/lib/toast';
import HomeButton from '@/components/shared/HomeButton';

interface RegisterResponse {
  accessToken: string;
  user: {
    _id: string;
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher';
    createdAt: string;
    updatedAt: string;
  };
}

export default function RegisterPage() {
  const { setUser, setAccessToken } = useAuthContext();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.post<RegisterResponse>('/api/auth/register', { name, email, password, role });
      
      // Set the access token and user data
      setApiAccessToken(res.data.accessToken);
      setUser(res.data.user);
      setAccessToken(res.data.accessToken);
      
      // Log for debugging
      console.log('Registration successful:', res.data.user);
      
      // Redirect based on role
      if (res.data.user.role === 'student') {
        router.push('/student/dashboard');
      } else if (res.data.user.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/dashboard');
      }
      
      toastSuccess('Account created successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Registration failed';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'outlook' | 'apple') => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const w = 520, h = 600;
    const y = window.top?.outerHeight ? Math.max(0, (window.top!.outerHeight - h) / 2) : 100;
    const x = window.top?.outerWidth ? Math.max(0, (window.top!.outerWidth - w) / 2) : 100;
    window.open(`${base}/api/auth/oauth/${provider}`, 'oauthLogin', `width=${w},height=${h},left=${x},top=${y}`);
    const handler = (event: MessageEvent) => {
      const data: any = event.data || {};
      if (data?.type === 'oauth-success' && data?.token) {
        window.location.href = '/dashboard';
      }
    };
    window.addEventListener('message', handler, { once: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Logo and Brand */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 sm:mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="text-xl sm:text-2xl font-bold text-white">V</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Verbfy
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">Join the learning revolution</p>
        </div>

        {/* Main Registration Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Create your account
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Start your English learning journey today
            </p>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to join as
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white/50 backdrop-blur-sm text-sm sm:text-base"
                value={role}
                onChange={(e) => setRole(e.target.value as 'student' | 'teacher')}
              >
                <option value="student">Student - Learn English</option>
                <option value="teacher">Teacher - Teach English</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                <div className="flex">
                  <i className="fas fa-exclamation-circle text-red-400 mt-0.5 mr-3"></i>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>
                  Create account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          {/* Social Registration Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-google text-red-500 mr-3"></i>
              Continue with Google
            </button>
            
            <button
              onClick={() => handleSocialLogin('outlook')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fas fa-envelope text-blue-500 mr-3"></i>
              Continue with Outlook
            </button>
            
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full inline-flex justify-center py-2.5 sm:py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <i className="fab fa-apple text-gray-900 mr-3"></i>
              Continue with Apple
            </button>
          </div>
        </div>

        {/* Sign In CTA */}
        <div className="text-center">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">
              Terms of Service
            </Link>
            <Link href="/help" className="hover:text-gray-700 transition-colors">
              Help Center
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 Verbfy. All rights reserved.
          </p>
        </div>
      </div>

      {/* Home Button - Floating */}
      <HomeButton />
    </div>
  );
} 