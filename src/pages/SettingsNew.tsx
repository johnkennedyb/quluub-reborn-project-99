import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Crown, 
  Lock, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Shield,
  CreditCard,
  Mail,
  Phone,
  User,
  Settings as SettingsIcon
} from "lucide-react";

const Settings = () => {
  const { user: currentUser, setUser } = useAuth();
  const { toast } = useToast();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [loading, setLoading] = useState({
    password: false,
    plan: false,
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(prev => ({ ...prev, password: true }));
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handlePlanUpgrade = async () => {
    setLoading(prev => ({ ...prev, plan: true }));
    try {
      // This would typically redirect to a payment page or open a payment modal
      toast({
        title: "Upgrade Plan",
        description: "Redirecting to payment page...",
      });
      // Implement payment flow here
    } catch (error) {
      console.error("Plan upgrade error:", error);
      toast({
        title: "Error",
        description: "Failed to process plan upgrade",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, plan: false }));
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'gold':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="pt-16 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            <SettingsIcon className="h-6 w-6 mr-2" />
            Settings
          </h1>
          <p className="text-gray-600">Manage your account preferences and security</p>
        </div>

        <div className="space-y-6">
          {/* Plan Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                Manage my plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Plan</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getPlanBadgeColor(currentUser?.plan)}>
                      {currentUser?.plan || 'Free'}
                    </Badge>
                    {currentUser?.plan === 'free' && (
                      <span className="text-sm text-gray-500">Limited features</span>
                    )}
                  </div>
                </div>
                {currentUser?.plan === 'free' && (
                  <Button 
                    onClick={handlePlanUpgrade}
                    disabled={loading.plan}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {loading.plan ? "Processing..." : "Upgrade to Premium"}
                  </Button>
                )}
              </div>

              {currentUser?.plan === 'free' && (
                <Alert>
                  <CreditCard className="h-4 w-4" />
                  <AlertDescription>
                    Upgrade to Premium to unlock unlimited messaging, advanced search filters, 
                    and priority support.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Free Plan Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Basic profile creation</li>
                    <li>• Limited daily matches</li>
                    <li>• Basic search filters</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Premium Plan Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Unlimited messaging</li>
                    <li>• Advanced search filters</li>
                    <li>• Priority customer support</li>
                    <li>• Profile boost feature</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-blue-600" />
                Change my password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter your new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handlePasswordChange}
                disabled={loading.password || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                {loading.password ? "Changing Password..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Help Center Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-green-600" />
                Help center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Need assistance? We're here to help you with any questions or issues.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Contact Support</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>support@quluub.com</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Links</h4>
                  <div className="space-y-2">
                    <Button variant="ghost" className="justify-start p-0 h-auto">
                      FAQ & Common Issues
                    </Button>
                    <Button variant="ghost" className="justify-start p-0 h-auto">
                      Privacy Policy
                    </Button>
                    <Button variant="ghost" className="justify-start p-0 h-auto">
                      Terms of Service
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Account Information</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Username: {currentUser?.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email: {currentUser?.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4" />
                    <span>Plan: {currentUser?.plan || 'Free'}</span>
                  </div>
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
