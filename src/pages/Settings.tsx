
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, CreditCard, Lock, User, Shield, Trash2, LogOut, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentService, userService } from "@/lib/api-client";

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    matches: true,
    messages: true,
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    onlineStatus: true,
    readReceipts: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    // Load user preferences and subscription info
    const loadUserData = async () => {
      if (user) {
        try {
          // Load subscription details if premium user
          if (user.plan === 'premium') {
            // Load subscription info
            // const subData = await paymentService.getSubscription();
            // setSubscription(subData);
          }
          
          // Load payment history
          const paymentData = await paymentService.getPaymentHistory();
          setPaymentHistory(paymentData.payments || []);
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
    };
    
    loadUserData();
  }, [user]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings Updated", 
      description: "Your privacy settings have been saved.",
    });
  };

  const handleUpgradeToPremium = async () => {
    setLoading(true);
    try {
      const paymentUrl = await paymentService.createPaystackPayment('premium');
      window.location.href = paymentUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDeleteAccount = () => {
    // Implement account deletion logic
    toast({
      title: "Account Deletion",
      description: "This feature is not yet available. Please contact support.",
      variant: "destructive",
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <TopNavbar />
      <div className="container py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        {/* Account Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Profile Status</h3>
                <p className="text-sm text-muted-foreground">
                  Current Plan: {user.plan === 'premium' ? 'Premium' : 'Free'}
                </p>
              </div>
              <Badge variant={user.plan === 'premium' ? 'default' : 'secondary'}>
                {user.plan === 'premium' ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </>
                ) : (
                  'Free'
                )}
              </Badge>
            </div>
            
            {user.plan !== 'premium' && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Upgrade to Premium</h3>
                    <p className="text-sm text-muted-foreground">
                      Unlock unlimited matches, messaging, and advanced features
                    </p>
                  </div>
                  <Button onClick={handleUpgradeToPremium} disabled={loading}>
                    <Crown className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Upgrade'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={notifications.email}
                onCheckedChange={(value) => handleNotificationChange('email', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications</p>
              </div>
              <Switch
                id="push-notifications"
                checked={notifications.push}
                onCheckedChange={(value) => handleNotificationChange('push', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="match-notifications">New Match Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified of new matches</p>
              </div>
              <Switch
                id="match-notifications"
                checked={notifications.matches}
                onCheckedChange={(value) => handleNotificationChange('matches', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="message-notifications">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified of new messages</p>
              </div>
              <Switch
                id="message-notifications"
                checked={notifications.messages}
                onCheckedChange={(value) => handleNotificationChange('messages', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profile-visible">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">Make your profile visible to others</p>
              </div>
              <Switch
                id="profile-visible"
                checked={privacy.profileVisible}
                onCheckedChange={(value) => handlePrivacyChange('profileVisible', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="online-status">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch
                id="online-status"
                checked={privacy.onlineStatus}
                onCheckedChange={(value) => handlePrivacyChange('onlineStatus', value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="read-receipts">Read Receipts</Label>
                <p className="text-sm text-muted-foreground">Let others know when you've read their messages</p>
              </div>
              <Switch
                id="read-receipts"
                checked={privacy.readReceipts}
                onCheckedChange={(value) => handlePrivacyChange('readReceipts', value)}
              />
            </div>
          </CardContent>
        </Card>



        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{payment.plan} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{payment.amount}</p>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-700">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Log Out</h3>
                <p className="text-sm text-muted-foreground">
                  Sign out of your account on this device
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Navbar />
    </div>
  );
};

export default Settings;
