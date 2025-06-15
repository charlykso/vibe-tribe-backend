import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Crown, 
  Rocket,
  Users,
  BarChart3,
  MessageSquare,
  Shield,
  Headphones
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  enterprise?: boolean;
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
  limits: {
    posts: string;
    platforms: string;
    teamMembers: string;
    analytics: string;
  };
  icon: React.ReactNode;
  color: string;
}

export const PricingPage: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals and small creators',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: <Star className="w-6 h-6" />,
      color: 'text-gray-600',
      limits: {
        posts: '10 posts/month',
        platforms: '2 platforms',
        teamMembers: '1 user',
        analytics: 'Basic analytics'
      },
      features: [
        { name: 'Basic post scheduling', included: true },
        { name: 'Content calendar', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Email support', included: true },
        { name: 'Team collaboration', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom branding', included: false },
        { name: 'Priority support', included: false },
        { name: 'API access', included: false }
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Ideal for growing businesses and teams',
      monthlyPrice: 29,
      yearlyPrice: 290,
      popular: true,
      icon: <Zap className="w-6 h-6" />,
      color: 'text-blue-600',
      limits: {
        posts: '100 posts/month',
        platforms: '5 platforms',
        teamMembers: '5 users',
        analytics: 'Advanced analytics'
      },
      features: [
        { name: 'Everything in Starter', included: true },
        { name: 'Team collaboration', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Content approval workflows', included: true },
        { name: 'Bulk scheduling', included: true },
        { name: 'Social listening', included: true },
        { name: 'Custom branding', included: false },
        { name: 'Priority support', included: false },
        { name: 'API access', included: false },
        { name: 'White-label solution', included: false }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      description: 'For established businesses with advanced needs',
      monthlyPrice: 79,
      yearlyPrice: 790,
      icon: <Crown className="w-6 h-6" />,
      color: 'text-purple-600',
      limits: {
        posts: '500 posts/month',
        platforms: '10 platforms',
        teamMembers: '15 users',
        analytics: 'Premium analytics'
      },
      features: [
        { name: 'Everything in Professional', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Priority support', included: true },
        { name: 'API access', included: true },
        { name: 'Advanced team roles', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Dedicated account manager', included: false },
        { name: 'White-label solution', included: false },
        { name: 'Custom contracts', included: false },
        { name: 'On-premise deployment', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: 0,
      yearlyPrice: 0,
      enterprise: true,
      icon: <Rocket className="w-6 h-6" />,
      color: 'text-orange-600',
      limits: {
        posts: 'Unlimited',
        platforms: 'Unlimited',
        teamMembers: 'Unlimited',
        analytics: 'Custom analytics'
      },
      features: [
        { name: 'Everything in Business', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'White-label solution', included: true },
        { name: 'Custom contracts', included: true },
        { name: 'On-premise deployment', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'SLA guarantees', included: true },
        { name: 'Training & onboarding', included: true },
        { name: 'Custom development', included: true },
        { name: '24/7 phone support', included: true }
      ]
    }
  ];

  const getPrice = (tier: PricingTier) => {
    if (tier.enterprise) return 'Custom';
    if (tier.monthlyPrice === 0) return 'Free';
    
    const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
    const period = isYearly ? '/year' : '/month';
    
    if (isYearly) {
      const monthlyEquivalent = Math.round(tier.yearlyPrice / 12);
      return (
        <div>
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-gray-500">{period}</span>
          <div className="text-sm text-gray-500">
            (${monthlyEquivalent}/month)
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-gray-500">{period}</span>
      </div>
    );
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.enterprise || tier.monthlyPrice === 0) return null;
    
    const yearlyMonthly = tier.yearlyPrice / 12;
    const savings = Math.round(((tier.monthlyPrice - yearlyMonthly) / tier.monthlyPrice) * 100);
    
    return savings > 0 ? `Save ${savings}%` : null;
  };

  const handleSelectPlan = (tier: PricingTier) => {
    if (tier.enterprise) {
      toast({
        title: "Contact Sales",
        description: "We'll get in touch to discuss your enterprise needs.",
      });
    } else {
      toast({
        title: "Plan Selected",
        description: `You've selected the ${tier.name} plan. Redirecting to checkout...`,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Scale your social media presence with the right plan for your needs
        </p>
        
        {/* Billing toggle */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <span className={`text-sm ${isYearly ? 'font-medium' : 'text-gray-500'}`}>
            Yearly
          </span>
          {isYearly && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Save up to 17%
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pricingTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative ${
              tier.popular 
                ? 'border-blue-500 shadow-lg scale-105' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 ${tier.color}`}>
                {tier.icon}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tier.description}
              </p>
              
              <div className="mt-4">
                {getPrice(tier)}
                {isYearly && getSavings(tier) && (
                  <Badge variant="outline" className="mt-2 text-green-600">
                    {getSavings(tier)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Limits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Posts</span>
                  <span className="font-medium">{tier.limits.posts}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Platforms</span>
                  <span className="font-medium">{tier.limits.platforms}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Team Members</span>
                  <span className="font-medium">{tier.limits.teamMembers}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Features */}
              <div className="space-y-2">
                {tier.features.slice(0, 6).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={feature.included ? '' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </div>
                ))}
                
                {tier.features.length > 6 && (
                  <div className="text-xs text-gray-500 mt-2">
                    +{tier.features.length - 6} more features
                  </div>
                )}
              </div>
              
              <Button 
                className={`w-full mt-6 ${
                  tier.popular 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : tier.enterprise
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : ''
                }`}
                variant={tier.popular || tier.enterprise ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(tier)}
              >
                {tier.enterprise ? 'Contact Sales' : tier.monthlyPrice === 0 ? 'Get Started' : 'Choose Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature comparison */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Features</th>
                {pricingTiers.map(tier => (
                  <th key={tier.id} className="text-center p-4 font-medium">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                'Basic post scheduling',
                'Team collaboration', 
                'Advanced analytics',
                'Custom branding',
                'Priority support',
                'API access'
              ].map(featureName => (
                <tr key={featureName} className="border-b">
                  <td className="p-4 font-medium">{featureName}</td>
                  {pricingTiers.map(tier => {
                    const feature = tier.features.find(f => f.name === featureName);
                    return (
                      <td key={tier.id} className="text-center p-4">
                        {feature?.included ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-400 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">What happens if I exceed my limits?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              We'll notify you when you're approaching your limits and offer upgrade options. Your account won't be suspended.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Do you offer refunds?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Yes, we offer a 30-day money-back guarantee for all paid plans.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Is there a free trial?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our Starter plan is free forever. For paid plans, we offer a 14-day free trial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
