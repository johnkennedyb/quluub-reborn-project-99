import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const provider = searchParams.get('provider');
  const reference = searchParams.get('trxref') || searchParams.get('reference');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      setIsVerifying(true);
      
      // First try to refresh user data
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        
        // Check if user is already upgraded to premium
        if (updatedUser.plan === 'premium') {
          updateUser(updatedUser);
          setVerificationStatus('success');
          
          toast({
            title: "🚀 Welcome to Premium!",
            description: "Congratulations! You now have access to all premium features: unlimited requests, ad-free browsing, video calling, and more!",
            variant: "default",
            duration: 8000,
          });
          return;
        }
      }
      
      // If not upgraded yet, try manual verification for Paystack
      if (provider === 'paystack' && reference) {
        const verifyResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payments/verify-and-upgrade`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: 'paystack',
            reference: reference
          })
        });
        
        if (verifyResponse.ok) {
          const result = await verifyResponse.json();
          if (result.success) {
            // Refresh user data again
            const userResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (userResponse.ok) {
              const updatedUser = await userResponse.json();
              updateUser(updatedUser);
              setVerificationStatus('success');
              
              toast({
                title: "🚀 Welcome to Premium!",
                description: "Payment verified! You now have access to all premium features!",
                variant: "default",
                duration: 8000,
              });
              return;
            }
          }
        }
      }
      
      // If we reach here, verification failed
      setVerificationStatus('failed');
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setVerificationStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetryVerification = () => {
    setVerificationStatus('pending');
    verifyPayment();
  };

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {verificationStatus === 'pending' && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
            {verificationStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {verificationStatus === 'failed' && <AlertCircle className="h-6 w-6 text-red-500" />}
            
            {verificationStatus === 'pending' && 'Verifying Payment...'}
            {verificationStatus === 'success' && 'Payment Successful!'}
            {verificationStatus === 'failed' && 'Verification Needed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationStatus === 'pending' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                We're verifying your {provider === 'stripe' ? 'Stripe' : 'Paystack'} payment and upgrading your account...
              </p>
              <div className="animate-pulse text-sm text-gray-500">
                This usually takes a few seconds
              </div>
            </div>
          )}
          
          {verificationStatus === 'success' && (
            <div className="text-center">
              <p className="text-green-600 mb-4 font-medium">
                🎉 Congratulations! Your account has been upgraded to Premium.
              </p>
              <p className="text-gray-600 mb-4">
                You now have access to all premium features including unlimited requests, video calling, and ad-free browsing.
              </p>
              <Button onClick={handleGoToSettings} className="w-full">
                Go to Settings
              </Button>
            </div>
          )}
          
          {verificationStatus === 'failed' && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Your payment was successful, but we're still processing your upgrade. This can take a few minutes.
              </p>
              
              {reference && (
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Transaction Reference:</p>
                  <p className="font-mono text-sm break-all">{reference}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button onClick={handleRetryVerification} variant="outline" className="w-full">
                  Retry Verification
                </Button>
                <Button onClick={handleGoToSettings} className="w-full">
                  Go to Settings
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                If the issue persists, please contact support with your transaction reference.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
