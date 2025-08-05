import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from '@/components/common/Toast'

// Test component that uses the toast
const TestComponent = ({ message, type, duration }: { message: string; type: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => {
  const { showToast } = useToast()
  
  const handleShowToast = () => {
    showToast(type, message, duration)
  }

  return (
    <div>
      <button onClick={handleShowToast}>Show Toast</button>
    </div>
  )
}

describe('Toast System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Success message" type="success" />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  it('should show error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Error message" type="error" />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  it('should show warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Warning message" type="warning" />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })

  it('should show info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Info message" type="info" />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })
  })

  it('should auto-close toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Auto-close message" type="success" duration={100} />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    // Should appear
    await waitFor(() => {
      expect(screen.getByText('Auto-close message')).toBeInTheDocument()
    })

    // Should disappear after duration
    await waitFor(() => {
      expect(screen.queryByText('Auto-close message')).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should allow manual close', async () => {
    render(
      <ToastProvider>
        <TestComponent message="Manual close message" type="success" />
      </ToastProvider>
    )

    const button = screen.getByText('Show Toast')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Manual close message')).toBeInTheDocument()
    })

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Manual close message')).not.toBeInTheDocument()
    })
  })

  it('should show multiple toasts', async () => {
    const MultipleToastComponent = () => {
      const { success, error, warning, info } = useToast()
      
      return (
        <div>
          <button onClick={() => success('Success 1')}>Success 1</button>
          <button onClick={() => error('Error 1')}>Error 1</button>
          <button onClick={() => warning('Warning 1')}>Warning 1</button>
          <button onClick={() => info('Info 1')}>Info 1</button>
        </div>
      )
    }

    render(
      <ToastProvider>
        <MultipleToastComponent />
      </ToastProvider>
    )

    // Show multiple toasts
    fireEvent.click(screen.getByText('Success 1'))
    fireEvent.click(screen.getByText('Error 1'))
    fireEvent.click(screen.getByText('Warning 1'))
    fireEvent.click(screen.getByText('Info 1'))

    await waitFor(() => {
      // Check that all toasts are displayed (2 elements each: button + toast)
      expect(screen.getAllByText('Success 1')).toHaveLength(2)
      expect(screen.getAllByText('Error 1')).toHaveLength(2)
      expect(screen.getAllByText('Warning 1')).toHaveLength(2)
      expect(screen.getAllByText('Info 1')).toHaveLength(2)
    })
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = jest.fn()

    expect(() => {
      render(<TestComponent message="Test" type="success" />)
    }).toThrow('useToast must be used within a ToastProvider')

    console.error = originalError
  })
}) 