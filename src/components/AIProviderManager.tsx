import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Zap, Settings, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ProviderStatus {
  openai: { available: boolean; model: string };
  gemini: { available: boolean; model: string };
  preferred: string;
  fallback: string;
}

interface TestResults {
  openai: { working: boolean; error?: string; responseTime?: number };
  gemini: { working: boolean; error?: string; responseTime?: number };
}

export const AIProviderManager: React.FC = () => {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    try {
      const response = await fetch('/api/v1/ai/providers/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provider status');
      }

      const data = await response.json();
      setStatus(data.data);
    } catch (error) {
      console.error('Error fetching provider status:', error);
      toast.error('Failed to fetch AI provider status');
    } finally {
      setIsLoading(false);
    }
  };

  const testProviders = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/v1/ai/providers/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to test providers');
      }

      const data = await response.json();
      setTestResults(data.data);
      toast.success('Provider tests completed');
    } catch (error) {
      console.error('Error testing providers:', error);
      toast.error('Failed to test AI providers');
    } finally {
      setIsTesting(false);
    }
  };

  const setPreferredProvider = async (provider: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/v1/ai/providers/preferred', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ provider })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set preferred provider');
      }

      await fetchProviderStatus(); // Refresh status
      toast.success(`Preferred provider set to ${provider}`);
    } catch (error) {
      console.error('Error setting preferred provider:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to set preferred provider');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (available: boolean, working?: boolean) => {
    if (working === true) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (working === false) return <XCircle className="h-5 w-5 text-red-500" />;
    if (available) return <CheckCircle className="h-5 w-5 text-blue-500" />;
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusText = (available: boolean, working?: boolean) => {
    if (working === true) return 'Working';
    if (working === false) return 'Error';
    if (available) return 'Available';
    return 'Not Available';
  };

  const getStatusColor = (available: boolean, working?: boolean) => {
    if (working === true) return 'text-green-600';
    if (working === false) return 'text-red-600';
    if (available) return 'text-blue-600';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading AI provider status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load AI provider status
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            AI Provider Management
          </CardTitle>
          <CardDescription>
            Manage and monitor your AI content generation providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenAI Status */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">OpenAI GPT-4</h3>
                  {status.preferred === 'openai' && (
                    <Badge variant="default">Preferred</Badge>
                  )}
                </div>
                {getStatusIcon(status.openai.available, testResults?.openai.working)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={getStatusColor(status.openai.available, testResults?.openai.working)}>
                    {getStatusText(status.openai.available, testResults?.openai.working)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Model:</span>
                  <span className="text-gray-600 dark:text-gray-400">{status.openai.model}</span>
                </div>
                {testResults?.openai.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Response Time:</span>
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {testResults.openai.responseTime}ms
                    </span>
                  </div>
                )}
                {testResults?.openai.error && (
                  <div className="text-red-600 dark:text-red-400 text-xs mt-2">
                    Error: {testResults.openai.error}
                  </div>
                )}
              </div>
            </div>

            {/* Gemini Status */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Google Gemini</h3>
                  {status.preferred === 'gemini' && (
                    <Badge variant="default">Preferred</Badge>
                  )}
                </div>
                {getStatusIcon(status.gemini.available, testResults?.gemini.working)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Status:</span>
                  <span className={getStatusColor(status.gemini.available, testResults?.gemini.working)}>
                    {getStatusText(status.gemini.available, testResults?.gemini.working)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Model:</span>
                  <span className="text-gray-600 dark:text-gray-400">{status.gemini.model}</span>
                </div>
                {testResults?.gemini.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Response Time:</span>
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {testResults.gemini.responseTime}ms
                    </span>
                  </div>
                )}
                {testResults?.gemini.error && (
                  <div className="text-red-600 dark:text-red-400 text-xs mt-2">
                    Error: {testResults.gemini.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Preferred Provider</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose which AI provider to use first. The system will automatically fallback to the other provider if needed.
                </p>
              </div>
              <Select
                value={status.preferred}
                onValueChange={setPreferredProvider}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai" disabled={!status.openai.available}>
                    OpenAI GPT-4
                  </SelectItem>
                  <SelectItem value="gemini" disabled={!status.gemini.available}>
                    Google Gemini
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-gray-100">Fallback Provider:</strong> {status.fallback === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={testProviders}
              disabled={isTesting}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Providers...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Providers
                </>
              )}
            </Button>
            
            <Button
              onClick={fetchProviderStatus}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Provider Comparison */}
          {testResults && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Performance Comparison</h4>
              <div className="space-y-3">
                {testResults.openai.responseTime && testResults.gemini.responseTime && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">Response Time Comparison</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        OpenAI: {testResults.openai.responseTime}ms |
                        Gemini: {testResults.gemini.responseTime}ms
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">OpenAI</div>
                        <Progress
                          value={Math.min(100, (testResults.openai.responseTime / 5000) * 100)}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gemini</div>
                        <Progress
                          value={Math.min(100, (testResults.gemini.responseTime / 5000) * 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {testResults.openai.working && testResults.gemini.working
                    ? '✅ Both providers are working correctly'
                    : testResults.openai.working || testResults.gemini.working
                    ? '⚠️ One provider is experiencing issues'
                    : '❌ Both providers are experiencing issues'
                  }
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
