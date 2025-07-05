import { useState, useEffect, useCallback, useMemo } from 'react';
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

interface ReportedProfile {
  _id: string;
  reporter: { _id: string; fullName: string; username: string };
  reported: { _id: string; fullName: string; username: string };
  reason: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'dismissed' | 'action_taken';
}

interface Subscription {
  _id: string;
  user: { 
    _id: string; 
    username: string; 
    fname: string; 
    lname: string; 
    email: string;
    fullName: string; 
  };
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  user: { 
    _id: string; 
    username: string; 
    fname: string; 
    lname: string; 
    email: string;
    fullName: string; 
  };
  amount: number;
  currency: string;
  plan: string;
  status: string;
  transactionId: string;
  paymentGateway: string;
  createdAt: string;
  updatedAt: string;
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

const defaultUserFilters: UserFilters = {};
const defaultCallFilters: CallFilters = {};

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

export const useAdminData = (filters: UserFilters = defaultUserFilters, callFilters: CallFilters = defaultCallFilters) => {
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
  const [callPagination, setCallPagination] = useState<any>({});
  const [reportedProfiles, setReportedProfiles] = useState<ReportedProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [vipUsers, setVipUsers] = useState<AdminUser[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<AdminUser[]>([]);
  const [loadingVips, setLoadingVips] = useState<boolean>(true);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [callStats, setCallStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    avgDuration: 0,
    totalDuration: 0
  });
  const { toast } = useToast();

  const apiClient = useMemo(() => createApiClient(), []);

  const fetchAdminStats = useCallback(async () => {
    try {
      console.log("📊 Fetching admin statistics...");
      const response = await apiClient.get('/admin/stats');
      console.log("✅ Admin stats received:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("❌ Failed to fetch admin stats:", error);
      throw error;
    }
  }, [apiClient]);

  const fetchUsers = useCallback(async (userFilters: UserFilters) => {
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
  }, [apiClient]);

  const fetchCalls = useCallback(async (cFilters: CallFilters) => {
    try {
      console.log("📞 Fetching calls with filters:", cFilters);
      
      const params = new URLSearchParams();
      if (cFilters.status && cFilters.status !== 'all') params.append('status', cFilters.status);
      if (cFilters.page) params.append('page', cFilters.page.toString());
      if (cFilters.limit) params.append('limit', cFilters.limit.toString());
      if (cFilters.sortBy) params.append('sortBy', cFilters.sortBy);
      if (cFilters.sortOrder) params.append('sortOrder', cFilters.sortOrder);

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
      setCallStats(prevStats => response.data.statistics || prevStats);
    } catch (error) {
      console.error("❌ Failed to fetch calls:", error);
      setCalls([]);
      throw error;
    }
  }, [apiClient]);

  const fetchReportedProfiles = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/reported-profiles');
      setReportedProfiles(response.data.reports || []);
    } catch (error) {
      console.error('❌ Failed to fetch reported profiles:', error);
      setReportedProfiles([]);
    }
  }, [apiClient]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/subscriptions');
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      console.error('❌ Failed to fetch subscriptions:', error);
      setSubscriptions([]);
    }
  }, [apiClient]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments');
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('❌ Failed to fetch payments:', error);
      setPayments([]);
    }
  }, [apiClient]);

  const fetchVipUsers = useCallback(async () => {
    setLoadingVips(true);
    try {
      const response = await apiClient.get('/admin/users', { params: { plan: 'Pro' } });
      setVipUsers(response.data.users || []);
    } catch (error) {
      console.error('❌ Failed to fetch VIP users:', error);
      setVipUsers([]);
    } finally {
      setLoadingVips(false);
    }
  }, [apiClient]);

  const fetchPotentialMatches = useCallback(async (userId: string) => {
    setLoadingMatches(true);
    try {
      const response = await apiClient.get(`/admin/users/${userId}/potential-matches`);
      setPotentialMatches(response.data.matches || []);
    } catch (error) {
      console.error('❌ Failed to fetch potential matches:', error);
      setPotentialMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [apiClient]);

  const sendSuggestions = useCallback(async (userId: string, suggestedUserIds: string[]) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/users/${userId}/suggest-matches`, { suggestedUserIds });
      toast({ title: 'Success', description: 'Match suggestions sent successfully!' });
    } catch (error) {
      console.error('Failed to send suggestions:', error);
      toast({ title: 'Error', description: 'Could not send suggestions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiClient, toast]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔄 Starting admin data fetch...");
        
        await Promise.all([
          fetchAdminStats(),
          fetchUsers(filters),
          fetchCalls(callFilters),
          fetchReportedProfiles(),
          fetchSubscriptions(),
          fetchPayments(),
          fetchVipUsers()
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
    callFilters.sortOrder,
    fetchAdminStats,
    fetchUsers,
    fetchCalls,
    fetchReportedProfiles,
    fetchSubscriptions,
    fetchPayments,
    fetchVipUsers,
    toast
  ]);

  const updateUserStatus = useCallback(async (userId: string, status: string) => {
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
  }, [apiClient, toast]);

  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.patch(`/admin/reported-profiles/${reportId}/dismiss`);
      setReportedProfiles(prev => prev.filter(report => report._id !== reportId));
      toast({ title: 'Success', description: 'Report dismissed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not dismiss report.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const processRefund = useCallback(async (paymentId: string) => {
    try {
      await apiClient.post(`/admin/payments/${paymentId}/refund`);
      setPayments(prev => prev.map(p => p._id === paymentId ? { ...p, status: 'refunded' } : p));
      toast({ title: 'Success', description: 'Payment refunded successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process refund.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const updateUserPlan = useCallback(async (userId: string, plan: string) => {
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
  }, [apiClient, toast]);

  const getUserDetails = useCallback(async (userId: string) => {
    try {
      console.log(`🔍 Fetching details for user ${userId}`);
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to fetch user details:", error);
      throw error;
    }
  }, [apiClient]);

  const refetchData = useCallback(async (newFilters = filters, newCallFilters = callFilters) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(newFilters),
        fetchCalls(newCallFilters),
        fetchReportedProfiles(),
        fetchSubscriptions(),
        fetchPayments(),
        fetchVipUsers()
      ]);
    } catch (err) {
      console.error("❌ Failed to refetch admin data:", err);
      setError(err instanceof Error ? err : new Error('Failed to refetch data'));
      setUsers([]);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAdminStats, fetchUsers, fetchCalls, fetchReportedProfiles, fetchSubscriptions, fetchPayments, fetchVipUsers, filters, callFilters]);

  return { 
    stats, 
    users,
    calls,
    callStats,
    loading, 
    error, 
    pagination,
    callPagination,
    reportedProfiles,
    subscriptions,
    payments,
    updateUserStatus,
    updateUserPlan,
    getUserDetails,
    dismissReport,
    processRefund,
    refetchData,
    vipUsers,
    potentialMatches,
    loadingVips,
    loadingMatches,
    isSubmitting,
    fetchPotentialMatches,
    sendSuggestions
  };
};
