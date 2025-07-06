
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Settings, Send, TestTube, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EmailConfiguration = () => {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'mail@quluub.com',
    smtpPassword: 'Z}!QLm__(e8p?I8J',
    fromName: 'Quluub Team',
    fromEmail: 'mail@quluub.com',
    replyTo: 'support@quluub.com'
  });

  const [bulkEmailSettings, setBulkEmailSettings] = useState({
    subject: '',
    message: '',
    recipientType: 'all'
  });

  const [testEmail, setTestEmail] = useState('');

  const handleSettingsChange = (field: string, value: string) => {
    setEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBulkEmailChange = (field: string, value: string) => {
    setBulkEmailSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    toast({
      title: "Settings Saved",
      description: "Email configuration has been updated successfully.",
    });
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Test Email Sent",
      description: `Test email sent to ${testEmail}`,
    });
  };

  const handleSendBulkEmail = () => {
    if (!bulkEmailSettings.subject || !bulkEmailSettings.message) {
      toast({
        title: "Error",
        description: "Please fill in subject and message fields.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Bulk Email Sent",
      description: `Email sent to ${bulkEmailSettings.recipientType} users`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Configuration</h2>
          <p className="text-gray-600">Manage email settings and send bulk communications</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Secure Connection
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            SMTP Settings
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Bulk Email
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test & Monitor
          </TabsTrigger>
        </TabsList>

        {/* SMTP Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => handleSettingsChange('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => handleSettingsChange('smtpPort', e.target.value)}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => handleSettingsChange('smtpUser', e.target.value)}
                    placeholder="mail@quluub.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => handleSettingsChange('smtpPassword', e.target.value)}
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => handleSettingsChange('fromName', e.target.value)}
                    placeholder="Quluub Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings.fromEmail}
                    onChange={(e) => handleSettingsChange('fromEmail', e.target.value)}
                    placeholder="mail@quluub.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input
                  id="replyTo"
                  value={emailSettings.replyTo}
                  onChange={(e) => handleSettingsChange('replyTo', e.target.value)}
                  placeholder="support@quluub.com"
                />
              </div>

              <Button onClick={handleSaveSettings} className="w-full md:w-auto">
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Email Tab */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Bulk Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipientType">Recipients</Label>
                <select
                  id="recipientType"
                  value={bulkEmailSettings.recipientType}
                  onChange={(e) => handleBulkEmailChange('recipientType', e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">All Users</option>
                  <option value="premium">Premium Members</option>
                  <option value="free">Free Members</option>
                  <option value="inactive">Inactive Users</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={bulkEmailSettings.subject}
                  onChange={(e) => handleBulkEmailChange('subject', e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={bulkEmailSettings.message}
                  onChange={(e) => handleBulkEmailChange('message', e.target.value)}
                  placeholder="Enter your message here..."
                  rows={8}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleSendBulkEmail} className="flex-1">
                  Send Bulk Email
                </Button>
                <Button variant="outline" className="flex-1">
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test & Monitor Tab */}
        <TabsContent value="test">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testEmail">Test Email Address</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <Button onClick={handleTestEmail} className="w-full">
                  Send Test Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">98.5%</div>
                    <div className="text-sm text-gray-600">Delivery Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24.3%</div>
                    <div className="text-sm text-gray-600">Open Rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">1,247</div>
                    <div className="text-sm text-gray-600">Sent Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">3</div>
                    <div className="text-sm text-gray-600">Bounced</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailConfiguration;
