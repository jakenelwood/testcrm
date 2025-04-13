import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { DemographicInfo } from "../demographic-info";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transformAutoFormToApiFormat } from "@/lib/form-transformers";

// Add vehicle pattern types to the form values
type VehicleFieldPattern = 
  | "v1yr" | "v1make" | "v1model" | "v1vin" | "v1usage" | "v1mi" | "v1-driver" 
  | "v1comp" | "v1coll" | "v1glass" | "v1tow" | "v1rr" | "v1fin" | "v1gap"
  | "v2yr" | "v2make" | "v2model" | "v2vin" | "v2usage" | "v2mi" | "v2-driver" 
  | "v2comp" | "v2coll" | "v2glass" | "v2tow" | "v2rr" | "v2fin" | "v2gap"
  | "v3yr" | "v3make" | "v3model" | "v3vin" | "v3usage" | "v3mi" | "v3-driver" 
  | "v3comp" | "v3coll" | "v3glass" | "v3tow" | "v3rr" | "v3fin" | "v3gap"
  | "v4yr" | "v4make" | "v4model" | "v4vin" | "v4usage" | "v4mi" | "v4-driver" 
  | "v4comp" | "v4coll" | "v4glass" | "v4tow" | "v4rr" | "v4fin" | "v4gap"
  | "v5yr" | "v5make" | "v5model" | "v5vin" | "v5usage" | "v5mi" | "v5-driver" 
  | "v5comp" | "v5coll" | "v5glass" | "v5tow" | "v5rr" | "v5fin" | "v5gap"
  | "v6yr" | "v6make" | "v6model" | "v6vin" | "v6usage" | "v6mi" | "v6-driver" 
  | "v6comp" | "v6coll" | "v6glass" | "v6tow" | "v6rr" | "v6fin" | "v6gap"
  | "v7yr" | "v7make" | "v7model" | "v7vin" | "v7usage" | "v7mi" | "v7-driver" 
  | "v7comp" | "v7coll" | "v7glass" | "v7tow" | "v7rr" | "v7fin" | "v7gap"
  | "v8yr" | "v8make" | "v8model" | "v8vin" | "v8usage" | "v8mi" | "v8-driver" 
  | "v8comp" | "v8coll" | "v8glass" | "v8tow" | "v8rr" | "v8fin" | "v8gap";

// Define the form values type
type AutoInsuranceFormValues = {
  "a-current-carrier": string
  "a-mos-current-carrier": string
  "a-climits": string
  "a-qlimits": string
  "a-exp-dt": Date | string
  "aprem": number | string
  "effective-date": Date | string
  "auto-additional-notes": string
  drivers: {
    firstName: string
    lastName: string
    gender?: string
    maritalStatus?: string
    licenseNumber: string
    licenseState: string
    dateOfBirth: Date | string
    primaryDriver: boolean
  }[]
} & { [K in VehicleFieldPattern]?: string | boolean | number };

// Driver Schema
const driverSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine((date) => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 16);
    return date <= eighteenYearsAgo;
  }, "Driver must be at least 16 years old"),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseState: z.string().min(1, "License state is required"),
  primaryDriver: z.boolean().optional(),
});

// Auto Insurance General Info
const autoInfoSchema = z.object({
  "a-current-carrier": z.string().min(1, "Current carrier is required"),
  "a-mos-current-carrier": z.string().min(1, "Months with current carrier is required"),
  "a-climits": z.string().min(1, "Current limits are required"),
  "a-qlimits": z.string().min(1, "Quoting limits are required"),
  "a-exp-dt": z.union([
    z.string().min(1, "Expiration date is required"),
    z.date()
  ]),
  "aprem": z.string().min(1, "Premium is required"),
  "effective-date": z.date({
    required_error: "Effective date is required",
  }).refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Effective date must be today or in the future"),
  "auto-additional-notes": z.string().optional(),
});

// Helper function to validate VIN
const validateVIN = (vin: string) => {
  // Basic VIN validation - 17 characters, alphanumeric (except I, O, Q)
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
};

// Vehicle 1 Schema
const vehicle1Schema = z.object({
  "v1yr": z.string().min(4, "Year must be 4 digits").refine(
    (val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year >= 1900 && year <= currentYear + 1;
    },
    "Year must be between 1900 and next year"
  ),
  "v1make": z.string().min(1, "Make is required"),
  "v1model": z.string().min(1, "Model is required"),
  "v1vin": z.string().min(17, "VIN must be 17 characters").max(17).refine(
    validateVIN,
    "VIN is invalid. Must be 17 alphanumeric characters (no I, O, Q)."
  ),
  "v1usage": z.string().min(1, "Usage is required"),
  "v1mi": z.string().min(1, "Annual mileage is required").refine(
    (val) => {
      const mileage = parseInt(val, 10);
      return !isNaN(mileage) && mileage >= 0 && mileage <= 100000;
    },
    "Mileage must be between 0 and 100,000"
  ),
  "v1-driver": z.string().optional(),
  "v1comp": z.string().optional(),
  "v1coll": z.string().optional(),
  "v1glass": z.boolean().optional(),
  "v1tow": z.boolean().optional(),
  "v1rr": z.boolean().optional(),
  "v1fin": z.boolean().optional(),
  "v1gap": z.boolean().optional(),
});

// Vehicle 2 Schema - Optional but with same validation when values are provided
const vehicle2Schema = z.object({
  "v2yr": z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year >= 1900 && year <= currentYear + 1;
    },
    "Year must be between 1900 and next year"
  ),
  "v2make": z.string().optional(),
  "v2model": z.string().optional(),
  "v2vin": z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return validateVIN(val);
    },
    "VIN is invalid. Must be 17 alphanumeric characters (no I, O, Q)."
  ),
  "v2usage": z.string().optional(),
  "v2mi": z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const mileage = parseInt(val, 10);
      return !isNaN(mileage) && mileage >= 0 && mileage <= 100000;
    },
    "Mileage must be between 0 and 100,000"
  ),
  "v2-driver": z.string().optional(),
  "v2comp": z.string().optional(),
  "v2coll": z.string().optional(),
  "v2glass": z.boolean().optional(),
  "v2tow": z.boolean().optional(),
  "v2rr": z.boolean().optional(),
  "v2fin": z.boolean().optional(),
  "v2gap": z.boolean().optional(),
});

// Vehicle 3 Schema
const vehicle3Schema = z.object({
  "v3yr": z.string().optional(),
  "v3make": z.string().optional(),
  "v3model": z.string().optional(),
  "v3vin": z.string().optional(),
  "v3usage": z.string().optional(),
  "v3mi": z.string().optional(),
  "v3-driver": z.string().optional(),
  "v3comp": z.string().optional(),
  "v3coll": z.string().optional(),
  "v3glass": z.boolean().optional(),
  "v3tow": z.boolean().optional(),
  "v3rr": z.boolean().optional(),
  "v3fin": z.boolean().optional(),
  "v3gap": z.boolean().optional(),
});

// Vehicle 4 Schema
const vehicle4Schema = z.object({
  "v4yr": z.string().optional(),
  "v4make": z.string().optional(),
  "v4model": z.string().optional(),
  "v4vin": z.string().optional(),
  "v4usage": z.string().optional(),
  "v4mi": z.string().optional(),
  "v4-driver": z.string().optional(),
  "v4comp": z.string().optional(),
  "v4coll": z.string().optional(),
  "v4glass": z.boolean().optional(),
  "v4tow": z.boolean().optional(),
  "v4rr": z.boolean().optional(),
  "v4fin": z.boolean().optional(),
  "v4gap": z.boolean().optional(),
});

// Vehicle 5-8 Schemas follow the same pattern
// For brevity, we'll include up to vehicle 8 schema in the final form

// Combined Auto Insurance Form Schema
const autoInsuranceFormSchema = z.object({
  // Auto insurance info
  ...autoInfoSchema.shape,
  
  // Vehicle 1 (required)
  ...vehicle1Schema.shape,
  
  // Vehicles 2-4 (optional)
  ...vehicle2Schema.shape,
  ...vehicle3Schema.shape,
  ...vehicle4Schema.shape,
  
  // We'll conditionally handle vehicles 5-8 in the UI
  // but include them in the schema for validation
  "v5yr": z.string().optional(),
  "v5make": z.string().optional(),
  "v5model": z.string().optional(),
  "v5vin": z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return validateVIN(val);
    },
    "VIN is invalid. Must be 17 alphanumeric characters (no I, O, Q)."
  ),
  "v5usage": z.string().optional(),
  "v5mi": z.string().optional(),
  "v5-driver": z.string().optional(),
  "v5comp": z.string().optional(),
  "v5coll": z.string().optional(),
  "v5glass": z.boolean().optional(),
  "v5tow": z.boolean().optional(),
  "v5rr": z.boolean().optional(),
  "v5fin": z.boolean().optional(),
  "v5gap": z.boolean().optional(),

  "v6yr": z.string().optional(),
  "v6make": z.string().optional(),
  "v6model": z.string().optional(),
  "v6vin": z.string().optional(),
  "v6usage": z.string().optional(),
  "v6mi": z.string().optional(),
  "v6-driver": z.string().optional(),
  "v6comp": z.string().optional(),
  "v6coll": z.string().optional(),
  "v6glass": z.boolean().optional(),
  "v6tow": z.boolean().optional(),
  "v6rr": z.boolean().optional(),
  "v6fin": z.boolean().optional(),
  "v6gap": z.boolean().optional(),

  "v7yr": z.string().optional(),
  "v7make": z.string().optional(),
  "v7model": z.string().optional(),
  "v7vin": z.string().optional(),
  "v7usage": z.string().optional(),
  "v7mi": z.string().optional(),
  "v7-driver": z.string().optional(),
  "v7comp": z.string().optional(),
  "v7coll": z.string().optional(),
  "v7glass": z.boolean().optional(),
  "v7tow": z.boolean().optional(),
  "v7rr": z.boolean().optional(),
  "v7fin": z.boolean().optional(),
  "v7gap": z.boolean().optional(),

  "v8yr": z.string().optional(),
  "v8make": z.string().optional(),
  "v8model": z.string().optional(),
  "v8vin": z.string().optional(),
  "v8usage": z.string().optional(),
  "v8mi": z.string().optional(),
  "v8-driver": z.string().optional(),
  "v8comp": z.string().optional(),
  "v8coll": z.string().optional(),
  "v8glass": z.boolean().optional(),
  "v8tow": z.boolean().optional(),
  "v8rr": z.boolean().optional(),
  "v8fin": z.boolean().optional(),
  "v8gap": z.boolean().optional(),
  
  // Driver information is now stored as references in v1-driver, v2-driver, etc.
  // But we'll keep a list of all drivers for UI convenience
  drivers: z.array(driverSchema).min(1, "At least one driver is required"),
});

interface AutoInsuranceFormProps {
  onSubmit: (data: AutoInsuranceFormValues) => void;
}

const stateOptions = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

const vehicleUseOptions = [
  { value: "commute", label: "Commute to Work/School" },
  { value: "pleasure", label: "Pleasure/Personal" },
  { value: "business", label: "Business" },
  { value: "farmRanch", label: "Farm/Ranch" },
];

const insurerOptions = [
  { value: "statefarim", label: "State Farm" },
  { value: "geico", label: "Geico" },
  { value: "progressive", label: "Progressive" },
  { value: "allstate", label: "Allstate" },
  { value: "libertymutual", label: "Liberty Mutual" },
  { value: "nationwide", label: "Nationwide" },
  { value: "farmers", label: "Farmers" },
  { value: "travelers", label: "Travelers" },
  { value: "americanfamily", label: "American Family" },
  { value: "other", label: "Other" },
  { value: "none", label: "None/Not Insured" },
];

export function AutoInsuranceForm({ onSubmit }: AutoInsuranceFormProps) {
  // Set default values for form using placeholder.txt field names
  const defaultValues: Partial<AutoInsuranceFormValues> = {
    // Auto insurance general info
    "a-current-carrier": "",
    "a-mos-current-carrier": "",
    "a-climits": "",
    "a-qlimits": "",
    "a-exp-dt": "",
    "aprem": "",
    "effective-date": new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
    "auto-additional-notes": "",
    
    // Vehicle 1 (required)
    "v1yr": "",
    "v1make": "",
    "v1model": "",
    "v1vin": "",
    "v1usage": "",
    "v1mi": "",
    "v1-driver": "",
    "v1comp": "",
    "v1coll": "",
    "v1glass": false,
    "v1tow": false,
    "v1rr": false,
    "v1fin": false,
    "v1gap": false,
    
    // Initial driver
    drivers: [
      {
        firstName: "",
        lastName: "",
        dateOfBirth: new Date(1990, 0, 1),
        gender: "",
        maritalStatus: "",
        licenseNumber: "",
        licenseState: "",
        primaryDriver: true,
      },
    ],
  };
  
  // Track number of vehicles shown in the form (minimum 1, maximum 8)
  const [vehicleCount, setVehicleCount] = useState(1);
  
  const form = useForm<AutoInsuranceFormValues>({
    resolver: zodResolver(autoInsuranceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleFormSubmit = (data: AutoInsuranceFormValues) => {
    // Convert form data to API-friendly format using our utility function
    const apiData = transformAutoFormToApiFormat(data);
    
    // Pass the transformed data to the parent component
    onSubmit(data);
    
    // Log transformed data for debugging
    console.log('Form data transformed to API format:', apiData);
  };

  const addDriver = () => {
    const drivers = form.getValues("drivers") || [];
    form.setValue("drivers", [
      ...drivers,
      {
        firstName: "",
        lastName: "",
        dateOfBirth: new Date(1990, 0, 1),
        gender: "",
        maritalStatus: "",
        licenseNumber: "",
        licenseState: "",
        primaryDriver: false,
      },
    ]);
  };

  const removeDriver = (index: number) => {
    const drivers = form.getValues("drivers");
    if (drivers.length > 1) {
      // Get the driver name we're removing
      const driverToRemove = `${drivers[index].firstName} ${drivers[index].lastName}`.trim();
      
      // Remove the driver from the drivers array
      form.setValue(
        "drivers",
        drivers.filter((_, i) => i !== index)
      );
      
      // Update any vehicle-driver references that point to this driver
      // We need to check all 8 potential vehicles
      for (let i = 1; i <= 8; i++) {
        const driverField = `v${i}-driver` as keyof AutoInsuranceFormValues;
        const currentDriver = form.getValues(driverField);
        
        if (currentDriver === driverToRemove) {
          form.setValue(driverField, "");
        }
      }
    }
  };

  const addVehicle = () => {
    if (vehicleCount < 8) {
      setVehicleCount(vehicleCount + 1);
    }
  };

  const removeVehicle = (vehicleNumber: number) => {
    if (vehicleCount > 1 && vehicleNumber <= vehicleCount) {
      // Clear the values for this vehicle
      const vehiclePrefix = `v${vehicleNumber}` as const;
      form.setValue(`${vehiclePrefix}yr`, "");
      form.setValue(`${vehiclePrefix}make`, "");
      form.setValue(`${vehiclePrefix}model`, "");
      form.setValue(`${vehiclePrefix}vin`, "");
      form.setValue(`${vehiclePrefix}usage`, "");
      form.setValue(`${vehiclePrefix}mi`, "");
      form.setValue(`${vehiclePrefix}-driver`, "");
      form.setValue(`${vehiclePrefix}comp`, "");
      form.setValue(`${vehiclePrefix}coll`, "");
      form.setValue(`${vehiclePrefix}glass`, false);
      form.setValue(`${vehiclePrefix}tow`, false);
      form.setValue(`${vehiclePrefix}rr`, false);
      form.setValue(`${vehiclePrefix}fin`, false);
      form.setValue(`${vehiclePrefix}gap`, false);
      
      // If we're removing the last vehicle, decrement the counter
      if (vehicleNumber === vehicleCount) {
        setVehicleCount(vehicleCount - 1);
      } 
      // Otherwise, we need to shift all the higher vehicles down
      else {
        // Shift all vehicles above this one down by one
        for (let i = vehicleNumber; i < vehicleCount; i++) {
          const currentPrefix = `v${i}` as const;
          const nextPrefix = `v${i+1}` as const;
          
          form.setValue(`${currentPrefix}yr`, form.getValues(`${nextPrefix}yr`));
          form.setValue(`${currentPrefix}make`, form.getValues(`${nextPrefix}make`));
          form.setValue(`${currentPrefix}model`, form.getValues(`${nextPrefix}model`));
          form.setValue(`${currentPrefix}vin`, form.getValues(`${nextPrefix}vin`));
          form.setValue(`${currentPrefix}usage`, form.getValues(`${nextPrefix}usage`));
          form.setValue(`${currentPrefix}mi`, form.getValues(`${nextPrefix}mi`));
          form.setValue(`${currentPrefix}-driver`, form.getValues(`${nextPrefix}-driver`));
          form.setValue(`${currentPrefix}comp`, form.getValues(`${nextPrefix}comp`));
          form.setValue(`${currentPrefix}coll`, form.getValues(`${nextPrefix}coll`));
          form.setValue(`${currentPrefix}glass`, form.getValues(`${nextPrefix}glass`));
          form.setValue(`${currentPrefix}tow`, form.getValues(`${nextPrefix}tow`));
          form.setValue(`${currentPrefix}rr`, form.getValues(`${nextPrefix}rr`));
          form.setValue(`${currentPrefix}fin`, form.getValues(`${nextPrefix}fin`));
          form.setValue(`${currentPrefix}gap`, form.getValues(`${nextPrefix}gap`));
        }
        
        // Clear the values for the last vehicle
        const lastPrefix = `v${vehicleCount}` as const;
        form.setValue(`${lastPrefix}yr`, "");
        form.setValue(`${lastPrefix}make`, "");
        form.setValue(`${lastPrefix}model`, "");
        form.setValue(`${lastPrefix}vin`, "");
        form.setValue(`${lastPrefix}usage`, "");
        form.setValue(`${lastPrefix}mi`, "");
        form.setValue(`${lastPrefix}-driver`, "");
        form.setValue(`${lastPrefix}comp`, "");
        form.setValue(`${lastPrefix}coll`, "");
        form.setValue(`${lastPrefix}glass`, false);
        form.setValue(`${lastPrefix}tow`, false);
        form.setValue(`${lastPrefix}rr`, false);
        form.setValue(`${lastPrefix}fin`, false);
        form.setValue(`${lastPrefix}gap`, false);
        
        setVehicleCount(vehicleCount - 1);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
        id="auto-insurance-form"
      >
        <div>
          <h3 className="text-lg font-medium mb-4">Auto Insurance Information</h3>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Insurance Carrier */}
                <FormField
                  control={form.control}
                  name="a-current-carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Insurance Carrier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {insurerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Months with Current Carrier */}
                <FormField
                  control={form.control}
                  name="a-mos-current-carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Months with Current Carrier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Limits */}
                <FormField
                  control={form.control}
                  name="a-climits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Coverage Limits</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select limits" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="state_minimum">State Minimum</SelectItem>
                          <SelectItem value="25/50/25">25/50/25</SelectItem>
                          <SelectItem value="50/100/50">50/100/50</SelectItem>
                          <SelectItem value="100/300/100">100/300/100</SelectItem>
                          <SelectItem value="250/500/250">250/500/250</SelectItem>
                          <SelectItem value="500/500/500">500/500/500</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quoting Limits */}
                <FormField
                  control={form.control}
                  name="a-qlimits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Coverage Limits</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select limits" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="state_minimum">State Minimum</SelectItem>
                          <SelectItem value="25/50/25">25/50/25</SelectItem>
                          <SelectItem value="50/100/50">50/100/50</SelectItem>
                          <SelectItem value="100/300/100">100/300/100</SelectItem>
                          <SelectItem value="250/500/250">250/500/250</SelectItem>
                          <SelectItem value="500/500/500">500/500/500</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expiration Date */}
                <FormField
                  control={form.control}
                  name="a-exp-dt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Policy Expiration Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="MM/DD/YYYY"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Premium */}
                <FormField
                  control={form.control}
                  name="aprem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Premium</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. $1,200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Effective Date */}
                <FormField
                  control={form.control}
                  name="effective-date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Effective Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            selected={field.value as Date}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The date the policy should become effective
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Driver Information</h3>
          {form.watch("drivers")?.map((_, index) => (
            <Card key={index} className="mb-4">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Driver {index + 1}</h4>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDriver(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`drivers.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`drivers.${index}.lastName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Replace date of birth field with DemographicInfo component */}
                  <DemographicInfo 
                    control={form.control}
                    genderFieldName={`drivers.${index}.gender`}
                    maritalStatusFieldName={`drivers.${index}.maritalStatus`}
                    dobFieldName={`drivers.${index}.dateOfBirth`}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`drivers.${index}.licenseNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver's License Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter license number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`drivers.${index}.licenseState`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License State</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stateOptions.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`drivers.${index}.primaryDriver`}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Uncheck all other primary drivers
                                const drivers = form.getValues("drivers");
                                drivers.forEach((_, i) => {
                                  if (i !== index) {
                                    form.setValue(
                                      `drivers.${i}.primaryDriver`,
                                      false
                                    );
                                  }
                                });
                              }
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Primary Driver</FormLabel>
                          <FormDescription>
                            This driver uses the vehicle most frequently
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDriver}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Driver
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Vehicle Information</h3>
          
          {/* Render vehicle forms based on vehicleCount */}
          {Array.from({ length: vehicleCount }).map((_, index) => {
            // Vehicle number is 1-based
            const vehicleNumber = index + 1;
            
            // Field prefixes for this vehicle (v1, v2, etc.)
            const prefix = `v${vehicleNumber}`;
            
            return (
              <Card key={vehicleNumber} className="mb-4">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Vehicle {vehicleNumber}</h4>
                    {vehicleNumber > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVehicle(vehicleNumber)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Year */}
                    <FormField
                      control={form.control}
                      name={`${prefix}yr` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 2022" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Make */}
                    <FormField
                      control={form.control}
                      name={`${prefix}make` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Make</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Honda" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Model */}
                    <FormField
                      control={form.control}
                      name={`${prefix}model` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Accord" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* VIN */}
                    <FormField
                      control={form.control}
                      name={`${prefix}vin` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIN</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="17-character VIN"
                              maxLength={17}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Usage */}
                    <FormField
                      control={form.control}
                      name={`${prefix}usage` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Use</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select primary use" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleUseOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Annual Mileage */}
                    <FormField
                      control={form.control}
                      name={`${prefix}mi` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Annual Mileage</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 12000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Primary Driver */}
                    <FormField
                      control={form.control}
                      name={`${prefix}-driver` as keyof AutoInsuranceFormValues}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Driver</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {form.watch("drivers").map((driver, idx) => {
                                const driverName = `${driver.firstName} ${driver.lastName}`.trim();
                                const driverValue = driverName || `driver-${idx}`;
                                return (
                                  <SelectItem
                                    key={idx}
                                    value={driverValue}
                                  >
                                    {driverName || `Driver ${idx + 1}`}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Coverage Options */}
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Coverage Options</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Comprehensive */}
                      <FormField
                        control={form.control}
                        name={`${prefix}comp` as keyof AutoInsuranceFormValues}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Comprehensive Deductible</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select deductible" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">$0</SelectItem>
                                <SelectItem value="100">$100</SelectItem>
                                <SelectItem value="250">$250</SelectItem>
                                <SelectItem value="500">$500</SelectItem>
                                <SelectItem value="1000">$1,000</SelectItem>
                                <SelectItem value="2500">$2,500</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Collision */}
                      <FormField
                        control={form.control}
                        name={`${prefix}coll` as keyof AutoInsuranceFormValues}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collision Deductible</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select deductible" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">$0</SelectItem>
                                <SelectItem value="100">$100</SelectItem>
                                <SelectItem value="250">$250</SelectItem>
                                <SelectItem value="500">$500</SelectItem>
                                <SelectItem value="1000">$1,000</SelectItem>
                                <SelectItem value="2500">$2,500</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Additional Coverages */}
                      <div className="md:col-span-2 space-y-4">
                        <FormField
                          control={form.control}
                          name={`${prefix}glass` as keyof AutoInsuranceFormValues}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Full Glass Coverage</FormLabel>
                                <FormDescription>
                                  Coverage for glass replacement with no deductible
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`${prefix}tow` as keyof AutoInsuranceFormValues}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Towing & Labor</FormLabel>
                                <FormDescription>
                                  Coverage for towing and labor costs due to disablement
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`${prefix}rr` as keyof AutoInsuranceFormValues}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Rental Reimbursement</FormLabel>
                                <FormDescription>
                                  Coverage for rental car expenses
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`${prefix}fin` as keyof AutoInsuranceFormValues}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Vehicle Financed/Leased</FormLabel>
                                <FormDescription>
                                  Is this vehicle financed or leased?
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch(`${prefix}fin` as keyof AutoInsuranceFormValues) && (
                          <FormField
                            control={form.control}
                            name={`${prefix}gap` as keyof AutoInsuranceFormValues}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-6">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Gap Coverage</FormLabel>
                                  <FormDescription>
                                    Coverage for the "gap" between what you owe and the vehicle's value
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {vehicleCount < 8 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVehicle}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Vehicle
            </Button>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="auto-additional-notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information we should know about your auto insurance needs?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="pt-6 space-x-2 flex justify-end">
          <Button type="submit" className="w-full sm:w-auto">
            Submit Auto Insurance Form
          </Button>
        </div>
      </form>
    </Form>
  );
} 