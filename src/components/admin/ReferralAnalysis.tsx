
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Gift } from 'lucide-react';

const ReferralAnalysis = () => {
  const { stats, loading } = useAdminData();

  if (loading) return <div>Loading referral data...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topReferrers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users with active referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.freeToProConversions || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Referral to premium conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>Users with the most successful referrals and bonuses earned.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Total Referrals</TableHead>
                <TableHead>Active Referrals</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Bonus Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.topReferrers && stats.topReferrers.length > 0 ? (
                stats.topReferrers.map((referrer: any) => (
                  <TableRow key={referrer._id}>
                    <TableCell>
                      <div className="font-medium">{referrer.fname} {referrer.lname}</div>
                      <div className="text-sm text-muted-foreground">@{referrer.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{referrer.totalReferrals}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{referrer.activeReferrals}</Badge>
                    </TableCell>
                    <TableCell>
                      {referrer.totalReferrals > 0 
                        ? Math.round((referrer.activeReferrals / referrer.totalReferrals) * 100)
                        : 0}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={referrer.activeReferrals >= 5 ? 'default' : 'secondary'}>
                        {referrer.activeReferrals >= 5 ? 'Bonus Eligible' : 'No Bonus'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No referral data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralAnalysis;
