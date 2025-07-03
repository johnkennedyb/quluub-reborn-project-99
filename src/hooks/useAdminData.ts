import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface AdminStats {
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  premiumMembers: number;
  proMembers: number;
  hiddenProfiles: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  inactiveUsers: number;
  inactiveQuarter: number;
  inactiveYear: number;
  inactiveSixMonths: number;
  recentRegistrations: number;
  monthlyRegistrations: number;
  totalMatches: number;
  pendingRequests: number;
  rejectedRequests: number;
  successRate: number;
  avgMatchesPerUser: number;
  matchToChatRate: number;
  messagesExchanged: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  avgSessionTime: string;
  conversionRate: number;
  engagementRate: number;
  churnRate: number;
  growthRate: number;
  freeToProConversions: number;
  totalReferrals: number;
  topReferrers: Array<{
    _id: string;
    username: string;
    fname: string;
    lname: string;
    totalReferrals: number;
    activeReferrals: number;
  }>;
  geographicDistribution: Array<{ country: string; count: number }>;
  ageDistribution: Array<{ _id: number; count: number }>;
}

interface AdminUser {
  _id: string;
  username: string;
  fname: string;
  lname: string;
  fullName: string;
  gender: string;
  dob: Date | string;
  age: number | null;
  country: string;
  plan: string;
  lastSeen: Date | string;
  createdAt: Date | string;
  status: string;
  summary?: string;
  joinedAgo: number | null;
  lastSeenAgo: number | null;
  matchCount?: number;
  messageCount?: number;
  hidden?: boolean;
}

interface AdminCall {
  _id: string;
  conversationId: string;
  participants: Array<{
    userId: {
      _id: string;
      fname: string;
      lname: string;
      username: string;
    };
    joinedAt: Date;
    leftAt?: Date;
  }>;
  status: 'started' | 'ended' | 'failed';
  duration: number;
  startTime: Date;
  endTime?: Date;
  recordingUrl?: string;
  quality: string;
  createdAt: Date;
}

interface CallFilters {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserFilters {
  search?: string;
  gender?: string;
  plan?: string;
  status?: string;
  country?: string;
  city?: string;
  inactiveMonths?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Configure axios to use the correct base URL and ADMIN auth token
const createApiClient = () => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add ADMIN auth token to requests
  apiClient.interceptors.request.use(
    (config) => {
      // Always use admin token for these requests
      const adminToken = localStorage.getItem('adminToken');
      console.log('🔐 Using admin token for request:', {
        hasToken: !!adminToken,
        url: config.url,
        tokenPrefix: adminToken ? adminToken.substring(0, 10) + '...' : 'none'
      });
      
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else {
        console.warn('⚠️ No admin token found for API request');
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('❌ Admin API 401 error, clearing tokens');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

export const useAdminData = (filters: UserFilters = {}, callFilters: CallFilters = {}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [calls, setCalls] = useState<AdminCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [callPagination, setCallPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    avgDuration: 0,
    totalDuration: 0
  });
  const { toast } = useToast();

  const apiClient = createApiClient();

  const fetchAdminStats = async () => {
    try {
      console.log("📊 Fetching admin statistics...");
      const response = await apiClient.get('/admin/stats');
      console.log("✅ Admin stats received:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch admin stats:", error);
      throw error;
    }
  };

  const fetchUsers = async (userFilters = filters) => {
    try {
      console.log("👥 Fetching users with filters:", userFilters);
      
      const params = new URLSearchParams();
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.gender && userFilters.gender !== 'all') params.append('gender', userFilters.gender);
      if (userFilters.plan && userFilters.plan !== 'all') params.append('plan', userFilters.plan);
      if (userFilters.status && userFilters.status !== 'all') params.append('status', userFilters.status);
      if (userFilters.country && userFilters.country !== 'all') params.append('country', userFilters.country);
      if (userFilters.city && userFilters.city !== 'all') params.append('city', userFilters.city);
      if (userFilters.inactiveMonths && userFilters.inactiveMonths !== 'all') params.append('inactiveMonths', userFilters.inactiveMonths);
      if (userFilters.page) params.append('page', userFilters.page.toString());
      if (userFilters.limit) params.append('limit', userFilters.limit.toString());
      if (userFilters.sortBy) params.append('sortBy', userFilters.sortBy);
      if (userFilters.sortOrder) params.append('sortOrder', userFilters.sortOrder);

      const response = await apiClient.get(`/admin/users?${params.toString()}`);
      console.log("✅ Admin users received:", response.data);
      
      const usersData = response.data.users;
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        hasNextPage: response.data.hasNextPage || false,
        hasPrevPage: response.data.hasPrevPage || false
      });
    } catch (error) {
      console.error("❌ Failed to fetch users:", error);
      setUsers([]);
      throw error;
    }
  };

  const fetchCalls = async (filters = callFilters) => {
    try {
      console.log("📞 Fetching calls with filters:", filters);
      
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await apiClient.get(`/admin/calls?${params.toString()}`);
      console.log("✅ Admin calls received:", response.data);
      
      setCalls(Array.isArray(response.data.calls) ? response.data.calls : []);
      setCallPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0,
        hasNextPage: response.data.hasNextPage || false,
        hasPrevPage: response.data.hasPrevPage || false
      });
      setCallStats(response.data.statistics || callStats);
    } catch (error) {
      console.error("❌ Failed to fetch calls:", error);
      setCalls([]);
      throw error;
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔄 Starting admin data fetch...");
        
        await Promise.all([
          fetchAdminStats(),
          fetchUsers(filters),
          fetchCalls(callFilters)
        ]);

        console.log("✅ All admin data fetched successfully");
      } catch (err) {
        console.error("❌ Failed to fetch admin data:", err);
        const errorMessage = axios.isAxiosError(err) 
          ? err.response?.data?.message || err.message
          : 'Failed to fetch admin data';
          
        setError(new Error(errorMessage));
        setUsers([]);
        setCalls([]);
        
        toast({
          title: "Error",
          description: `Failed to load admin data: ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have an admin token
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      fetchAdminData();
    } else {
      console.warn("⚠️ No admin token found, skipping data fetch");
      setLoading(false);
    }
  }, [
    filters.search,
    filters.gender, 
    filters.plan,
    filters.status,
    filters.country,
    filters.city,
    filters.inactiveMonths,
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
    callFilters.status,
    callFilters.page,
    callFilters.limit,
    callFilters.sortBy,
    callFilters.sortOrder
  ]);

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      await apiClient.put(`/admin/users/${userId}/status`, { status });
      
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, status } : user
      ));

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error) {
      console.error("❌ Failed to update user status:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to update user status';
        
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserPlan = async (userId: string, plan: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/plan`, { plan });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, plan } : user
      ));
      toast({
        title: "Success",
        description: "User plan updated successfully",
      });
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to update user plan';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getUserDetails = async (userId: string) => {
    try {
      console.log(`🔍 Fetching details for user ${userId}`);
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch user details:", error);
      throw error;
    }
  };

  const refetchData = async (newFilters = filters, newCallFilters = callFilters) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(newFilters),
        fetchCalls(newCallFilters)
      ]);
    } catch (err) {
      console.error("❌ Failed to refetch admin data:", err);
      setError(err instanceof Error ? err : new Error('Failed to refetch data'));
      setUsers([]);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  return { 
    stats, 
    users,
    calls,
    callStats,
    loading, 
    error, 
    pagination,
    callPagination,
    updateUserStatus,
    updateUserPlan,
    getUserDetails,
    refetchData
  };
};
