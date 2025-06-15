import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Users,
  MessageSquare,
  BarChart3,
  Zap,
  Target,
  Rocket,
  Star
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    role: '',
    teamSize: '',
    goals: [] as string[],
    platforms: [] as string[],
    experience: '',
    companyName: '',
    industry: ''
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to VibeTribe Manager!',
      description: 'Let\'s get you set up in just a few minutes',
      icon: <Rocket className="w-8 h-8 text-blue-500" />,
      component: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome to VibeTribe Manager!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The all-in-one platform for managing your social media presence and community engagement.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Multi-platform posting</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Team collaboration</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Community management</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'role',
      title: 'Tell us about yourself',
      description: 'Help us customize your experience',
      icon: <Users className="w-8 h-8 text-green-500" />,
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">What's your role?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                'Social Media Manager',
                'Marketing Manager',
                'Content Creator',
                'Community Manager',
                'Business Owner',
                'Agency Owner'
              ].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserData(prev => ({ ...prev, role }))}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    userData.role === role
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <Input
              value={userData.companyName}
              onChange={(e) => setUserData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Enter your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Team Size</label>
            <div className="grid grid-cols-4 gap-2">
              {['Just me', '2-5', '6-20', '20+'].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setUserData(prev => ({ ...prev, teamSize: size }))}
                  className={`p-2 border rounded text-sm transition-colors ${
                    userData.teamSize === size
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'What are your main goals?',
      description: 'Select all that apply',
      icon: <Target className="w-8 h-8 text-orange-500" />,
      component: (
        <div className="space-y-4">
          {[
            { id: 'engagement', label: 'Increase engagement', desc: 'Boost likes, comments, and shares' },
            { id: 'followers', label: 'Grow followers', desc: 'Expand your audience reach' },
            { id: 'leads', label: 'Generate leads', desc: 'Convert social traffic to customers' },
            { id: 'brand', label: 'Build brand awareness', desc: 'Increase brand recognition' },
            { id: 'community', label: 'Manage community', desc: 'Foster community engagement' },
            { id: 'analytics', label: 'Track performance', desc: 'Measure and optimize results' }
          ].map(goal => (
            <div
              key={goal.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                userData.goals.includes(goal.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => {
                setUserData(prev => ({
                  ...prev,
                  goals: prev.goals.includes(goal.id)
                    ? prev.goals.filter(g => g !== goal.id)
                    : [...prev.goals, goal.id]
                }));
              }}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={userData.goals.includes(goal.id)}
                  onChange={() => {}}
                />
                <div>
                  <h4 className="font-medium">{goal.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{goal.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'platforms',
      title: 'Which platforms do you use?',
      description: 'We\'ll help you connect them later',
      icon: <MessageSquare className="w-8 h-8 text-purple-500" />,
      component: (
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'twitter', name: 'Twitter', color: 'bg-blue-500' },
            { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
            { id: 'instagram', name: 'Instagram', color: 'bg-pink-500' },
            { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
            { id: 'youtube', name: 'YouTube', color: 'bg-red-500' },
            { id: 'tiktok', name: 'TikTok', color: 'bg-black' }
          ].map(platform => (
            <button
              key={platform.id}
              type="button"
              onClick={() => {
                setUserData(prev => ({
                  ...prev,
                  platforms: prev.platforms.includes(platform.id)
                    ? prev.platforms.filter(p => p !== platform.id)
                    : [...prev.platforms, platform.id]
                }));
              }}
              className={`p-4 border rounded-lg transition-colors ${
                userData.platforms.includes(platform.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${platform.color} rounded-lg`}></div>
                <span className="font-medium">{platform.name}</span>
                {userData.platforms.includes(platform.id) && (
                  <Check className="w-4 h-4 text-blue-500 ml-auto" />
                )}
              </div>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      description: 'Welcome to your new social media command center',
      icon: <Star className="w-8 h-8 text-yellow-500" />,
      component: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center">
            <Check className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome aboard, {userData.companyName || 'there'}!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is ready. Let's start building your social media presence!
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Quick Start Checklist:</h3>
            <div className="space-y-2 text-sm text-left">
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Complete onboarding</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <span>Connect your social media accounts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <span>Create your first post</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox />
                <span>Invite team members</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      toast({
        title: "Welcome to VibeTribe!",
        description: "Your account setup is complete. Let's get started!",
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return true;
      case 'role':
        return userData.role && userData.teamSize;
      case 'goals':
        return userData.goals.length > 0;
      case 'platforms':
        return userData.platforms.length > 0;
      case 'complete':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.component}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
