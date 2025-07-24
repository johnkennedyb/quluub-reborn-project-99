import React, { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Users, MessageSquare, Heart, Eye } from "lucide-react";

interface NotificationItem {
  id: string;
  type: 'request' | 'message' | 'match' | 'view' | 'other';
  username: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  user?: {
    _id: string;
    username: string;
    fname: string;
    lname: string;
    profile_pic?: string;
  };
}

interface NotificationsData {
  request: NotificationItem[];
  others: NotificationItem[];
}

const Notifications = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        // Mock data for now - replace with actual API call when available
        return {
          request: [],
          others: []
        } as NotificationsData;
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive",
        });
        return { request: [], others: [] };
      }
    },
    enabled: !!currentUser,
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <Users className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'match':
        return <Heart className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-green-100 text-green-800';
      case 'match':
        return 'bg-pink-100 text-pink-800';
      case 'view':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
        <Navbar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Failed to load notifications</p>
            </CardContent>
          </Card>
        </div>
        <Navbar />
      </div>
    );
  }

  const notifications = data || { request: [], others: [] };
  const allNotifications = [...notifications.request, ...notifications.others];
  const unreadCount = allNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        {allNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500">When you receive notifications, they'll appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {notifications.request.length > 0 && (
              <AccordionItem value="requests" className="border-0">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Connection Requests</span>
                      <Badge variant="secondary">{notifications.request.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator />
                    <div className="p-6 pt-4 space-y-4">
                      {notifications.request.map((notification, index) => (
                        <Fragment key={notification.id}>
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.username}
                                </p>
                                <Badge 
                                  variant="outline" 
                                  className={getNotificationColor(notification.type)}
                                >
                                  {notification.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                          {index < notifications.request.length - 1 && <Separator />}
                        </Fragment>
                      ))}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}

            {notifications.others.length > 0 && (
              <AccordionItem value="others" className="border-0">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-gray-600" />
                      <span className="font-medium">Other Notifications</span>
                      <Badge variant="secondary">{notifications.others.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator />
                    <div className="p-6 pt-4 space-y-4">
                      {notifications.others.map((notification, index) => (
                        <Fragment key={notification.id}>
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.username}
                                </p>
                                <Badge 
                                  variant="outline" 
                                  className={getNotificationColor(notification.type)}
                                >
                                  {notification.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              </div>
                            )}
                          </div>
                          {index < notifications.others.length - 1 && <Separator />}
                        </Fragment>
                      ))}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
      <Navbar />
    </div>
  );
};

export default Notifications;
