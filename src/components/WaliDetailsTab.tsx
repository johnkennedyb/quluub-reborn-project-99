
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Phone, Mail, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WaliDetails {
  name: string;
  relationship: string;
  email: string;
  phone: string;
  notes: string;
}

interface WaliDetailsTabProps {
  initialData?: string; // JSON string from user.waliDetails
  onSave: (waliDetails: string) => void;
  disabled?: boolean;
}

const WaliDetailsTab = ({ initialData, onSave, disabled = false }: WaliDetailsTabProps) => {
  const [waliDetails, setWaliDetails] = useState<WaliDetails>({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setWaliDetails(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error parsing wali details:', error);
      }
    }
  }, [initialData]);

  const handleInputChange = (field: keyof WaliDetails, value: string) => {
    setWaliDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!waliDetails.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Wali name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!waliDetails.relationship.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Relationship to wali is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!waliDetails.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Wali email is required.',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(waliDetails.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const waliDetailsJson = JSON.stringify(waliDetails);
      await onSave(waliDetailsJson);
      
      toast({
        title: 'Success',
        description: 'Wali details have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save wali details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Wali Details
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide your wali's contact information. This is required for Islamic marriage processes and helps maintain proper Islamic etiquette.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wali Name */}
        <div className="space-y-2">
          <Label htmlFor="wali-name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Wali Name *
          </Label>
          <Input
            id="wali-name"
            placeholder="Enter your wali's full name"
            value={waliDetails.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Relationship */}
        <div className="space-y-2">
          <Label htmlFor="wali-relationship">Relationship to You *</Label>
          <Select
            value={waliDetails.relationship}
            onValueChange={(value) => handleInputChange('relationship', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="father">Father</SelectItem>
              <SelectItem value="brother">Brother</SelectItem>
              <SelectItem value="uncle">Uncle (Paternal)</SelectItem>
              <SelectItem value="uncle-maternal">Uncle (Maternal)</SelectItem>
              <SelectItem value="grandfather">Grandfather</SelectItem>
              <SelectItem value="cousin">Cousin (Male)</SelectItem>
              <SelectItem value="imam">Imam/Religious Leader</SelectItem>
              <SelectItem value="other">Other Male Guardian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="wali-email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address *
          </Label>
          <Input
            id="wali-email"
            type="email"
            placeholder="wali@example.com"
            value={waliDetails.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Your wali will receive notifications about connection requests and important updates.
          </p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="wali-phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </Label>
          <Input
            id="wali-phone"
            type="tel"
            placeholder="+44 xxx xxxx xxxx"
            value={waliDetails.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Optional but recommended for important communications.
          </p>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="wali-notes">Additional Notes</Label>
          <Textarea
            id="wali-notes"
            placeholder="Any additional information about your wali or preferences for contact..."
            value={waliDetails.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>

        {/* Important Notice */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Important Information:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Your wali will be contacted for marriage-related communications</li>
            <li>• This information is kept strictly confidential</li>
            <li>• You can update these details anytime</li>
            <li>• Having a wali is an Islamic requirement for marriage</li>
          </ul>
        </div>

        {/* Save Button */}
        {!disabled && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Wali Details'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default WaliDetailsTab;
