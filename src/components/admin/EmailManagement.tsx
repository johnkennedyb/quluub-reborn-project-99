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
import { Loader2, Paperclip, X, Search } from 'lucide-react';

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
  const [attachments, setAttachments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(0);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newAttachments = files.map((file: File) => ({
      file,
      name: file.name,
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('recipientType', recipientType);
      formData.append('userIds', JSON.stringify(userIds));
      
      // Add delay if specified
      if (delayMinutes > 0) {
        const sendAt = new Date(Date.now() + delayMinutes * 60 * 1000);
        formData.append('sendAt', sendAt.toISOString());
      } else if (scheduleDate) {
        formData.append('sendAt', scheduleDate);
      }

      // Add attachments
      attachments.forEach((attachment, index) => {
        formData.append(`attachments`, attachment.file);
      });

      const endpoint = (scheduleDate || delayMinutes > 0) ? 'scheduleEmail' : 'sendBulkEmail';
      await adminService[endpoint](formData);
      
      toast({ 
        title: 'Success', 
        description: `Email ${(scheduleDate || delayMinutes > 0) ? 'scheduled' : 'sent'} successfully.` 
      });
      
      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      setScheduleDate('');
      setAttachments([]);
      setDelayMinutes(0);
      setRefreshKey(k => k + 1);
    } catch (error) {
      toast({ title: 'Error', description: `Failed to ${(scheduleDate || delayMinutes > 0) ? 'schedule' : 'send'} email.`, variant: 'destructive' });
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
                <div className="space-y-2">
                  <Label>Select Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <MultiSelect 
                    options={users.filter(user => 
                      user.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )} 
                    value={selectedUsers} 
                    onChange={setSelectedUsers} 
                    labelledBy="Select Users"
                    hasSelectAll={true}
                    disableSearch={false}
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedUsers.length} user(s) selected
                  </p>
                </div>
              )}
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div><Label htmlFor="message">Message</Label><Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} /></div>
              
              {/* Attachments Section */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800">
                    <Paperclip className="h-4 w-4" />
                    <span>Click to upload files or drag and drop</span>
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)</span>
                        <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduling Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delayMinutes">Send Delay (minutes)</Label>
                  <Input 
                    id="delayMinutes" 
                    type="number" 
                    min="0" 
                    value={delayMinutes} 
                    onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                    placeholder="0 = send immediately" 
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleDate">Or Schedule for Specific Time</Label>
                  <Input 
                    id="scheduleDate" 
                    type="datetime-local" 
                    value={scheduleDate} 
                    onChange={(e) => setScheduleDate(e.target.value)} 
                  />
                </div>
              </div>
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
                <h3 className="text-lg font-semibold mb-4">Email Metrics & Analytics</h3>
                {emailMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <h4 className="text-sm font-medium text-blue-700">Sent Today</h4>
                        <p className="text-2xl font-bold text-blue-900">{emailMetrics.sentToday}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <h4 className="text-sm font-medium text-green-700">Delivery Rate</h4>
                        <p className="text-2xl font-bold text-green-900">{emailMetrics.deliveryRate?.toFixed(2)}%</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <h4 className="text-sm font-medium text-purple-700">Open Rate</h4>
                        <p className="text-2xl font-bold text-purple-900">{emailMetrics.openRate?.toFixed(2)}%</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded">
                        <h4 className="text-sm font-medium text-red-700">Bounce Rate</h4>
                        <p className="text-2xl font-bold text-red-900">{emailMetrics.bounceRate?.toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Additional Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span>Total Sent (7 days):</span><strong>{emailMetrics.sentWeek || 0}</strong></div>
                        <div className="flex justify-between"><span>Total Sent (30 days):</span><strong>{emailMetrics.sentMonth || 0}</strong></div>
                        <div className="flex justify-between"><span>Bounced Emails:</span><strong>{emailMetrics.bounced || 0}</strong></div>
                        <div className="flex justify-between"><span>Spam Complaints:</span><strong>{emailMetrics.spamComplaints || 0}</strong></div>
                        <div className="flex justify-between"><span>Unsubscribes:</span><strong>{emailMetrics.unsubscribes || 0}</strong></div>
                        <div className="flex justify-between"><span>Click Rate:</span><strong>{emailMetrics.clickRate?.toFixed(2) || 0}%</strong></div>
                      </div>
                    </div>
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
