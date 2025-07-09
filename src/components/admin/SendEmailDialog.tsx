import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/api-client';

interface SendEmailDialogProps {
  user: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SendEmailDialog = ({ user, isOpen, onOpenChange }: SendEmailDialogProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!subject || !message) {
      toast({ title: 'Error', description: 'Subject and message are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await adminService.sendBulkEmail({
        subject,
        message,
        userIds: [user._id],
        recipientType: 'specific'
      });
      
      toast({ title: 'Success', description: `Email sent to ${user.fname} ${user.lname}` });
      setSubject('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send email.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Email to {user.fname} {user.lname}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Input 
              id="recipient" 
              value={`${user.fname} ${user.lname} (${user.email})`} 
              disabled 
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={loading}>
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;