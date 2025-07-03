
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

const ValidateEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid validation link');
        return;
      }

      try {
        const response = await apiClient.post('/email/verify', { token });
        setStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify email. The link may be expired or invalid.');
        
        toast({
          title: "Verification Failed",
          description: "Failed to verify your email. Please try again.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [token, toast]);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleResendValidation = async () => {
    try {
      await apiClient.post('/email/send-validation', { 
        email: 'user-email' // In real implementation, you'd get this from user input
      });
      
      toast({
        title: "Validation Email Sent",
        description: "A new validation email has been sent to your inbox.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend validation email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="text-green-600 font-medium">{message}</p>
              <Button onClick={handleGoToLogin} className="w-full">
                Go to Login
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="text-red-600">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                  Go to Login
                </Button>
                <Button onClick={handleResendValidation} variant="secondary" className="w-full">
                  Resend Validation Email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidateEmail;
