import { QueryClient } from '@tanstack/react-query';
import { userService, relationshipService } from './api-client';

// Advanced caching configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query keys for consistent caching
export const queryKeys = {
  // User-related queries
  user: {
    profile: (userId: string) => ['user', 'profile', userId],
    profileOptimized: (userId: string) => ['user', 'profile-optimized', userId],
    favorites: () => ['user', 'favorites'],
    profileViews: () => ['user', 'profile-views'],
  },
  
  // Relationship queries
  relationships: {
    matches: () => ['relationships', 'matches'],
    received: () => ['relationships', 'received'],
    sent: () => ['relationships', 'sent'],
    all: () => ['relationships'],
  },
  
  // Search and browse queries
  browse: {
    users: (filters: any) => ['browse', 'users', filters],
    search: (query: string, filters: any) => ['browse', 'search', query, filters],
  },
  
  // Chat queries
  chat: {
    conversations: () => ['chat', 'conversations'],
    messages: (conversationId: string) => ['chat', 'messages', conversationId],
  },
};

// Prefetch strategies for better performance
export const prefetchStrategies = {
  // Prefetch user's own data on login
  prefetchUserData: async (userId: string) => {
    const promises = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profileOptimized(userId),
        queryFn: () => userService.getProfileOptimized(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes for own profile
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.relationships.matches(),
        queryFn: () => relationshipService.getMatches(),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.favorites(),
        queryFn: () => userService.getFavorites(),
        staleTime: 5 * 60 * 1000,
      }),
    ];
    
    await Promise.allSettled(promises);
  },
  
  // Prefetch related profiles when viewing a profile
  prefetchRelatedProfiles: async (currentUserId: string, viewedUserId: string) => {
    try {
      // Get matches to prefetch their profiles
      const matches = await queryClient.fetchQuery({
        queryKey: queryKeys.relationships.matches(),
        queryFn: () => relationshipService.getMatches(),
      });
      
      // Prefetch up to 5 match profiles
      const prefetchPromises = matches.slice(0, 5).map((match: any) => 
        queryClient.prefetchQuery({
          queryKey: queryKeys.user.profileOptimized(match._id),
          queryFn: () => userService.getProfileOptimized(match._id),
          staleTime: 5 * 60 * 1000,
        })
      );
      
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.log('Prefetch related profiles failed:', error);
    }
  },
  
  // Invalidate related queries after mutations
  invalidateAfterMutation: {
    // After sending a request
    afterSendRequest: (targetUserId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.sent() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profileOptimized(targetUserId) });
    },
    
    // After accepting/rejecting a request
    afterRespondToRequest: (requesterId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.received() });
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.matches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profileOptimized(requesterId) });
    },
    
    // After adding/removing favorites
    afterFavoriteAction: (targetUserId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profileOptimized(targetUserId) });
    },
    
    // After withdrawing connection
    afterWithdrawConnection: (targetUserId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.matches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profileOptimized(targetUserId) });
    },
  },
};

// Background sync for critical data
export const backgroundSync = {
  // Sync user's relationship data every 5 minutes
  startRelationshipSync: (userId: string) => {
    const syncInterval = setInterval(async () => {
      try {
        await queryClient.refetchQueries({ 
          queryKey: queryKeys.relationships.all(),
          type: 'active'
        });
      } catch (error) {
        console.log('Background relationship sync failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(syncInterval);
  },
  
  // Sync favorites every 10 minutes
  startFavoritesSync: () => {
    const syncInterval = setInterval(async () => {
      try {
        await queryClient.refetchQueries({ 
          queryKey: queryKeys.user.favorites(),
          type: 'active'
        });
      } catch (error) {
        console.log('Background favorites sync failed:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(syncInterval);
  },
};

export default queryClient;
