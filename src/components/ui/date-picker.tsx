
import * as React from "react"
import { format, subYears, isBefore, isAfter, differenceInYears } from "date-fns"
import { Calendar as CalendarIcon, AlertCircle, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  minAge?: number;
  maxAge?: number;
  error?: string;
  onChange?: (date: Date | undefined) => void;
}

export function DatePicker({ 
  date, 
  setDate, 
  disabled = false, 
  minAge = 18, 
  maxAge = 100,
  error,
  onChange
}: DatePickerProps) {
  const today = new Date();
  const minDate = subYears(today, maxAge);
  const maxDate = subYears(today, minAge);
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange?.(undefined);
      return;
    }
    
    // Ensure the selected date is within the valid range
    let finalDate = selectedDate;
    
    if (isBefore(selectedDate, minDate)) {
      finalDate = minDate;
    } else if (isAfter(selectedDate, maxDate)) {
      finalDate = maxDate;
    }
    
    setDate(finalDate);
    onChange?.(finalDate);
  };
  
  const isDateValid = (date: Date) => {
    const age = differenceInYears(today, date);
    return age >= minAge && age <= maxAge;
  };
  
  const getAgeValidationMessage = () => {
    if (!date) return null;
    
    const age = differenceInYears(today, date);
    
    if (age < minAge) {
      return `You must be at least ${minAge} years old.`;
    }
    
    if (age > maxAge) {
      return `Maximum age is ${maxAge} years.`;
    }
    
    return null;
  };
  
  const validationMessage = getAgeValidationMessage();
  const isValid = !date || !validationMessage;

  return (
    <Card className="space-y-3">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-medium">Date of Birth</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Please select your date of birth. This is required for age verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date ? "text-muted-foreground" : "",
                  error ? "border-destructive" : "border-input"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                {date ? format(date, "PPP") : <span>Select your date of birth</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                fromDate={minDate}
                toDate={maxDate}
                captionLayout="dropdown-buttons"
                fromYear={today.getFullYear() - maxAge}
                toYear={today.getFullYear() - minAge}
                initialFocus
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
          
          {date && (
            <div className="mt-2 flex items-center text-sm">
              <Info className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "text-muted-foreground",
                !isValid && "text-destructive"
              )}>
                {isValid 
                  ? `Age: ${differenceInYears(today, date)} years`
                  : validationMessage
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
      </CardContent>
    </Card>
  );
}
