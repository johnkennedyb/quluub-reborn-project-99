import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EditUserDialogProps {
  user: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdate: (userId: string, data: any) => Promise<void>;
  sendPasswordReset: (userId: string) => Promise<void>;
  onStatusChange?: (userId: string, userName: string, currentStatus: string, newStatus: string) => void;
}

const EditUserDialog = ({ user, isOpen, onOpenChange, onUserUpdate, sendPasswordReset, onStatusChange }: EditUserDialogProps) => {
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    plan: '',
    status: '',
    hidden: false,
    dob: null as Date | null,
    country: '',
    city: '',
    region: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        fname: user.fname || '',
        lname: user.lname || '',
        email: user.email || '',
        plan: user.plan || 'freemium',
        status: user.status || 'active',
        hidden: user.hidden || false,
        dob: user.dob ? (typeof user.dob === 'string' ? new Date(user.dob) : user.dob) : null,
        country: user.country || '',
        city: user.city || '',
        region: user.region || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = { ...formData };
      if (formData.dob) {
        updateData.dob = formData.dob.toISOString();
      }
      
      await onUserUpdate(user._id, updateData);
      toast({ title: 'Success', description: 'User updated successfully' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update user', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(user._id, `${user.fname} ${user.lname}`, formData.status, newStatus);
    }
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSendPasswordReset = async () => {
    try {
      await sendPasswordReset(user._id);
      toast({ title: 'Success', description: 'Password reset email sent' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send password reset', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user?.fname} {user?.lname}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={formData.fname}
                onChange={(e) => setFormData(prev => ({ ...prev, fname: e.target.value }))}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={formData.lname}
                onChange={(e) => setFormData(prev => ({ ...prev, lname: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <Label>Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dob ? format(formData.dob, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.dob || undefined}
                  onSelect={(date) => setFormData(prev => ({ ...prev, dob: date || null }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                placeholder="Country"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <Label>Region</Label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Region"
              />
            </div>
          </div>
          
          <div>
            <Label>Plan</Label>
            <Select value={formData.plan} onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freemium">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.hidden}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hidden: checked }))}
            />
            <Label>Hidden Profile</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleSendPasswordReset}>
              Reset Password
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
