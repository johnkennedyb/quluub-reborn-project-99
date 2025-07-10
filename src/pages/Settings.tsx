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

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [isPro, setIsPro] = useState(user?.plan === 'premium');
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
  const { toast } = useToast();
  const [currency, setCurrency] = useState<'GBP' | 'NGN'>('GBP');

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
  }, []);

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

    const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      if (currency === 'GBP') {
        // Use the new Stripe backend endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ priceId: 'price_1Q5CNeBbkcQFdkf0i8BryMoN' }), // Premium discounted price
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create Stripe checkout session');
        }

        const session = await response.json();
        window.location.href = session.url;
      } else {
        // Use the existing Paystack service for NGN
        const { authorization_url } = await paymentService.createPaystackPayment();
        window.location.href = authorization_url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: (error as Error).message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
    // No finally block needed as we only want to stop loading on error. On success, the page redirects.
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
      await userService.updateProfile(user?._id || '', { hidden: !user?.hidden });
      updateUser({ hidden: !user?.hidden });
      toast({
        title: user?.hidden ? "Profile shown" : "Profile hidden",
        description: user?.hidden ? "Your profile is now visible to others." : "Your profile is now hidden from others.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile visibility.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container py-6">
        {/* Email validation banner */}
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertDescription className="flex items-center gap-2">
            <span className="bg-yellow-400 text-white p-1 rounded-full">!</span>
            Please validate your email address to continue
            <Button variant="outline" size="sm" className="ml-auto bg-blue-600 text-white hover:bg-blue-700">
              Resend validation mail
            </Button>
          </AlertDescription>
        </Alert>
        
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
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
                    <Button onClick={handleApplyReferral} size="sm">
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
                  <Button variant={currency === 'GBP' ? 'default' : 'outline'} size="sm" onClick={() => setCurrency('GBP')}>GBP</Button>
                  <Button variant={currency === 'NGN' ? 'default' : 'outline'} size="sm" onClick={() => setCurrency('NGN')}>NGN</Button>
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
                        onClick={handleUpgrade}
                        disabled={isLoadingPayment}
                      >
                        {isLoadingPayment ? "Processing..." : "Upgrade to Premium"}
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
                  <Button variant="outline" className="w-full border-red-300 text-red-500 hover:bg-red-50">
                    Delete my account
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
