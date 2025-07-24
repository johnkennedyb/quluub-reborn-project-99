import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

interface FeedItem {
  id: string;
  type: 'message' | 'view' | 'request' | 'match';
  user?: {
    username: string;
    profile_pic?: string;
  };
  message?: string;
  timestamp: Date | string;
}

interface DashboardFeedsProps {
  feed: FeedItem[];
  isLoading?: boolean;
}

const DashboardFeeds: React.FC<DashboardFeedsProps> = ({ feed, isLoading = false }) => {
  const getFeedIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'view':
        return '👁️';
      case 'request':
        return '🤝';
      case 'match':
        return '💖';
      default:
        return '📢';
    }
  };

  const getFeedTitle = (type: string) => {
    switch (type) {
      case 'message':
        return 'New Message';
      case 'view':
        return 'Profile View';
      case 'request':
        return 'Connection Request';
      case 'match':
        return 'New Match';
      default:
        return 'Activity';
    }
  };

  const getFeedColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 text-blue-800';
      case 'view':
        return 'bg-green-100 text-green-800';
      case 'request':
        return 'bg-purple-100 text-purple-800';
      case 'match':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📰 Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {feed && feed.length > 0 ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-2xl">{getFeedIcon(item.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge className={getFeedColor(item.type)}>
                      {getFeedTitle(item.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {moment(item.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {item.user?.username && `${item.user.username} `}
                    {item.message || `${getFeedTitle(item.type).toLowerCase()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your activity feed will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardFeeds;
