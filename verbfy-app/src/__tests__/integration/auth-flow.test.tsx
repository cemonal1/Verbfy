import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { AuthContext } from '@/context/AuthContext'
import LoginPage from '@/features/auth/view/LoginPage'
import { authAPI } from '@/lib/api'
import { I18nProvider } from '@/lib/i18n'

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}))

const mockRouter = {
  push: jest.fn(),
  pathname: '/login',
  query: {},
}

describe('Authentication Flow Integration', () => {
  const mockAuthContext = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refreshUser: jest.fn(),
    setUser: jest.fn(),
    setAccessToken: jest.fn(),
  }

  const renderWithProviders = (ui: React.ReactNode) =>
    render(
      <I18nProvider>
        <AuthContext.Provider value={mockAuthContext as any}>{ui}</AuthContext.Provider>
      </I18nProvider>
    )

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('should complete full login flow successfully', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student',
    }

    const mockLoginResponse = {
      user: mockUser,
      token: 'mock-token',
    }

    ;(authAPI.login as jest.Mock).mockResolvedValue(mockLoginResponse)
    mockAuthContext.login.mockResolvedValue(mockLoginResponse)

    renderWithProviders(<LoginPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login|sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockAuthContext.login).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalled()
    })
  })

  it('should handle login errors gracefully', async () => {
    const mockError = new Error('Invalid credentials')
    ;(authAPI.login as jest.Mock).mockRejectedValue(mockError)

    renderWithProviders(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginPage />
      </AuthContext.Provider>
    )

    // Fill in login form with invalid credentials
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

    // Submit form
    fireEvent.click(loginButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Should not redirect
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('should validate form before submission', async () => {
    renderWithProviders(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginPage />
      </AuthContext.Provider>
    )

    const loginButton = screen.getByRole('button', { name: /login/i })

    // Try to submit empty form
    fireEvent.click(loginButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    // Should not call API
    expect(authAPI.login).not.toHaveBeenCalled()
  })

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error')
    ;(authAPI.login as jest.Mock).mockRejectedValue(networkError)

    renderWithProviders(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginPage />
      </AuthContext.Provider>
    )

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(loginButton)

    // Should show network error
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should clear errors when user starts typing', async () => {
    const mockError = new Error('Invalid credentials')
    ;(authAPI.login as jest.Mock).mockRejectedValue(mockError)

    renderWithProviders(
      <AuthContext.Provider value={mockAuthContext}>
        <LoginPage />
      </AuthContext.Provider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })

    // Submit form with invalid credentials
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(loginButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })

    // Start typing in email field
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()
    })
  })
})