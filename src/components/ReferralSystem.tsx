import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Copy, Check, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  premiumMonthsEarned: number;
  referralLink: string;
}

const ReferralSystem = () => {
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: '',
    totalReferrals: 0,
    completedReferrals: 0,
    premiumMonthsEarned: 0,
    referralLink: ''
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: ReferralData = {
        referralCode: user?.username ? `${user.username.toUpperCase()}REF` : 'USERREF',
        totalReferrals: 7,
        completedReferrals: 6,
        premiumMonthsEarned: Math.floor(6 / 5), // 5 referrals = 1 month
        referralLink: `${window.location.origin}/signup?ref=${user?.username || 'user'}`
      };
      setReferralData(mockData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Referral link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: 'Copied!',
        description: 'Referral code copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive'
      });
    }
  };

  const progressToNext = referralData.completedReferrals % 5;
  const progressPercentage = (progressToNext / 5) * 100;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Invite Friends & Get Premium Free
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get 1 month of premium for every 5 successful referrals
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress to next reward</span>
              <span className="text-sm text-muted-foreground">
                {progressToNext}/5 referrals
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {5 - progressToNext} more {5 - progressToNext === 1 ? 'referral' : 'referrals'} needed for 1 month premium
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{referralData.totalReferrals}</div>
              <div className="text-xs text-muted-foreground">Total Invites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{referralData.completedReferrals}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{referralData.premiumMonthsEarned}</div>
              <div className="text-xs text-muted-foreground">Months Earned</div>
            </div>
          </div>

          {/* Earned Premium */}
          {referralData.premiumMonthsEarned > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Premium Earned!</span>
              </div>
              <p className="text-sm text-purple-700">
                You've earned {referralData.premiumMonthsEarned} month{referralData.premiumMonthsEarned !== 1 ? 's' : ''} of premium access through referrals!
              </p>
            </div>
          )}

          {/* Referral Code Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Your Referral Code</label>
            <div className="flex gap-2">
              <Input
                value={referralData.referralCode}
                readOnly
                className="bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyReferralCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Referral Link Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Share Your Link</label>
            <div className="flex gap-2">
              <Input
                value={referralData.referralLink}
                readOnly
                className="bg-muted text-xs"
              />
              <Button
                variant="outline"
                onClick={copyReferralLink}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Share Your Link</h4>
                <p className="text-sm text-muted-foreground">
                  Send your referral link to friends or family who might be interested in finding their spouse
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">They Sign Up</h4>
                <p className="text-sm text-muted-foreground">
                  When someone joins using your link, they get registered as your referral
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">You Both Benefit</h4>
                <p className="text-sm text-muted-foreground">
                  For every 5 successful referrals, you get 1 month of premium access completely free!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;