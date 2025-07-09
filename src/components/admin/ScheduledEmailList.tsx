import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface ScheduledEmailListProps {
  refreshKey: number;
}

interface ScheduledEmail {
  _id: string;
  subject: string;
  recipients: { _id: string; fname: string; lname: string; email: string }[];
  sendTime: string;
}

const ScheduledEmailList = ({ refreshKey }: ScheduledEmailListProps) => {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchScheduledEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/scheduled-emails', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setEmails(data);
      } else {
        throw new Error(data.message || 'Failed to fetch scheduled emails');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not fetch scheduled emails.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledEmails();
  }, [refreshKey]);

  const handleCancelEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/scheduled-emails/${emailId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Scheduled email cancelled successfully.' });
        fetchScheduledEmails(); // Refresh the list
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel email');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel scheduled email.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div>Loading scheduled emails...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Scheduled Emails</CardTitle>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <p>No pending emails.</p>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div key={email._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{email.subject}</p>
                  <p className="text-sm text-gray-500">
                    Scheduled for: {new Date(email.sendTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Recipients: {email.recipients.length}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleCancelEmail(email._id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledEmailList;
