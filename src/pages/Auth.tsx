
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import SignupForm from '@/components/SignupForm';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, login, signup } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (username: string, password: string) => {
    try {
      await login({ username, password });
      toast({ title: 'Success', description: 'Logged in successfully!' });
    } catch (error: any) {
      toast({ 
        title: 'Login Failed', 
        description: error.message || 'Invalid credentials', 
        variant: 'destructive' 
      });
    }
  };

  const handleSignup = async (data: any) => {
    try {
      await signup({
        username: data.username || `${data.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
        email: data.email,
        password: data.password,
        fname: data.firstName,
        lname: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        ethnicity: data.ethnicity,
        countryOfResidence: data.countryOfResidence,
        cityOfResidence: data.cityOfResidence,
        summary: data.summary,
      });
      toast({ title: 'Success', description: 'Account created successfully!' });
    } catch (error: any) {
      toast({ 
        title: 'Signup Failed', 
        description: error.message || 'Failed to create account', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm 
            onLogin={handleLogin}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm 
            onSignup={handleSignup}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
