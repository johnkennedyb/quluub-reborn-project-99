
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { MultiSelect } from 'react-multi-select-component';
import { Loader2 } from 'lucide-react';

// New ScheduledEmailList Component
const ScheduledEmailList = ({ refreshKey }: { refreshKey: number }) => {
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchScheduledEmails = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/admin/emails/scheduled');
        setScheduledEmails(response.data);
      } catch (error) {
        console.error('Failed to fetch scheduled emails:', error);
        toast({ title: 'Error', description: 'Failed to load scheduled emails', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchScheduledEmails();
  }, [refreshKey, toast]);

  const handleCancelEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    
    try {
      await apiClient.delete(`/admin/emails/scheduled/${emailId}`);
      toast({ title: 'Success', description: 'Email schedule cancelled' });
      setScheduledEmails(scheduledEmails.filter((email: any) => email._id !== emailId));
    } catch (error) {
      console.error('Failed to cancel email:', error);
      toast({ title: 'Error', description: 'Failed to cancel scheduled email', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {scheduledEmails.length === 0 ? (
        <p className="text-center text-muted-foreground">No scheduled emails found</p>
      ) : (
        scheduledEmails.map((email: any) => (
          <Card key={email._id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{email.subject}</h3>
                <p className="text-sm text-muted-foreground">
                  Scheduled for: {new Date(email.sendAt).toLocaleString()}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCancelEmail(email._id)}
              >
                Cancel
              </Button>
            </div>
            <p className="text-sm bg-gray-50 p-2 rounded">{email.message}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Recipients: {email.recipientType === 'specific' 
                ? `${email.recipients.length} specific users` 
                : email.recipientType}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

const EmailManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // State for Compose tab
  const [recipientType, setRecipientType] = useState('specific');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  // State for Settings tab
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPassword: '',
    fromName: '', fromEmail: '', replyTo: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [emailMetrics, setEmailMetrics] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, configRes, metricsRes] = await Promise.all([
        apiClient.get('/admin/users?limit=10000'),
        apiClient.get('/admin/email-config'),
        apiClient.get('/admin/email-metrics')
      ]);
      
      setUsers(usersRes.data.users.map((user: any) => ({ 
        label: `${user.fname} ${user.lname} (${user.email})`, 
        value: user._id 
      })));
      
      setEmailSettings(configRes.data);
      setEmailMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to load initial email data:', error);
      toast({ title: 'Error', description: 'Failed to load initial email data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleSendOrSchedule = async () => {
    if (!subject || !message) {
      return toast({ title: 'Error', description: 'Subject and message are required.', variant: 'destructive' });
    }

    let recipients: string[] = [];
    if (recipientType === 'specific') {
      if (selectedUsers.length === 0) return toast({ title: 'Error', description: 'Please select at least one user.', variant: 'destructive' });
      recipients = selectedUsers.map((u: any) => u.value);
    }

    setLoading(true);
    try {
      const payload = { 
        recipients,
        subject, 
        message,
        recipientType: recipientType !== 'specific' ? recipientType : undefined
      };
      
      if (scheduleDate) {
        await apiClient.post('/admin/emails/schedule', { 
          ...payload, 
          sendAt: scheduleDate 
        });
        toast({ title: 'Success', description: 'Email scheduled successfully.' });
      } else {
        await apiClient.post('/admin/emails/send', payload);
        toast({ title: 'Success', description: 'Email sent successfully.' });
      }
      
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      setScheduleDate('');
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('Failed to send/schedule email:', error);
      toast({ title: 'Error', description: `Failed to ${scheduleDate ? 'schedule' : 'send'} email.`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await apiClient.post('/admin/email-config', emailSettings);
      toast({ title: 'Settings Saved', description: 'Email configuration updated.' });
    } catch (error) {
      console.error('Failed to save email settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return toast({ title: 'Error', description: 'Please enter a test email address.', variant: 'destructive' });
    setLoading(true);
    try {
      await apiClient.post('/admin/emails/test', { email: testEmail });
      toast({ title: 'Test Email Sent', description: `Test email sent to ${testEmail}` });
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({ title: 'Error', description: 'Failed to send test email.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !emailMetrics) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader><CardTitle>Email Management</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="compose">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose & Send</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Emails</TabsTrigger>
            <TabsTrigger value="settings">Settings & Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="mt-4">
            <div className="space-y-4">
              <div>
                <Label>Recipient Type</Label>
                <select onChange={(e) => setRecipientType(e.target.value)} value={recipientType} className="w-full p-2 border rounded">
                  <option value="specific">Specific Users</option>
                  <option value="all">All Users</option>
                  <option value="premium">Premium Members</option>
                  <option value="free">Freemium Members</option>
                  <option value="inactive">Inactive Users</option>
                </select>
              </div>
              {recipientType === 'specific' && (
                <div>
                  <Label>Select Users</Label>
                  <MultiSelect options={users} value={selectedUsers} onChange={setSelectedUsers} labelledBy="Select Users" />
                </div>
              )}
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} /></div>
              <div><Label htmlFor="scheduleDate">Schedule Send Time (Optional)</Label><Input id="scheduleDate" type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} /></div>
              <Button onClick={handleSendOrSchedule} disabled={loading}>{loading ? 'Processing...' : (scheduleDate ? 'Schedule Email' : 'Send Email')}</Button>
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-4">
            <ScheduledEmailList refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">SMTP Configuration</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Host</Label><Input value={emailSettings.smtpHost} onChange={e => setEmailSettings({...emailSettings, smtpHost: e.target.value})} /></div>
                    <div><Label>Port</Label><Input value={emailSettings.smtpPort} onChange={e => setEmailSettings({...emailSettings, smtpPort: e.target.value})} /></div>
                  </div>
                  <div><Label>Username</Label><Input value={emailSettings.smtpUser} onChange={e => setEmailSettings({...emailSettings, smtpUser: e.target.value})} /></div>
                  <div><Label>Password</Label><Input type="password" value={emailSettings.smtpPassword} onChange={e => setEmailSettings({...emailSettings, smtpPassword: e.target.value})} /></div>
                  <div><Label>From Name</Label><Input value={emailSettings.fromName} onChange={e => setEmailSettings({...emailSettings, fromName: e.target.value})} /></div>
                  <div><Label>From Email</Label><Input value={emailSettings.fromEmail} onChange={e => setEmailSettings({...emailSettings, fromEmail: e.target.value})} /></div>
                  <Button onClick={handleSaveSettings} disabled={loading}>Save Settings</Button>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Send Test Email</h3>
                  <div className="flex gap-2">
                    <Input placeholder="recipient@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                    <Button onClick={handleTestEmail} disabled={loading} variant="outline">Send Test</Button>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Email Metrics</h3>
                {emailMetrics ? (
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Sent Today:</span><strong>{emailMetrics.sentToday}</strong></div>
                    <div className="flex justify-between"><span>Delivery Rate:</span><strong>{emailMetrics.deliveryRate?.toFixed(2)}%</strong></div>
                    <div className="flex justify-between"><span>Open Rate:</span><strong>{emailMetrics.openRate?.toFixed(2)}%</strong></div>
                    <div className="flex justify-between"><span>Bounced:</span><strong>{emailMetrics.bounced}</strong></div>
                  </div>
                ) : <p>Metrics are not available.</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmailManagement;
