import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  isLoading, 
  top 
}: {
  receivedRequestArray: any[];
  sentRequestArray: any[];
  matchesArray: any[];
  isLoading: boolean;
  top: number;
}) => {
  const navigate = useNavigate();
  
  const tabData = [
    { title: "Matches", data: matchesArray },
    { title: "Received Requests", data: receivedRequestArray },
    { title: "Sent Requests", data: sentRequestArray },
    { title: "Profile Views", data: [] }
  ];

  const currentTab = tabData[top];

  const handleChatClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.conversationId) {
      navigate(`/messages?conversation=${item.conversationId}`);
    } else {
      // If no conversationId, try to navigate with user ID
      navigate(`/messages?user=${item._id || item.id}`);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardContent className="p-6">
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
                      {item.name?.charAt(0) || item.firstName?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name || `${item.firstName} ${item.lastName}`}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.age && `${item.age} years old`}
                    {item.location && ` • ${item.location}`}
                  </p>
                </div>
                {top === 0 && ( // Only show chat button for matches (top === 0)
                  <button
                    onClick={(e) => handleChatClick(item, e)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Chat</span>
                  </button>
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
          <div className="space-y-4">
            {feed.map((item, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="text-sm">{item.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{item.timestamp}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg text-muted-foreground">Nothing here yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardNew = () => {
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
          feed: feedData?.feed || []
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

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-6">
            {/* Dashboard Top Bar */}
            <DashboardTopBar topBar={topBar} setTop={setTop} />
            
            {/* Advertisement */}
            <Advert />

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardTabs
                  receivedRequestArray={data?.received?.receivedUsers || []}
                  sentRequestArray={data?.sent?.sentUsers || []}
                  matchesArray={data?.matches?.matchedUsers || []}
                  isLoading={isLoading}
                  top={top}
                />
              </div>
              <div className="lg:col-span-1">
                <DashboardFeeds feed={data?.feed || []} />
              </div>
            </div>
          </div>
        )}
      </div>
      <Navbar />
    </div>
  );
};

export default DashboardNew;
