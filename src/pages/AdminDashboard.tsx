import React, { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2, Users, BarChart3, Mail, Settings, Phone, CreditCard, Wallet, Heart, UserCheck } from 'lucide-react';
import MemberManagement from '@/components/admin/MemberManagement';
import ReportedProfiles from '@/components/admin/ReportedProfiles';
import DashboardInsights from '@/components/admin/DashboardInsights';
import SubscriptionOverview from '@/components/admin/SubscriptionOverview';
import PaymentHistory from '@/components/admin/PaymentHistory';
import SuggestedMatches from '@/components/admin/SuggestedMatches';
import ReferralAnalysis from '@/components/admin/ReferralAnalysis';
import EmailConfiguration from '@/components/admin/EmailConfiguration';

const AdminDashboard = () => {
  const { adminUser, adminLogout } = useAdminAuth();
  const { stats, users, calls, loading, error } = useAdminData();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {adminUser?.fname} {adminUser?.lname}</p>
            </div>
            <Button variant="outline" onClick={adminLogout} className="w-full sm:w-auto">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile-responsive tabs */}
          <div className="overflow-x-auto">
            <TabsList className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 w-full min-w-max">
              <TabsTrigger value="overview" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Members</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Insights</span>
                <span className="sm:hidden">Data</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Email</span>
                <span className="sm:hidden">Mail</span>
              </TabsTrigger>
              <TabsTrigger value="calls" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Calls</span>
              </TabsTrigger>
              <TabsTrigger value="reported" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Rep</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Subs</span>
                <span className="sm:hidden">Sub</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Payments</span>
                <span className="sm:hidden">Pay</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Matches</span>
                <span className="sm:hidden">Match</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Referrals</span>
                <span className="sm:hidden">Ref</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.recentRegistrations || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.inactiveUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.inactiveSixMonths || 0} inactive 6+ months
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.premiumMembers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.conversionRate || 0}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages Exchanged</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.messagesExchanged || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.messagesThisWeek || 0} this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics - Mobile responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inactive User Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>1 Month Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3 Months Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveQuarter || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>6 Months Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveSixMonths || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1 Year Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveYear || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Matches:</span>
                    <span className="font-semibold">{stats?.totalMatches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold">{stats?.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg per User:</span>
                    <span className="font-semibold">{stats?.avgMatchesPerUser || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Growth Rate:</span>
                    <span className="font-semibold">{stats?.growthRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn Rate:</span>
                    <span className="font-semibold">{stats?.churnRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engagement Rate:</span>
                    <span className="font-semibold">{stats?.engagementRate || 0}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Mobile responsive */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('members')}
                    className="h-16 sm:h-20 flex flex-col items-center justify-center"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    Manage Members
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('insights')}
                    className="h-16 sm:h-20 flex flex-col items-center justify-center"
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Insights
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('suggestions')}
                    className="h-16 sm:h-20 flex flex-col items-center justify-center"
                  >
                    <Heart className="h-6 w-6 mb-2" />
                    Match Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MemberManagement stats={stats} />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <DashboardInsights stats={stats} />
          </TabsContent>

          {/* Communication Tab - Now with Email Configuration */}
          <TabsContent value="communication">
            <EmailConfiguration />
          </TabsContent>

          {/* Calls Tab */}
          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Video Call Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">{calls?.length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">5</div>
                      <div className="text-xs sm:text-sm text-gray-600">Min Limit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">100%</div>
                      <div className="text-xs sm:text-sm text-gray-600">Recorded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">24h</div>
                      <div className="text-xs sm:text-sm text-gray-600">Avg Response</div>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <p className="text-sm sm:text-base text-gray-500">
                      All video calls are automatically recorded and sent to parent/wali emails.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reported Tab */}
          <TabsContent value="reported">
            <ReportedProfiles />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <SubscriptionOverview />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentHistory />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <SuggestedMatches />
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <ReferralAnalysis />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
