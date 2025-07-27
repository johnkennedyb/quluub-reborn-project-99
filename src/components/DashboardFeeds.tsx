import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const DashboardFeeds: React.FC<DashboardFeedsProps> = ({ feed, isLoading = false, onLoadMore, hasMore = false }) => {
  const [showAll, setShowAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Show only first 5 items initially, unless showAll is true
  const displayedFeed = showAll ? feed : feed.slice(0, 5);
  const hasHiddenItems = feed.length > 5;
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

  const handleLoadMore = async () => {
    if (onLoadMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displayedFeed.map((item, index) => (
              <div key={item.id || index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                    {getFeedIcon(item.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Badge className={getFeedColor(item.type)}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {moment(item.timestamp).fromNow()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mt-1">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Show More/Less Button */}
            {hasHiddenItems && (
              <div className="flex justify-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShowAll}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      See More ({feed.length - 5} more)
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Load More Button (for pagination) */}
            {showAll && hasMore && (
              <div className="flex justify-center pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Activities'}
                </Button>
              </div>
            )}
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
