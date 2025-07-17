
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
  target: z.enum(['all', 'premium', 'free']),
});

const PushNotificationManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchPushNotifications = async () => {
    const response = await apiClient.get('/admin/push-notifications');
    return response.data;
  };

  const sendPushNotification = async (data: z.infer<typeof formSchema>) => {
    const response = await apiClient.post('/admin/push-notifications', {
      title: data.title,
      body: data.message,
      target: data.target
    });
    return response.data;
  };

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['pushNotifications'],
    queryFn: fetchPushNotifications,
  });

  const mutation = useMutation({
    mutationFn: sendPushNotification,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Push notification sent successfully!' });
      queryClient.invalidateQueries({ queryKey: ['pushNotifications'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      message: '',
      target: 'all',
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Push Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter notification title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter notification message" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a target audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="premium">Premium & Pro Users</SelectItem>
                        <SelectItem value="free">Freemium Users</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Sending...' : 'Send Notification'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading history...</TableCell>
                </TableRow>
              ) : notifications && notifications.length > 0 ? (
                notifications.map((notification: any) => (
                  <TableRow key={notification._id}>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>{notification.target}</TableCell>
                    <TableCell>{notification.status}</TableCell>
                    <TableCell>{format(new Date(notification.sentAt), 'PPP p')}</TableCell>
                    <TableCell>{notification.sentCount}</TableCell>
                    <TableCell>{notification.failedCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No notification history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationManager;
