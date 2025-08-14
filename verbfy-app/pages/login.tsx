import LoginPage from '../src/features/auth/view/LoginPage';
import Link from 'next/link';

export default function Login() {
  return (
    <>
      <LoginPage />
      <div className="mt-6 text-center">
        <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot password?</Link>
      </div>
    </>
  );
}