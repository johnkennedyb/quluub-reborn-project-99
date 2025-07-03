
import { createContext, useContext, useEffect, useState } from 'react';
import { adminService } from '@/lib/api-client';

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
  adminLogin: (credentials: { username: string; password: string }) => Promise<AdminUser>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  adminUser: null,
  isAdminAuthenticated: false,
  isLoading: true,
  adminLogin: async () => {
    throw new Error('AdminAuth context not initialized');
  },
  adminLogout: () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAdminAuth = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        const storedAdminUser = localStorage.getItem('adminUser');
        
        console.log('🔍 Admin auth init:', {
          hasToken: !!adminToken,
          hasUser: !!storedAdminUser
        });

        if (adminToken && storedAdminUser) {
          try {
            const parsedUser = JSON.parse(storedAdminUser);
            console.log('Admin user found in storage:', parsedUser.username);
            
            // Verify the token is still valid by making a test request
            await adminService.getStats();
            setAdminUser(parsedUser);
            console.log('Admin authentication verified');
          } catch (error) {
            console.error('Admin token verification failed:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
          }
        } else {
          console.log('No admin authentication found');
        }
      } catch (error) {
        console.error('Failed to initialize admin auth:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdminAuth();
  }, []);

  const adminLogin = async (credentials: { username: string; password: string }): Promise<AdminUser> => {
    setIsLoading(true);
    try {
      // Use the regular login endpoint but check for admin type
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user is admin
      if (data.user.type !== 'ADMIN') {
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('✅ Admin login successful:', data.user.username);
      
      // Store admin token and user data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      setAdminUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    console.log('Admin logged out');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated: !!adminUser,
        isLoading,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
