import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

interface SendEmailDialogProps {
  user: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSendEmail: (userId: string, subject: string, message: string) => Promise<void>;
}

const formSchema = z.object({
  subject: z.string().min(2, 'Subject must be at least 2 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const SendEmailDialog = ({ user, isOpen, onOpenChange, onSendEmail }: SendEmailDialogProps) => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const handleSend = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSendEmail(user._id, values.subject, values.message);
      toast({ title: 'Success', description: 'Email sent successfully.' });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not send email.', variant: 'destructive' });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Email to {user.fname}</DialogTitle>
          <DialogDescription>Compose and send an email directly to the user.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSend)} className="space-y-4">
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input value={user.email} disabled />
              </FormControl>
            </FormItem>
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Email subject" {...field} />
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
                    <Textarea placeholder="Type your message here." rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendEmailDialog;
