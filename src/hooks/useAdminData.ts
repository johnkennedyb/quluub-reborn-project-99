import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// Interfaces
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
  user: { _id: string; username: string; fname: string; lname: string; email: string; fullName: string };
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
  user: { _id: string; username: string; fname: string; lname: string; email: string; fullName: string };
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
    userId: { _id: string; fname: string; lname: string; username: string };
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
  country?: string | string[];
  city?: string | string[];
  inactiveFor?: string;
  hidden?: string;
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

// API Client Setup
const createApiClient = () => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
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

// Main Hook
export const useAdminData = (filters: UserFilters = defaultUserFilters, callFilters: CallFilters = defaultCallFilters) => {
  const { toast } = useToast();
    const apiClient = useMemo(() => createApiClient(), []);

  // State Declarations
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [calls, setCalls] = useState<AdminCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
    totalUsers: 0,
  });
  const [reportedProfiles, setReportedProfiles] = useState<ReportedProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pushNotifications, setPushNotifications] = useState<any[]>([]);
  const [premiumUsers, setPremiumUsers] = useState<AdminUser[]>([]);
  const [potentialMatches, setPotentialMatches] = useState<AdminUser[]>([]);
  const [loadingPremiums, setLoadingPremiums] = useState<boolean>(true);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  // Data Fetching Callbacks
  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/statistics');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
      toast({ title: 'Error', description: 'Could not fetch admin statistics.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchUsers = useCallback(async (currentFilters: UserFilters) => {
    try {
      const params = new URLSearchParams(currentFilters as any).toString();
      const response = await apiClient.get(`/admin/users?${params}`);
      setUsers(response.data.users || []);
      setPagination({
        totalUsers: response.data.totalUsers,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        hasNextPage: response.data.currentPage < response.data.totalPages,
        hasPrevPage: response.data.currentPage > 1,
        total: response.data.totalUsers,
      });
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast({ title: 'Error', description: 'Could not fetch users.', variant: 'destructive' });
      setUsers([]);
    }
  }, [apiClient, toast]);

  const fetchCalls = useCallback(async (cFilters: CallFilters) => {
    try {
      const params = new URLSearchParams(cFilters as any).toString();
      const response = await apiClient.get(`/admin/calls?${params}`);
      setCalls(response.data.calls || []);
      setCallPagination({
        totalCalls: response.data.totalCalls,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
      });
      setCallStats(response.data.statistics || callStats);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      toast({ title: 'Error', description: 'Could not fetch calls.', variant: 'destructive' });
      setCalls([]);
    }
  }, [apiClient, toast, callStats]);

  const fetchReportedProfiles = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/reported-profiles');
      // Backend returns { reports: [...], pagination: {...} }
      setReportedProfiles(response.data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reported profiles', err);
      toast({ title: 'Error', description: 'Could not fetch reported profiles.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/subscriptions');
      setSubscriptions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
      toast({ title: 'Error', description: 'Could not fetch subscriptions.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments');
      // Backend returns { payments: [], pagination: {} }
      setPayments(response.data?.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments', err);
      toast({ title: 'Error', description: 'Could not fetch payments.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchPushNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/push-notifications');
      setPushNotifications(response.data || []);
    } catch (err) {
      console.error('Failed to fetch push notifications', err);
      toast({ title: 'Error', description: 'Could not fetch push notifications.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const fetchPremiumUsers = useCallback(async () => {
    setLoadingPremiums(true);
    try {
      const response = await apiClient.get('/admin/premium-users');
      setPremiumUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch premium users:', error);
      toast({ title: 'Error', description: 'Could not fetch premium users.', variant: 'destructive' });
    } finally {
      setLoadingPremiums(false);
    }
  }, [apiClient, toast]);

  const fetchPotentialMatches = useCallback(async (userId: string) => {
    setLoadingMatches(true);
    try {
      const response = await apiClient.get(`/admin/users/${userId}/potential-matches`);
      setPotentialMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch potential matches:', error);
      setPotentialMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  }, [apiClient]);

  const refetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAdminStats();
      await fetchUsers(filters);
      await fetchReportedProfiles();
      await fetchSubscriptions();
      await fetchPayments();
      await fetchPushNotifications();
      await fetchPremiumUsers();
      await fetchCalls(callFilters);
    } catch (err) {
      console.error('Failed to refetch data:', err);
      setError(err);
      toast({ title: 'Error', description: 'Failed to refresh data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters, callFilters, apiClient, toast]);

  useEffect(() => {
    refetchData();
  }, [refetchData]);

  // Action Callbacks
  const deleteUser = useCallback(async (userId: string) => {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast({ title: 'Success', description: 'User deleted successfully.' });
      await refetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: 'Could not delete user.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const updateUser = useCallback(async (userId: string, data: Partial<AdminUser>) => {
    try {
      await apiClient.put(`/admin/users/${userId}`, data);
      toast({ title: 'Success', description: 'User updated successfully.' });
      await refetchData();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast({ title: 'Error', description: 'Could not update user.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  

  const updateUserAccountStatus = useCallback(async (userId: string, status: string, reportId?: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/status`, { status, reportId });
      toast({ title: 'Success', description: 'User status updated successfully.' });
      await refetchData();
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({ title: 'Error', description: 'Could not update user status.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const updateUserPlan = useCallback(async (userId: string, plan: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/plan`, { plan });
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, plan } : user
      ));
      toast({ title: 'Success', description: 'User plan updated successfully.' });
    } catch (error) {
      console.error('Failed to update user plan:', error);
      toast({ title: 'Error', description: 'Could not update user plan.', variant: 'destructive' });
    }
  }, [apiClient, toast]);



  const dismissReport = useCallback(async (reportId: string) => {
    try {
      await apiClient.put(`/admin/reports/${reportId}/dismiss`);
      toast({ title: 'Success', description: 'Report dismissed successfully.' });
      await fetchReportedProfiles();
    } catch (error) {
      console.error('Failed to dismiss report:', error);
      toast({ title: 'Error', description: 'Could not dismiss report.', variant: 'destructive' });
    }
  }, [apiClient, fetchReportedProfiles, toast]);

  const verifyUserEmail = useCallback(async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/verify-email`);
      toast({ title: 'Success', description: 'User email verified.' });
      await refetchData();
    } catch (error) {
      console.error('Failed to verify email:', error);
      toast({ title: 'Error', description: 'Could not verify email.', variant: 'destructive' });
    }
  }, [apiClient, refetchData, toast]);

  const sendBulkEmail = useCallback(async (data: { recipients: string[], subject: string, message: string, attachments?: File[] }) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('recipients', JSON.stringify(data.recipients));
      formData.append('subject', data.subject);
      formData.append('message', data.message);
      if (data.attachments) {
        data.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      await apiClient.post('/admin/bulk-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Success', description: 'Bulk email sent successfully.' });
    } catch (error) {
      console.error('Failed to send bulk email:', error);
      toast({ title: 'Error', description: 'Could not send bulk email.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [apiClient, toast]);

  const sendPasswordResetLink = useCallback(async (userId: string) => {
    try {
      const user = users.find(u => u._id === userId);
      await apiClient.post(`/admin/users/${userId}/reset-password`);
      toast({ title: 'Success', description: `Password reset link sent to ${user?.username || 'user'}.` });
    } catch (error) {
      console.error('Failed to send password reset:', error);
      toast({ title: 'Error', description: 'Could not send password reset link.', variant: 'destructive' });
    }
  }, [apiClient, toast, users]);

  const sendPushNotification = useCallback(async (data: { title: string; body: string; target: string; userId?: string }) => {
    try {
      await apiClient.post('/admin/push-notifications', data);
      toast({ title: 'Success', description: 'Push notification sent successfully.' });
      await fetchPushNotifications();
    } catch (error) {
      console.error('Failed to send push notification:', error);
      toast({ title: 'Error', description: 'Could not send push notification.', variant: 'destructive' });
    }
  }, [apiClient, fetchPushNotifications, toast]);

  const impersonateUser = useCallback(async (userId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/impersonate`);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.open('/dashboard', '_blank');
      toast({ title: 'Success', description: `Impersonating ${user.username}` });
    } catch (error) {
      console.error('Impersonation failed:', error);
      toast({ title: 'Error', description: 'Failed to impersonate user.', variant: 'destructive' });
    }
  }, [apiClient, toast]);

  const sendSuggestions = useCallback(async (userId: string, suggestedUserIds: string[]) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/users/${userId}/send-suggestions`, { suggestedUserIds });
      toast({ title: 'Success', description: 'Suggestions sent successfully.' });
    } catch (error) {
      console.error('Failed to send suggestions:', error);
      toast({ title: 'Error', description: 'Could not send suggestions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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

  const stopImpersonation = () => {
    localStorage.removeItem('impersonatedUser');
    window.location.reload();
  };

  const processRefund = useCallback(async (paymentId: string) => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.post(`/admin/payments/${paymentId}/refund`);
      
      if (response.data.success) {
        // Refresh payments data after successful refund
        const paymentsResponse = await apiClient.get('/admin/payments');
        setPayments(paymentsResponse.data.payments || []);
        return { success: true, message: 'Refund processed successfully' };
      } else {
        throw new Error(response.data.message || 'Failed to process refund');
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      setError(error.response?.data?.message || error.message || 'Failed to process refund');
      return { success: false, message: error.response?.data?.message || error.message || 'Failed to process refund' };
    } finally {
      setIsSubmitting(false);
    }
  }, [apiClient, setIsSubmitting, setPayments, setError]);

  const sendEmail = useCallback(async (emailData: { to: string; subject: string; message: string }) => {
    try {
      await apiClient.post('/admin/send-email', emailData);
      toast({ title: 'Success', description: 'Email sent successfully.' });
    } catch (err) {
      console.error('Failed to send email', err);
      toast({ title: 'Error', description: 'Could not send email.', variant: 'destructive' });
      throw err; // Re-throw to allow caller to handle it
    }
  }, [apiClient, toast]);

  // Returned Values
  return {
    stats,
    users,
    calls,
    loading,
    error,
    pagination,
    reportedProfiles,
    subscriptions,
    payments,
    pushNotifications,
    premiumUsers,
    potentialMatches,
    callPagination,
    callStats,
    loadingPremiums,
    loadingMatches,
    isSubmitting,
    refetchData,
    sendPushNotification,
    updateUser,
    updateUserAccountStatus,
    deleteUser,
    dismissReport,
    verifyUserEmail,
    sendBulkEmail,
    sendEmail,
    sendPasswordResetLink,
    impersonateUser,
    fetchCalls,
    fetchPotentialMatches,
    
    sendSuggestions,
    updateUserPlan,
    sendTestPushNotification,
    stopImpersonation,
    processRefund,
  };
};
