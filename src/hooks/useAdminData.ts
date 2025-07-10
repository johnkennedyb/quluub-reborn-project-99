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
  const [pushNotifications, setPushNotifications] = useState<any[]>([]);
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
  const [callPagination, setCallPagination] = useState<CallPagination>({
    totalCalls: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [callStats, setCallStats] = useState<CallStatistics>({
    totalDuration: 0,
    averageDuration: 0,
    totalCalls: 0,
  });

  const [loadingVips, setLoadingVips] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/statistics');
      setStats(response.data);
    } catch (err) {
      console.error('❌ Failed to fetch admin stats', err);
      toast({ title: 'Error', description: 'Could not fetch admin statistics.', variant: 'destructive' });
    }
  }, [toast]);

  const fetchUsers = useCallback(async (currentFilters: any) => {
    try {
      const params = new URLSearchParams(currentFilters).toString();
      const response = await apiClient.get(`/admin/users?${params}`);
      setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      setPagination({
        totalUsers: response.data.totalUsers,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
      });
    } catch (err) {
      console.error('❌ Failed to fetch users', err);
      toast({ title: 'Error', description: 'Could not fetch users.', variant: 'destructive' });
      setUsers([]);
    }
  }, [toast]);

  const fetchCalls = useCallback(async (cFilters: CallFilters) => {
    try {
      const params = new URLSearchParams(cFilters as any).toString();
      const response = await apiClient.get(`/admin/calls?${params}`);
      setCalls(Array.isArray(response.data.calls) ? response.data.calls : []);
      setCallPagination({
        totalCalls: response.data.totalCalls,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
      });
      setCallStats(prevStats => response.data.statistics || prevStats);
    } catch (error) {
      console.error('❌ Failed to fetch calls:', error);
      toast({ title: 'Error', description: 'Could not fetch calls.', variant: 'destructive' });
      setCalls([]);
    }
  }, [toast]);

  const fetchReportedProfiles = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/reported-profiles');
      setReportedProfiles(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch reported profiles', err);
      toast({ title: 'Error', description: 'Could not fetch reported profiles.', variant: 'destructive' });
    }
  }, [toast]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/subscriptions');
      setSubscriptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch subscriptions', err);
      toast({ title: 'Error', description: 'Could not fetch subscriptions.', variant: 'destructive' });
    }
  }, [toast]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments');
      setPayments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch payments', err);
      toast({ title: 'Error', description: 'Could not fetch payments.', variant: 'destructive' });
    }
  }, [toast]);

  const fetchPushNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/push-notifications');
      setPushNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('❌ Failed to fetch push notifications', err);
      toast({ title: 'Error', description: 'Could not fetch push notifications.', variant: 'destructive' });
    }
  }, [toast]);

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
  }, [toast]);

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
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(filters),
        fetchReportedProfiles(),
        fetchSubscriptions(),
        fetchPayments(),
        fetchPushNotifications(),
        fetchVipUsers(),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('❌ Failed to refetch data:', err);
      toast({ title: 'Error', description: 'Failed to refresh data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [
    filters, 
    toast,
    fetchAdminStats, 
    fetchUsers, 
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
  
  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await apiClient.post('/auth/request-password-reset', { email });
      toast({ title: 'Success', description: `Password reset link sent to ${email}.` });
    } catch (error) {
      console.error('❌ Failed to send password reset:', error);
      toast({ title: 'Error', description: 'Could not send password reset link.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const updateUserStatus = useCallback(async (userId: string, status: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status });
      toast({ title: 'Success', description: 'User status updated.' });
      refetchData();
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      toast({ title: 'Error', description: 'Could not update user status.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.put(`/admin/reported-profiles/${reportId}/dismiss`);
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
          await apiClient.post(`/admin/users/${userId}/send-suggestions`, { suggestedUserIds });
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

  const sendTestPushNotification = useCallback(async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/test-push`);
      toast({ title: 'Success', description: 'Test push sent.' });
    } catch (err) {
      console.error('Failed to send test push', err);
      toast({ title: 'Error', description: 'Could not send test push.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const impersonateUser = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/impersonate`);
      const { token, user } = response.data;
      localStorage.setItem('impersonationToken', token);
      localStorage.setItem('impersonatingUser', JSON.stringify(user));
      window.open('/', '_blank');
    } catch (err) {
      console.error('Failed to impersonate user', err);
      toast({ title: 'Error', description: 'Could not impersonate user.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const stopImpersonation = useCallback(() => {
    localStorage.removeItem('impersonationToken');
    localStorage.removeItem('impersonatingUser');
    window.location.reload();
  }, []);

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
    sendTestPushNotification,
    impersonateUser,
    stopImpersonation,
  };
};
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
  
  const sendPasswordReset = useCallback(async (email: string) => {
    try {
      await apiClient.post('/auth/request-password-reset', { email });
      toast({ title: 'Success', description: `Password reset link sent to ${email}.` });
    } catch (error) {
      console.error('❌ Failed to send password reset:', error);
      toast({ title: 'Error', description: 'Could not send password reset link.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const updateUserStatus = useCallback(async (userId: string, status: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status });
      toast({ title: 'Success', description: 'User status updated.' });
      refetchData();
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      toast({ title: 'Error', description: 'Could not update user status.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.put(`/admin/reported-profiles/${reportId}/dismiss`);
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
          await apiClient.post(`/admin/users/${userId}/send-suggestions`, { suggestedUserIds });
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

  const sendTestPushNotification = useCallback(async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/test-push`);
      toast({ title: 'Success', description: 'Test push sent.' });
    } catch (err) {
      console.error('Failed to send test push', err);
      toast({ title: 'Error', description: 'Could not send test push.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const impersonateUser = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/impersonate`);
      const { token, user } = response.data;
      localStorage.setItem('impersonationToken', token);
      localStorage.setItem('impersonatingUser', JSON.stringify(user));
      window.open('/', '_blank');
    } catch (err) {
      console.error('Failed to impersonate user', err);
      toast({ title: 'Error', description: 'Could not impersonate user.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const stopImpersonation = useCallback(() => {
    localStorage.removeItem('impersonationToken');
    localStorage.removeItem('impersonatingUser');
    window.location.reload();
  }, []);

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
    sendTestPushNotification,
    impersonateUser,
    stopImpersonation,
  };
};
  }, [fetchAdminStats, fetchUsers, filters, toast]);

  const updateUser = useCallback(async (userId: string, data: Partial<AdminUser>) => {
    try {
      await apiClient.put(`/admin/users/${userId}`, data);
      await refetchData();
    } catch (error) {
      console.error(`❌ Failed to update user ${userId}:`, error);
      throw new Error('Failed to update user.');
    }
  }, [apiClient, refetchData]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      await refetchData(); // Refetch data to reflect the deletion
    } catch (error) {
      console.error(`❌ Failed to delete user ${userId}:`, error);
      throw new Error('Failed to delete user.');
    }
  }, [apiClient, refetchData]);

  const sendPasswordReset = useCallback(async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/reset-password`);
    } catch (error) {
      console.error(`❌ Failed to send password reset for user ${userId}:`, error);
      throw new Error('Failed to send password reset link.');
    }
  }, [apiClient]);

  const processRefund = useCallback(async (paymentId: string) => {
    try {
      const response = await apiClient.post(`/admin/payments/${paymentId}/refund`);
      toast({ title: 'Success', description: 'Refund processed successfully!' });
      // Refetch payments to update the UI
      fetchPayments();
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to process refund:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to process refund.', variant: 'destructive' });
      throw error;
    }
  }, [apiClient, toast, fetchPayments]);

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

  const updateUserStatus = useCallback(async (userId: string, status: string) => {
    try {
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      await apiClient.patch(`/admin/users/${userId}/status`, { status });
      toast({ title: "Success", description: "User status updated successfully" });
      fetchUsers(filters); // Refetch users to get the latest status
      fetchReportedProfiles(); // Refetch reports as status change might be an action on a report
    } catch (error) {
      console.error("❌ Failed to update user status:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Failed to update user status';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      throw error;
    }
  }, [apiClient, toast, filters, fetchUsers, fetchReportedProfiles]);

  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.patch(`/admin/reported-profiles/${reportId}/dismiss`);
      toast({ title: 'Success', description: 'Report dismissed.' });
      fetchReportedProfiles(); // Refetch reports to update the list
    } catch (error) {
      toast({ title: 'Error', description: 'Could not dismiss report.', variant: 'destructive' });
    }
  }, [apiClient, toast, fetchReportedProfiles]);



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

  const refetchData = useCallback(async () => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      console.warn("⚠️ No admin token found, skipping data fetch");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(filters),
        fetchCalls(callFilters),
        fetchReportedProfiles(),
        fetchSubscriptions(),
  useEffect(() => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(filters),
        fetchReportedProfiles(),
        fetchPushNotifications(),
        fetchSubscriptions(),
        fetchPayments(),
        fetchVipUsers(),
        fetchPotentialMatches(),
        fetchCalls(callFilters)
      ]);
    } catch (err: any) {
      setError(err);
      if (err.response && err.response.status === 401) {
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  }, [filters, callFilters, fetchAdminStats, fetchUsers, fetchReportedProfiles, fetchPushNotifications, fetchSubscriptions, fetchPayments, fetchVipUsers, fetchPotentialMatches, fetchCalls]);

  useEffect(() => {
    refetchData();
  }, [refetchData, fetchCalls]);

  return { 
    stats, 
    users,
    calls,
    loading,
    error,
    pagination,
    refetchData,
    deleteUser,
    updateUser,
    sendPasswordReset,
    dismissReport,
    updateUserStatus,
    sendPushNotification,
    fetchPushNotifications,
    fetchCalls,
    callPagination,
    callStats,
    vipUsers,
    potentialMatches,
    loadingVips,
    loadingMatches,
    isSubmitting,
    fetchPotentialMatches,
    sendSuggestions,
    pushNotifications,
    sendPushNotification
  };
};
