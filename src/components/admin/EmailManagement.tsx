import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/api-client';
import { MultiSelect } from 'react-multi-select-component';
import ScheduledEmailList from './ScheduledEmailList';
import { Loader2 } from 'lucide-react';

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
        adminService.getAllUsers({ limit: 10000 }),
        adminService.getEmailConfig(),
        adminService.getEmailMetrics()
      ]);
      setUsers(usersRes.map((user: any) => ({ label: `${user.fname} ${user.lname} (${user.email})`, value: user._id })));
      setEmailSettings(configRes);
      setEmailMetrics(metricsRes);
    } catch (error) {
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

    let userIds = [];
    if (recipientType === 'specific') {
      if (selectedUsers.length === 0) return toast({ title: 'Error', description: 'Please select at least one user.', variant: 'destructive' });
      userIds = selectedUsers.map(u => u.value);
    }

    setLoading(true);
    try {
      const payload = { subject, message, userIds, recipientType };
      if (scheduleDate) {
        await adminService.scheduleEmail({ ...payload, sendAt: scheduleDate });
        toast({ title: 'Success', description: 'Email scheduled successfully.' });
      } else {
        await adminService.sendBulkEmail(payload);
        toast({ title: 'Success', description: 'Email sent successfully.' });
      }
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      setScheduleDate('');
      setRefreshKey(k => k + 1);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to ${scheduleDate ? 'schedule' : 'send'} email.`, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await adminService.saveEmailConfig(emailSettings);
      toast({ title: 'Settings Saved', description: 'Email configuration updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return toast({ title: 'Error', description: 'Please enter a test email address.', variant: 'destructive' });
    setLoading(true);
    try {
      await adminService.sendTestEmail(testEmail);
      toast({ title: 'Test Email Sent', description: `Test email sent to ${testEmail}` });
    } catch (error) {
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
            <ScheduledEmailList refreshKey={refreshKey} setRefreshKey={setRefreshKey} />
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
