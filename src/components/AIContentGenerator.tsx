import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Target, Zap, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ContentVariation {
  content: string;
  platform: string;
  tone: string;
  score: number;
  hashtags: string[];
  estimatedEngagement: number;
}

interface PerformancePrediction {
  predicted_metrics: {
    engagement_rate: number;
    reach: number;
    impressions: number;
    clicks: number;
    shares: number;
    comments: number;
    likes: number;
  };
  confidence_score: number;
  recommendations: string[];
}

export const AIContentGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [tone, setTone] = useState('professional');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [variations, setVariations] = useState<ContentVariation[]>([]);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const [providerUsed, setProviderUsed] = useState<string>('');

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a content prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/v1/ai/generate/variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          options: {
            platform,
            tone,
            includeHashtags,
            includeEmojis,
            variations: 3
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setVariations(data.data.variations);
      setProviderUsed(data.data.provider || 'AI');
      toast.success(`Content variations generated successfully using ${data.data.provider || 'AI'}!`);
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const predictPerformance = async (content: string) => {
    setIsPredicting(true);
    try {
      const response = await fetch('/api/v1/ai/predict/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contentId: `temp_${Date.now()}`,
          contentText: content,
          platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to predict performance');
      }

      const data = await response.json();
      setPrediction(data.data);
      setSelectedContent(content);
      toast.success('Performance prediction generated!');
    } catch (error) {
      console.error('Error predicting performance:', error);
      toast.error('Failed to predict performance. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 0.05) return 'text-green-600';
    if (rate >= 0.03) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Content Generator
            {providerUsed && (
              <Badge variant="outline" className="ml-auto">
                Powered by {providerUsed === 'gemini' ? 'Google Gemini' : 'OpenAI GPT-4'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Generate engaging content with AI-powered insights and performance predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Content Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe what you want to post about..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="authoritative">Authoritative</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hashtags">Include Hashtags</Label>
                <Switch
                  id="hashtags"
                  checked={includeHashtags}
                  onCheckedChange={setIncludeHashtags}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="emojis">Include Emojis</Label>
                <Switch
                  id="emojis"
                  checked={includeEmojis}
                  onCheckedChange={setIncludeEmojis}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={generateContent} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content Variations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {variations.length > 0 && (
        <Tabs defaultValue="variations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="variations">Content Variations</TabsTrigger>
            <TabsTrigger value="prediction">Performance Prediction</TabsTrigger>
          </TabsList>

          <TabsContent value="variations" className="space-y-4">
            {variations.map((variation, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{variation.platform}</Badge>
                        <Badge variant="outline">{variation.tone}</Badge>
                        <span className={`text-sm font-medium ${getScoreColor(variation.score)}`}>
                          Quality: {(variation.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(variation.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => predictPerformance(variation.content)}
                          disabled={isPredicting}
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Predict
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{variation.content}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Est. Engagement: {(variation.estimatedEngagement * 100).toFixed(1)}%</span>
                      <span>Hashtags: {variation.hashtags.length}</span>
                      <span>Characters: {variation.content.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="prediction" className="space-y-4">
            {prediction ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Performance Prediction
                  </CardTitle>
                  <CardDescription>
                    AI-powered performance forecast for your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedContent}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getEngagementColor(prediction.predicted_metrics.engagement_rate)}`}>
                        {(prediction.predicted_metrics.engagement_rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {prediction.predicted_metrics.reach.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reach</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {prediction.predicted_metrics.likes.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {prediction.predicted_metrics.shares.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Shares</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Score</span>
                      <span className="text-sm">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={prediction.confidence_score * 100} className="h-2" />
                  </div>

                  {prediction.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        AI Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {prediction.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-yellow-500 dark:text-yellow-400 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a content variation and click "Predict" to see performance forecasts</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
