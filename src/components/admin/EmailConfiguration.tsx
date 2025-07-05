
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Settings, 
  Send, 
  Users, 
  BarChart3, 
  Template,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'match' | 'reminder' | 'custom';
}

const EmailConfiguration = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose');
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    message: '',
    recipients: 'all'
  });
  
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to Quluub!',
      content: 'Welcome to our dating platform. Start your journey to find your perfect match!',
      type: 'welcome'
    },
    {
      id: '2',
      name: 'New Matches',
      subject: 'You have new potential matches!',
      content: 'Check out your new potential matches and start conversations today.',
      type: 'match'
    }
  ]);

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Quluub Team'
  });

  const handleSendBulkEmail = async () => {
    if (!bulkEmailData.subject || !bulkEmailData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in both subject and message',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Success',
        description: `Bulk email sent to ${bulkEmailData.recipients} recipients`
      });
      
      setBulkEmailData({
        subject: '',
        message: '',
        recipients: 'all'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send bulk email',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSettings = () => {
    toast({
      title: 'Success',
      description: 'Email settings saved successfully'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Manage email settings, templates, and send bulk communications to users.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Compose</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Compose Email Tab */}
        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Email</CardTitle>
              <CardDescription>
                Send emails to all users or specific groups.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select
                    value={bulkEmailData.recipients}
                    onValueChange={(value) => setBulkEmailData({ ...bulkEmailData, recipients: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="premium">Premium Users Only</SelectItem>
                      <SelectItem value="free">Free Users Only</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Recipients</Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {bulkEmailData.recipients === 'all' ? '2,456' :
                       bulkEmailData.recipients === 'premium' ? '6' :
                       bulkEmailData.recipients === 'free' ? '2,450' :
                       '892'} users
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={bulkEmailData.subject}
                  onChange={(e) => setBulkEmailData({ ...bulkEmailData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your email message here..."
                  rows={8}
                  value={bulkEmailData.message}
                  onChange={(e) => setBulkEmailData({ ...bulkEmailData, message: e.target.value })}
                />
              </div>

              <Button onClick={handleSendBulkEmail} className="w-full sm:w-auto">
                <Send className="h-4 w-4 mr-2" />
                Send Bulk Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium">Email Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Manage reusable email templates for different scenarios.
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {template.type}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs font-medium">Subject:</Label>
                        <p className="text-sm text-muted-foreground">{template.subject}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Content Preview:</Label>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Email Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold">12,450</p>
                  </div>
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                    <p className="text-2xl font-bold">98.5%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold">24.7%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">3.2%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                  <div className="space-y-1 mb-2 sm:mb-0">
                    <h4 className="font-medium">Welcome to Quluub</h4>
                    <p className="text-sm text-muted-foreground">Sent to 150 recipients • Jan 15, 2024</p>
                  </div>
                  <Badge variant="outline">32.1% open rate</Badge>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                  <div className="space-y-1 mb-2 sm:mb-0">
                    <h4 className="font-medium">New Matches Available</h4>
                    <p className="text-sm text-muted-foreground">Sent to 89 recipients • Jan 10, 2024</p>
                  </div>
                  <Badge variant="outline">28.4% open rate</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>
                Configure your email server settings for sending emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    placeholder="587"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    placeholder="your-email@gmail.com"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="your-app-password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    placeholder="noreply@quluub.com"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Quluub Team"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailConfiguration;
