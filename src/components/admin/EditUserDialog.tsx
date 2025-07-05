import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

interface EditUserDialogProps {
  user: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserUpdate: () => void;
}

const formSchema = z.object({
  fname: z.string().min(2, 'First name must be at least 2 characters'),
  lname: z.string().min(2, 'Last name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  city: z.string().optional(),
  country: z.string().optional(),
});

const EditUserDialog = ({ user, isOpen, onOpenChange, onUserUpdate }: EditUserDialogProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: '',
      lname: '',
      username: '',
      city: '',
      country: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fname: user.fname || '',
        lname: user.lname || '',
        username: user.username || '',
        city: user.city || '',
        country: user.country || '',
      });
    }
  }, [user, form]);

  const handleSaveChanges = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch(`/api/admin/users/${user._id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: JSON.stringify(values),
        }
      );
      if (!response.ok) throw new Error('Failed to update user details');
      toast({ title: 'Success', description: 'User details updated successfully.' });
      onUserUpdate();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update user details.', variant: 'destructive' });
    }
  };

  const handlePlanChange = async (plan: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user._id}/plan`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          body: JSON.stringify({ plan }),
        }
      );
      if (!response.ok) throw new Error('Failed to update plan');
      toast({ title: 'Success', description: `User plan upgraded to ${plan}.` });
      onUserUpdate();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update user plan.', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to send a password reset link to this user?')) return;
    try {
      const response = await fetch(`/api/admin/users/${user._id}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to send reset link');
      toast({ title: 'Success', description: 'Password reset link sent to user.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not send password reset link.', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User: {user.fullName}</DialogTitle>
          <DialogDescription>Make changes to the user's profile and settings.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fname" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lname" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input {...field} placeholder="User's city" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl><Input {...field} placeholder="User's country" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
        
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-medium">Plan Management</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm">Current Plan: <span className="font-semibold">{user.plan}</span></p>
            <Select onValueChange={handlePlanChange} defaultValue={user.plan}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freemium">Freemium</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-medium">Account Actions</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm">Send password reset link to user.</p>
            <Button variant="destructive" onClick={handleResetPassword}>Reset Password</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;