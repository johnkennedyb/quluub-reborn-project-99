import axios from 'axios';

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
  login: async (credentials: { username: string; password: string }) => {
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
  
  signup: async (userData: {
    username: string;
    email: string;
    password: string;
    fname: string;
    lname: string;
    gender: string;
    parentEmail?: string;
  }) => {
    try {
      const response = await apiClient.post('/auth/signup', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Auth service signup error:', error);
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
  }
};

// Relationship service
export const relationshipService = {
  sendRequest: async (followedUserId: string) => {
    const response = await apiClient.post('/relationships/request', { followedUserId });
    return response.data;
  },
  
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
  createPaystackPayment: async () => {
    console.log('API: Creating Paystack payment');
    const response = await apiClient.post('/payments/create-paystack-payment');
    return response.data;
  }
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
  
  updateUserStatus: async (userId: string, status: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Admin update user status error:', error);
      throw error;
    }
  },
  
  getSystemMetrics: async () => {
    try {
      const response = await apiClient.get('/admin/system');
      return response.data;
    } catch (error) {
      console.error('Admin system metrics error:', error);
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

  getAllPayments: async () => {
    try {
      const response = await apiClient.get('/admin/payments');
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

  resetUserPassword: async (userId: string) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      console.error('Admin reset password error:', error);
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

  // Email configuration methods
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

  sendBulkEmail: async (emailData: any) => {
    try {
      const response = await apiClient.post('/admin/bulk-email', emailData);
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
  
  resendValidation: async () => {
    console.log('API: Resending validation email');
    const response = await apiClient.post('/email/resend-validation');
    return response.data;
  },
  
  getVerificationStatus: async () => {
    console.log('API: Getting email verification status');
    const response = await apiClient.get('/email/status');
    return response.data;
  }
};

export default apiClient;
