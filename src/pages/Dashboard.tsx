import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import Advert from "@/components/Advert";
import DashboardFeeds from "@/components/DashboardFeeds";
import DashboardTabs from "@/components/DashboardTabs";
import { useAuth } from "@/contexts/AuthContext";
import { relationshipService, userService, feedService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  Heart, 
  Send, 
  Inbox, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MessageCircle 
} from "lucide-react";

// Dashboard components matching taofeeq_UI structure
const DashboardTopBar = ({ topBar }: { topBar: any[] }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {topBar.map(({ icon, number, title, stats, color }, index, arr) => (
        <Card
          key={title}
          className="cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderLeft: `3px solid ${color}` }}
          onClick={() => {
            if (index === arr.length - 1) {
              navigate("/notifications");
            }
            // The setTop functionality is removed as it's no longer needed
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{number}</p>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex items-center gap-1 text-xs">
                  <span 
                    className={`flex items-center font-semibold ${
                      stats === 0 ? 'text-gray-500' : stats > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stats === 0 ? (
                      <Minus className="w-3 h-3 mr-1" />
                    ) : stats > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stats)}%
                  </span>
                  <span className="text-muted-foreground">this week</span>
                </div>
              </div>
              <div className="text-primary">
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};



const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [feedPage, setFeedPage] = useState(1);
  const [allFeedItems, setAllFeedItems] = useState([]);
  const [feedHasMore, setFeedHasMore] = useState(false);

  // Fetch dashboard data matching taofeeq_UI structure
  const { isLoading, data } = useQuery<{
    matches: { count: number; percentageDifference: number; matchedUsers: any[] };
    received: { count: number; percentageDifference: number; receivedUsers: any[] };
    sent: { count: number; percentageDifference: number; sentUsers: any[] };
    views: { count: number; percentageDifference: number };
    favorites: { count: number; percentageDifference: number; favoriteUsers: any[] };
    feed: any[];
  }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        // Fetch matches data
        const matchesData = await relationshipService.getMatches();
        
        // Fetch pending requests (received)
        const pendingData = await relationshipService.getPendingRequests();
        console.log('Pending requests data:', pendingData);
        
        // Task #25: Fetch sent requests
        const sentData = await relationshipService.getSentRequests();
        
        // Task #30: Fetch feed data
        const feedData = await feedService.getFeed();
        
        // Fetch profile views
        const profileViewsResponse = await userService.getProfileViewsCount();
        
        // Fetch favorites
        const favoritesData = await userService.getFavorites();
        
        // Gender-based filtering
        const userGender = user?.gender;
        const oppositeGenderMatches = matchesData?.matches?.filter(match => match.gender !== userGender) || [];
        
        // Mock percentage differences for now (would come from backend in real implementation)
        const mockPercentageDifference = () => Math.floor(Math.random() * 21) - 10; // -10 to +10
        
        return {
          matches: {
            count: oppositeGenderMatches.length,
            percentageDifference: mockPercentageDifference(),
            matchedUsers: oppositeGenderMatches
          },
          received: {
            count: pendingData?.requests?.length || 0,
            percentageDifference: mockPercentageDifference(),
            receivedUsers: pendingData?.requests || []
          },
          sent: {
            count: sentData?.requests?.length || 0,
            percentageDifference: mockPercentageDifference(),
            sentUsers: sentData?.requests || []
          },
          views: {
            count: profileViewsResponse?.profileViews || 0,
            percentageDifference: mockPercentageDifference()
          },
          favorites: {
            count: favoritesData?.favorites?.length || 0,
            percentageDifference: mockPercentageDifference(),
            favoriteUsers: favoritesData?.favorites || []
          },
          feed: feedData?.data?.feed || feedData?.data || []
        };
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        toast({
          title: "Error",
          description: "Failed to fetch your dashboard data",
          variant: "destructive",
        });
        throw err;
      }
    }
  });

  // Initialize feed state when data is loaded
  useEffect(() => {
    if (data?.feed) {
      setAllFeedItems(data.feed);
      setFeedHasMore(false); // No pagination support in current API
    }
  }, [data?.feed]);

  // Load more feed items (simplified for existing API)
  const handleLoadMoreFeed = async () => {
    try {
      const feedData = await feedService.getFeed();
      
      // For now, just refresh the feed since the existing API doesn't support pagination
      const feedItems = feedData?.data?.feed || feedData?.data || [];
      setAllFeedItems(feedItems);
      setFeedHasMore(false); // No pagination support in current API
    } catch (error) {
      console.error('Error loading more feed items:', error);
      toast({
        title: "Error",
        description: "Failed to load more feed items",
        variant: "destructive",
      });
    }
  };

  // Create topBar data matching taofeeq_UI structure
  const topBar = isLoading
    ? []
    : [
        {
          title: "Matches",
          number: data?.matches?.count || 0,
          stats: data?.matches?.percentageDifference || 0,
          icon: <Heart className="w-6 h-6" />,
          color: "#008080",
        },
        {
          title: "Received Requests",
          number: data?.received?.count || 0,
          stats: data?.received?.percentageDifference || 0,
          icon: <Inbox className="w-6 h-6" />,
          color: "#9c27b0",
        },
        {
          title: "Sent Requests",
          number: data?.sent?.count || 0,
          stats: data?.sent?.percentageDifference || 0,
          icon: <Send className="w-6 h-6" />,
          color: "#1976d2",
        },
        {
          title: "Profile Views",
          number: data?.views?.count || 0,
          stats: data?.views?.percentageDifference || 0,
          icon: <Eye className="w-6 h-6" />,
          color: "#e91e63",
        },
        {
          title: "Favorites",
          number: data?.favorites?.count || 0,
          stats: data?.favorites?.percentageDifference || 0,
          icon: <Heart className="w-6 h-6" />,
          color: "#ff5722",
        },
      ];

  // Show validation alert if email not verified
  const showValidationAlert = user && !user.emailVerified;

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container mx-auto px-4 py-6" style={{paddingBottom: '200px'}}>
        {/* Email validation alert */}
        

        {/* Task #11: Show first name at top of page */}
        {user?.fname && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Hello, {user.fname}!</h1>
          </div>
        )}

        {/* Top Bar Stats */}
        <div className="mb-6">
          <DashboardTopBar topBar={topBar} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardTabs 
              receivedRequestArray={data?.received?.receivedUsers || []}
              sentRequestArray={data?.sent?.sentUsers || []}
              matchesArray={data?.matches?.matchedUsers || []}
              favoritesArray={data?.favorites?.favoriteUsers || []}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Feed and Ads */}
          <div className="space-y-6">
            <DashboardFeeds 
              feed={allFeedItems} 
              isLoading={isLoading}
              onLoadMore={handleLoadMoreFeed}
              hasMore={feedHasMore}
            />
            <Advert />
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Dashboard;
