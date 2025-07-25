import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import Advert from "@/components/Advert";
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
const DashboardTopBar = ({ topBar, setTop }: { topBar: any[], setTop: (index: number) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {topBar.map(({ icon, number, title, stats, color }, index, arr) => (
        <Card
          key={title}
          className="cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderLeft: `3px solid ${color}` }}
          onClick={() =>
            index === arr.length - 1
              ? navigate("/notifications")
              : setTop(index)
          }
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

const DashboardTabs = ({ 
  receivedRequestArray, 
  sentRequestArray, 
  matchesArray, 
  favoritesArray,
  isLoading, 
  top 
}: {
  receivedRequestArray: any[];
  sentRequestArray: any[];
  matchesArray: any[];
  favoritesArray: any[];
  isLoading: boolean;
  top: number;
}) => {
  const navigate = useNavigate();
  const tabData = [
    { title: "Matches", data: matchesArray },
    { title: "Received Requests", data: receivedRequestArray },
    { title: "Sent Requests", data: sentRequestArray }
  ];

  const currentTab = tabData[top];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {tabData.map((tab, index) => (
            <button
              key={tab.title}
              onClick={() => window.dispatchEvent(new CustomEvent('dashboardTabChange', { detail: index }))}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                index === top
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.title.toUpperCase()} ({tab.data.length})
            </button>
          ))}
        </div>
        
        <h3 className="text-lg font-semibold mb-4">{currentTab.title}</h3>
        {currentTab.data.length > 0 ? (
          <div className="space-y-4">
            {currentTab.data.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {item.profileImage ? (
                    <img 
                      src={item.profileImage} 
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-gray-600">
                      {item.fname?.charAt(0) || item.name?.charAt(0) || item.firstName?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name || `${item.fname} ${item.lname}` || `${item.firstName} ${item.lastName}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.age && `${item.age} years old`}
                    {item.location && ` • ${item.location}`}
                  </p>
                </div>
                {/* Chat button for matches only */}
                {currentTab.title === "Matches" && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/messages?user=${item._id}`)}
                    className="ml-2"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">Nothing here yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardFeeds = ({ feed }: { feed: any[] }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'request':
        return <Send className="w-4 h-4 text-purple-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-green-500" />;
      case 'match':
        return <Heart className="w-4 h-4 text-red-500" />;
      default:
        return <Heart className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Feed</h3>
          <button className="text-primary text-sm font-medium hover:underline">
            SEE ALL
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Recent information you may find useful
        </p>
        
        {feed.length > 0 ? (
          <div className="space-y-3">
            {feed.slice(0, 10).map((item, index) => (
              <div key={item.id || index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  {item.user?.profile_pic ? (
                    <img 
                      src={item.user.profile_pic} 
                      alt={item.user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-600">
                        {item.user?.username?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    <p className="text-sm text-gray-900">{item.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your activity feed will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [top, setTop] = useState(0);

  // Fetch dashboard data matching taofeeq_UI structure
  const { isLoading, data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        // Fetch matches data
        const matchesData = await relationshipService.getMatches();
        
        // Fetch pending requests (received)
        const pendingData = await relationshipService.getPendingRequests();
        
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
            count: profileViewsResponse?.count || 0,
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
    },
  });

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
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Email validation alert */}
        {showValidationAlert && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              Please verify your email address to access all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Task #11: Show first name at top of page */}
        {user?.fname && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Hello, {user.fname}!</h1>
          </div>
        )}

        {/* Top Bar Stats */}
        <div className="mb-6">
          <DashboardTopBar topBar={topBar} setTop={setTop} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tabs */}
          <div className="lg:col-span-2">
            <DashboardTabs
              receivedRequestArray={data?.received?.receivedUsers || []}
              sentRequestArray={data?.sent?.sentUsers || []}
              matchesArray={data?.matches?.matchedUsers || []}
              favoritesArray={data?.favorites?.favoriteUsers || []}
              isLoading={isLoading}
              top={top}
            />
          </div>

          {/* Right Column - Feed and Ads */}
          <div className="space-y-6">
            <DashboardFeeds feed={data?.feed || []} />
            <Advert />
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Dashboard;
