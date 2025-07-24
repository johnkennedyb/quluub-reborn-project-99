import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart,
  Send,
  Inbox,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { relationshipService, userService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Fragment, useEffect, useContext } from "react";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import Advert from "@/components/Advert";
import UserCard from "@/components/UserCard";

// DashboardTopBar Component - Exact replica of taofeeq_UI
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
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-xl font-bold text-slate-700 mt-1">{number}</p>
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

// DashboardTabs Component - Exact replica of taofeeq_UI
const DashboardTabs = ({
  receivedRequestArray,
  sentRequestArray,
  matchesArray,
  isLoading,
  top,
}: {
  receivedRequestArray: any[];
  sentRequestArray: any[];
  matchesArray: any[];
  isLoading: boolean;
  top: number;
}) => {
  const [value, setValue] = useState("matches");
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768; // Simple mobile detection

  useEffect(() => {
    const tabValues = ["matches", "received", "sent"];
    setValue(tabValues[top] || "matches");
  }, [top]);

  const EmptyState = ({ description }: { description: string }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-gray-400 mb-2">
        <Heart className="w-12 h-12" />
      </div>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );

  const UserList = ({ users }: { users: any[] }) => (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {users.map((user) => (
        <div key={JSON.stringify(user)} className="p-2">
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Desktop Tabs */}
      <div className="hidden sm:block">
        <Card>
          <CardContent className="p-0">
            <Tabs value={value} onValueChange={setValue} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="matches">
                  Matches ({matchesArray?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="received">
                  Received Requests ({receivedRequestArray?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Sent Requests ({sentRequestArray?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="matches" className="mt-0 p-4">
                {matchesArray?.length > 0 ? (
                  <UserList users={matchesArray} />
                ) : (
                  <EmptyState description="No matches yet" />
                )}
              </TabsContent>
              
              <TabsContent value="received" className="mt-0 p-4">
                {receivedRequestArray?.length > 0 ? (
                  <UserList users={receivedRequestArray} />
                ) : (
                  <EmptyState description="No pending received requests yet" />
                )}
              </TabsContent>
              
              <TabsContent value="sent" className="mt-0 p-4">
                {sentRequestArray?.length > 0 ? (
                  <UserList users={sentRequestArray} />
                ) : (
                  <EmptyState description="No pending sent requests yet" />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Accordions */}
      <div className="block sm:hidden space-y-2">
        <Card>
          <CardContent className="p-0">
            <details className="group" open={value === "matches"}>
              <summary className="flex items-center justify-between p-4 cursor-pointer">
                <span className="font-medium">Matches ({matchesArray?.length || 0})</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 max-h-64 overflow-y-auto">
                {matchesArray?.length > 0 ? (
                  <UserList users={matchesArray} />
                ) : (
                  <EmptyState description="No matches yet" />
                )}
              </div>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <details className="group" open={value === "received"}>
              <summary className="flex items-center justify-between p-4 cursor-pointer">
                <span className="font-medium">Received Requests ({receivedRequestArray?.length || 0})</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 max-h-64 overflow-y-auto">
                {receivedRequestArray?.length > 0 ? (
                  <UserList users={receivedRequestArray} />
                ) : (
                  <EmptyState description="No pending received requests yet" />
                )}
              </div>
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <details className="group" open={value === "sent"}>
              <summary className="flex items-center justify-between p-4 cursor-pointer">
                <span className="font-medium">Sent Requests ({sentRequestArray?.length || 0})</span>
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 max-h-64 overflow-y-auto">
                {sentRequestArray?.length > 0 ? (
                  <UserList users={sentRequestArray} />
                ) : (
                  <EmptyState description="No pending sent requests yet" />
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// DashboardFeeds Component - Exact replica of taofeeq_UI
const DashboardFeeds = ({ feed }: { feed: any[] }) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        padding: "10px",
      }}
    >
      <Stack direction={"row"} justifyContent={"space-between"}>
        <Box>
          <Typography
            component="strong"
            sx={{
              textTransform: "capitalize",
              fontWeight: "bold",
              color: "#545e6f",
            }}
          >
            Feed
          </Typography>
          <Typography variant="caption" display="block">
            Recent information you may find useful
          </Typography>
        </Box>
        <Button onClick={() => navigate("/notifications")} size="small">
          See all
        </Button>
      </Stack>

      {feed?.length < 1 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={"Nothing here yet"}
          style={{ marginTop: "150px", height: "35vh" }}
        />
      ) : (
        <List
          sx={{
            height: "61vh",
            overflow: "auto",
            scrollbarWidth: "none",
          }}
        >
          {feed?.map((item, index, arr) => (
            <Fragment
              key={`${item.username}${item.type}${item.timestamp}${index}`}
            >
              <ListItem>
                {/* FeedCard component would go here - using placeholder for now */}
                <div>{item.content || "Feed item"}</div>
              </ListItem>
              {index !== arr?.length - 1 && (
                <Divider variant="fullWidth" sx={{ margin: "5px" }} />
              )}
            </Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

// CustomTabPanel Component - Exact replica of taofeeq_UI
function CustomTabPanel(props: any) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        height: "63.25vh",
        overflow: "auto",
        scrollbarWidth: "none",
      }}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

// Main Dashboard Component - Exact replica of taofeeq_UI Home.jsx
const DashboardExact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [top, setTop] = useState(0);

  // Exact same query structure as taofeeq_UI
  const { isLoading, data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        // Fetch matches data
        const matchesData = await relationshipService.getMatches();
        
        // Fetch pending requests (received)
        const pendingData = await relationshipService.getPendingRequests();
        
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
            count: 0, // Would come from sent requests endpoint
            percentageDifference: mockPercentageDifference(),
            sentUsers: [] // Would come from sent requests endpoint
          },
          views: {
            count: profileViewsResponse?.count || 0,
            percentageDifference: mockPercentageDifference()
          },
          feed: [] // Would come from feed endpoint
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

  // Exact same topBar structure as taofeeq_UI
  const topBar = isLoading
    ? []
    : [
        {
          title: "Matches",
          number: data?.matches?.count,
          stats: data?.matches?.percentageDifference,
          icon: <JoinInnerIcon color="primary" />,
          color: "#008080",
        },
        {
          title: "Received Requests",
          number: data?.received?.count,
          stats: data?.received?.percentageDifference,
          icon: <MoveToInboxIcon color="secondary" />,
          color: "#9c27b0",
        },
        {
          title: "Sent Requests",
          number: data?.sent?.count,
          stats: data?.sent?.percentageDifference,
          icon: (
            <SendIcon
              sx={{
                color: "#1976d2",
              }}
            />
          ),
          color: "#1976d2",
        },
        {
          title: "Profile Views",
          number: data?.views?.count,
          stats: data?.views?.percentageDifference,
          icon: <VisibilityIcon sx={{ color: pink[500] }} />,
          color: "#e91e63",
        },
      ];

  // Exact same return structure as taofeeq_UI Home.jsx
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <div className="container mx-auto px-4 py-6 pb-20">
        {isLoading ? (
          <Skeleton active />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <DashboardTopBar topBar={topBar} setTop={setTop} />
            <Advert />

            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <DashboardTabs
                  receivedRequestArray={
                    isLoading ? [] : data?.received?.receivedUsers
                  }
                  sentRequestArray={isLoading ? [] : data?.sent?.sentUsers}
                  matchesArray={isLoading ? [] : data?.matches?.matchedUsers}
                  isLoading={isLoading}
                  top={top}
                />
              </Col>
              <Col xs={24} sm={8}>
                <DashboardFeeds feed={isLoading ? [] : data?.feed} />
              </Col>
            </Row>
          </div>
        )}
      </div>
      <Navbar />
    </div>
  );
};

export default DashboardExact;
