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
              calls.map((call) => (
                <TableRow key={call._id}>
                  <TableCell>{call.caller.fullName}</TableCell>
                  <TableCell>{call.receiver.fullName}</TableCell>
                  <TableCell>{format(new Date(call.startTime), 'PPP p')}</TableCell>
                  <TableCell>{Math.round(call.duration / 60)} mins</TableCell>
                  <TableCell><Badge>{call.status}</Badge></TableCell>
                  <TableCell>
                    <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Recording
                    </a>
                  </TableCell>
                </TableRow>
              ))
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
