import React, { Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import FeedCard from "@/components/FeedCard";
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
        const response = await userService.getNotifications();
        return response.data as NotificationsData;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your latest activities</p>
        </div>

        <div className="space-y-4">
          {/* Connection Requests */}
          <Accordion type="single" collapsible defaultValue="requests">
            <AccordionItem value="requests">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Connection requests</span>
                  {data?.request && data.request.length > 0 && (
                    <Badge variant="secondary">{data.request.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {data?.request && data.request.length > 0 ? (
                  <div className="space-y-3">
                    {data.request.map((item, index) => (
                      <Fragment key={`${item.username}${item.type}${item.timestamp}${index}`}>
                        <Card className={`${!item.read ? 'border-blue-200 bg-blue-50' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${getNotificationColor(item.type)}`}>
                                {getNotificationIcon(item.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.username}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.message}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {index !== data.request.length - 1 && <Separator />}
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No requests yet</p>
                    </CardContent>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Recent Notifications */}
          <Accordion type="single" collapsible defaultValue="recent">
            <AccordionItem value="recent">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Recent notifications</span>
                  {data?.others && data.others.length > 0 && (
                    <Badge variant="secondary">{data.others.length}</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="max-h-96 overflow-y-auto">
                  {data?.others && data.others.length > 0 ? (
                    <div className="space-y-3">
                      {data.others.map((item, index) => (
                        <Fragment key={`${item.username}${item.type}${item.timestamp}${index}`}>
                          <Card className={`${!item.read ? 'border-blue-200 bg-blue-50' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-full ${getNotificationColor(item.type)}`}>
                                  {getNotificationIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.username}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {item.message}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          {index !== data.others.length - 1 && <Separator />}
                        </Fragment>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nothing here yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Your notifications will appear here
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Notifications;
