
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Gift, TrendingUp, Award } from 'lucide-react';

interface ReferralData {
  userId: string;
  userName: string;
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  premiumMonthsEarned: number;
  referralStatus: string;
}

const ReferralAnalysis = () => {
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/referrals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setReferralData(data.referrals || []);
      } else {
        throw new Error(data.message || 'Failed to fetch referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load referral data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePremiumMonths = (completedReferrals: number) => {
    return Math.floor(completedReferrals / 5); // 5 referrals = 1 month premium
  };

  const getTotalStats = () => {
    return referralData.reduce(
      (acc, user) => ({
        totalUsers: acc.totalUsers + 1,
        totalReferrals: acc.totalReferrals + user.totalReferrals,
        completedReferrals: acc.completedReferrals + user.completedReferrals,
        premiumMonthsEarned: acc.premiumMonthsEarned + calculatePremiumMonths(user.completedReferrals),
      }),
      { totalUsers: 0, totalReferrals: 0, completedReferrals: 0, premiumMonthsEarned: 0 }
    );
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Active Referrers</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Completed Referrals</p>
                <p className="text-2xl font-bold">{stats.completedReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Premium Months Earned</p>
                <p className="text-2xl font-bold">{stats.premiumMonthsEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Details */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Users earn 1 month of premium for every 5 successful referrals
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referralData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No referral data available
              </p>
            ) : (
              referralData.map((user) => {
                const premiumMonths = calculatePremiumMonths(user.completedReferrals);
                const progressToNext = user.completedReferrals % 5;
                const neededForNext = 5 - progressToNext;
                
                return (
                  <div key={user.userId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{user.userName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {user.referralCode}
                        </p>
                      </div>
                      <Badge variant={premiumMonths > 0 ? "default" : "secondary"}>
                        {premiumMonths} months earned
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Referrals</p>
                        <p className="font-medium">{user.totalReferrals}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">{user.completedReferrals}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Premium</p>
                        <p className="font-medium">
                          {progressToNext === 0 && user.completedReferrals > 0 
                            ? "Eligible now!" 
                            : `${neededForNext} more needed`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress bar for next premium month */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress to next premium month</span>
                        <span>{progressToNext}/5</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(progressToNext / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralAnalysis;
