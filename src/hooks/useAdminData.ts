
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

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
  inactiveFor?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CallPagination {
  totalCalls: number;
  totalPages: number;
  currentPage: number;
}

interface CallStatistics {
  totalDuration: number;
  averageDuration: number;
  totalCalls: number;
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

  apiClient.interceptors.request.use(
    (config) => {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
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
  const { toast } = useToast();
  const apiClient = useMemo(() => createApiClient(), []);
  
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
  const [callPagination, setCallPagination] = useState<CallPagination>({
    totalCalls: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [reportedProfiles, setReportedProfiles] = useState<ReportedProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pushNotifications, setPushNotifications] = useState<any[]>([]);
  const [vipUsers, setVipUsers] = useState<AdminUser[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<AdminUser[]>([]);
  const [loadingVips, setLoadingVips] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [callStats, setCallStats] = useState<CallStatistics>({
    totalDuration: 0,
    averageDuration: 0,
    totalCalls: 0,
  });

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('❌ Failed to fetch admin stats', err);
      toast({ title: 'Error', description: 'Could not fetch admin statistics.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchUsers = useCallback(async (currentFilters: any) => {
    try {
      const params = new URLSearchParams(currentFilters).toString();
      const response = await apiClient.get(`/admin/users?${params}`);
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      setPagination({
        currentPage: response.data.currentPage || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.totalUsers || 0,
        hasNextPage: response.data.hasNextPage || false,
        hasPrevPage: response.data.hasPrevPage || false
      });
    } catch (err) {
      console.error('❌ Failed to fetch users', err);
      toast({ title: 'Error', description: 'Could not fetch users.', variant: 'destructive' });
      setUsers([]);
    }
  }, [apiClient, toast]);

  const fetchCalls = useCallback(async (cFilters: CallFilters) => {
    try {
      const params = new URLSearchParams(cFilters as any).toString();
      const response = await apiClient.get(`/admin/calls?${params}`);
      setCalls(Array.isArray(response.data.calls) ? response.data.calls : []);
      setCallPagination({
        totalCalls: response.data.totalCalls || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 1,
      });
      setCallStats(response.data.statistics || {
        totalDuration: 0,
        averageDuration: 0,
        totalCalls: 0,
      });
    } catch (error) {
      console.error('❌ Failed to fetch calls:', error);
      toast({ title: 'Error', description: 'Could not fetch calls.', variant: 'destructive' });
      setCalls([]);
    }
  }, [apiClient, toast]);

  const fetchReportedProfiles = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/reported-profiles');
      setReportedProfiles(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch reported profiles', err);
      toast({ title: 'Error', description: 'Could not fetch reported profiles.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/subscriptions');
      setSubscriptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch subscriptions', err);
      toast({ title: 'Error', description: 'Could not fetch subscriptions.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments');
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch payments', err);
      toast({ title: 'Error', description: 'Could not fetch payments.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchPushNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/push-notifications');
      setPushNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch push notifications', err);
      toast({ title: 'Error', description: 'Could not fetch push notifications.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchVipUsers = useCallback(async () => {
    setLoadingVips(true);
    try {
      const response = await apiClient.get('/admin/vip-users');
      setVipUsers(response.data.vips || []);
    } catch (error) {
      console.error('❌ Failed to fetch VIP users:', error);
      toast({ title: 'Error', description: 'Could not fetch VIP users.', variant: 'destructive' });
    } finally {
      setLoadingVips(false);
    }
  }, [apiClient, toast]);

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

  const refetchData = useCallback(async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      console.warn("⚠️ No admin token found, skipping data fetch");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(filters),
        fetchCalls(callFilters),
        fetchReportedProfiles(),
        fetchSubscriptions(),
        fetchPayments(),
        fetchPushNotifications(),
        fetchVipUsers(),
      ]);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(new Error(errorMessage));
      console.error('❌ Failed to refetch data:', err);
      toast({ title: 'Error', description: 'Failed to refresh data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [
    filters, 
    callFilters,
    toast,
    fetchAdminStats, 
    fetchUsers, 
    fetchCalls,
    fetchReportedProfiles, 
    fetchSubscriptions, 
    fetchPayments, 
    fetchPushNotifications, 
    fetchVipUsers
  ]);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast({ title: 'Success', description: 'User deleted successfully.' });
      refetchData();
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      toast({ title: 'Error', description: 'Could not delete user.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const updateUser = useCallback(async (userId: string, data: Partial<AdminUser>) => {
    try {
      await apiClient.put(`/admin/users/${userId}`, data);
      toast({ title: 'Success', description: 'User updated successfully.' });
      refetchData();
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      toast({ title: 'Error', description: 'Could not update user.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);
  
  const sendPasswordReset = useCallback(async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/reset-password`);
      toast({ title: 'Success', description: 'Password reset link sent.' });
    } catch (error) {
      console.error('❌ Failed to send password reset:', error);
      toast({ title: 'Error', description: 'Could not send password reset link.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const updateUserStatus = useCallback(async (userId: string, status: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status });
      toast({ title: 'Success', description: 'User status updated.' });
      refetchData();
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      toast({ title: 'Error', description: 'Could not update user status.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.patch(`/admin/reported-profiles/${reportId}/dismiss`);
      toast({ title: 'Success', description: 'Report dismissed.' });
      fetchReportedProfiles();
    } catch (error) {
      console.error('❌ Failed to dismiss report:', error);
      toast({ title: 'Error', description: 'Could not dismiss report.', variant: 'destructive' });
    }
  }, [apiClient, fetchReportedProfiles, toast]);
  
  const sendSuggestions = useCallback(async (userId: string, suggestedUserIds: string[]) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/users/${userId}/suggest-matches`, { suggestedUserIds });
      toast({ title: 'Success', description: 'Suggestions sent successfully.' });
    } catch (error) {
      console.error('❌ Failed to send suggestions:', error);
      toast({ title: 'Error', description: 'Could not send suggestions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiClient, toast]);

  const sendPushNotification = useCallback(async (data: { title: string; message: string; target: string; targetUsers?: string[] }) => {
    try {
      await apiClient.post('/admin/push-notifications', data);
      await fetchPushNotifications();
      toast({ title: 'Success', description: 'Push notification sent.' });
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      throw new Error('Failed to send push notification.');
    }
  }, [apiClient, fetchPushNotifications, toast]);

  const updateUserPlan = useCallback(async (userId: string, plan: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/plan`, { plan });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, plan } : user
      ));
      toast({ title: 'Success', description: 'User plan updated.' });
    } catch (err) {
      console.error('Failed to update user plan', err);
      toast({ title: 'Error', description: 'Could not update user plan.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const processRefund = useCallback(async (paymentId: string) => {
    try {
      const response = await apiClient.post(`/admin/payments/${paymentId}/refund`);
      toast({ title: 'Success', description: 'Refund processed successfully!' });
      fetchPayments();
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to process refund:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to process refund.', variant: 'destructive' });
      throw error;
    }
  }, [apiClient, toast, fetchPayments]);

  return {
    stats,
    users,
    calls,
    loading,
    error,
    pagination,
    callPagination,
    reportedProfiles,
    subscriptions,
    payments,
    pushNotifications,
    vipUsers,
    potentialMatches,
    loadingVips,
    loadingMatches,
    isSubmitting,
    callStats,
    refetchData,
    deleteUser,
    updateUser,
    sendPasswordReset,
    updateUserStatus,
    dismissReport,
    sendSuggestions,
    sendPushNotification,
    fetchPushNotifications,
    fetchCalls,
    fetchPotentialMatches,
    updateUserPlan,
    processRefund,
  };
};
