import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2, Send, BarChart3, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AuthService } from '@/lib/auth';
import { PostsService } from '@/lib/services/posts';
import { AnalyticsService } from '@/lib/services/analytics';
import { MediaService } from '@/lib/services/media';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function IntegrationTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Backend Health Check', status: 'pending', message: 'Not tested' },
    { name: 'Authentication', status: 'pending', message: 'Not tested' },
    { name: 'Posts API', status: 'pending', message: 'Not tested' },
    { name: 'Analytics API', status: 'pending', message: 'Not tested' },
    { name: 'Media Upload', status: 'pending', message: 'Not tested' },
  ]);

  const [testContent, setTestContent] = useState('Testing frontend integration! 🎉 #test');
  const [running, setRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setTests(prev => prev.map(test =>
      test.name === name ? { ...test, status, message, data } : test
    ));
  };

  const runAllTests = async () => {
    setRunning(true);

    try {
      // Test 1: Backend Health Check
      updateTest('Backend Health Check', 'pending', 'Testing...');
      try {
        const response = await fetch('http://localhost:3001/health');
        const data = await response.json();
        updateTest('Backend Health Check', 'success', `Server running on port 3001`, data);
      } catch (error) {
        updateTest('Backend Health Check', 'error', 'Backend server not available');
      }

      // Test 2: Authentication
      updateTest('Authentication', 'pending', 'Testing...');
      try {
        const result = await AuthService.login({
          email: 'test@example.com',
          password: 'password123'
        });
        updateTest('Authentication', 'success', `Logged in as ${result.user.name}`, result.user);
      } catch (error) {
        updateTest('Authentication', 'error', error instanceof Error ? error.message : 'Auth failed');
      }

      // Test 3: Posts API
      updateTest('Posts API', 'pending', 'Testing...');
      try {
        // Create a test post
        const response = await PostsService.createPost({
          content: testContent,
          platforms: ['twitter', 'linkedin']
        });
        const post = response.data?.post!;

        // Try to publish it
        await PostsService.publishPost(post.id);

        updateTest('Posts API', 'success', `Created and published post: ${post.id}`, post);
      } catch (error) {
        updateTest('Posts API', 'error', error instanceof Error ? error.message : 'Posts API failed');
      }

      // Test 4: Analytics API
      updateTest('Analytics API', 'pending', 'Testing...');
      try {
        const overviewResponse = await AnalyticsService.getOverview();
        const platformsResponse = await AnalyticsService.getPlatformAnalytics();

        const overview = overviewResponse.data;
        const platforms = platformsResponse.data?.platforms || [];

        updateTest('Analytics API', 'success', `Loaded analytics: ${overview?.total_posts || 0} posts, ${platforms.length} platforms`, { overview, platforms });
      } catch (error) {
        updateTest('Analytics API', 'error', error instanceof Error ? error.message : 'Analytics API failed');
      }

      // Test 5: Media Upload (mock)
      updateTest('Media Upload', 'pending', 'Testing...');
      try {
        // Create a mock file for testing
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const result = await MediaService.uploadFileWithFallback(mockFile);

        updateTest('Media Upload', 'success', `Uploaded file: ${result.filename}`, result);
      } catch (error) {
        updateTest('Media Upload', 'error', error instanceof Error ? error.message : 'Media upload failed');
      }

    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return running ? <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> : <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const totalTests = tests.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integration Test Suite</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Test the frontend integration with the Firebase backend
        </p>
      </div>

      {/* Test Controls */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Test Configuration</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{successCount}/{totalTests} tests passed</span>
              <Button onClick={runAllTests} disabled={running}>
                {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Run All Tests
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Test Post Content
              </label>
              <Textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                placeholder="Enter content for post creation test..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="grid gap-4">
        {tests.map((test, index) => (
          <Card key={index} className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{test.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{test.message}</p>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>

              {test.data && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Status Summary */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="text-center">
            {successCount === totalTests ? (
              <div className="text-green-600">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">All Tests Passed!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Frontend is successfully integrated with the Firebase backend.
                </p>
              </div>
            ) : (
              <div className="text-blue-600">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Integration Status</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {successCount} of {totalTests} tests completed successfully.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
