
import { useQuery, useMutation } from '@tanstack/react-query';
import { userService, relationshipService, chatService } from './api-client';
import { useToast } from '@/hooks/use-toast';

export const useUserStats = (userId: string | undefined) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      try {
        // In a real implementation, we would have dedicated endpoints for these stats
        // Here we're gathering data from multiple endpoints 
        const matchesData = await relationshipService.getMatches();
        const pendingData = await relationshipService.getPendingRequests();
        const unreadCount = await chatService.getUnreadCount();
        
        return {
          matches: matchesData?.matches?.length || 0,
          receivedRequests: pendingData?.requests?.length || 0,
          sentRequests: 0, // We would need an endpoint for this
          profileViews: 0, // We would need an endpoint for this
          unreadMessages: unreadCount || 0
        };
      } catch (error) {
        console.error("Error fetching user stats:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user statistics",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!userId,
  });
};

export const useSendConnectionRequest = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      return await relationshipService.sendRequest(userId);
    },
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "They'll be notified of your interest",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send request",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error("Error sending connection request:", error);
    }
  });
};

export const useRespondToConnectionRequest = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ relationshipId, action }: { relationshipId: string, action: 'accept' | 'reject' }) => {
      return await relationshipService.respondToRequest(relationshipId, action);
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === 'accept' ? "Connection accepted" : "Connection declined",
        description: variables.action === 'accept' 
          ? "You can now chat with this person" 
          : "The connection request has been declined",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to respond to request",
        description: "Please try again later",
        variant: "destructive",
      });
      console.error("Error responding to connection request:", error);
    }
  });
};
