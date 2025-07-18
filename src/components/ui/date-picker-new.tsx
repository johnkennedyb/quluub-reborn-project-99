import React from 'react';
import { format, subYears, isBefore, isAfter, differenceInYears, parse } from 'date-fns';
import { CalendarIcon, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DatePickerProps {
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
  dateFormat?: string;
}

// Date validation type
interface DateValidation {
  isValid: boolean;
  message?: string;
  age: number;
}

// Helper function to parse date string
function parseDate(dateString: string, formatString: string): Date | null {
  const parsed = parse(dateString, formatString, new Date());
  return isValidDate(parsed) ? parsed : null;
}

// Type guard for date validation
function isValidDate(date: Date | null): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function DatePicker({ 
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
  containerClassName,
  dateFormat = 'yyyy-MM-dd'
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  
  // Sync input value with date prop
  React.useEffect(() => {
    setInputValue(date ? format(date, dateFormat) : '');
  }, [date, dateFormat]);
  const today = new Date();
  const minDate = subYears(today, maxAge);
  const maxDate = subYears(today, minAge);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Only try to parse when we have a complete date
    if (value.length === dateFormat.length) {
      const parsedDate = parseDate(value, dateFormat);
      if (parsedDate) {
        if (isBefore(parsedDate, minDate)) {
          setDate(minDate);
          onChange?.(minDate);
        } else if (isAfter(parsedDate, maxDate)) {
          setDate(maxDate);
          onChange?.(maxDate);
        } else {
          setDate(parsedDate);
          onChange?.(parsedDate);
        }
      } else {
        setDate(null);
        onChange?.(null);
      }
    } else {
      // Clear the date if input is incomplete
      setDate(null);
      onChange?.(null);
    }
  };

  const validateDate = (date: Date | null): DateValidation => {
    if (!isValidDate(date)) {
      return { isValid: false, message: 'Invalid date', age: 0 };
    }

    const age = differenceInYears(today, date);
    if (age < minAge) {
      return { isValid: false, message: `You must be at least ${minAge} years old.`, age };
    }
    if (age > maxAge) {
      return { isValid: false, message: `Maximum age is ${maxAge} years.`, age };
    }

    return { isValid: true, age };
  };

  const validation = validateDate(date);
  const showValidation = inputValue.length > 0 && (!isFocused || inputValue.length === dateFormat.length);

  return (
    <div className={cn("space-y-3 w-full", containerClassName)}>
      <div className="space-y-1">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>
      <div className="relative">
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={dateFormat}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-destructive" : (inputValue && !validation.isValid && inputValue.length >= dateFormat.length ? "border-destructive" : "border-input"),
              className
            )}
            disabled={disabled}
          />
        </div>
        
        {showValidation && (
          <div className={cn(
            "mt-2 flex items-center text-sm",
            !validation.isValid ? "text-destructive" : "text-muted-foreground"
          )}>
            <Info className={cn("mr-2 h-4 w-4", !validation.isValid ? "text-destructive" : "text-muted-foreground")} />
            <span>
              {validation.isValid 
                ? `Age: ${validation.age} years`
                : validation.message
              }
            </span>
          </div>
        )}
        
        {error && (
          <div className="mt-2 flex items-center text-sm text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
