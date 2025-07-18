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
  const [isSendingRequest, setIsSendingRequest] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState({
    matches: 1,
    favorites: 1,
    received: 1,
    sent: 1
  });
  const itemsPerPage = 6;

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
        
        // Fetch profile views (assuming there's an endpoint for this)
        const profileViewsResponse = await userService.getProfileViewsCount();
        
        // Gender-based filtering
        const userGender = user?.gender;
        const oppositeGenderMatches = matchesData?.matches?.filter(match => match.gender !== userGender) || [];
        const oppositeGenderFavorites = favoritesData?.favorites?.filter(fav => fav.gender !== userGender) || [];
        
        return {
          matches: oppositeGenderMatches.length,
          favorites: oppositeGenderFavorites.length,
          receivedRequests: pendingData?.requests?.length || 0,
          sentRequests: 0, // This would need a separate endpoint if available
          profileViews: profileViewsResponse?.count || 0,
          unreadMessages: unreadCount || 0,
          matchesList: oppositeGenderMatches,
          favoritesList: oppositeGenderFavorites,
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
  }, [relationshipData, toast]);

  // Handle resend validation email
   const handleResendEmail = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Could not find your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      await emailService.resendValidationEmail(user.email);
      toast({
        title: "Verification Email Sent",
        description: `A new verification email has been sent to ${user.email}.`,
      });
    } catch (err: any) {
      console.error("Resend validation failed:", err);
      toast({
        title: "Failed to Send",
        description: err?.response?.data?.message || "There was an error sending the email. Please try again later.",
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
      await userService.removeFavorite(userId);
      // Update the list by removing the user with the given ID
      setFavoritesList(favoritesList.filter(user => user._id !== userId));
      // Update the stats
      setStats(prev => ({ ...prev, favorites: prev.favorites - 1 }));
      toast({
        title: "Removed from favorites",
        description: "User has been removed from your favorites.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from favorites.",
        variant: "destructive",
      });
    }
  };

  const handleSendRequestFromFavorites = async (userId: string) => {
    setIsSendingRequest(userId);
    try {
      await relationshipService.sendRequest(userId);
      // Update the favorites list to show the request has been sent
      setFavoritesList(favoritesList.map(user => 
        user._id === userId ? { ...user, requestSent: true } : user
      ));
      toast({
        title: "Request sent",
        description: "Your request has been sent successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error sending request from favorites:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRequest(null);
    }
  };

  const renderTabContent = () => {
    const getPaginatedList = (list, page) => {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return list.slice(startIndex, endIndex);
    };

    const renderPaginationButtons = (totalItems, tab) => {
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const currentTabPage = currentPage[tab];

      return (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => ({ ...prev, [tab]: prev[tab] - 1 }))}
            disabled={currentTabPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => ({ ...prev, [tab]: prev[tab] + 1 }))}
            disabled={currentTabPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      );
    };

    switch (activeTab) {
      case 'matches':
        if (matchesList.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-center text-muted-foreground">
                  No matches yet
                </p>
                <p className="text-sm text-center text-muted-foreground max-w-md mt-2">
                  You haven't matched with anyone yet. Check back later or explore potential matches.
                </p>
                <Link to="/browse" className="mt-4">
                  <Button>
                    Explore Potential Matches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        }

        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaginatedList(matchesList, currentPage.matches).map((match) => (
                <Card key={match._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200">
                      {match.profilePhoto ? (
                        <img 
                          src={match.profilePhoto} 
                          alt={`${match.fname} ${match.lname}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                            e.currentTarget.alt = "Image not found";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">{match.fname} {match.lname}</h3>
                      <div className="text-sm text-muted-foreground mb-3">
                        {match.ethnicity || "N/A"} • {match.height || "N/A"}
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/profile/${match._id}`}>
                          <Button variant="outline" size="sm">Profile</Button>
                        </Link>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleMessageMatch(match._id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" /> Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPaginationButtons(matchesList.length, 'matches')}
          </div>
        );

      case 'favorites':
        if (favoritesList.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <Star className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-center text-muted-foreground">
                  No favorites yet
                </p>
                <p className="text-sm text-center text-muted-foreground max-w-md mt-2">
                  Add people to your favorites to easily find them later.
                </p>
                <Link to="/browse" className="mt-4">
                  <Button>
                    Explore Potential Matches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        }

        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaginatedList(favoritesList, currentPage.favorites).map((fav) => (
                <Card key={fav._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200">
                      {fav.profilePhoto ? (
                        <img 
                          src={fav.profilePhoto} 
                          alt={`${fav.fname} ${fav.lname}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                            e.currentTarget.alt = "Image not found";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">{fav.fname} {fav.lname}</h3>
                      <div className="text-sm text-muted-foreground mb-3">
                        {fav.ethnicity || "N/A"} • {fav.height || "N/A"}
                      </div>
                      <div className="flex space-x-2 flex-wrap gap-y-2">
                        <Link to={`/profile/${fav._id}`}>
                          <Button variant="outline" size="sm">Profile</Button>
                        </Link>
                        <Button 
                          variant="default" 
                          size="sm"
                          disabled={isSendingRequest === fav._id || fav.requestSent}
                          onClick={() => handleSendRequestFromFavorites(fav._id)}
                        >
                          {isSendingRequest === fav._id ? "Sending..." : fav.requestSent ? "Request Sent" : "Send Request"}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRemoveFromFavorites(fav._id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPaginationButtons(favoritesList.length, 'favorites')}
          </div>
        );

      case 'received':
        if (receivedRequestsList.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-center text-muted-foreground">
                  No received requests
                </p>
                <p className="text-sm text-center text-muted-foreground max-w-md mt-2">
                  You haven't received any connection requests yet. Check back later.
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaginatedList(receivedRequestsList, currentPage.received).map((requester) => (
                <Card key={requester._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200">
                      {requester.profile_pic ? (
                        <img 
                          src={requester.profile_pic} 
                          alt={`${requester.fname} ${requester.lname}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                            e.currentTarget.alt = "Image not found";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">{requester.fname} {requester.lname}</h3>
                      <div className="text-sm text-muted-foreground mb-3">
                        {requester.ethnicity || "N/A"} • {requester.height || "N/A"}
                      </div>
                      <div className="flex space-x-2 flex-wrap gap-y-2">
                        <Link to={`/profile/${requester._id}`}>
                          <Button variant="outline" size="sm">Profile</Button>
                        </Link>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleAcceptRequest(requester.relationship.id)}
                        >
                          Accept
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRejectRequest(requester.relationship.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPaginationButtons(receivedRequestsList.length, 'received')}
          </div>
        );

      case 'sent':
        if (sentRequestsList.length === 0) {
          return (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <UserX className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg text-center text-muted-foreground">
                  No sent requests
                </p>
                <p className="text-sm text-center text-muted-foreground max-w-md mt-2">
                  You haven't sent any connection requests yet. Explore potential matches to connect with others.
                </p>
                <Link to="/browse" className="mt-4">
                  <Button>
                    Explore Potential Matches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        }

        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPaginatedList(sentRequestsList, currentPage.sent).map((requestee) => (
                <Card key={requestee._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gray-200">
                      {requestee.profilePhoto ? (
                        <img 
                          src={requestee.profilePhoto} 
                          alt={`${requestee.fname} ${requestee.lname}`} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/default-avatar.png";
                            e.currentTarget.alt = "Image not found";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <UserIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-1">{requestee.fname} {requestee.lname}</h3>
                      <div className="text-sm text-muted-foreground mb-3">
                        Request sent
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/profile/${requestee._id}`}>
                          <Button variant="outline" size="sm">Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {renderPaginationButtons(sentRequestsList.length, 'sent')}
          </div>
        );

      default:
        return null;
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 mt-6">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Matches</p>
                <p className="text-2xl font-bold">{stats.matches}</p>
              </div>
              <Heart className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-2xl font-bold">{stats.favorites}</p>
              </div>
              <Star className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Received Requests</p>
                <p className="text-2xl font-bold">{stats.receivedRequests}</p>
              </div>
              <UserCheck className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Sent Requests</p>
                <p className="text-2xl font-bold">{stats.sentRequests}</p>
              </div>
              <UserX className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold">{stats.profileViews}</p>
              </div>
              <UserIcon className="h-6 w-6 text-primary" />
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
