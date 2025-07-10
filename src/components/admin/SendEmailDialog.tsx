
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface SendEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientEmail: string;
  userId: string;
}

const SendEmailDialog = ({ isOpen, onOpenChange, recipientName, recipientEmail, userId }: SendEmailDialogProps) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both subject and message',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/send-individual-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          userId,
          subject,
          message
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email sent successfully'
        });
        setSubject('');
        setMessage('');
        onOpenChange(false);
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to {recipientName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">To:</label>
            <p className="text-sm text-gray-600">{recipientEmail}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              rows={5}
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;
