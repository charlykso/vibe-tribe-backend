/**
 * Global error handling utilities
 */

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser behavior (logging to console)
    event.preventDefault();
    
    // Log to external error service if available
    // Example: Sentry.captureException(event.reason);
    
    // Show user-friendly error message for critical errors
    if (shouldShowUserError(event.reason)) {
      showUserError('Something went wrong. Please try refreshing the page.');
    }
  });

  // Handle general JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Log to external error service if available
    // Example: Sentry.captureException(event.error);
    
    // Show user-friendly error message for critical errors
    if (shouldShowUserError(event.error)) {
      showUserError('An unexpected error occurred. Please refresh the page.');
    }
  });
};

// Determine if an error should be shown to the user
const shouldShowUserError = (error: any): boolean => {
  // Don't show errors for network issues (user might be offline)
  if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
    return false;
  }
  
  // Don't show errors for cancelled requests
  if (error?.name === 'AbortError') {
    return false;
  }
  
  // Don't show errors for development-only issues
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  
  // Show errors for critical application failures
  return true;
};

// Show user-friendly error message
const showUserError = (message: string) => {
  // Use toast notification if available
  if (typeof window !== 'undefined' && (window as any).showToast) {
    (window as any).showToast(message, 'error');
    return;
  }
  
  // Fallback to alert (not ideal but better than nothing)
  alert(message);
};

// Error boundary error handler
export const handleErrorBoundaryError = (error: Error, errorInfo: any) => {
  console.error('Error Boundary caught an error:', error, errorInfo);
  
  // Log to external error service
  // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  
  // Track error analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'exception', {
      description: error.message,
      fatal: false
    });
  }
};

// API error handler
export const handleApiError = (error: any): string => {
  // Handle network errors
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  // Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
    return 'Request timed out. Please try again.';
  }
  
  // Handle specific HTTP status codes
  if (error?.status) {
    switch (error.status) {
      case 400:
        return error?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return error?.message || 'Conflict. The resource already exists or has been modified.';
      case 422:
        return error?.message || 'Invalid data provided.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return error?.message || 'An unexpected error occurred.';
    }
  }
  
  // Handle generic errors
  return error?.message || 'An unexpected error occurred.';
};

// Safe async function wrapper
export const safeAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Safe async function error:', error);
      return null;
    }
  };
};

// Safe function wrapper for synchronous functions
export const safe = <T extends any[], R>(
  fn: (...args: T) => R,
  fallback?: R
) => {
  return (...args: T): R | typeof fallback => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Safe function error:', error);
      return fallback as R;
    }
  };
};

// Initialize error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}
