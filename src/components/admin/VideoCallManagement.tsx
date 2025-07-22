import React from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const VideoCallManagement = () => {
  const { calls, loading } = useAdminData();

  if (loading) return <div>Loading call history...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Call History</CardTitle>
        <CardDescription>Review all recorded video calls between members.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caller</TableHead>
              <TableHead>Receiver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recording</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls && calls.length > 0 ? (
              calls.map((call) => {
                // Use caller and recipient from backend, not participants array
                const caller = call.caller || { fname: 'Unknown', lname: 'User', username: 'unknown' };
                const recipient = call.recipient || { fname: 'Unknown', lname: 'User', username: 'unknown' };
                
                // Handle date formatting with proper validation
                const formatDate = (dateValue) => {
                  if (!dateValue) return 'N/A';
                  try {
                    const date = new Date(dateValue);
                    if (isNaN(date.getTime())) return 'Invalid Date';
                    return format(date, 'PPP p');
                  } catch (error) {
                    return 'Invalid Date';
                  }
                };
                
                return (
                  <TableRow key={call._id}>
                    <TableCell>{caller.fname} {caller.lname} (@{caller.username})</TableCell>
                    <TableCell>{recipient.fname} {recipient.lname} (@{recipient.username})</TableCell>
                    <TableCell>{formatDate(call.startedAt || call.createdAt)}</TableCell>
                    <TableCell>{Math.round((call.duration || 0) / 60)} mins</TableCell>
                    <TableCell><Badge>{call.status}</Badge></TableCell>
                    <TableCell>
                      {call.recordingUrl ? (
                        <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Recording
                        </a>
                      ) : (
                        <span className="text-gray-400">No recording</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No call history found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VideoCallManagement;
