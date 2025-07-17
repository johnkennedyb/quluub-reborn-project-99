
import { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { timeAgo } from '@/utils/dataUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

interface Notification {
  _id: string;
  type: 'connection_request' | 'connection_accepted' | 'message' | 'video_call';
  message: string;
  createdAt: string;
  read: boolean;
  relatedId?: string;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications');
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(socketUrl);
    socket.emit('joinNotifications', user._id);

    socket.on('newNotification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast({
        title: 'New Notification',
        description: notification.message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user, toast]);

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
      try {
        await Promise.all(unreadIds.map(id => apiClient.put(`/notifications/${id}/read`)));
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  const handleJoinCall = (roomId: string) => {
    navigate(`/video-call?room=${roomId}`);
    setIsOpen(false);
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1rem] h-[1rem] flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No new notifications
            </div>
          ) : (
            notifications.map(notification => (
              <Card key={notification._id} className="m-2 shadow-none border">
                <CardContent className="p-3">
                  <div className="text-sm mb-1">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {timeAgo(new Date(notification.createdAt))}
                  </div>
                  
                  {notification.type === 'video_call' && notification.relatedId && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDismiss(notification._id)}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleJoinCall(notification.relatedId!)}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Join Call
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
