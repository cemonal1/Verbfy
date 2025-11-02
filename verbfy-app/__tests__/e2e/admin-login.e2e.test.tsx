import { render, screen } from '@testing-library/react';
import AdminLoginPage from '../../pages/admin/login';

// Mock AuthContext hook to avoid requiring provider in this smoke test
jest.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({
    user: null,
    loading: false,
    setAccessToken: jest.fn(),
    setUser: jest.fn(),
  }),
}));

describe('E2E Admin Login Page', () => {
  it('renders Secure Login button and form', async () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole('button', { name: /Secure Login/i })).toBeInTheDocument();
    expect(screen.getByTestId('admin-login-form')).toBeInTheDocument();
  });
});