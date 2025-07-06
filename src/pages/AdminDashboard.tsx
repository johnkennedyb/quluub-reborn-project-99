
import React, { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Loader2, Users, BarChart3, Mail, Settings, Phone, CreditCard, Wallet, Heart, UserCheck, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-xl md:text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4 text-sm md:text-base">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const tabItems = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'members', label: 'Members', icon: Users },
    { value: 'insights', label: 'Insights', icon: BarChart3 },
    { value: 'communication', label: 'Email', icon: Mail },
    { value: 'calls', label: 'Calls', icon: Phone },
    { value: 'reported', label: 'Reported', icon: Settings },
    { value: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { value: 'payments', label: 'Payments', icon: Wallet },
    { value: 'suggestions', label: 'Matches', icon: Heart },
    { value: 'referrals', label: 'Referrals', icon: UserCheck }
  ];

  const TabNavigation = () => (
    <div className="space-y-2">
      {tabItems.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => {
            setActiveTab(value);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
            activeTab === value
              ? 'bg-red-100 text-red-700 font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {isMobile && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <SheetHeader>
                      <SheetTitle>Admin Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <TabNavigation />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-600">Welcome back, {adminUser?.fname} {adminUser?.lname}</p>
              </div>
            </div>
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={adminLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation */}
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-1">
              {tabItems.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="flex items-center space-x-1 text-xs lg:text-sm">
                  <Icon className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inactive User Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">1 Month Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">3 Months Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveQuarter || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">6 Months Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveSixMonths || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">1 Year Inactive:</span>
                    <span className="font-semibold">{stats?.inactiveYear || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Match Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Matches:</span>
                    <span className="font-semibold">{stats?.totalMatches || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate:</span>
                    <span className="font-semibold">{stats?.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg per User:</span>
                    <span className="font-semibold">{stats?.avgMatchesPerUser || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Growth Rate:</span>
                    <span className="font-semibold">{stats?.growthRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Churn Rate:</span>
                    <span className="font-semibold">{stats?.churnRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Engagement Rate:</span>
                    <span className="font-semibold">{stats?.engagementRate || 0}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('members')}
                    className="h-16 md:h-20 flex flex-col items-center justify-center"
                  >
                    <Users className="h-5 w-5 md:h-6 md:w-6 mb-1 md:mb-2" />
                    <span className="text-sm">Manage Members</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('insights')}
                    className="h-16 md:h-20 flex flex-col items-center justify-center"
                  >
                    <BarChart3 className="h-5 w-5 md:h-6 md:w-6 mb-1 md:mb-2" />
                    <span className="text-sm">View Insights</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab('suggestions')}
                    className="h-16 md:h-20 flex flex-col items-center justify-center"
                  >
                    <Heart className="h-5 w-5 md:h-6 md:w-6 mb-1 md:mb-2" />
                    <span className="text-sm">Match Suggestions</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <MemberManagement stats={stats} />
          </TabsContent>

          <TabsContent value="insights">
            <DashboardInsights stats={stats} />
          </TabsContent>

          <TabsContent value="communication">
            <EmailConfiguration />
          </TabsContent>

          <TabsContent value="calls">
            <Card>
              <CardHeader>
                <CardTitle>Video Call Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">{calls?.length || 0}</div>
                      <div className="text-xs md:text-sm text-gray-600">Total Calls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">5</div>
                      <div className="text-xs md:text-sm text-gray-600">Min Limit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">100%</div>
                      <div className="text-xs md:text-sm text-gray-600">Recorded</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">24h</div>
                      <div className="text-xs md:text-sm text-gray-600">Avg Response</div>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm md:text-base">
                      All video calls are automatically recorded and sent to parent/wali emails.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reported">
            <ReportedProfiles />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionOverview />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="suggestions">
            <SuggestedMatches />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralAnalysis />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
