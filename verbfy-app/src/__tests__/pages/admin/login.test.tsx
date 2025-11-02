import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import AdminLoginPage from '../../../../pages/admin/login';
import api from '@/lib/api';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => {
  const original = jest.requireActual('@/lib/api');
  return {
    __esModule: true,
    default: {
      post: jest.fn(),
    },
  };
});

const mockRouter = {
  replace: jest.fn(),
  pathname: '/admin/login',
  query: {},
};

describe('Admin Login Page', () => {
  const mockAuthContext: any = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    loading: false,
    setUser: jest.fn(),
    setAccessToken: jest.fn(),
  };

  const renderWithProviders = (ui: React.ReactNode) => {
    const Provider = AuthContext.Provider as unknown as React.ComponentType<{
      value: unknown; children: React.ReactNode;
    }>;
    return render(<Provider value={mockAuthContext}>{ui}</Provider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('logs in admin, stores token and user, and redirects to dashboard', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        token: 'mock-admin-token',
        user: { id: 'a1', email: 'admin@verbfy.com', role: 'admin' },
      },
    });

    renderWithProviders(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@verbfy.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Secret123!' } });

    fireEvent.click(screen.getByRole('button', { name: /secure login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/admin/login', {
        email: 'admin@verbfy.com',
        password: 'Secret123!',
      });
    });

    await waitFor(() => {
      expect(mockAuthContext.setAccessToken).toHaveBeenCalledWith('mock-admin-token');
    });

    await waitFor(() => {
      expect(mockAuthContext.setUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows validation error if fields are empty', async () => {
    renderWithProviders(<AdminLoginPage />);

    fireEvent.submit(screen.getByTestId('admin-login-form'));

    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('handles API error response gracefully', async () => {
    (api.post as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    renderWithProviders(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@verbfy.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: /secure login/i }));

    await waitFor(() => {
      expect((api.post as jest.Mock)).toHaveBeenCalled();
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/invalid credentials|login failed/i);

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});