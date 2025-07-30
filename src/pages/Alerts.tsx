import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProfileImage from "@/components/ProfileImage";
import { useToast } from "@/hooks/use-toast";
import { relationshipService } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo } from "@/utils/dataUtils";

interface ConnectionRequest {
  _id: string;
  relationship: {
    id: string;
    status: string;
    createdAt?: string;
  };
  fname: string;
  lname: string;
  country?: string;
  profile_pic?: string;
  kunya?: string;
}

interface Notification {
  id: string;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'admin_announcement' | 'system_alert';
  title: string;
  description: string;
  time: string;
  createdAt: string;
  read: boolean;
  user?: {
    name: string;
    photo?: string;
  };
}

const Alerts = () => {
  const { user } = useAuth();
  const [showConnectionRequests, setShowConnectionRequests] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const adminNotificationId = notificationId.replace('admin_', '');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications/${adminNotificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update the notification in the local state
        setNotifications(prev => prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        ));
        toast({ title: 'Success', description: 'Notification marked as read' });
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' });
    }
  };

  // Fetch admin notifications
  const fetchAdminNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const adminNotifications = await response.json();
        return adminNotifications.map((notification: any) => ({
          id: `admin_${notification._id}`,
          type: notification.type === 'admin_announcement' ? 'admin_announcement' : 'system_alert',
          title: notification.type === 'admin_announcement' ? 'Admin Announcement' : 'System Alert',
          description: notification.message,
          time: timeAgo(new Date(notification.createdAt)),
          createdAt: notification.createdAt, // Keep original timestamp for sorting
          read: notification.read
        }));
      }
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
    }
    return [];
  };

  // Fetch connection requests and matches
  const fetchConnectionData = async () => {
    try {
      setLoading(true);
      
      // Get pending connection requests (people who want to connect with me)
      const pendingResponse = await relationshipService.getPendingRequests();
      console.log("Pending requests response:", pendingResponse);
      
      if (pendingResponse && pendingResponse.requests) {
        setConnectionRequests(pendingResponse.requests);
      }

      // Get matches to show as notifications for accepted connections
      const matchesResponse = await relationshipService.getMatches();
      console.log("Matches response:", matchesResponse);
      
      let allNotifications: Notification[] = [];
      
      if (matchesResponse && matchesResponse.matches) {
        const matchNotifications: Notification[] = matchesResponse.matches.map((match: any) => ({
          id: `match_${match._id}`,
          type: 'connection_accepted',
          title: 'Connection Accepted!',
          description: `You and ${match.fname} ${match.lname} are now connected. You can start chatting!`,
          time: timeAgo(new Date(match.relationship?.createdAt || match.relationship?.updatedAt || Date.now())),
          createdAt: match.relationship?.createdAt || match.relationship?.updatedAt || new Date().toISOString(),
          read: false,
          user: {
            name: `${match.fname} ${match.lname}`,
            photo: match.profile_pic
          }
        }));
        
        allNotifications = [...allNotifications, ...matchNotifications];
      }
      
      // Fetch admin notifications
      const adminNotifications = await fetchAdminNotifications();
      allNotifications = [...allNotifications, ...adminNotifications];
      
      // Sort notifications by createdAt timestamp (newest first)
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setNotifications(allNotifications);
      
    } catch (error) {
      console.error("Failed to fetch connection data:", error);
      toast({
        title: "Error",
        description: "Failed to load connection requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionData();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchConnectionData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptRequest = async (relationshipId: string, userId: string) => {
    try {
      await relationshipService.respondToRequest(relationshipId, 'accept');
      
      // Remove from connection requests
      setConnectionRequests(prev => 
        prev.filter(req => req.relationship.id !== relationshipId)
      );
      
      // Add to notifications as accepted connection
      const acceptedUser = connectionRequests.find(req => req.relationship.id === relationshipId);
      if (acceptedUser) {
        const newNotification: Notification = {
          id: `accepted_${relationshipId}`,
          type: 'connection_accepted',
          title: 'Connection Accepted!',
          description: `You and ${acceptedUser.fname} ${acceptedUser.lname} are now connected. You can start chatting!`,
          time: 'Just now',
          createdAt: new Date().toISOString(),
          read: false,
          user: {
            name: `${acceptedUser.fname} ${acceptedUser.lname}`,
            photo: acceptedUser.profile_pic
          }
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
      
      toast({
        title: "Connection Accepted",
        description: "You can now message each other",
      });
    } catch (error) {
      console.error("Failed to accept connection:", error);
      toast({
        title: "Error",
        description: "Failed to accept connection request",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (relationshipId: string) => {
    try {
      await relationshipService.respondToRequest(relationshipId, 'reject');
      
      // Remove from connection requests
      setConnectionRequests(prev => 
        prev.filter(req => req.relationship.id !== relationshipId)
      );
      
      toast({
        title: "Connection Declined",
        description: "The request has been declined",
      });
    } catch (error) {
      console.error("Failed to reject connection:", error);
      toast({
        title: "Error",
        description: "Failed to decline connection request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" style={{paddingBottom: '200px'}}>
        <div className="container py-6 flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{paddingBottom: '200px'}}>
      <div className="container py-6">
        
        {/* Connection Requests Section */}
        <div className="mb-6">
          <div 
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => setShowConnectionRequests(!showConnectionRequests)}
          >
            <h2 className="text-xl font-bold">Connection requests</h2>
            {showConnectionRequests ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {showConnectionRequests && (
            <div className="space-y-4">
              {connectionRequests.length > 0 ? (
                connectionRequests.map(request => (
                  <Card key={request._id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ProfileImage
                            src={request.profile_pic || ""}
                            alt={`${request.fname} ${request.lname}`}
                            fallback={`${request.fname?.charAt(0)}${request.lname?.charAt(0)}`}
                            size="md"
                          />
                          <div>
                            <h3 className="font-medium">
                              {request.fname} {request.lname}
                              {request.kunya && (
                                <span className="text-sm text-muted-foreground ml-1">
                                  ({request.kunya})
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {request.country || "Unknown location"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(new Date(request.relationship.createdAt || Date.now()))}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeclineRequest(request.relationship.id)}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAcceptRequest(request.relationship.id, request._id)}
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 16V12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8H12.01" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-lg text-center text-muted-foreground">
                      No requests yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
        {/* Recent Notifications Section */}
        <div>
          <div 
            className="flex justify-between items-center mb-2 cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <h2 className="text-xl font-bold">Recent notifications</h2>
            {showNotifications ? <ChevronUp /> : <ChevronDown />}
          </div>
          
          {showNotifications && (
            <div className="space-y-4 mt-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const isAdminNotification = notification.type === 'admin_announcement' || notification.type === 'system_alert';
                  const notificationStyle = isAdminNotification 
                    ? "bg-blue-50 border-blue-200 hover:bg-blue-100" 
                    : notification.read ? "bg-background" : "bg-primary/5 border-primary/20";
                  
                  return (
                    <Alert
                      key={notification.id}
                      variant={notification.read ? "default" : "default"}
                      className={`${notificationStyle} cursor-pointer transition-colors`}
                      onClick={() => isAdminNotification && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          {isAdminNotification ? (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {notification.type === 'admin_announcement' ? '📢' : '⚠️'}
                            </div>
                          ) : (
                            notification.user?.photo && (
                              <ProfileImage
                                src={notification.user.photo}
                                alt={notification.user.name}
                                fallback={notification.user.name.split(' ').map(n => n[0]).join('')}
                                size="sm"
                              />
                            )
                          )}
                          <div>
                            <AlertTitle className={`font-semibold ${isAdminNotification ? 'text-blue-800' : ''}`}>
                              {notification.title}
                            </AlertTitle>
                            <AlertDescription className={`${isAdminNotification ? 'text-blue-700' : 'text-muted-foreground'}`}>
                              {notification.description}
                            </AlertDescription>
                            {isAdminNotification && !notification.read && (
                              <div className="text-xs text-blue-600 mt-1 font-medium">Click to mark as read</div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {notification.time}
                        </div>
                      </div>
                    </Alert>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 16V12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8H12.01" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p className="text-lg text-center text-muted-foreground">
                      Nothing here yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Alerts;
