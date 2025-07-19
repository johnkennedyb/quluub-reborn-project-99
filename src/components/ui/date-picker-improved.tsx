import React from 'react';
import { differenceInYears } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface DatePickerImprovedProps {
  date: Date | null;
  setDate: (date: Date | null) => void;
  disabled?: boolean;
  minAge?: number;
  maxAge?: number;
  error?: string;
  label?: string;
  helperText?: string;
  onChange?: (date: Date | null) => void;
  className?: string;
  containerClassName?: string;
}

export function DatePickerImproved({ 
  date, 
  setDate, 
  disabled = false, 
  minAge = 18, 
  maxAge = 100,
  error,
  label = 'Date of Birth',
  helperText = 'Please select your date of birth. This is required for age verification.',
  onChange,
  className,
  containerClassName
}: DatePickerImprovedProps) {
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear - maxAge}-01-01`;
  const maxDate = `${currentYear - minAge}-12-31`;
  
  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Parse date from input
  const parseDateFromInput = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    const parsedDate = parseDateFromInput(dateString);
    setDate(parsedDate);
    onChange?.(parsedDate);
  };
  
  // Calculate age for display
  const age = date ? differenceInYears(new Date(), date) : null;

  return (
    <div className={containerClassName}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        
        <Input
          type="date"
          value={formatDateForInput(date)}
          onChange={handleDateChange}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          className={className}
          placeholder="Select your date of birth"
        />
        
        {/* Age Display */}
        {age !== null && (
          <p className="text-xs text-muted-foreground">
            Age: {age} years old
          </p>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DatePickerImproved;
