
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminService } from '@/lib/api-client';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

export interface ScheduledEmailListProps {
  refreshKey: number;
  setRefreshKey?: React.Dispatch<React.SetStateAction<number>>;
}

const ScheduledEmailList = ({ refreshKey, setRefreshKey }: ScheduledEmailListProps) => {
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchScheduledEmails = async () => {
    setLoading(true);
    try {
      const emails = await adminService.getScheduledEmails();
      setScheduledEmails(emails);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch scheduled emails.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledEmails();
  }, [refreshKey]);

  const handleCancel = async (emailId: string) => {
    try {
      await adminService.cancelScheduledEmail(emailId);
      toast({ title: 'Success', description: 'Scheduled email cancelled.' });
      fetchScheduledEmails();
      if (setRefreshKey) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel email.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading scheduled emails...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Scheduled Emails</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Scheduled For</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scheduledEmails.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No scheduled emails found.</TableCell>
            </TableRow>
          ) : (
            scheduledEmails.map((email: any) => (
              <TableRow key={email._id}>
                <TableCell>{email.subject}</TableCell>
                <TableCell>{email.recipientType}</TableCell>
                <TableCell>{format(new Date(email.sendAt), 'PPP p')}</TableCell>
                <TableCell>{email.status}</TableCell>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleCancel(email._id)}
                    disabled={email.status === 'sent'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ScheduledEmailList;
