import { renderHook, act, waitFor } from '@testing-library/react'
import { useLoginViewModel } from '@/features/auth/viewmodel/useLoginViewModel'
import { authAPI } from '@/lib/api'

// Mock the API
jest.mock('@/lib/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}))

jest.mock('@/lib/toast', () => ({
  toastError: jest.fn(),
}))

// Mock the auth context
jest.mock('@/context/AuthContext', () => ({
  useAuthContext: () => ({
    login: jest.fn(async () => true),
    setUser: jest.fn(),
    setAccessToken: jest.fn(),
    loading: false,
  }),
}))

describe('useLoginViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLoginViewModel())

    expect(result.current.email).toBe('')
    expect(result.current.password).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('should update email when setEmail is called', () => {
    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail('test@example.com')
    })

    expect(result.current.email).toBe('test@example.com')
  })

  it('should update password when setPassword is called', () => {
    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setPassword('password123')
    })

    expect(result.current.password).toBe('password123')
  })

  it('should handle successful login', async () => {
    const mockLoginResponse = {
      user: { id: '1', email: 'test@example.com', role: 'student' },
      token: 'mock-token',
    }

    ;(authAPI.login as jest.Mock).mockResolvedValue(mockLoginResponse)

    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail('test@example.com')
      result.current.setPassword('password123')
    })

    await act(async () => {
      await result.current.handleLogin()
    })

    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('')
  })

  it('should handle login error', async () => {
    const mockError = { response: { data: { message: 'Invalid credentials' } } }
    ;(authAPI.login as jest.Mock).mockRejectedValue(mockError)

    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail('test@example.com')
      result.current.setPassword('wrongpassword')
    })

    await act(async () => {
      await result.current.handleLogin()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('should validate email format', () => {
    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail('invalid-email')
    })

    expect(result.current.isValidEmail()).toBe(false)

    act(() => {
      result.current.setEmail('valid@example.com')
    })

    expect(result.current.isValidEmail()).toBe(true)
  })

  it('should validate form before submission', () => {
    const { result } = renderHook(() => useLoginViewModel())

    // Empty form
    expect(result.current.isFormValid()).toBe(false)

    // Invalid email
    act(() => {
      result.current.setEmail('invalid-email')
      result.current.setPassword('password123')
    })
    expect(result.current.isFormValid()).toBe(false)

    // Valid form
    act(() => {
      result.current.setEmail('valid@example.com')
      result.current.setPassword('password123')
    })
    expect(result.current.isFormValid()).toBe(true)
  })

  it('should clear error when email or password changes', () => {
    const { result } = renderHook(() => useLoginViewModel())

    // Set initial error
    act(() => {
      result.current.setError('Some error')
    })

    expect(result.current.error).toBe('Some error')

    // Clear error when email changes
    act(() => {
      result.current.setEmail('new@example.com')
    })

    expect(result.current.error).toBe('')

    // Set error again
    act(() => {
      result.current.setError('Another error')
    })

    // Clear error when password changes
    act(() => {
      result.current.setPassword('newpassword')
    })

    expect(result.current.error).toBe('')
  })

  it('should set loading state during login', async () => {
    const mockLoginResponse = {
      user: { id: '1', email: 'test@example.com', role: 'student' },
      token: 'mock-token',
    }

    ;(authAPI.login as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockLoginResponse), 100))
    )

    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail('test@example.com')
      result.current.setPassword('password123')
    })

    // Start login
    act(() => {
      result.current.handleLogin()
    })

    // Should be loading
    expect(result.current.loading).toBe(true)

    // Wait for login to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
}) 