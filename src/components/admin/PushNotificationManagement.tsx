import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
// This hook will be updated later to include push notification functions
import { useAdminData } from '@/hooks/useAdminData';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
  target: z.enum(['all', 'premium', 'free']),
});

const PushNotificationManagement = () => {
    const { toast } = useToast();
  const { sendPushNotification, pushNotifications, loading } = useAdminData();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      message: '',
      target: 'all',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await sendPushNotification(values);
      toast({ title: 'Success', description: 'Push notification sent successfully!' });
      form.reset();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send push notification.', variant: 'destructive' });
    }
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
                        <SelectItem value="premium">Premium Users</SelectItem>
                        <SelectItem value="free">Freemium Users</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Send Notification</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading && <p>Loading history...</p>}
            {pushNotifications && pushNotifications.length > 0 ? (
              <ul className="space-y-2">
                {pushNotifications.map((notification) => (
                  <li key={notification._id} className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <div className="text-xs text-gray-400 mt-2 flex justify-between">
                      <span>Target: {notification.target}</span>
                      <span>Sent: {new Date(notification.sentAt).toLocaleString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No notification history found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationManagement;
