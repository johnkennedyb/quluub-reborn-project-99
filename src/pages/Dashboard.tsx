import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from "@/types/user";
import { DatabaseStats } from "@/components/DatabaseStats";
import { Heart, User as UserIcon, ArrowRight, MessageSquare, Star, UserCheck, UserX } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
// at the top of Dashboard.tsx
import { relationshipService, chatService, userService, emailService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { calculateAge } from "@/utils/dataUtils";
// import { calculateAge } from "@/utils/dataUtils";

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("matches");
  const [stats, setStats] = useState({
    matches: 0,
    favorites: 0,
    receivedRequests: 0,
    sentRequests: 0,
    profileViews: 0
  });
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [receivedRequestsList, setReceivedRequestsList] = useState<any[]>([]);
  const [sentRequestsList, setSentRequestsList] = useState<any[]>([]);
  
  // Fetch relationship stats from the backend
  const { data: relationshipData, isLoading, error, refetch } = useQuery({
    queryKey: ['relationships'],
    queryFn: async () => {
      try {
        // Fetch matches data
        const matchesData = await relationshipService.getMatches();
        
        // Fetch pending requests (received)
        const pendingData = await relationshipService.getPendingRequests();
        
        // Fetch favorites
        const favoritesData = await userService.getFavorites();
        
        // Get unread messages count
        const unreadCount = await chatService.getUnreadCount();
        
        return {
          matches: matchesData?.matches?.length || 0,
          favorites: favoritesData?.favorites?.length || 0,
          receivedRequests: pendingData?.requests?.length || 0,
          sentRequests: 0, // This would need a separate endpoint if available
          profileViews: 0, // This would need a separate endpoint if available
          unreadMessages: unreadCount || 0,
          matchesList: matchesData?.matches || [],
          favoritesList: favoritesData?.favorites || [],
          receivedRequestsList: pendingData?.requests || [],
          sentRequestsList: [] // This would come from sent requests endpoint
        };
      } catch (err) {
        console.error("Failed to fetch relationship data:", err);
        toast({
          title: "Error",
          description: "Failed to fetch your dashboard data",
          variant: "destructive",
        });
        return {
          matches: 0,
          favorites: 0,
          receivedRequests: 0,
          sentRequests: 0,
          profileViews: 0,
          unreadMessages: 0,
          matchesList: [],
          favoritesList: [],
          receivedRequestsList: [],
          sentRequestsList: []
        };
      }
    },
    enabled: !!user,
  });
  
  // Update stats when data is loaded
  useEffect(() => {
    if (relationshipData) {
      setStats({
        matches: relationshipData.matches,
        favorites: relationshipData.favorites,
        receivedRequests: relationshipData.receivedRequests,
        sentRequests: relationshipData.sentRequests,
        profileViews: relationshipData.profileViews
      });
      setMatchesList(relationshipData.matchesList);
      setFavoritesList(relationshipData.favoritesList);
      setReceivedRequestsList(relationshipData.receivedRequestsList);
      setSentRequestsList(relationshipData.sentRequestsList);
    }
  }, [relationshipData]);

  // Handle resend validation email
 const handleResendEmail = async () => {
  try {
    const { message, email } = await emailService.resendValidation();
    toast({
      title: "Email Sent",
      description: message || `Validation link sent to ${email}`,
    });
  } catch (err: any) {
    console.error("Resend validation failed:", err);
    toast({
      title: "Failed to Send",
      description: err?.response?.data?.message || "Please try again later.",
      variant: "destructive",
    });
  }
};


  const handleMessageMatch = (matchId: string) => {
    window.location.href = `/messages?conversation=${matchId}`;
  };

  const handleAcceptRequest = async (relationshipId: string) => {
    try {
      await relationshipService.respondToRequest(relationshipId, 'accept');
      toast({
        title: "Request accepted",
        description: "You can now message each other",
      });
      refetch(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (relationshipId: string) => {
    try {
      await relationshipService.respondToRequest(relationshipId, 'reject');
      toast({
        title: "Request rejected",
        description: "The request has been declined",
      });
      refetch(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const handleSendRequest = (userId: string) => {
    // Send connection request
    toast({
      title: "Request sent",
      description: "Your connection request has been sent",
    });
  };

  const handleRemoveFromFavorites = async (userId: string) => {
    try {
      await userService.removeFromFavorites(userId);
      setFavoritesList(prev => prev.filter(fav => fav._id !== userId));
      toast({
        title: "Removed from favorites",
        description: "User has been removed from your favorites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "matches":
        return matchesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {matchesList.slice(0, 6).map((match) => (
              <Card key={match._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {match.fname?.charAt(0)}{match.lname?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {match.fname} {match.lname}
                        {match.dob}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {match.country || "Location not specified"}
                      </p>
                    </div>
                  </div>
                  {match.summary && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {match.summary}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleMessageMatch(match._id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">No matches yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/search'}
            >
              Browse potential matches
            </Button>
          </div>
        );

      case "favorites":
        return favoritesList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {favoritesList.map((favorite) => (
              <Card key={favorite._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {favorite.fname?.charAt(0)}{favorite.lname?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {favorite.fname} {favorite.lname}
                        {favorite.dob && `, ${calculateAge(favorite.dob)}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {favorite.country || "Location not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRemoveFromFavorites(favorite._id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">No favorites yet</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/search'}
            >
              Browse to add favorites
            </Button>
          </div>
        );

      case "received":
        return receivedRequestsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {receivedRequestsList.map((request) => (
              <Card key={request._id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {request.fname?.charAt(0)}{request.lname?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {request.fname} {request.lname}
                        {request.dob && `, ${calculateAge(request.dob)}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {request.country || "Location not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAcceptRequest(request.relationship.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRejectRequest(request.relationship.id)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">No connection requests</p>
          </div>
        );

      case "sent":
        return (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg text-muted-foreground">No sent requests to display</p>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No data available</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <TopNavbar />
      <div className="container py-6">
        {/* Email validation banner */}
       {user && !user.emailVerified && (
  <Alert className="mb-6 bg-yellow-50 border-yellow-200">
    <AlertDescription className="flex items-center gap-2">
      <span className="bg-yellow-400 text-white p-1 rounded-full">!</span>
      Please validate your email address to continue
      <Button
        variant="outline"
        size="sm"
        className="ml-auto bg-blue-600 text-white hover:bg-blue-700"
        onClick={handleResendEmail}
      >
        Resend validation mail
      </Button>
    </AlertDescription>
  </Alert>
)}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Matches</h3>
                <Heart className="h-5 w-5 text-teal-500" />
              </div>
              <p className="text-2xl font-bold">{stats.matches}</p>
              <p className="text-xs text-muted-foreground mt-1">= 0% this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Favorites</h3>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.favorites}</p>
              <p className="text-xs text-muted-foreground mt-1">Added to favorites</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Received Requests</h3>
                <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="2" strokeWidth="2"></rect>
                  <path d="M9 12h6m-3-3v6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <p className="text-2xl font-bold">{stats.receivedRequests}</p>
              <Link to="/alerts" className="text-xs text-blue-500 hover:underline">View requests</Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Sent Requests</h3>
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 12h14M19 12l-4-4m0 8l4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <p className="text-2xl font-bold">{stats.sentRequests}</p>
              <p className="text-xs text-muted-foreground mt-1">= 0% this week</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Advertisement Section */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Advert</h3>
              <span className="text-xs text-muted-foreground">This is sponsored</span>
            </div>
            <div className="py-8 text-center text-muted-foreground">
              Sponsored post placeholder
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs Section */}
        <div className="mt-6">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <Button 
                variant="link" 
                className={`px-4 pb-2 ${activeTab === 'matches' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('matches')}
              >
                MATCHES ({stats.matches})
              </Button>
              <Button 
                variant="link" 
                className={`px-4 pb-2 ${activeTab === 'favorites' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('favorites')}
              >
                FAVORITES ({stats.favorites})
              </Button>
              <Button 
                variant="link" 
                className={`px-4 pb-2 ${activeTab === 'received' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('received')}
              >
                RECEIVED REQUESTS ({stats.receivedRequests})
              </Button>
              <Button 
                variant="link" 
                className={`px-4 pb-2 ${activeTab === 'sent' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('sent')}
              >
                SENT REQUESTS ({stats.sentRequests})
              </Button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="py-6">
            {renderTabContent()}
            
            {/* View All Button for matches */}
            {activeTab === 'matches' && matchesList.length > 6 && (
              <div className="text-center">
                <Link to="/matches">
                  <Button variant="outline">
                    View All Matches
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Feed Section */}
        <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Feed</h3>
            <Button variant="link" className="text-primary p-0">
              SEE ALL
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Recent information you may find useful
          </div>
          
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg text-muted-foreground">Nothing here yet</p>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Dashboard;
