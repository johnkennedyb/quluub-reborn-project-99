import axios from 'axios';
import { LoginCredentials, SignupData, User } from '@/types/user';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  signup: async (data: SignupData) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  resendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification-email', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post(`/auth/reset-password?token=${token}`, { password });
    return response.data;
  },
};

export const userService = {
  getProfile: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    const response = await apiClient.put(`/users/${userId}`, data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  updatePreferences: async (userId: string, preferences: any) => {
    const response = await apiClient.put(`/users/${userId}/preferences`, preferences);
    return response.data;
  },

  getPreferences: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/preferences`);
    return response.data;
  },

  changePassword: async (userId: string, data: any) => {
    const response = await apiClient.post(`/users/${userId}/change-password`, data);
    return response.data;
  },

  deleteAccount: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  uploadProfilePicture: async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('profile_pic', file);
    const response = await apiClient.post(`/users/${userId}/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removeProfilePicture: async (userId: string) => {
    const response = await apiClient.delete(`/users/${userId}/remove-profile-picture`);
    return response.data;
  },

  getMatches: async (userId: string, params?: any) => {
    const response = await apiClient.get(`/users/${userId}/matches`, { params });
    return response.data;
  },

  getPotentialMatches: async (userId: string, params?: any) => {
    const response = await apiClient.get(`/users/${userId}/potential-matches`, { params });
    return response.data;
  },

  getBrowseUsers: async (params?: any) => {
    const response = await apiClient.get('/users/browse', { params });
    return response.data;
  },

  likeUser: async (userId: string, likedUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/like/${likedUserId}`);
    return response.data;
  },

  passUser: async (userId: string, passedUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/pass/${passedUserId}`);
    return response.data;
  },

  getLikes: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/likes`);
    return response.data;
  },

  getPasses: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/passes`);
    return response.data;
  },

  reportUser: async (userId: string, reportedUserId: string, reason: string, description: string) => {
    const response = await apiClient.post(`/users/${userId}/report/${reportedUserId}`, { reason, description });
    return response.data;
  },

  blockUser: async (userId: string, blockedUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/block/${blockedUserId}`);
    return response.data;
  },

  getBlocks: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/blocks`);
    return response.data;
  },

  unblockUser: async (userId: string, blockedUserId: string) => {
    const response = await apiClient.delete(`/users/${userId}/block/${blockedUserId}`);
    return response.data;
  },

  addToFavorites: async (userId: string, favoriteUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/favorites/${favoriteUserId}`);
    return response.data;
  },

  removeFromFavorites: async (userId: string, favoriteUserId: string) => {
    const response = await apiClient.delete(`/users/${userId}/favorites/${favoriteUserId}`);
    return response.data;
  },

  getFavorites: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/favorites`);
    return response.data;
  },

  getReferralStats: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/referral-stats`);
    return response.data;
  },

  getVideoCallCredits: async (userId: string) => {
    const response = await apiClient.get(`/users/${userId}/video-call-credits`);
    return response.data;
  },

  updateVideoCallCredits: async (userId: string, credits: number) => {
    const response = await apiClient.put(`/users/${userId}/video-call-credits`, { credits });
    return response.data;
  },

  startVideoCall: async (userId: string, otherUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/start-video-call/${otherUserId}`);
    return response.data;
  },

  endVideoCall: async (userId: string, callId: string) => {
    const response = await apiClient.post(`/users/${userId}/end-video-call/${callId}`);
    return response.data;
  },

  logActivity: async (userId: string, activityType: string, details: any) => {
    const response = await apiClient.post(`/users/${userId}/activity`, { type: activityType, details });
    return response.data;
  },

  getActivityFeed: async (userId: string, params?: any) => {
    const response = await apiClient.get(`/users/${userId}/activity`, { params });
    return response.data;
  },

  getNotifications: async (userId: string, params?: any) => {
    const response = await apiClient.get(`/users/${userId}/notifications`, { params });
    return response.data;
  },

  markNotificationAsRead: async (userId: string, notificationId: string) => {
    const response = await apiClient.patch(`/users/${userId}/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async (userId: string) => {
    const response = await apiClient.patch(`/users/${userId}/notifications/read-all`);
    return response.data;
  },

  getChatRooms: async (userId: string, params?: any) => {
    const response = await apiClient.get(`/users/${userId}/chat-rooms`, { params });
    return response.data;
  },

  createChatRoom: async (userId: string, otherUserId: string) => {
    const response = await apiClient.post(`/users/${userId}/chat-rooms`, { otherUserId });
    return response.data;
  },

  getChatMessages: async (chatRoomId: string, params?: any) => {
    const response = await apiClient.get(`/chat-rooms/${chatRoomId}/messages`, { params });
    return response.data;
  },

  sendMessage: async (chatRoomId: string, content: string) => {
    const response = await apiClient.post(`/chat-rooms/${chatRoomId}/messages`, { content });
    return response.data;
  },

  markMessagesAsRead: async (chatRoomId: string) => {
    const response = await apiClient.patch(`/chat-rooms/${chatRoomId}/messages/read`);
    return response.data;
  },

  getSubscriptionPlans: async () => {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  },

  subscribeToPlan: async (userId: string, planId: string, paymentMethodId: string) => {
    const response = await apiClient.post(`/subscriptions/${planId}/subscribe`, { userId, paymentMethodId });
    return response.data;
  },

  cancelSubscription: async (userId: string) => {
    const response = await apiClient.post(`/subscriptions/cancel`, { userId });
    return response.data;
  },

  getSubscriptionStatus: async (userId: string) => {
    const response = await apiClient.get(`/subscriptions/status/${userId}`);
    return response.data;
  },

  createPaymentIntent: async (userId: string, planId: string) => {
    const response = await apiClient.post('/payments/create-payment-intent', { userId, planId });
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await apiClient.post('/payments/confirm-payment', { paymentIntentId });
    return response.data;
  },

  getPaymentHistory: async (userId: string) => {
    const response = await apiClient.get(`/payments/history/${userId}`);
    return response.data;
  },
};

export const relationshipService = {
  getMatches: async () => {
    const response = await apiClient.get('/relationships/matches');
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await apiClient.get('/relationships/pending');
    return response.data;
  },

  sendRequest: async (userId: string) => {
    const response = await apiClient.post(`/relationships/request/${userId}`);
    return response.data;
  },

  respondToRequest: async (relationshipId: string, action: 'accept' | 'reject') => {
    const response = await apiClient.post(`/relationships/${relationshipId}/${action}`);
    return response.data;
  },

  getSentRequests: async () => {
    const response = await apiClient.get('/relationships/sent');
    return response.data;
  },

  getReceivedRequests: async () => {
    const response = await apiClient.get('/relationships/received');
    return response.data;
  },

  likeUser: async (currentUserId: string, userId: string) => {
    const response = await apiClient.post(`/relationships/like/${userId}`, { currentUserId });
    return response.data;
  },

  passUser: async (currentUserId: string, userId: string) => {
    const response = await apiClient.post(`/relationships/pass/${userId}`, { currentUserId });
    return response.data;
  },
};

export const chatService = {
  getUnreadCount: async () => {
    const response = await apiClient.get('/chat/unread-count');
    return response.data;
  },

  getChatRooms: async () => {
    const response = await apiClient.get('/chat/rooms');
    return response.data;
  },

  getMessages: async (roomId: string) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}/messages`);
    return response.data;
  },

  sendMessage: async (roomId: string, message: string) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, { message });
    return response.data;
  },

  markAsRead: async (roomId: string) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/read`);
    return response.data;
  },

  getChat: async (userId: string) => {
    const response = await apiClient.get(`/chat/${userId}`);
    return response.data;
  },

  addChat: async (userId: string, message: string) => {
    const response = await apiClient.post('/chat', { userId, message });
    return response.data;
  },

  updateChat: async (ids: string[]) => {
    const response = await apiClient.put('/chat', { ids });
    return response.data;
  },
};

export const paymentService = {
  getPlans: async () => {
    const response = await apiClient.get('/payments/plans');
    return response.data;
  },

  createPaymentIntent: async (planId: string) => {
    const response = await apiClient.post('/payments/create-intent', { planId });
    return response.data;
  },

  confirmPayment: async (paymentIntentId: string) => {
    const response = await apiClient.post('/payments/confirm', { paymentIntentId });
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await apiClient.get('/payments/history');
    return response.data;
  },

  createPaystackPayment: async (data: any) => {
    const response = await apiClient.post('/payments/paystack', data);
    return response.data;
  },
};

export const emailService = {
  sendEmail: async (data: any) => {
    const response = await apiClient.post('/email/send', data);
    return response.data;
  },

  getEmailTemplates: async () => {
    const response = await apiClient.get('/email/templates');
    return response.data;
  },

  resendValidationEmail: async (email: string) => {
    const response = await apiClient.post('/email/resend-validation', { email });
    return response.data;
  },
};

export const adminService = {
  getStats: () => apiClient.get('/admin/stats').then(res => res.data),
  getAllUsers: (params?: any) => apiClient.get('/admin/users', { params }).then(res => res.data.users),
  getUserDetails: (userId: string) => apiClient.get(`/admin/users/${userId}`).then(res => res.data),
  updateUserStatus: (userId: string, status: string) => apiClient.patch(`/admin/users/${userId}/status`, { status }).then(res => res.data),
  updateUserPlan: (userId: string, plan: string) => apiClient.put(`/admin/users/${userId}/plan`, { plan }).then(res => res.data),
  updateUser: (userId: string, data: any) => apiClient.put(`/admin/users/${userId}`, data).then(res => res.data),
  deleteUser: (userId: string) => apiClient.delete(`/admin/users/${userId}`).then(res => res.data),
  sendPasswordResetLink: (userId: string) => apiClient.post(`/admin/users/${userId}/reset-password`).then(res => res.data),
  verifyUserEmail: (userId: string) => apiClient.post(`/admin/users/${userId}/verify-email`).then(res => res.data),
  getSystemMetrics: () => apiClient.get('/admin/system').then(res => res.data),
  getAllCalls: (params?: any) => apiClient.get('/admin/calls', { params }).then(res => res.data),
  saveCallRecord: (data: any) => apiClient.post('/admin/calls', data).then(res => res.data),
  uploadCallRecording: (data: any) => apiClient.post('/admin/call-recordings', data).then(res => res.data),
  getChatReports: () => apiClient.get('/admin/chat-reports').then(res => res.data),
  sendChatReport: (data: any) => apiClient.post('/admin/send-chat-report', data).then(res => res.data),
  getMatchingInsights: () => apiClient.get('/admin/matching-insights').then(res => res.data),
  getEngagementMetrics: () => apiClient.get('/admin/engagement-metrics').then(res => res.data),
  getConversionMetrics: () => apiClient.get('/admin/conversion-metrics').then(res => res.data),
  getChurnAnalysis: () => apiClient.get('/admin/churn-analysis').then(res => res.data),
  getReferralAnalysis: () => apiClient.get('/admin/referral-analysis').then(res => res.data),
  getReportedProfiles: () => apiClient.get('/admin/reported-profiles').then(res => res.data),
  dismissReport: (reportId: string) => apiClient.patch(`/admin/reported-profiles/${reportId}/dismiss`).then(res => res.data),
  getVipUsers: () => apiClient.get('/admin/vip-users').then(res => res.data),
  getPotentialMatches: (userId: string) => apiClient.get(`/admin/users/${userId}/potential-matches`).then(res => res.data),
  sendMatchSuggestions: (userId: string, suggestedUserIds: string[]) => apiClient.post(`/admin/users/${userId}/suggest-matches`, { suggestedUserIds }).then(res => res.data),
  getScheduledEmails: () => apiClient.get('/admin/scheduled-emails').then(res => res.data),
  cancelScheduledEmail: (id: string) => apiClient.delete(`/admin/scheduled-emails/${id}`).then(res => res.data),
  sendAdminPushNotification: (data: any) => apiClient.post('/admin/push-notifications', data).then(res => res.data),
  getAdminPushNotifications: () => apiClient.get('/admin/push-notifications').then(res => res.data),
  getPaymentHistory: () => apiClient.get('/admin/payments').then(res => res.data),
  processRefund: (id: string) => apiClient.post(`/admin/payments/${id}/refund`).then(res => res.data),
  scheduleEmail: async (data: any) => {
    const response = await apiClient.post('/admin/schedule-email', data);
    return response.data;
  },
  getEmailConfig: () => apiClient.get('/admin/email-config').then(res => res.data),
  saveEmailConfig: (config: any) => apiClient.post('/admin/email-config', config).then(res => res.data),
  getEmailMetrics: () => apiClient.get('/admin/email-metrics').then(res => res.data),
  sendTestEmail: (email: string) => apiClient.post('/admin/test-email', { email }).then(res => res.data),
  sendBulkEmail: (data: any) => apiClient.post('/admin/bulk-email', data).then(res => res.data),
};

// Default export for backwards compatibility
const apiClientDefault = apiClient;
export default apiClientDefault;
