import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface PlanData {
  price: number;
  originalPrice: number | null;
}

interface PricingData {
  symbol: string;
  freemium: PlanData;
  premium: PlanData;
  pro: PlanData;
}

interface PricingToggleProps {
  onPlanSelect?: (plan: string, currency: string, amount: number) => void;
}

const PricingToggle = ({ onPlanSelect }: PricingToggleProps) => {
  const [currency, setCurrency] = useState<'GBP' | 'NGN'>('GBP');

  const pricingData: Record<'GBP' | 'NGN', PricingData> = {
    GBP: {
      symbol: '£',
      freemium: { price: 0, originalPrice: null },
      premium: { price: 2, originalPrice: 5 },
      pro: { price: 10, originalPrice: 15 }
    },
    NGN: {
      symbol: '₦',
      freemium: { price: 0, originalPrice: null },
      premium: { price: 1500, originalPrice: 3500 },
      pro: { price: 7500, originalPrice: 11000 }
    }
  };

  const features = {
    freemium: [
      '5 connection requests per month',
      '10 messages per day',
      'Basic profile visibility',
      'View 30 profiles per day',
      'Ads included'
    ],
    premium: [
      'Unlimited connection requests',
      'Unlimited messages',
      'Enhanced profile visibility',
      'Video calling: Yes',
      'View unlimited profiles',
      'Ad-free experience',
      'Priority customer support'
    ],
    pro: [
      'All Premium features',
      'Advanced search filters',
      'Profile boost (appear first)',
      'See who liked your profile',
      'Unlimited video calls',
      'Dedicated relationship advisor',
      'Priority matching algorithm'
    ]
  };

  const handlePlanSelect = (plan: keyof Omit<PricingData, 'symbol'>) => {
    const planData = pricingData[currency][plan];
    if (onPlanSelect) {
      onPlanSelect(plan, currency, planData.price);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Currency Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={currency === 'GBP' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrency('GBP')}
            className="rounded-md"
          >
            International (£)
          </Button>
          <Button
            variant={currency === 'NGN' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrency('NGN')}
            className="rounded-md"
          >
            Nigeria (₦)
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Freemium Plan */}
        <Card className="relative">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Freemium</CardTitle>
            <div className="text-3xl font-bold">
              {pricingData[currency].symbol}{pricingData[currency].freemium.price}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Perfect to get started</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.freemium.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handlePlanSelect('freemium')}
            >
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-primary">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Premium</CardTitle>
            <div className="text-3xl font-bold">
              {pricingData[currency].symbol}{pricingData[currency].premium.price}
              {pricingData[currency].premium.originalPrice && (
                <span className="text-lg line-through text-muted-foreground ml-2">
                  ({pricingData[currency].symbol}{pricingData[currency].premium.originalPrice})
                </span>
              )}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Best for serious seekers</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.premium.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              className="w-full"
              onClick={() => handlePlanSelect('premium')}
            >
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Pro</CardTitle>
            <div className="text-3xl font-bold">
              {pricingData[currency].symbol}{pricingData[currency].pro.price}
              {pricingData[currency].pro.originalPrice && (
                <span className="text-lg line-through text-muted-foreground ml-2">
                  ({pricingData[currency].symbol}{pricingData[currency].pro.originalPrice})
                </span>
              )}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">Ultimate experience</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => handlePlanSelect('pro')}
            >
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Promo Notice */}
      <div className="text-center text-sm text-muted-foreground">
        <p>🎉 Limited time offer! Promotional pricing available for early subscribers.</p>
        <p>All plans include secure payment processing and can be cancelled anytime.</p>
      </div>
    </div>
  );
};

export default PricingToggle;
