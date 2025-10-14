import React, { ComponentType, lazy, Suspense } from 'react';

// Simple fallback component
const DefaultFallback = () => React.createElement('div', null, 'Loading...');

// Dynamic import wrapper with suspense
export function lazyImport<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  const LazyComponent = lazy(importFunc);
  const FallbackComponent = fallback || DefaultFallback;
  
  const LazyWithSuspense = (props: React.ComponentProps<T>) => {
    return React.createElement(
      Suspense,
      { fallback: React.createElement(FallbackComponent, null) },
      React.createElement(LazyComponent, props as any)
    );
  };
  const lazyMeta = LazyComponent as unknown as ComponentType & { displayName?: string; name?: string };
  LazyWithSuspense.displayName = `Lazy(${lazyMeta.displayName || lazyMeta.name || 'Component'})`;

  return LazyWithSuspense as ComponentType<React.ComponentProps<T>>;
}

// Performance monitoring utilities
export const performanceUtils = {
  // Mark performance timing
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },

  // Measure performance between marks
  measure: (name: string, startMark: string, endMark?: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.measure(name, startMark, endMark);
        const entries = window.performance.getEntriesByName(name);
        const measure = entries[entries.length - 1];
        return measure ? measure.duration : 0;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return 0;
      }
    }
    return 0;
  },

  // Get navigation timing
  getNavigationTiming: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!navigation) return null;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: navigation.responseEnd - navigation.requestStart,
        ttfb: navigation.responseStart - navigation.requestStart,
      };
    }
    return null;
  },

  // Report Core Web Vitals
  reportWebVitals: (metric: unknown) => {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Google Analytics, Sentry, or custom analytics
      console.log('Web Vital:', metric);
    }
  },
};

// Image optimization utilities
export const imageUtils = {
  // Generate responsive image props
  getResponsiveProps: (src: string, alt: string) => ({
    src,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    style: { maxWidth: '100%', height: 'auto' },
  }),

  // Preload critical images
  preloadImage: (src: string) => {
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  },
};

// Bundle size optimization
export const bundleUtils = {
  // Dynamically import large libraries only when needed
  loadChartLibrary: () => import('recharts'),
  loadSocketLibrary: () => import('socket.io-client'),
  loadStripeLibrary: () => import('@stripe/stripe-js'),
  
  // Conditional loading based on feature flags
  loadFeature: async (featureName: string) => {
    switch (featureName) {
      case 'analytics':
        return import('../components/analytics/AdminDashboard');
      case 'chat':
        return import('../components/chat/ChatInterface');
      case 'voice':
        return import('../components/voiceChat/VoiceChatRoom');
      default:
        return null;
    }
  },
};

// Memory management utilities
export const memoryUtils = {
  // Clean up event listeners
  cleanup: (element: Element, eventType: string, handler: EventListener) => {
    element.removeEventListener(eventType, handler);
  },

  // Debounce function for performance
  debounce: <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};