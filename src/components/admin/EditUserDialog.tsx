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
  onUserUpdate: (userId: string, data: any) => void;
  sendPasswordReset: (userId: string) => Promise<void>;
}

const formSchema = z.object({
  fname: z.string().min(2, 'First name must be at least 2 characters'),
  lname: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  plan: z.enum(['free', 'premium']),
  status: z.enum(['active', 'inactive', 'suspended', 'banned']),
  isVerified: z.boolean(),
  city: z.string().optional(),
  country: z.string().optional(),
  gender: z.enum(['male', 'female']),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

const EditUserDialog = ({ user, isOpen, onOpenChange, onUserUpdate, sendPasswordReset }: EditUserDialogProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: user?.fname || '',
      lname: user?.lname || '',
      email: user?.email || '',
      plan: user?.plan || 'free',
      status: user?.status || 'active',
      isVerified: user?.isVerified || false,
      city: user?.city || '',
      country: user?.country || '',
      gender: user?.gender || 'male',
      dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fname: user.fname || '',
        lname: user.lname || '',
        email: user.email || '',
        plan: user.plan || 'free',
        status: user.status || 'active',
        isVerified: user.isVerified || false,
        city: user.city || '',
        country: user.country || '',
        gender: user.gender || 'male',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      });
    }
  }, [user, form]);

  const handleSaveChanges = async (values: z.infer<typeof formSchema>) => {
    const planChanged = values.plan !== user.plan;
    const statusChanged = values.status !== user.status;

    let confirmationMessage = '';
    if (planChanged && statusChanged) {
      confirmationMessage = `You are about to change the user's plan to "${values.plan}" and status to "${values.status}". Are you sure?`;
    } else if (planChanged) {
      confirmationMessage = `You are about to change the user's plan to "${values.plan}". Are you sure?`;
    } else if (statusChanged) {
      confirmationMessage = `You are about to change the user's status to "${values.status}". Are you sure?`;
    }

    if (confirmationMessage && !confirm(confirmationMessage)) {
      return; // User cancelled the action
    }

    try {
      await onUserUpdate(user._id, values);
      toast({ title: 'Success', description: 'User details updated successfully.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update user details.', variant: 'destructive' });
    }
  };



  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to send a password reset link to this user?')) return;
    try {
      await sendPasswordReset(user._id);
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
            {/* Personal Details */}
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
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} type="email" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl><Input {...field} type="date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Account Settings */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="secondary" onClick={handleResetPassword}>Send Password Reset</Button>
            </div>
          </form>
        </Form>

        {/* Other Actions */}
        <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Account Actions</h3>
            <div className="flex items-center justify-between">
                <p className="text-sm">Send a password reset link to the user's email.</p>
                <Button variant="destructive" onClick={handleResetPassword}>Reset Password</Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;