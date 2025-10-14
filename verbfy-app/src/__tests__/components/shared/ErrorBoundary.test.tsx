import React from 'react'
import { render, screen } from '@testing-library/react'

// Preserve original NODE_ENV across tests
const ORIGINAL_NODE_ENV = process.env.NODE_ENV

// Simple component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Simple Error Boundary component for testing
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // Ensure env restored after tests that modify NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: ORIGINAL_NODE_ENV,
      writable: true,
      configurable: true
    })
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/Please try refreshing the page/i)).toBeInTheDocument()
  })

  it('provides error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    // Set NODE_ENV to development via Object.defineProperty to override read-only property
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Error Details/i)).toBeInTheDocument()
    expect(screen.getByText(/Test error/i)).toBeInTheDocument()

    // Restore original env
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    })
  })

  it('does not show error details outside development mode', () => {
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.queryByText(/Error Details/i)).toBeNull()

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    })
  })

  it('calls componentDidCatch when error occurs', () => {
    const mockComponentDidCatch = jest.fn()
    const originalComponentDidCatch = ErrorBoundary.prototype.componentDidCatch
    ErrorBoundary.prototype.componentDidCatch = mockComponentDidCatch

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(mockComponentDidCatch).toHaveBeenCalled()

    // Restore original method
    ErrorBoundary.prototype.componentDidCatch = originalComponentDidCatch
  })
})