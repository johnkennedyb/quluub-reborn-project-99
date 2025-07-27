import apiClient from './api-client';

export interface FeedItem {
  id: string;
  type: 'message' | 'view' | 'request' | 'match';
  user: {
    username: string;
    profile_pic?: string;
  };
  message: string;
  timestamp: string;
}

export interface FeedResponse {
  feed: FeedItem[];
  pagination: {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
    totalPages: number;
  };
}

export const feedService = {
  // Get user's activity feed with pagination
  getFeed: async (page: number = 1, limit: number = 10): Promise<FeedResponse> => {
    try {
      const response = await apiClient.get(`/feed?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  },

  // Mark feed item as read
  markFeedItemRead: async (feedItemId: string): Promise<void> => {
    try {
      await apiClient.put(`/feed/${feedItemId}/read`);
    } catch (error) {
      console.error('Error marking feed item as read:', error);
      throw error;
    }
  }
};

export default feedService;
