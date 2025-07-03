
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
}

const StatsCard = ({ title, value, description, icon }: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

interface DatabaseStatsProps {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  unreadMessages: number;
}

export const DatabaseStats = ({
  totalUsers,
  activeUsers,
  totalMatches,
  unreadMessages
}: DatabaseStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard title="Total Users" value={totalUsers} description="Registered accounts" />
      <StatsCard title="Active Users" value={activeUsers} description="Active in last 30 days" />
      <StatsCard title="Total Matches" value={totalMatches} description="Successful connections" />
      <StatsCard title="Unread Messages" value={unreadMessages} description="Pending communications" />
    </div>
  );
};
