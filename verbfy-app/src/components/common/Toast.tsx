import React, { createContext, useContext, useState, ReactNode } from 'react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast interface
interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Toast context interface
interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Provider component
interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Show toast
  const showToast = (type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  // Remove toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Convenience methods
  const success = (message: string, duration?: number) => showToast('success', message, duration);
  const error = (message: string, duration?: number) => showToast('error', message, duration);
  const warning = (message: string, duration?: number) => showToast('warning', message, duration);
  const info = (message: string, duration?: number) => showToast('info', message, duration);

  const value: ToastContextType = {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {(() => { try { setToastContext(value); } catch {} return null; })()}
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Custom hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

// Individual toast item component
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { type, message, id } = toast;

  // Get icon and colors based on type
  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-400',
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-400',
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-400',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-400',
        };
      default:
        return {
          icon: '📢',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          iconColor: 'text-gray-400',
        };
    }
  };

  const styles = getToastStyles(type);

  return (
    <div
      className={`
        max-w-sm w-full ${styles.bgColor} border ${styles.borderColor} rounded-lg shadow-lg
        p-4 flex items-start space-x-3 transform transition-all duration-300 ease-in-out
        hover:scale-105
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 text-lg ${styles.iconColor}`}>
        {styles.icon}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${styles.textColor}`}>
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(id)}
        className={`
          flex-shrink-0 ml-2 p-1 rounded-md ${styles.textColor} hover:bg-black/10
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
          focus:ring-current transition-colors duration-200
        `}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Global toast functions (for use outside of React components)
let toastContext: ToastContextType | null = null;

export const setToastContext = (context: ToastContextType) => {
  toastContext = context;
};

export const toast = {
  success: (message: string, duration?: number) => {
    if (toastContext) {
      toastContext.success(message, duration);
    } else {
      // No-op when context is unavailable (e.g., unit tests)
    }
  },
  error: (message: string, duration?: number) => {
    if (toastContext) {
      toastContext.error(message, duration);
    } else {
      // No-op when context is unavailable (e.g., unit tests)
    }
  },
  warning: (message: string, duration?: number) => {
    if (toastContext) {
      toastContext.warning(message, duration);
    } else {
      // No-op when context is unavailable (e.g., unit tests)
    }
  },
  info: (message: string, duration?: number) => {
    if (toastContext) {
      toastContext.info(message, duration);
    } else {
      // No-op when context is unavailable (e.g., unit tests)
    }
  },
};