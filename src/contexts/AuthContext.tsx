import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../lib/api-client';
import type { LoginCredentials, SignupData, User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (data: SignupData) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Found token in storage, fetching user data...');
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              console.log('User authenticated:', currentUser.username);
              setUser(currentUser);
            } else {
              console.log('No user data returned despite having token');
              localStorage.removeItem('token'); // Clean up invalid token
            }
          } catch (error) {
            console.error('Failed to fetch current user:', error);
            localStorage.removeItem('token'); // Clean up invalid token
          }
        } else {
          console.log('No authentication token found');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('token'); // Clean up on error
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      console.log('Login successful:', response.user.username);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.signup(data);
      console.log('Signup successful:', response.user.username);
      setUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    console.log('User logged out');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      console.log('User updated:', updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
