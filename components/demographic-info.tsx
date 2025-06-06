import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DemographicInfoProps {
  control: Control<any>;
  genderFieldName: string;
  maritalStatusFieldName: string;
  dobFieldName: string;
  required?: boolean;
}

/**
 * DemographicInfo Component
 * 
 * Reusable component for collecting demographic information including:
 * - Gender
 * - Marital Status
 * - Date of Birth
 * 
 * Uses react-hook-form's form control and follows ShadCN UI patterns
 */
export function DemographicInfo({ 
  control, 
  genderFieldName, 
  maritalStatusFieldName, 
  dobFieldName,
  required = false
}: DemographicInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Gender Selection */}
      <FormField
        control={control}
        name={genderFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gender {required && <span className="text-red-500">*</span>}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Marital Status Selection */}
      <FormField
        control={control}
        name={maritalStatusFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marital Status {required && <span className="text-red-500">*</span>}</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date of Birth Calendar */}
      <FormField
        control={control}
        name={dobFieldName}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date of Birth {required && <span className="text-red-500">*</span>}</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => {
                    // Disable future dates and dates more than 100 years ago
                    const today = new Date();
                    const hundred_years_ago = new Date();
                    hundred_years_ago.setFullYear(today.getFullYear() - 100);
                    return date > today || date < hundred_years_ago;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 