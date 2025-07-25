import axios from 'axios';
import type { LoginCredentials, SignupData, User } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Check if this is an admin request
    if (config.url?.includes('/admin/')) {
      const adminToken = localStorage.getItem('adminToken');
      console.log('🔐 Admin API request:', {
        url: config.url,
        hasToken: !!adminToken,
        tokenPrefix: adminToken ? adminToken.substring(0, 10) + '...' : 'none'
      });
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // Regular user token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });

    if (error.response?.status === 401) {
      // Check if this was an admin request
      if (error.config?.url?.includes('/admin/')) {
        console.error('❌ Admin authentication failed, clearing admin tokens');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        if (window.location.pathname.includes('/admin')) {
          window.location.href = '/admin/login';
        }
      } else {
        // Regular user token expired
        console.error('❌ User authentication failed, clearing user token');
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/admin') && !window.location.pathname.includes('/auth')) {
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Auth service login error:', error);
      throw error;
    }
  },
  
  signup: async (userData: SignupData) => {
    try {
      const response = await apiClient.post('/auth/signup', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      console.error('Auth service signup error:');
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request:', error.request);
      } else {
        // Something happened in setting up the request
        console.error('Error:', error.message);
      }
      throw error;
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Auth service getCurrentUser error:', error);
      throw error;
    }
  },
  
  getProfile: async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Auth service getProfile error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await apiClient.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Auth service changePassword error:', error);
      throw error;
    }
  }
};

// User service
export const userService = {
  getProfile: async (userId: string) => {
    const response = await apiClient.get(`/users/profile/${userId}`);
    return response.data;
  },
  
  updateProfile: async (userId: string, profileData: any) => {
    const response = await apiClient.put(`/users/${userId}`, profileData);
    return response.data;
  },
  
  getBrowseUsers: async (params?: any) => {
    const response = await apiClient.get('/users/browse', { params });
    return response.data;
  },
  
  upgradePlan: async (planData: { email: string; plan: string }) => {
    const response = await apiClient.post('/users/upgrade-plan', planData);
    return response.data;
  },
  
  // Favorites
  addToFavorites: async (userId: string) => {
    console.log(`API: Adding user ${userId} to favorites`);
    const response = await apiClient.post(`/users/favorites/${userId}`);
    return response.data;
  },
  
  removeFromFavorites: async (userId: string) => {
    console.log(`API: Removing user ${userId} from favorites`);
    const response = await apiClient.delete(`/users/favorites/${userId}`);
    return response.data;
  },
  
  getFavorites: async () => {
    console.log('API: Getting user favorites');
    const response = await apiClient.get('/users/favorites');
    return response.data;
  },

  getProfileViewsCount: async () => {
    try {
      const response = await apiClient.get('/users/profile-views-count');
      return response.data;
    } catch (error) {
      console.error('Get profile views count error:', error);
      throw error;
    }
  },

  logProfileView: async (userId: string) => {
    try {
      const response = await apiClient.post('/users/log-profile-view', { userId });
      return response.data;
    } catch (error) {
      console.error('Log profile view error:', error);
      throw error;
    }
  },

  // Optimized profile endpoint that combines profile and relationship data
  getProfileOptimized: async (userId: string) => {
    try {
      const response = await apiClient.get(`/users/profile-optimized/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get optimized profile error:', error);
      throw error;
    }
  },

  deleteAccount: async () => {
    const response = await apiClient.delete('/users/account');
    console.log('🗑️ Delete account response:', response);
    return response;
  },
};

// Relationship service
export const relationshipService = {
  
  respondToRequest: async (requestId: string, action: 'accept' | 'reject') => {
    // Map frontend actions to backend status values
    const status = action === 'accept' ? 'matched' : 'rejected';
    const response = await apiClient.put(`/relationships/${requestId}/status`, { status });
    return response.data;
  },
  
  getReceivedRequests: async () => {
    const response = await apiClient.get('/relationships/pending');
    return response.data;
  },
  
  getPendingRequests: async () => {
    const response = await apiClient.get('/relationships/pending');
    return response.data;
  },
  
  getSentRequests: async () => {
    const response = await apiClient.get('/relationships/sent');
    return response.data;
  },
  
  getMatches: async () => {
    const response = await apiClient.get('/relationships/matches');
    return response.data;
  },
  
  withdrawRequest: async (relationshipId: string) => {
    const response = await apiClient.delete(`/relationships/withdraw/${relationshipId}`);
    return response.data;
  },
  
  sendRequest: async (userId: string) => {
    const response = await apiClient.post('/relationships/request', { followedUserId: userId });
    return response.data;
  }
};

// Chat service  
export const chatService = {
  getConversations: async () => {
    const response = await apiClient.get('/chats/conversations');
    return response.data;
  },
  
  getMessages: async (userId: string) => {
    const response = await apiClient.get(`/chats/messages/${userId}`);
    return response.data;
  },
  
  sendMessage: async (receiverId: string, message: string) => {
    const response = await apiClient.post('/chats/send', { userId: receiverId, message });
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get('/chats/unread');
    return response.data;
  },

  // Legacy chat endpoints for compatibility
  getChat: async (userId: string) => {
    const response = await apiClient.get(`/chats/chat?userId=${userId}`);
    return response.data;
  },

  addChat: async (userId: string, message: string) => {
    const response = await apiClient.post('/chats/chat', { userId, message });
    return response.data;
  },

  updateChat: async (ids: string[]) => {
    const response = await apiClient.put('/chats/chat', { ids });
    return response.data;
  }
};

// Payment service
export const paymentService = {
  createStripePayment: async (plan: string, amount: number, currency: string) => {
    const response = await apiClient.post('/payments/create-checkout-session', { plan, amount, currency });
    return response.data;
  },
  createPaystackPayment: (plan: string, amount: number) => {
    console.log('API: Creating Paystack payment for', { plan, amount });
    return apiClient.post('/payments/create-paystack-payment', { plan, amount }).then(res => res.data);
  },
};

// Admin service
export const adminService = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Admin stats error:', error);
      throw error;
    }
  },
  
  getAllUsers: async (params?: any) => {
    try {
      const response = await apiClient.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Admin users error:', error);
      throw error;
    }
  },
  
  getUserDetails: async (userId: string) => {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Admin user details error:', error);
      throw error;
    }
  },
  
  updateUserAccountStatus: async (userId: string, status: string, reportId?: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/status`, { status, reportId });
      return response.data;
    } catch (error) {
      console.error('Admin update user status error:', error);
      throw error;
    }
  },

  // Calls
  getAllCalls: async (params?: any) => {
    try {
      const response = await apiClient.get('/admin/calls', { params });
      return response.data;
    } catch (error) {
      console.error('Admin calls error:', error);
      throw error;
    }
  },
  
  saveCallRecord: async (callData: any) => {
    try {
      const response = await apiClient.post('/admin/calls', callData);
      return response.data;
    } catch (error) {
      console.error('Admin save call record error:', error);
      throw error;
    }
  },
  
  uploadCallRecording: async (file: File, conversationId: string, duration?: number) => {
    try {
      const formData = new FormData();
      formData.append('recording', file);
      formData.append('conversationId', conversationId);
      if (duration) {
        formData.append('duration', duration.toString());
      }
      
      const response = await apiClient.post('/admin/call-recordings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Admin upload call recording error:', error);
      throw error;
    }
  },

  // Subscriptions and Payments
  getAllSubscriptions: async () => {
    try {
      const response = await apiClient.get('/admin/subscriptions');
      return response.data;
    } catch (error) {
      console.error('Admin subscriptions error:', error);
      throw error;
    }
  },

  getPaymentHistory: async (params?: any) => {
    try {
      const response = await apiClient.get('/admin/payments', { params });
      return response.data;
    } catch (error) {
      console.error('Admin payments error:', error);
      throw error;
    }
  },

  processRefund: async (paymentId: string) => {
    try {
      const response = await apiClient.post(`/admin/payments/${paymentId}/refund`);
      return response.data;
    } catch (error) {
      console.error('Admin process refund error:', error);
      throw error;
    }
  },

  // User Management
  updateUser: async (userId: string, userData: any) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Admin update user error:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Admin delete user error:', error);
      throw error;
    }
  },

  sendPasswordResetLink: async (userId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      console.error('Admin send password reset link error:', error);
      throw error;
    }
  },

  updateUserPlan: async (userId: string, plan: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/plan`, { plan });
      return response.data;
    } catch (error) {
      console.error('Admin update user plan error:', error);
      throw error;
    }
  },

    verifyUserEmail: async (userId: string) => {
    try {
      const response = await apiClient.post(`/admin/users/${userId}/verify-email`);
      return response.data;
    } catch (error) {
      console.error('Admin verify user email error:', error);
      throw error;
    }
  },

  // Reports
  getReportedProfiles: async () => {
    try {
      const response = await apiClient.get('/admin/reported-profiles');
      return response.data;
    } catch (error) {
      console.error('Admin get reported profiles error:', error);
      throw error;
    }
  },

  dismissReport: async (reportId: string) => {
    try {
      const response = await apiClient.put(`/admin/reports/${reportId}/dismiss`);
      return response.data;
    } catch (error) {
      console.error('Admin dismiss report error:', error);
      throw error;
    }
  },

  // Push Notifications
  sendAdminPushNotification: async (notificationData: any) => {
    try {
      const response = await apiClient.post('/admin/push-notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Admin send push notification error:', error);
      throw error;
    }
  },

  getAdminPushNotifications: async (params?: any) => {
    try {
      const response = await apiClient.get('/admin/push-notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Admin get push notifications error:', error);
      throw error;
    }
  },

  // Email Marketing
  getEmailConfig: async () => {
    try {
      const response = await apiClient.get('/admin/email-config');
      return response.data;
    } catch (error) {
      console.error('Admin get email config error:', error);
      throw error;
    }
  },

  saveEmailConfig: async (configData: any) => {
    try {
      const response = await apiClient.post('/admin/email-config', configData);
      return response.data;
    } catch (error) {
      console.error('Admin save email config error:', error);
      throw error;
    }
  },

  sendBulkEmail: async (emailData: { recipients: string[], subject: string, message: string, attachments?: File[] }) => {
    try {
      const formData = new FormData();
      formData.append('recipients', JSON.stringify(emailData.recipients));
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);
      if (emailData.attachments) {
        emailData.attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const response = await apiClient.post('/admin/bulk-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Admin send bulk email error:', error);
      throw error;
    }
  },

  sendTestEmail: async (testEmail: string) => {
    try {
      const response = await apiClient.post('/admin/test-email', { testEmail });
      return response.data;
    } catch (error) {
      console.error('Admin send test email error:', error);
      throw error;
    }
  },

  getEmailMetrics: async () => {
    try {
      const response = await apiClient.get('/admin/email-metrics');
      return response.data;
    } catch (error) {
      console.error('Admin email metrics error:', error);
      throw error;
    }
  }
};

// Feed service
export const feedService = {
  getFeed() {
    return apiClient.get('/feed');
  },

  markFeedItemRead(itemId: string) {
    return apiClient.put(`/feed/${itemId}/read`);
  },
};

// Video call service
export const videoCallService = {
  initiateCall: async (partnerId: string) => {
    console.log(`API: Initiating video call with partner ${partnerId}`);
    const response = await apiClient.post('/video-call/initiate', { partnerId });
    return response.data;
  },
  
  getCallStatus: async (partnerId: string) => {
    console.log(`API: Getting call status for partner ${partnerId}`);
    const response = await apiClient.get(`/video-call/status/${partnerId}`);
    return response.data;
  }
};

// Email service
export const emailService = {
  sendValidation: async (email: string) => {
    console.log(`API: Sending validation email to ${email}`);
    const response = await apiClient.post('/email/send-validation', { email });
    return response.data;
  },
  
  verifyEmail: async (token: string) => {
    console.log(`API: Verifying email with token`);
    const response = await apiClient.post('/email/verify', { token });
    return response.data;
  },
  
  resendValidationEmail: async (email: string) => {
    console.log(`API: Resending validation email to ${email}`);
    const response = await apiClient.post('/auth/resend-validation', { email });
    return response.data;
  },
  
 
  
  getVerificationStatus: async () => {
    console.log('API: Getting email verification status');
    const response = await apiClient.get('/email/status');
    return response.data;
  }
};

export default apiClient;
