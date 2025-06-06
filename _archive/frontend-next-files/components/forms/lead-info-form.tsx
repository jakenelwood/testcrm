'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchPipelines } from "@/utils/pipeline-api";
import { Pipeline, PipelineStatus } from "@/types/lead";

// Function to format phone number as (555) 555-5555
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, '');

  // Format the phone number
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

// Map of ZIP codes to states (simplified with just a few examples)
const zipCodeMap: Record<string, string> = {
  // This would be a much larger map in production
  "55401": "MN", "55402": "MN", "55403": "MN", // Minneapolis
  "90001": "CA", "90002": "CA", "90003": "CA", // Los Angeles
  "10001": "NY", "10002": "NY", "10003": "NY", // New York
  "60601": "IL", "60602": "IL", "60603": "IL", // Chicago
  // Add more ZIP codes as needed
};

// Define accident/incident schema
const accidentSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
});

// Define additional driver schema
const additionalDriverSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  date_of_birth: z.string().optional(),
  license_number: z.string().optional(),
  license_state: z.string().optional(),
  relationship: z.string().optional(),
  sr22_required: z.boolean().default(false),
});

// Define form schema
const formSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  business_name: z.string().optional(),
  phone_number: z.string().optional().refine(
    (val) => !val || val === "" || /^\(\d{3}\) \d{3}-\d{4}$/.test(val) || /^\d{10}$/.test(val.replace(/\D/g, '')),
    {
      message: "Phone number must be in the format (555) 555-5555",
    }
  ),
  email: z.string().optional().refine(
    (val) => !val || val === "" || z.string().email().safeParse(val).success,
    {
      message: "Invalid email address",
    }
  ),
  street_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  mailing_address: z.string().optional(),
  prior_address: z.string().optional(),
  rent_or_own: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  date_of_birth: z.string().optional().refine(
    (val) => !val || val === "" || /^\d{2}\/\d{2}\/\d{4}$/.test(val),
    {
      message: "Date must be in MM/DD/YYYY format",
    }
  ),
  education_occupation: z.string().optional(),
  drivers_license: z.string().optional(),
  license_state: z.string().optional(),
  ssn: z.string().optional(),
  referred_by: z.string().optional(),
  effective_date: z.date().optional(),
  sr22_required: z.boolean().default(false),
  military_status: z.boolean().default(false),
  accidents: z.array(accidentSchema).default([]),
  additional_drivers: z.array(additionalDriverSchema).default([]),
  pipeline_id: z.number().min(1, "Pipeline is required"),
  status_id: z.number().min(1, "Stage is required"),
  includeAuto: z.boolean().default(false),
  includeHome: z.boolean().default(false),
  includeSpecialty: z.boolean().default(false),
}).refine((data) => {
  // Require either business name or first/last name
  const hasBusinessName = data.business_name && data.business_name.trim().length > 0;
  const hasPersonalName = data.first_name && data.first_name.trim().length > 0 &&
                          data.last_name && data.last_name.trim().length > 0;
  return hasBusinessName || hasPersonalName;
}, {
  message: "Please fill in either business name or first and last name",
  path: ["first_name"], // This will show the error on the first_name field
});

export type LeadInfoFormValues = z.infer<typeof formSchema>;

interface LeadInfoFormProps {
  onSubmit: (data: LeadInfoFormValues) => void;
  defaultValues?: Partial<LeadInfoFormValues>;
  onAutoSave?: (data: Partial<LeadInfoFormValues>) => void;
  onPrevious?: () => void;
  onDelete?: () => void;
  showPreviousButton?: boolean;
  showDeleteButton?: boolean;
}

export function LeadInfoForm({
  onSubmit,
  defaultValues,
  onAutoSave,
  onPrevious,
  onDelete,
  showPreviousButton = false,
  showDeleteButton = false
}: LeadInfoFormProps) {
  // State for ZIP code to State mapping
  const [zipLookupState, setZipLookupState] = useState<string | null>(null);
  // State for pipelines
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoadingPipelines, setIsLoadingPipelines] = useState(true);
  const [selectedPipelineStatuses, setSelectedPipelineStatuses] = useState<PipelineStatus[]>([]);
  // State for auto-save
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize form with default values
  const form = useForm<LeadInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      business_name: "",
      phone_number: "",
      email: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      mailing_address: "",
      prior_address: "",
      rent_or_own: "",
      gender: "",
      marital_status: "",
      date_of_birth: "",
      education_occupation: "",
      drivers_license: "",
      license_state: "",
      ssn: "",
      referred_by: "",
      effective_date: new Date(new Date().setDate(new Date().getDate() + 7)),
      sr22_required: false,
      military_status: false,
      accidents: [],
      additional_drivers: [],
      pipeline_id: 0, // Will be set by the useEffect when pipelines are loaded
      status_id: 0, // Will be set when pipeline is selected
      includeAuto: false,
      includeHome: false,
      includeSpecialty: false,
      ...defaultValues, // Merge any provided default values
      accidents: defaultValues?.accidents || [], // Ensure accidents is always an array
      additional_drivers: defaultValues?.additional_drivers || [], // Ensure additional_drivers is always an array
    },
  });

  // Fetch pipelines on component mount
  useEffect(() => {
    const loadPipelines = async () => {
      try {
        setIsLoadingPipelines(true);
        const data = await fetchPipelines();
        setPipelines(data);

        // If we have a default pipeline, set it as the default value
        const defaultPipeline = data.find(p => p.is_default);
        if (defaultPipeline) {
          form.setValue('pipeline_id', defaultPipeline.id);
          // Set the first status as default if available
          if (defaultPipeline.statuses && defaultPipeline.statuses.length > 0) {
            form.setValue('status_id', defaultPipeline.statuses[0].id);
            setSelectedPipelineStatuses(defaultPipeline.statuses);
          }
        }
      } catch (error) {
        console.error('Error loading pipelines:', error);
      } finally {
        setIsLoadingPipelines(false);
      }
    };

    loadPipelines();
  }, [form]);

  // Watch for ZIP code and pipeline changes
  const zipCode = form.watch('zip_code');
  const pipelineId = form.watch('pipeline_id');
  const accidents = form.watch('accidents') || [];
  const additionalDrivers = form.watch('additional_drivers') || [];

  // Auto-save function
  const autoSave = useCallback(async (data: Partial<LeadInfoFormValues>) => {
    if (onAutoSave) {
      try {
        await onAutoSave(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [onAutoSave]);

  // Watch all form values for auto-save
  const formValues = form.watch();
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formValues && ((formValues.first_name && formValues.first_name.length > 0) || (formValues.business_name && formValues.business_name.length > 0))) {
        autoSave(formValues);
      }
    }, 1000); // Auto-save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formValues, autoSave]);

  // Accident management functions
  const addAccident = () => {
    const currentAccidents = form.getValues('accidents') || [];
    form.setValue('accidents', [...currentAccidents, { date: '', description: '' }]);
  };

  const removeAccident = (index: number) => {
    const currentAccidents = form.getValues('accidents') || [];
    form.setValue('accidents', currentAccidents.filter((_, i) => i !== index));
  };

  // Additional driver management functions
  const addAdditionalDriver = () => {
    const currentDrivers = form.getValues('additional_drivers') || [];
    form.setValue('additional_drivers', [...currentDrivers, {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      license_number: '',
      license_state: '',
      relationship: '',
      sr22_required: false
    }]);
  };

  const removeAdditionalDriver = (index: number) => {
    const currentDrivers = form.getValues('additional_drivers') || [];
    form.setValue('additional_drivers', currentDrivers.filter((_, i) => i !== index));
  };

  // Auto-populate state based on ZIP code
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      const stateFromZip = zipCodeMap[zipCode];
      if (stateFromZip) {
        setZipLookupState(stateFromZip);
        form.setValue('state', stateFromZip);
      } else {
        setZipLookupState(null);
      }
    }
  }, [zipCode, form]);

  // Handle pipeline changes to update available statuses
  useEffect(() => {
    if (pipelines.length > 0 && pipelineId) {
      const selectedPipeline = pipelines.find(p => p.id === pipelineId);

      if (selectedPipeline && selectedPipeline.statuses) {
        setSelectedPipelineStatuses(selectedPipeline.statuses);
        // Set the first status as default if no status is currently selected
        if (!form.getValues('status_id') && selectedPipeline.statuses.length > 0) {
          form.setValue('status_id', selectedPipeline.statuses[0].id);
        }
      } else {
        setSelectedPipelineStatuses([]);
        form.setValue('status_id', 0);
      }
    }
  }, [pipelineId, pipelines, form]);

  // Handle form submission
  const handleFormSubmit = (values: any) => {
    onSubmit(values as LeadInfoFormValues);
  };

  return (
    <div className="space-y-6">
      {/* Header with Previous button and auto-save indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showPreviousButton && onPrevious && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrevious}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          <h2 className="text-xl font-semibold">Lead Information</h2>
        </div>
        {lastSaved && (
          <div className="text-sm text-muted-foreground">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pipeline Selection */}
                <FormField
                  control={form.control}
                  name="pipeline_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                        disabled={isLoadingPipelines}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pipeline" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pipelines.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                              {pipeline.name}
                              {pipeline.is_default && " (Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the appropriate pipeline for this lead
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Stage Selection */}
                <FormField
                  control={form.control}
                  name="status_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                        disabled={selectedPipelineStatuses.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedPipelineStatuses.map((status) => (
                            <SelectItem key={status.id} value={status.id.toString()}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the current stage for this lead
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Name Fields - moved below pipeline/stage */}
                <FormField
                  control={form.control}
                  name="first_name"
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

                <FormField
                  control={form.control}
                  name="last_name"
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

                {/* Business Name Field */}
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corporation" {...field} />
                      </FormControl>
                      <FormDescription>
                        Fill this if this is a business lead
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(555) 555-5555"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth (MM/DD/YYYY)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MM/DD/YYYY"
                          {...field}
                          onChange={(e) => {
                            // Add slashes automatically
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length > 4) {
                              value = value.slice(0, 4) + value.slice(4);
                            }
                            if (value.length > 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2);
                            }
                            if (value.length > 5) {
                              value = value.slice(0, 5) + '/' + value.slice(5, 9);
                            }
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Anytown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AL">Alabama</SelectItem>
                          <SelectItem value="AK">Alaska</SelectItem>
                          <SelectItem value="AZ">Arizona</SelectItem>
                          <SelectItem value="AR">Arkansas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="CT">Connecticut</SelectItem>
                          <SelectItem value="DE">Delaware</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="HI">Hawaii</SelectItem>
                          <SelectItem value="ID">Idaho</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IA">Iowa</SelectItem>
                          <SelectItem value="KS">Kansas</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="LA">Louisiana</SelectItem>
                          <SelectItem value="ME">Maine</SelectItem>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="MA">Massachusetts</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="MN">Minnesota</SelectItem>
                          <SelectItem value="MS">Mississippi</SelectItem>
                          <SelectItem value="MO">Missouri</SelectItem>
                          <SelectItem value="MT">Montana</SelectItem>
                          <SelectItem value="NE">Nebraska</SelectItem>
                          <SelectItem value="NV">Nevada</SelectItem>
                          <SelectItem value="NH">New Hampshire</SelectItem>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NM">New Mexico</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="ND">North Dakota</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="OK">Oklahoma</SelectItem>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          <SelectItem value="SC">South Carolina</SelectItem>
                          <SelectItem value="SD">South Dakota</SelectItem>
                          <SelectItem value="TN">Tennessee</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="UT">Utah</SelectItem>
                          <SelectItem value="VT">Vermont</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="WI">Wisconsin</SelectItem>
                          <SelectItem value="WY">Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                      {zipLookupState && (
                        <FormDescription>
                          Auto-filled based on ZIP code
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} maxLength={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mailing_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mailing Address (if different)</FormLabel>
                      <FormControl>
                        <Input placeholder="P.O. Box 123, City, State ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prior_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prior Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Previous address if moved recently" {...field} />
                      </FormControl>
                      <FormDescription>
                        If you've moved in the last 3 years
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rent_or_own"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Do you rent or own your home?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="own">Own</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="live_with_family">Live with Family</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non_binary">Non-Binary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marital_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education/Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Bachelor's Degree, Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drivers_license"
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

                <FormField
                  control={form.control}
                  name="license_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License State</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AL">Alabama</SelectItem>
                          <SelectItem value="AK">Alaska</SelectItem>
                          <SelectItem value="AZ">Arizona</SelectItem>
                          <SelectItem value="AR">Arkansas</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="CO">Colorado</SelectItem>
                          <SelectItem value="CT">Connecticut</SelectItem>
                          <SelectItem value="DE">Delaware</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          <SelectItem value="GA">Georgia</SelectItem>
                          <SelectItem value="HI">Hawaii</SelectItem>
                          <SelectItem value="ID">Idaho</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IA">Iowa</SelectItem>
                          <SelectItem value="KS">Kansas</SelectItem>
                          <SelectItem value="KY">Kentucky</SelectItem>
                          <SelectItem value="LA">Louisiana</SelectItem>
                          <SelectItem value="ME">Maine</SelectItem>
                          <SelectItem value="MD">Maryland</SelectItem>
                          <SelectItem value="MA">Massachusetts</SelectItem>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="MN">Minnesota</SelectItem>
                          <SelectItem value="MS">Mississippi</SelectItem>
                          <SelectItem value="MO">Missouri</SelectItem>
                          <SelectItem value="MT">Montana</SelectItem>
                          <SelectItem value="NE">Nebraska</SelectItem>
                          <SelectItem value="NV">Nevada</SelectItem>
                          <SelectItem value="NH">New Hampshire</SelectItem>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NM">New Mexico</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="NC">North Carolina</SelectItem>
                          <SelectItem value="ND">North Dakota</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="OK">Oklahoma</SelectItem>
                          <SelectItem value="OR">Oregon</SelectItem>
                          <SelectItem value="PA">Pennsylvania</SelectItem>
                          <SelectItem value="RI">Rhode Island</SelectItem>
                          <SelectItem value="SC">South Carolina</SelectItem>
                          <SelectItem value="SD">South Dakota</SelectItem>
                          <SelectItem value="TN">Tennessee</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="UT">Utah</SelectItem>
                          <SelectItem value="VT">Vermont</SelectItem>
                          <SelectItem value="VA">Virginia</SelectItem>
                          <SelectItem value="WA">Washington</SelectItem>
                          <SelectItem value="WV">West Virginia</SelectItem>
                          <SelectItem value="WI">Wisconsin</SelectItem>
                          <SelectItem value="WY">Wyoming</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="XXX-XX-XXXX" {...field} />
                      </FormControl>
                      <FormDescription>
                        This information is securely stored and will only be used for quote purposes.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referred_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referred By</FormLabel>
                      <FormControl>
                        <Input placeholder="How did you hear about us?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Effective Date */}
                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Desired Effective Date</FormLabel>
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
                        When would you like your insurance to start?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Special Status Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField
                  control={form.control}
                  name="sr22_required"
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
                  name="military_status"
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
                          Active duty or veteran military service
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Accidents/Incidents Information */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Accidents & Incidents</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAccident}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Accident
                  </Button>
                </div>

                {accidents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                    <p>No accidents or incidents reported.</p>
                    <p className="text-sm">Click "Add Accident" to add any accidents, violations, or incidents.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accidents.map((accident, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Accident/Incident #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAccident(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`accidents.${index}.date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`accidents.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Brief description of incident"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Drivers Information */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Additional Drivers</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAdditionalDriver}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </div>

                {additionalDrivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                    <p>No additional drivers added.</p>
                    <p className="text-sm">Click "Add Driver" to add household members who will be driving.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {additionalDrivers.map((driver, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Additional Driver {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdditionalDriver(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.first_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Driver's first name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.last_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Driver's last name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.date_of_birth`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.license_number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Driver's license number"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.license_state`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License State</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="AL">Alabama</SelectItem>
                                    <SelectItem value="AK">Alaska</SelectItem>
                                    <SelectItem value="AZ">Arizona</SelectItem>
                                    <SelectItem value="AR">Arkansas</SelectItem>
                                    <SelectItem value="CA">California</SelectItem>
                                    <SelectItem value="CO">Colorado</SelectItem>
                                    <SelectItem value="CT">Connecticut</SelectItem>
                                    <SelectItem value="DE">Delaware</SelectItem>
                                    <SelectItem value="FL">Florida</SelectItem>
                                    <SelectItem value="GA">Georgia</SelectItem>
                                    <SelectItem value="HI">Hawaii</SelectItem>
                                    <SelectItem value="ID">Idaho</SelectItem>
                                    <SelectItem value="IL">Illinois</SelectItem>
                                    <SelectItem value="IN">Indiana</SelectItem>
                                    <SelectItem value="IA">Iowa</SelectItem>
                                    <SelectItem value="KS">Kansas</SelectItem>
                                    <SelectItem value="KY">Kentucky</SelectItem>
                                    <SelectItem value="LA">Louisiana</SelectItem>
                                    <SelectItem value="ME">Maine</SelectItem>
                                    <SelectItem value="MD">Maryland</SelectItem>
                                    <SelectItem value="MA">Massachusetts</SelectItem>
                                    <SelectItem value="MI">Michigan</SelectItem>
                                    <SelectItem value="MN">Minnesota</SelectItem>
                                    <SelectItem value="MS">Mississippi</SelectItem>
                                    <SelectItem value="MO">Missouri</SelectItem>
                                    <SelectItem value="MT">Montana</SelectItem>
                                    <SelectItem value="NE">Nebraska</SelectItem>
                                    <SelectItem value="NV">Nevada</SelectItem>
                                    <SelectItem value="NH">New Hampshire</SelectItem>
                                    <SelectItem value="NJ">New Jersey</SelectItem>
                                    <SelectItem value="NM">New Mexico</SelectItem>
                                    <SelectItem value="NY">New York</SelectItem>
                                    <SelectItem value="NC">North Carolina</SelectItem>
                                    <SelectItem value="ND">North Dakota</SelectItem>
                                    <SelectItem value="OH">Ohio</SelectItem>
                                    <SelectItem value="OK">Oklahoma</SelectItem>
                                    <SelectItem value="OR">Oregon</SelectItem>
                                    <SelectItem value="PA">Pennsylvania</SelectItem>
                                    <SelectItem value="RI">Rhode Island</SelectItem>
                                    <SelectItem value="SC">South Carolina</SelectItem>
                                    <SelectItem value="SD">South Dakota</SelectItem>
                                    <SelectItem value="TN">Tennessee</SelectItem>
                                    <SelectItem value="TX">Texas</SelectItem>
                                    <SelectItem value="UT">Utah</SelectItem>
                                    <SelectItem value="VT">Vermont</SelectItem>
                                    <SelectItem value="VA">Virginia</SelectItem>
                                    <SelectItem value="WA">Washington</SelectItem>
                                    <SelectItem value="WV">West Virginia</SelectItem>
                                    <SelectItem value="WI">Wisconsin</SelectItem>
                                    <SelectItem value="WY">Wyoming</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.relationship`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                    <SelectItem value="relative">Other Relative</SelectItem>
                                    <SelectItem value="roommate">Roommate</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`additional_drivers.${index}.sr22_required`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    SR22 Required
                                  </FormLabel>
                                  <FormDescription>
                                    Required insurance filing for high-risk drivers
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pipeline Selector */}
              <div className="space-y-4 mb-6">
                <FormField
                  control={form.control}
                  name="pipeline_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : undefined}
                        disabled={isLoadingPipelines || form.watch('client_type') === 'Business'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingPipelines ? "Loading pipelines..." : "Select a pipeline"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pipelines.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                              {pipeline.name} {pipeline.is_default && "(Default)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {form.watch('client_type') === 'Business'
                          ? "Business clients are automatically assigned to the Bravo pipeline"
                          : "Select which pipeline this lead should be assigned to"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Insurance Type Checkboxes */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="includeAuto"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Auto Insurance
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeHome"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Home Insurance
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeSpecialty"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Specialty Insurance
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
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
        </CardContent>
      </Card>
    </div>
  );
}