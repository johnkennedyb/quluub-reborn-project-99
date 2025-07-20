import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Check, CheckCircle, BadgeDollarSign, Eye, EyeOff, Mail, HelpCircle, Copy, Gift } from "lucide-react";
import { Lock } from "@/components/Icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/api-client";
import { paymentService } from "@/lib/api-client";
import { isPremiumUser, getPlanDisplayName } from "@/utils/premiumUtils";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [isPro, setIsPro] = useState(isPremiumUser(user));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    completedReferrals: 0
  });
  const [applyReferralCode, setApplyReferralCode] = useState("");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const { toast } = useToast();
  // Automatically detect currency based on user's country
  const getUserCurrency = () => {
    if (user?.country === 'Nigeria') {
      return 'NGN';
    }
    return 'GBP'; // Default to GBP for UK and other countries
  };
  
  const [currency] = useState<'GBP' | 'NGN'>(getUserCurrency());
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const pricing = {
    GBP: {
      premium: '2',
      original: '5',
      symbol: '£',
    },
    NGN: {
      premium: '3000',
      original: '7500',
      symbol: '₦',
    },
  };

  useEffect(() => {
    fetchReferralStats();
    checkPaymentSuccess();
  }, []);

  // Check for payment success and refresh user status
  const checkPaymentSuccess = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const provider = urlParams.get('provider');
    const reference = urlParams.get('trxref') || urlParams.get('reference'); // Paystack reference
    
    if (paymentSuccess === 'true') {
      setIsCheckingPayment(true);
      
      // Show immediate success popup
      toast({
        title: "🎉 Payment Successful!",
        description: `Your ${provider === 'stripe' ? 'Stripe' : 'Paystack'} payment was successful. Processing your upgrade...`,
        variant: "default",
        duration: 4000,
      });
      
      // Clean up URL parameters immediately to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Try multiple attempts to verify payment with increasing delays
      let attempts = 0;
      const maxAttempts = 5;
      const baseDelay = 2000; // Start with 2 seconds
      
      const attemptVerification = async () => {
        attempts++;
        console.log(`Payment verification attempt ${attempts}/${maxAttempts}`);
        
        try {
          // First try to refresh user data
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const updatedUser = await response.json();
            
            // Check if user is already upgraded to premium
            if (updatedUser.plan === 'premium') {
              updateUser(updatedUser);
              setIsPro(isPremiumUser(updatedUser));
              setIsCheckingPayment(false);
              
              // Show premium upgrade confirmation
              toast({
                title: "🚀 Welcome to Premium!",
                description: "Congratulations! You now have access to all premium features: unlimited requests, ad-free browsing, video calling, and more!",
                variant: "default",
                duration: 8000,
              });
              return true; // Success
            }
          }
          
          // If webhook hasn't processed yet, try manual verification
          if (provider && reference) {
            const manualResult = await tryManualVerification(provider, reference);
            if (manualResult) {
              setIsCheckingPayment(false);
              return true; // Success
            }
          }
          
          // If not successful and we have more attempts, try again
          if (attempts < maxAttempts) {
            const delay = baseDelay * attempts; // Exponential backoff
            console.log(`Retrying in ${delay}ms...`);
            setTimeout(attemptVerification, delay);
          } else {
            // All attempts failed
            setIsCheckingPayment(false);
            toast({
              title: "⚠️ Payment Processing",
              description: "Your payment was successful, but the upgrade is taking longer than expected. Please refresh the page in a few minutes or contact support if the issue persists.",
              variant: "destructive",
              duration: 10000,
            });
          }
          
        } catch (error) {
          console.error(`Payment verification attempt ${attempts} failed:`, error);
          
          if (attempts < maxAttempts) {
            const delay = baseDelay * attempts;
            setTimeout(attemptVerification, delay);
          } else {
            setIsCheckingPayment(false);
            toast({
              title: "❌ Verification Error",
              description: "There was an error verifying your payment. Please refresh the page or contact support.",
              variant: "destructive",
              duration: 10000,
            });
          }
        }
        
        return false; // Not successful yet
      };
      
      // Start the verification process
      attemptVerification();
    }
  };

  // Manual payment verification fallback
  const tryManualVerification = async (provider, reference) => {
    if (provider === 'paystack' && reference) {
      try {
        console.log('Attempting manual payment verification for Paystack...');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/verify-and-upgrade`, {
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
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh user data
            const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (userResponse.ok) {
              const updatedUser = await userResponse.json();
              updateUser(updatedUser);
              setIsPro(isPremiumUser(updatedUser));
              
              toast({
                title: "🚀 Welcome to Premium!",
                description: "Payment verified! You now have access to all premium features!",
                variant: "default",
                duration: 8000,
              });
              return true; // Success
            }
          }
        } else {
          console.error('Manual verification failed');
        }
      } catch (error) {
        console.error('Error in manual payment verification:', error);
      }
    }
    
    // For Stripe, we don't have manual verification, so just return false
    return false;
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/referrals/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode || '');
        setReferralStats(data.referralStats || {
          totalReferrals: 0,
          activeReferrals: 0,
          completedReferrals: 0
        });
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/referrals/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode);
        toast({
          title: "Referral code generated",
          description: "Your referral code has been created successfully.",
          variant: "success",
        });
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral code.",
        variant: "destructive",
      });
    }
  };

  const handleApplyReferral = async () => {
    if (!applyReferralCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/referrals/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ referralCode: applyReferralCode })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Referral applied",
          description: "Referral code applied successfully!",
          variant: "success",
        });
        setApplyReferralCode("");
        fetchReferralStats();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to apply referral code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying referral code:', error);
      toast({
        title: "Error",
        description: "Failed to apply referral code.",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  };

    const handleUpgrade = async (plan: string, amount: string, currency: 'GBP' | 'NGN') => {
    setIsUpgrading(true);
    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        toast({ title: "Invalid Amount", description: "The payment amount is not valid.", variant: "destructive" });
        setIsUpgrading(false);
        return;
      }

      if (currency === 'GBP') {
        const response = await paymentService.createStripePayment(plan, numericAmount, currency.toLowerCase());
        if (response.url) {
          window.location.href = response.url;
        }
      } else if (currency === 'NGN') {
        const amountInKobo = numericAmount * 100;
        const response = await paymentService.createPaystackPayment(plan, amountInKobo);
        if (response.url) {
          window.location.href = response.url;
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: (error as Error).message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been changed successfully.",
          variant: "success",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to change password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password.",
        variant: "destructive",
      });
    }
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@quluub.com';
  };

  const handleHideProfile = async () => {
    try {
      const updatedUser = await userService.updateProfile(user?._id || '', { hidden: !user?.hidden });
      updateUser(updatedUser);
      toast({
        title: updatedUser.hidden ? "Profile Hidden" : "Profile Visible",
        description: updatedUser.hidden ? "Your profile is now hidden from search results." : "Your profile is now visible in search results.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update profile visibility.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsDeletingAccount(true);
    try {
      await userService.deleteAccount();
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        variant: "success",
      });
      // Log out the user and redirect to home page
      localStorage.removeItem('token');
      updateUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container py-6">
        
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        {/* Payment Processing Banner */}
        {isCheckingPayment && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <div>
                <h3 className="font-semibold text-green-800">🎉 Payment Successful!</h3>
                <p className="text-green-700 text-sm">We're upgrading you to Premium now. This will take just a moment...</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Referral System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Referral System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Your Referral Code</h3>
                  {referralCode ? (
                    <div className="flex items-center gap-2">
                      <Input value={referralCode} readOnly />
                      <Button onClick={copyReferralCode} size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={generateReferralCode}>Generate Code</Button>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    Successful Referrals: <strong>{referralStats.completedReferrals}</strong>
                  </div>
                  <p className="mt-1 text-sm text-green-600">
                    You get 1 month of Premium for every 5 successful referrals!
                  </p>
                  {referralStats.completedReferrals > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      You are <strong>{5 - (referralStats.completedReferrals % 5)}</strong> referrals away from your next reward.
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Apply Referral Code</h3>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Enter referral code"
                      value={applyReferralCode}
                      onChange={(e) => setApplyReferralCode(e.target.value)}
                    />
                    <Button onClick={() => handleApplyReferral()} size="sm">
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5" />
                  Manage My Plan
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currency}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {currency === 'NGN' ? 'Nigeria' : 'International'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <Card className={`border ${!isPro ? 'border-primary shadow-md' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Freemium</span>
                      {!isPro && <Badge className="bg-green-500">Active</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-center">{pricing[currency].symbol}0<span className="text-base font-normal text-muted-foreground">/month</span></div>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Requests Sent Per Month:</span>
                        <span className="font-medium">2</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Requests Received Per Month:</span>
                        <span className="font-medium">Unlimited</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Message Allowance:</span>
                        <span className="font-medium">10</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Word Count Per Message:</span>
                        <span className="font-medium">20</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Ad-free Browsing:</span>
                        <span className="font-medium">No</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Video Calling:</span>
                        <span className="font-medium">No</span>
                      </li>
                    </ul>
                    {!isPro && (
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        disabled
                      >
                        Current Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                {/* Pro Plan */}
                <Card className={`border ${isPro ? 'border-primary shadow-md' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>Premium</span>
                      {isPro && <Badge className="bg-green-500">Active</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold text-center">
                      {pricing[currency].symbol}{pricing[currency].premium} <span className="text-lg font-normal text-muted-foreground line-through">{pricing[currency].symbol}{pricing[currency].original}</span>
                      <span className="text-base font-normal text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between">
                        <span>Requests Sent Per Month:</span>
                        <span className="font-medium">5</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Requests Received Per Month:</span>
                        <span className="font-medium">Unlimited</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Ad-free Browsing:</span>
                        <span className="font-medium">Yes</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Video Calling:</span>
                        <span className="font-medium">Yes</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Message Allowance:</span>
                        <span className="font-medium">10</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Word Count Per Message:</span>
                        <span className="font-medium">20</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Ad-free Browsing:</span>
                        <span className="font-medium">Yes</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Video Calling:</span>
                        <span className="font-medium">Yes</span>
                      </li>
                    </ul>
                    {!isPro ? (
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        onClick={() => handleUpgrade('premium', pricing[currency].premium, currency)}
                        disabled={isUpgrading || isCheckingPayment}
                      >
                        {isCheckingPayment ? "Verifying Payment..." : isUpgrading ? "Processing..." : "Upgrade to Premium"}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        disabled
                      >
                        Current Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change My Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Input 
                    type={showCurrentPassword ? "text" : "password"} 
                    placeholder="Current password*" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="New password*" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm password*" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handlePasswordChange}
                className="w-full md:w-auto md:ml-auto block"
              >
                Change password
              </Button>
            </CardContent>
          </Card>
          
          {/* Help Center */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Toggle visibility</h3>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-300 text-red-500 hover:bg-red-50"
                    onClick={handleHideProfile}
                  >
                    {user?.hidden ? 'Show my profile' : 'Hide my profile'}
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Having any issues?</h3>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-500 hover:bg-blue-50"
                    onClick={handleContactSupport}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Contact us
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Please be sure!</h3>
                  <Button 
                    variant="outline" 
                    className="w-full border-red-300 text-red-500 hover:bg-red-50"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete my account'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Settings;
