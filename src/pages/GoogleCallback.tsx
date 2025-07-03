
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          title: 'Authentication Failed',
          description: 'Google authentication was cancelled or failed',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        toast({
          title: 'Authentication Failed',
          description: 'No authorization code received from Google',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      try {
        console.log('Processing Google OAuth callback with code');
        
        // Send the authorization code to your backend
        const response = await apiClient.post('/auth/google', {
          code,
          redirectUri: `${window.location.origin}/auth/google/callback`
        });

        if (response.data.token && response.data.user) {
          localStorage.setItem('token', response.data.token);
          
          // Update the user context
          updateUser(response.data.user);
          
          toast({
            title: 'Login Successful',
            description: 'Welcome to Quluub!',
          });

          // Parse the state to get the redirect URL
          let redirectTo = '/dashboard';
          if (state) {
            try {
              const parsedState = JSON.parse(state);
              redirectTo = parsedState.from || '/dashboard';
            } catch (e) {
              console.warn('Failed to parse state:', e);
            }
          }

          navigate(redirectTo);
        } else {
          throw new Error('No token or user data received from server');
        }
      } catch (error: any) {
        console.error('Google authentication error:', error);
        const errorMessage = error.response?.data?.message || 'Failed to authenticate with Google';
        
        toast({
          title: 'Authentication Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // If the error is about missing required fields, redirect to complete signup
        if (errorMessage.includes('gender') || errorMessage.includes('required')) {
          navigate('/auth?completeProfile=true');
        } else {
          navigate('/auth');
        }
      } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, toast, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Authenticating with Google</h2>
        <p className="text-gray-600">Please wait while we sign you in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
