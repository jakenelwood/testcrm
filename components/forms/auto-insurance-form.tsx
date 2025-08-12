'use client';

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DemographicInfo } from "../demographic-info";

// Define vehicle type
type Vehicle = {
  year: string;
  make: string;
  model: string;
  vin: string;
  usage: string;
  annualMiles: string;
  dailyMiles?: string;
  primaryDriver?: string;
  comprehensive?: string;
  collision?: string;
  glass?: boolean;
  towing?: boolean;
  rental?: boolean;
  financed?: boolean;
  gap?: boolean;
};

// Define driver type
type Driver = {
  firstName: string;
  lastName: string;
  gender?: string;
  maritalStatus?: string;
  licenseNumber: string;
  licenseState: string;
  dateOfBirth: Date;
  primaryDriver?: boolean;
  sr22Required?: boolean;
  education?: string;
  occupation?: string;
  relationToPrimary?: string;
  accidentDescription?: string;
  accidentDate?: string;
  militaryStatus?: boolean;
};



// Helper function to validate VIN
const validateVIN = (vin: string) => {
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
};

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
  sr22Required: z.boolean().optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  relationToPrimary: z.string().optional(),
  accidentDescription: z.string().optional(),
  accidentDate: z.string().optional(),
  militaryStatus: z.boolean().optional(),
});

// Vehicle Schema
const vehicleSchema = z.object({
  year: z.string().min(4, "Year must be 4 digits").refine(
    (val) => {
      const year = parseInt(val, 10);
      const currentYear = new Date().getFullYear();
      return !isNaN(year) && year >= 1900 && year <= currentYear + 1;
    },
    "Year must be between 1900 and next year"
  ),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  vin: z.string().min(17, "VIN must be 17 characters").max(17).refine(
    validateVIN,
    "VIN is invalid. Must be 17 alphanumeric characters (no I, O, Q)."
  ),
  usage: z.string().min(1, "Usage is required"),
  annualMiles: z.string().min(1, "Annual mileage is required").refine(
    (val) => {
      const mileage = parseInt(val, 10);
      return !isNaN(mileage) && mileage >= 0 && mileage <= 100000;
    },
    "Annual mileage must be between 0 and 100,000"
  ),
  dailyMiles: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      const mileage = parseInt(val, 10);
      return !isNaN(mileage) && mileage >= 0 && mileage <= 500;
    },
    "Daily mileage must be between 0 and 500"
  ),
  primaryDriver: z.string().optional(),
  comprehensive: z.string().optional(),
  collision: z.string().optional(),
  glass: z.boolean().optional(),
  towing: z.boolean().optional(),
  rental: z.boolean().optional(),
  financed: z.boolean().optional(),
  gap: z.boolean().optional(),
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
  "auto-garaging-address": z.string().optional(),
});

// Combined Auto Insurance Form Schema
const autoInsuranceFormSchema = z.object({
  // Auto insurance info
  ...autoInfoSchema.shape,

  // Dynamic vehicles array
  vehicles: z.array(vehicleSchema).min(1, "At least one vehicle is required"),

  // Driver information
  drivers: z.array(driverSchema).min(1, "At least one driver is required"),
});

// Infer the form values type from the schema
type AutoInsuranceFormValues = z.infer<typeof autoInsuranceFormSchema>;

interface AutoInsuranceFormProps {
  onSubmit: (data: AutoInsuranceFormValues) => void;
  onPrevious?: () => void;
  showPreviousButton?: boolean;
  onDelete?: () => void;
  showDeleteButton?: boolean;
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

export function AutoInsuranceForm({ onSubmit, onPrevious, showPreviousButton = false, onDelete, showDeleteButton = false }: AutoInsuranceFormProps) {
  // Set default values for form
  const defaultValues: Partial<AutoInsuranceFormValues> = {
    // Auto insurance general info
    "a-current-carrier": "",
    "a-mos-current-carrier": "",
    "a-climits": "",
    "a-qlimits": "",
    "a-exp-dt": "",
    "aprem": "",
    "effective-date": new Date(new Date().setDate(new Date().getDate() + 7)),
    "auto-additional-notes": "",
    "auto-garaging-address": "",

    // Initial vehicle
    vehicles: [
      {
        year: "",
        make: "",
        model: "",
        vin: "",
        usage: "",
        annualMiles: "",
        dailyMiles: "",
        primaryDriver: "",
        comprehensive: "",
        collision: "",
        glass: false,
        towing: false,
        rental: false,
        financed: false,
        gap: false,
      },
    ],

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
        sr22Required: false,
        education: "",
        occupation: "",
        relationToPrimary: "Primary Insured",
        accidentDescription: "",
        accidentDate: "",
        militaryStatus: false,
      },
    ],
  };

  const form = useForm<AutoInsuranceFormValues>({
    resolver: zodResolver(autoInsuranceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  const { fields: driverFields, append: appendDriver, remove: removeDriver } = useFieldArray({
    control: form.control,
    name: "drivers",
  });

  const handleFormSubmit = (data: AutoInsuranceFormValues) => {
    onSubmit(data);
    console.log('Dynamic Auto Form Data:', data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-8"
        id="auto-insurance-form"
      >
        {/* Auto Insurance General Information */}
        <Card>
          <CardHeader>
            <CardTitle>Auto Insurance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Insurance Carrier */}
              <FormField
                control={form.control}
                name="a-current-carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Insurance Carrier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type="number" placeholder="e.g. 24" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
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
            </div>

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

            {/* Garaging Address - NEW FIELD */}
            <FormField
              control={form.control}
              name="auto-garaging-address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Garaging Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Where is the vehicle primarily parked?" {...field} />
                  </FormControl>
                  <FormDescription>
                    If different from your home address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="auto-additional-notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about your auto insurance needs"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Dynamic Vehicles Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {vehicleFields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Vehicle {index + 1}</CardTitle>
                    {vehicleFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Year */}
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 2020" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Make */}
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.make`}
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
                      name={`vehicles.${index}.model`}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* VIN */}
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.vin`}
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
                      name={`vehicles.${index}.usage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Use</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select primary use" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vehicleUseOptions.map((option) => (
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Annual Mileage */}
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.annualMiles`}
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

                    {/* Daily Mileage - NEW FIELD */}
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.dailyMiles`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Mileage (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 35"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Average miles driven per day
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Coverage Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.comprehensive`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comprehensive Deductible</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select deductible" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Coverage</SelectItem>
                              <SelectItem value="100">$100</SelectItem>
                              <SelectItem value="250">$250</SelectItem>
                              <SelectItem value="500">$500</SelectItem>
                              <SelectItem value="1000">$1,000</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.collision`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collision Deductible</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select deductible" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Coverage</SelectItem>
                              <SelectItem value="100">$100</SelectItem>
                              <SelectItem value="250">$250</SelectItem>
                              <SelectItem value="500">$500</SelectItem>
                              <SelectItem value="1000">$1,000</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Coverage Options */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.glass`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Glass Coverage</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.towing`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Towing</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.rental`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Rental Car</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.financed`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Financed</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vehicles.${index}.gap`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>GAP Coverage</FormLabel>
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
              onClick={() => appendVehicle({
                year: "",
                make: "",
                model: "",
                vin: "",
                usage: "",
                annualMiles: "",
                dailyMiles: "",
                primaryDriver: "",
                comprehensive: "",
                collision: "",
                glass: false,
                towing: false,
                rental: false,
                financed: false,
                gap: false,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Vehicle
            </Button>
          </CardContent>
        </Card>

        {/* Dynamic Drivers Section */}
        <Card>
          <CardHeader>
            <CardTitle>Drivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {driverFields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {index === 0 ? "Primary Driver" : `Driver ${index + 1}`}
                    </CardTitle>
                    {driverFields.length > 1 && index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDriver(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* First Name */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Last Name */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date of Birth */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.dateOfBirth`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
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
                                  const sixteenYearsAgo = new Date();
                                  sixteenYearsAgo.setFullYear(sixteenYearsAgo.getFullYear() - 16);
                                  return date > sixteenYearsAgo;
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gender */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.gender`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    {/* Marital Status */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.maritalStatus`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* License Number */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.licenseNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver's License Number</FormLabel>
                          <FormControl>
                            <Input placeholder="License number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* License State */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.licenseState`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stateOptions.map((option) => (
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Education */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.education`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select education" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high_school">High School</SelectItem>
                              <SelectItem value="some_college">Some College</SelectItem>
                              <SelectItem value="associates">Associate's Degree</SelectItem>
                              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                              <SelectItem value="masters">Master's Degree</SelectItem>
                              <SelectItem value="doctorate">Doctorate</SelectItem>
                              <SelectItem value="trade_school">Trade School</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Occupation */}
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.occupation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Engineer, Teacher" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Relation to Primary (for non-primary drivers) */}
                  {index > 0 && (
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.relationToPrimary`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship to Primary Insured</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="other_relative">Other Relative</SelectItem>
                              <SelectItem value="roommate">Roommate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Checkboxes for special statuses */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.primaryDriver`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={index === 0} // Primary driver is always the primary
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Primary Driver</FormLabel>
                            <FormDescription>
                              {index === 0 ? "Primary insured is the primary driver" : "Check if this is a primary driver"}
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`drivers.${index}.sr22Required`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>SR22 Required</FormLabel>
                            <FormDescription>
                              Required insurance filing for high-risk drivers
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`drivers.${index}.militaryStatus`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Military Service</FormLabel>
                            <FormDescription>
                              Active or veteran military service
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Accident Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`drivers.${index}.accidentDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recent Accident Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              placeholder="MM/DD/YYYY"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Date of most recent accident or violation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`drivers.${index}.accidentDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accident Description (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of incident"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description of accident or violation
                          </FormDescription>
                          <FormMessage />
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
              onClick={() => appendDriver({
                firstName: "",
                lastName: "",
                dateOfBirth: new Date(1990, 0, 1),
                gender: "",
                maritalStatus: "",
                licenseNumber: "",
                licenseState: "",
                primaryDriver: false,
                sr22Required: false,
                education: "",
                occupation: "",
                relationToPrimary: "",
                accidentDescription: "",
                accidentDate: "",
                militaryStatus: false,
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Driver
            </Button>
          </CardContent>
        </Card>

        <div className="pt-6 flex justify-between items-center">
          {showPreviousButton && onPrevious ? (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          ) : (
            <div></div>
          )}

          {showDeleteButton && onDelete ? (
            <button
              type="button"
              className="p-2 hover:bg-red-50 rounded-md transition-colors"
              onClick={() => {
                const userInput = prompt('To delete this lead, please type "DELETE" to confirm:');
                if (userInput && userInput.toLowerCase() === 'delete') {
                  onDelete();
                } else if (userInput !== null) {
                  alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
                }
              }}
              title="Delete Lead"
            >
              <Trash2 className="h-8 w-8 text-red-600 font-bold stroke-2" />
            </button>
          ) : (
            <div></div>
          )}

          <Button type="submit" className="flex items-center">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
