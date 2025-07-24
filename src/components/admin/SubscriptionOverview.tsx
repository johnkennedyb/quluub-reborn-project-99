import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CreditCard, Users, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAdminData } from '@/hooks/useAdminData';
import { useQuery } from '@tanstack/react-query';

interface PremiumUser {
  _id: string;
  fname: string;
  lname: string;
  username: string;
  email: string;
  plan: string;
  createdAt: string;
  paymentInfo: {
    amount: number;
    currency: string;
    status: string;
    transactionId: string;
    paymentDate: string | null;
    plan: string;
    provider: string;
  };
  matchCount: number;
  messageCount: number;
  daysSinceSubscription: number;
}

interface PremiumUsersResponse {
  users: PremiumUser[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const SubscriptionOverview = () => {
  const { loading, stats } = useAdminData();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: premiumUsersData, isLoading: premiumUsersLoading } = useQuery<PremiumUsersResponse>({
    queryKey: ['premiumUsers', currentPage],
    queryFn: async () => {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Admin token not found');
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/premium-users?page=${currentPage}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch premium users');
      }
      return response.json();
    },
  });

  const getPaymentStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'default';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'outline';
      case 'no_payment':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPlanVariant = (plan: string): 'default' | 'secondary' | 'outline' => {
    switch (plan) {
      case 'pro':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'freemium':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading || premiumUsersLoading) return <div>Loading subscription data...</div>;

  const premiumUsers = premiumUsersData?.users || [];
  const pagination = premiumUsersData?.pagination;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumMembers + stats?.proMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total premium and pro users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Including Pro members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Free to premium conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Users & Payment Details</CardTitle>
          <CardDescription>View premium users with their payment information and activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Payment Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {premiumUsers.length > 0 ? (
                premiumUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="font-medium">{user.fname} {user.lname}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPlanVariant(user.plan)}>{user.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {user.paymentInfo.amount > 0 
                          ? `${user.paymentInfo.currency} ${user.paymentInfo.amount.toFixed(2)}`
                          : 'No Payment'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">{user.paymentInfo.provider}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentStatusVariant(user.paymentInfo.status)}>
                        {user.paymentInfo.status === 'no_payment' ? 'No Payment' : user.paymentInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.paymentInfo.paymentDate 
                        ? format(new Date(user.paymentInfo.paymentDate), 'PPP')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {user.paymentInfo.transactionId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.matchCount} matches</div>
                        <div className="text-muted-foreground">{user.messageCount} messages</div>
                        <div className="text-xs text-muted-foreground">{user.daysSinceSubscription} days</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No premium users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * limit) + 1} to {Math.min(pagination.currentPage * limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionOverview;
