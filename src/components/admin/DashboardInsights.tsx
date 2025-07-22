
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Mail, User } from 'lucide-react';

interface DashboardInsightsProps {
  stats: any;
}

const DashboardInsights = ({ stats }: DashboardInsightsProps) => {
  if (!stats) return <div>Loading insights...</div>;

    const formatNumber = (num: number | null | undefined): string => {
    if (typeof num !== 'number') {
      return '0';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalMatches} total matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match to Chat Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matchToChatRate}%</div>
            <Progress value={stats.matchToChatRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Matches that lead to conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <Progress value={stats.engagementRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Active users this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <Progress value={stats.conversionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Free to premium upgrades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Today</span>
              <Badge variant="default">{formatNumber(stats.activeToday)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active This Week</span>
              <Badge variant="secondary">{formatNumber(stats.activeThisWeek)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active This Month</span>
              <Badge variant="outline">{formatNumber(stats.activeThisMonth)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Inactive (1 month)</span>
              <Badge variant="destructive">{formatNumber(stats.inactiveUsers)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Inactive (3 months)</span>
              <Badge variant="destructive">{formatNumber(stats.inactiveQuarter)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Inactive (1 year)</span>
              <Badge variant="destructive">{formatNumber(stats.inactiveYear)}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium">Churn Rate: {stats.churnRate}%</div>
              <Progress value={stats.churnRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">New This Week</span>
              <Badge variant="default">{formatNumber(stats.recentRegistrations)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New This Month</span>
              <Badge variant="secondary">{formatNumber(stats.monthlyRegistrations)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Premium Upgrades</span>
              <Badge variant="outline">{formatNumber(stats.freeToProConversions)}</Badge>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium">Growth Rate: {stats.growthRate}%</div>
              <Progress value={stats.growthRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Inactivity */}
      <Card>
        <CardHeader>
          <CardTitle>User Inactivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Inactive {'>'} 1 Month</span>
            <Badge variant="secondary">{formatNumber(stats.inactiveUsers || 0)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Inactive {'>'} 3 Months</span>
            <Badge variant="secondary">{formatNumber(stats.inactiveQuarter || 0)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Inactive {'>'} 6 Months</span>
            <Badge variant="secondary">{formatNumber(stats.inactiveSixMonths || 0)}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Inactive {'>'} 1 Year</span>
            <Badge variant="secondary">{formatNumber(stats.inactiveYear || 0)}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{formatNumber(stats.messagesExchanged)}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{formatNumber(stats.messagesThisWeek)}</div>
              <div className="text-sm text-gray-600">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{formatNumber(stats.messagesThisMonth)}</div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      {stats.geographicDistribution && stats.geographicDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.geographicDistribution.slice(0, 5).map((country: any, index: number) => (
                <div key={country.country} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{country.country}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(country.count / stats.totalMembers) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{country.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Referrers */}
      {stats.topReferrers && stats.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topReferrers.slice(0, 5).map((referrer: any, index: number) => (
                <div key={referrer._id} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">{referrer.fname} {referrer.lname}</span>
                    <span className="text-xs text-gray-500 ml-2">@{referrer.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{referrer.totalReferrals} referrals</div>
                    <div className="text-xs text-green-600 font-semibold">
                      Bonus: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(referrer.bonusReceived || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardInsights;
