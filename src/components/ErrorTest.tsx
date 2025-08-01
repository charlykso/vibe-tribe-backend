import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ComponentErrorBoundary from '@/components/ComponentErrorBoundary';

// Component that throws an error for testing
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by ErrorThrowingComponent');
  }
  
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <p className="text-green-800 dark:text-green-200">
        ✅ Component is working normally
      </p>
    </div>
  );
};

// Component that throws an error in useEffect
const AsyncErrorComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      // Simulate an async error
      setTimeout(() => {
        throw new Error('This is an async error for testing');
      }, 100);
    }
  }, [shouldThrow]);
  
  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p className="text-blue-800 dark:text-blue-200">
        ✅ Async component is working normally
      </p>
    </div>
  );
};

// Component that accesses undefined properties
const UndefinedAccessComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  const data: any = shouldThrow ? undefined : { user: { name: 'John Doe', avatar: '/avatar.jpg' } };
  
  return (
    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
      <p className="text-purple-800 dark:text-purple-200">
        User: {data.user.name} {/* This will throw if data is undefined */}
      </p>
      <img src={data.user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
    </div>
  );
};

export const ErrorTest: React.FC = () => {
  const [throwRenderError, setThrowRenderError] = useState(false);
  const [throwAsyncError, setThrowAsyncError] = useState(false);
  const [throwUndefinedError, setThrowUndefinedError] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setThrowRenderError(!throwRenderError)}
              variant={throwRenderError ? "destructive" : "outline"}
            >
              {throwRenderError ? "Stop" : "Test"} Render Error
            </Button>
            <Button
              onClick={() => setThrowAsyncError(!throwAsyncError)}
              variant={throwAsyncError ? "destructive" : "outline"}
            >
              {throwAsyncError ? "Stop" : "Test"} Async Error
            </Button>
            <Button
              onClick={() => setThrowUndefinedError(!throwUndefinedError)}
              variant={throwUndefinedError ? "destructive" : "outline"}
            >
              {throwUndefinedError ? "Stop" : "Test"} Undefined Access
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Render Error Test</h3>
              <ComponentErrorBoundary componentName="ErrorThrowingComponent">
                <ErrorThrowingComponent shouldThrow={throwRenderError} />
              </ComponentErrorBoundary>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">2. Async Error Test</h3>
              <ComponentErrorBoundary componentName="AsyncErrorComponent">
                <AsyncErrorComponent shouldThrow={throwAsyncError} />
              </ComponentErrorBoundary>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">3. Undefined Access Test</h3>
              <ComponentErrorBoundary componentName="UndefinedAccessComponent">
                <UndefinedAccessComponent shouldThrow={throwUndefinedError} />
              </ComponentErrorBoundary>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Testing Instructions:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Click "Test Render Error" to trigger a component render error</li>
              <li>• Click "Test Async Error" to trigger an async error (check console)</li>
              <li>• Click "Test Undefined Access" to trigger undefined property access</li>
              <li>• Each error should be caught by its respective error boundary</li>
              <li>• Click "Retry" in the error UI to recover the component</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
