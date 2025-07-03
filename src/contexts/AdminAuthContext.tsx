
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  type: 'ADMIN';
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  adminLogin: (credentials: { username: string; password: string }) => Promise<void>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAdminAuthenticated = !!adminUser;

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const storedAdminUser = localStorage.getItem('adminUser');
      
      console.log('🔍 Admin auth init:', { hasToken: !!token, hasUser: !!storedAdminUser });
      
      if (token && storedAdminUser) {
        try {
          console.log('🔍 Verifying stored admin token...');
          
          // Test the token with a simple API call
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const parsedUser = JSON.parse(storedAdminUser);
            console.log('✅ Admin token verified, user restored:', parsedUser.username);
            setAdminUser(parsedUser);
          } else {
            console.log('❌ Admin token validation failed, clearing storage');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
          }
        } catch (error) {
          console.error('❌ Admin token validation error:', error);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const adminLogin = async (credentials: { username: string; password: string }) => {
    try {
      setIsLoading(true);
      
      console.log('🔐 Attempting admin login for:', credentials.username);
      
      // Use the regular auth login but validate admin privileges
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('🔐 Login response:', { 
        status: response.status, 
        userType: data.user?.type,
        hasUser: !!data.user,
        hasToken: !!data.token
      });

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user is admin - accept both 'ADMIN' and 'admin' for flexibility
      const userType = data.user?.type?.toUpperCase();
      if (!data.user || userType !== 'ADMIN') {
        console.log('❌ Admin access denied:', {
          userExists: !!data.user,
          userType: data.user?.type,
          expectedType: 'ADMIN'
        });
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store admin-specific token and user data
      const adminToken = data.token;
      const adminUserData = {
        ...data.user,
        type: 'ADMIN' as const // Normalize to uppercase
      };

      console.log('✅ Storing admin credentials:', {
        token: adminToken.substring(0, 10) + '...',
        userData: adminUserData.username
      });

      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminUser', JSON.stringify(adminUserData));
      
      setAdminUser(adminUserData);

      toast({
        title: "Admin login successful",
        description: "Welcome to the admin dashboard!",
      });
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      // Clean up any partial state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    console.log('🔐 Admin logout');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel.",
    });
  };

  const value: AdminAuthContextType = {
    adminUser,
    isAdminAuthenticated,
    isLoading,
    adminLogin,
    adminLogout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
