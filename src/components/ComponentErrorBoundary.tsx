import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  showRetry?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * A lightweight error boundary for individual components
 * Use this for wrapping specific components that might fail
 */
class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ComponentErrorBoundary (${this.props.componentName || 'Unknown'}) caught an error:`, error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default component error UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {this.props.componentName ? `${this.props.componentName} Error` : 'Component Error'}
              </div>
              <div className="text-sm mt-1">
                Something went wrong loading this section.
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-xs mt-2 font-mono bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {this.state.error.message}
                </div>
              )}
            </div>
            {this.props.showRetry !== false && (
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="ml-4"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;

// Convenience wrapper for common use cases
export const withComponentErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
  options?: {
    fallback?: ReactNode;
    showRetry?: boolean;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ComponentErrorBoundary
      componentName={componentName}
      fallback={options?.fallback}
      showRetry={options?.showRetry}
      onError={options?.onError}
    >
      <Component {...props} />
    </ComponentErrorBoundary>
  );
  
  WrappedComponent.displayName = `withComponentErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
