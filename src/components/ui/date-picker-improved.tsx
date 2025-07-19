import React from 'react';
import { differenceInYears } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const minYear = currentYear - maxAge;
  const maxYear = currentYear - minAge;
  
  // Extract current values
  const selectedDay = date ? date.getDate() : null;
  const selectedMonth = date ? date.getMonth() + 1 : null; // getMonth() returns 0-11
  const selectedYear = date ? date.getFullYear() : null;
  
  // Generate options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  
  // Get days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  // Update date when any component changes
  const updateDate = (day: number | null, month: number | null, year: number | null) => {
    if (day && month && year) {
      // Validate day exists in the selected month/year
      const daysInMonth = getDaysInMonth(month, year);
      const validDay = Math.min(day, daysInMonth);
      
      const newDate = new Date(year, month - 1, validDay); // month is 0-indexed in Date constructor
      setDate(newDate);
      onChange?.(newDate);
    } else {
      setDate(null);
      onChange?.(null);
    }
  };
  
  const handleDayChange = (value: string) => {
    const day = parseInt(value);
    updateDate(day, selectedMonth, selectedYear);
  };
  
  const handleMonthChange = (value: string) => {
    const month = parseInt(value);
    updateDate(selectedDay, month, selectedYear);
  };
  
  const handleYearChange = (value: string) => {
    const year = parseInt(value);
    updateDate(selectedDay, selectedMonth, year);
  };
  
  // Calculate age for display
  const age = date ? differenceInYears(new Date(), date) : null;
  
  // Filter days based on selected month/year
  const availableDays = selectedMonth && selectedYear 
    ? days.filter(day => day <= getDaysInMonth(selectedMonth, selectedYear))
    : days;

  return (
    <div className={containerClassName}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        
        <div className="grid grid-cols-3 gap-2">
          {/* Day Selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Day</Label>
            <Select 
              value={selectedDay?.toString() || ""} 
              onValueChange={handleDayChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Month Selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Month</Label>
            <Select 
              value={selectedMonth?.toString() || ""} 
              onValueChange={handleMonthChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Year Selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Year</Label>
            <Select 
              value={selectedYear?.toString() || ""} 
              onValueChange={handleYearChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
