'use client';

import React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2 } from "lucide-react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

// Define the form schema based on home insurance requirements from placeholders.txt
const formSchema = z.object({
  // Basic Home Details
  hcovtype: z.string({
    required_error: "Please select coverage type",
  }),
  "h-current-insurance-carrier": z.string().optional(),
  "hmos-with-current-carrier": z.string().optional(),
  "h-expiration-date": z.string().optional(),
  husage: z.string({
    required_error: "Please select home usage",
  }),
  hfrmtyp: z.string({
    required_error: "Please select form type",
  }),
  hnofm: z.string().min(1, "Number of household members is required"),
  "hyr-built": z.string().min(4, "Please enter a valid year"),
  hsqft: z.string().min(1, "Square footage is required"),

  // Property Features
  hstorystyle: z.string({
    required_error: "Please select story style",
  }),
  hgarage: z.string({
    required_error: "Please select garage type",
  }),
  hbasementpct: z.string().optional(),
  hwalkout: z.boolean().optional(),
  hfullbath: z.string().min(1, "Number of full bathrooms is required"),
  hhalfbath: z.string().min(1, "Number of half bathrooms is required"),
  hthreeqtrbath: z.string().min(1, "Number of 3/4 bathrooms is required"),

  // Construction Details
  hsidingtype: z.string({
    required_error: "Please select siding type",
  }),
  hfireplc: z.string().optional(),
  hwoodstove: z.boolean().optional(),

  // Outdoor Features
  hpool: z.string().optional(),
  pldpth: z.string().optional(),
  dvbrd: z.boolean().optional(),
  htramp: z.boolean().optional(),
  hfence: z.string().optional(),
  "hfence-height": z.string().optional(),

  // Safety & Systems
  "hmi-from-fd": z.string().min(1, "Distance from fire department is required"),
  hrfd: z.string().min(1, "Responding fire department is required"),
  hhydrantdist: z.string().min(1, "Hydrant distance is required"),
  hsprinkled: z.boolean().optional(),

  // Valuation
  hreconcost: z.string().min(1, "Reconstruction cost is required"),
  hperspropval: z.string().min(1, "Personal property value is required"),

  // Additional Information
  hpets: z.string().optional(),
  "h-bitingpets": z.boolean().optional(),
  hbiztype: z.string().optional(),
  hdeductible: z.string({
    required_error: "Please select deductible",
  }),

  // Priority 1: Core Missing Fields - Property Details
  "home-number-of-bedrooms": z.string().optional(),
  "home-attached-structures": z.string().optional(),
  "home-detached-structures": z.string().optional(),
  "home-deck-size": z.string().optional(),
  "home-deck-type": z.string().optional(),
  "home-porch-size": z.string().optional(),
  "home-porch-type": z.string().optional(),
  "home-septic-sewer": z.string().optional(),
  "home-mortgage": z.string().optional(),

  // Priority 1: Systems & Infrastructure
  "home-electrical-type-amps": z.string().optional(),
  "home-electrical-year": z.string().optional(),
  "home-heating-system-type": z.string().optional(),
  "home-heating-system-year": z.string().optional(),
  "home-plumbing-material-type": z.string().optional(),
  "home-plumbing-year": z.string().optional(),
  "home-roof-year-replaced": z.string().optional(),

  // Priority 1: Safety & Security
  "home-alarm": z.boolean().optional(),
  "home-flood-insurance": z.boolean().optional(),
  "home-wind-hail": z.boolean().optional(),
  "home-service-line-limit": z.string().optional(),
  "home-sump-pump-limit": z.string().optional(),

  // Priority 1: Insurance Details
  "home-expiration-date": z.string().optional(),
  "home-months-with-current-carrier": z.string().optional(),
  "home-form-type": z.string().optional(),
  "home-claim-description": z.string().optional(),
  "home-claim-date": z.string().optional(),

  // Priority 2: Specialty Items
  "home-e-bikes-detail-type": z.string().optional(),
  "home-e-bikes-value": z.string().optional(),
  "home-scheduled-items-type": z.string().optional(),
  "home-scheduled-items-value": z.string().optional(),

  // Priority 3: Additional Information
  "home-additional-notes": z.string().optional(),
  "home-bankruptcy-foreclosure": z.boolean().optional(),
});

export type HomeInsuranceFormValues = z.infer<typeof formSchema>;

interface HomeInsuranceFormProps {
  onSubmitForm?: (values: HomeInsuranceFormValues) => void;
  onPrevious?: () => void;
  showPreviousButton?: boolean;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export function HomeInsuranceForm({ onSubmitForm, onPrevious, showPreviousButton = false, onDelete, showDeleteButton = false }: HomeInsuranceFormProps) {
  // Initialize the form with default values
  const form = useForm<HomeInsuranceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hcovtype: "",
      "h-current-insurance-carrier": "",
      "hmos-with-current-carrier": "",
      "h-expiration-date": "",
      husage: "",
      hfrmtyp: "",
      hnofm: "",
      "hyr-built": "",
      hsqft: "",
      hstorystyle: "",
      hgarage: "",
      hbasementpct: "",
      hwalkout: false,
      hfullbath: "",
      hhalfbath: "",
      hthreeqtrbath: "",
      hsidingtype: "",
      hfireplc: "",
      hwoodstove: false,
      hpool: "",
      pldpth: "",
      dvbrd: false,
      htramp: false,
      hfence: "",
      "hfence-height": "",
      "hmi-from-fd": "",
      hrfd: "",
      hhydrantdist: "",
      hsprinkled: false,
      hreconcost: "",
      hperspropval: "",
      hpets: "",
      "h-bitingpets": false,
      hbiztype: "",
      hdeductible: "",

      // Priority 1: Core Missing Fields - Property Details
      "home-number-of-bedrooms": "",
      "home-attached-structures": "",
      "home-detached-structures": "",
      "home-deck-size": "",
      "home-deck-type": "",
      "home-porch-size": "",
      "home-porch-type": "",
      "home-septic-sewer": "",
      "home-mortgage": "",

      // Priority 1: Systems & Infrastructure
      "home-electrical-type-amps": "",
      "home-electrical-year": "",
      "home-heating-system-type": "",
      "home-heating-system-year": "",
      "home-plumbing-material-type": "",
      "home-plumbing-year": "",
      "home-roof-year-replaced": "",

      // Priority 1: Safety & Security
      "home-alarm": false,
      "home-flood-insurance": false,
      "home-wind-hail": false,
      "home-service-line-limit": "",
      "home-sump-pump-limit": "",

      // Priority 1: Insurance Details
      "home-expiration-date": "",
      "home-months-with-current-carrier": "",
      "home-form-type": "",
      "home-claim-description": "",
      "home-claim-date": "",

      // Priority 2: Specialty Items
      "home-e-bikes-detail-type": "",
      "home-e-bikes-value": "",
      "home-scheduled-items-type": "",
      "home-scheduled-items-value": "",

      // Priority 3: Additional Information
      "home-additional-notes": "",
      "home-bankruptcy-foreclosure": false,
    },
  });

  // Handle form submission
  function onSubmit(values: HomeInsuranceFormValues) {
    // This would typically send data to an API
    console.log(values);

    // If a callback was provided, call it with the values
    if (onSubmitForm) {
      onSubmitForm(values);
    } else {
      // Default behavior if no callback provided
      alert("Form submitted successfully! Check console for values.");
    }
  }

  return (
    <div className="w-full">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="hcovtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coverage Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="homeowners">Homeowners</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="renters">Renters</SelectItem>
                            <SelectItem value="landlord">Landlord</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="h-current-insurance-carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Insurance Carrier</FormLabel>
                        <FormControl>
                          <Input placeholder="Current carrier" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hmos-with-current-carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Months with Current Carrier</FormLabel>
                        <FormControl>
                          <Input placeholder="Number of months" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="h-expiration-date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Property Information Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Property Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="husage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Usage</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select usage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="primary">Primary Residence</SelectItem>
                            <SelectItem value="secondary">Secondary/Vacation</SelectItem>
                            <SelectItem value="rental">Rental Property</SelectItem>
                            <SelectItem value="vacant">Vacant</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hfrmtyp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select form type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HO3">HO3 (Standard)</SelectItem>
                            <SelectItem value="HO4">HO4 (Renters)</SelectItem>
                            <SelectItem value="HO5">HO5 (Premium)</SelectItem>
                            <SelectItem value="HO6">HO6 (Condo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hnofm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Household Members</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 4" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hyr-built"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Built</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1985" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hsqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Square Footage</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2000" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hstorystyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stories/Style</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stories/style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1story">1 Story</SelectItem>
                            <SelectItem value="1.5story">1.5 Stories</SelectItem>
                            <SelectItem value="2story">2 Stories</SelectItem>
                            <SelectItem value="3story">3+ Stories</SelectItem>
                            <SelectItem value="split">Split Level</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hgarage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garage Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select garage type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="attached1">Attached 1-Car</SelectItem>
                            <SelectItem value="attached2">Attached 2-Car</SelectItem>
                            <SelectItem value="attached3">Attached 3+ Car</SelectItem>
                            <SelectItem value="detached1">Detached 1-Car</SelectItem>
                            <SelectItem value="detached2">Detached 2-Car</SelectItem>
                            <SelectItem value="detached3">Detached 3+ Car</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Valuation Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Valuation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="hreconcost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reconstruction Cost</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 350000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Estimated cost to rebuild your home
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hperspropval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Property Value</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 175000" {...field} />
                        </FormControl>
                        <FormDescription>
                          Value of your belongings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hdeductible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductible</FormLabel>
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
                            <SelectItem value="500">$500</SelectItem>
                            <SelectItem value="1000">$1,000</SelectItem>
                            <SelectItem value="2500">$2,500</SelectItem>
                            <SelectItem value="5000">$5,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Property Details Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="home-number-of-bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Bedrooms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-attached-structures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attached Structures</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Deck, Porch, Garage" {...field} />
                        </FormControl>
                        <FormDescription>
                          List any structures attached to the home
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-detached-structures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detached Structures</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Shed, Garage, Pool House" {...field} />
                        </FormControl>
                        <FormDescription>
                          List any structures separate from the home
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-deck-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deck Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deck type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="wood">Wood</SelectItem>
                            <SelectItem value="composite">Composite</SelectItem>
                            <SelectItem value="concrete">Concrete</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-deck-size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deck Size (sq ft)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 200" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-porch-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porch Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select porch type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="covered">Covered</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="screened">Screened</SelectItem>
                            <SelectItem value="enclosed">Enclosed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-porch-size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porch Size (sq ft)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 150" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-septic-sewer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Septic/Sewer System</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select system type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public-sewer">Public Sewer</SelectItem>
                            <SelectItem value="septic">Septic System</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-mortgage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mortgage Information</FormLabel>
                        <FormControl>
                          <Input placeholder="Lender name or 'Paid Off'" {...field} />
                        </FormControl>
                        <FormDescription>
                          Name of mortgage lender or indicate if paid off
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Systems & Infrastructure Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Systems & Infrastructure</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="home-electrical-type-amps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electrical System (Amps)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select electrical capacity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="60">60 Amp</SelectItem>
                            <SelectItem value="100">100 Amp</SelectItem>
                            <SelectItem value="150">150 Amp</SelectItem>
                            <SelectItem value="200">200 Amp</SelectItem>
                            <SelectItem value="400">400+ Amp</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-electrical-year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electrical System Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2010" {...field} />
                        </FormControl>
                        <FormDescription>
                          Year electrical system was installed/updated
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-heating-system-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heating System Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select heating type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="forced-air-gas">Forced Air - Gas</SelectItem>
                            <SelectItem value="forced-air-electric">Forced Air - Electric</SelectItem>
                            <SelectItem value="boiler">Boiler</SelectItem>
                            <SelectItem value="heat-pump">Heat Pump</SelectItem>
                            <SelectItem value="radiant">Radiant</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-heating-system-year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heating System Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2015" {...field} />
                        </FormControl>
                        <FormDescription>
                          Year heating system was installed/replaced
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-plumbing-material-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plumbing Material</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plumbing material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="copper">Copper</SelectItem>
                            <SelectItem value="pex">PEX</SelectItem>
                            <SelectItem value="pvc">PVC</SelectItem>
                            <SelectItem value="galvanized">Galvanized Steel</SelectItem>
                            <SelectItem value="mixed">Mixed Materials</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-plumbing-year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plumbing System Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2005" {...field} />
                        </FormControl>
                        <FormDescription>
                          Year plumbing was installed/updated
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-roof-year-replaced"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roof Replacement Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2018" {...field} />
                        </FormControl>
                        <FormDescription>
                          Year roof was last replaced or installed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Safety & Additional Details */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Safety & Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="hmi-from-fd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Miles from Fire Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hrfd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responding Fire Department</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Minneapolis Fire Station #7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hhydrantdist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hydrant Distance (feet)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 500" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hsprinkled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sprinkler System</FormLabel>
                          <FormDescription>
                            Does the property have a sprinkler system?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-alarm"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Security Alarm System</FormLabel>
                          <FormDescription>
                            Does the property have a security alarm system?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-flood-insurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Flood Insurance</FormLabel>
                          <FormDescription>
                            Do you have separate flood insurance?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-wind-hail"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Wind/Hail Coverage</FormLabel>
                          <FormDescription>
                            Do you want wind and hail coverage?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-service-line-limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Line Coverage Limit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage limit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Coverage</SelectItem>
                            <SelectItem value="5000">$5,000</SelectItem>
                            <SelectItem value="10000">$10,000</SelectItem>
                            <SelectItem value="15000">$15,000</SelectItem>
                            <SelectItem value="25000">$25,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Coverage for water, sewer, and utility lines
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-sump-pump-limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sump Pump Coverage Limit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select coverage limit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Coverage</SelectItem>
                            <SelectItem value="2500">$2,500</SelectItem>
                            <SelectItem value="5000">$5,000</SelectItem>
                            <SelectItem value="10000">$10,000</SelectItem>
                            <SelectItem value="15000">$15,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Coverage for sump pump failure
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hpets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pets</FormLabel>
                        <FormControl>
                          <Input placeholder="Type and number of pets" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="h-bitingpets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Animals with Biting History</FormLabel>
                          <FormDescription>
                            Do you have any animals with a biting history?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Insurance Details & Claims History */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Insurance Details & Claims History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="home-expiration-date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Policy Expiration Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/DD/YYYY" type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-months-with-current-carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Months with Current Carrier</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 24" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-form-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Policy Form Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select form type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HO1">HO1 - Basic Form</SelectItem>
                            <SelectItem value="HO2">HO2 - Broad Form</SelectItem>
                            <SelectItem value="HO3">HO3 - Special Form</SelectItem>
                            <SelectItem value="HO4">HO4 - Renters</SelectItem>
                            <SelectItem value="HO5">HO5 - Comprehensive</SelectItem>
                            <SelectItem value="HO6">HO6 - Condo</SelectItem>
                            <SelectItem value="HO8">HO8 - Modified Coverage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-claim-date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Most Recent Claim Date</FormLabel>
                        <FormControl>
                          <Input placeholder="MM/DD/YYYY" type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Leave blank if no claims in past 5 years
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-claim-description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Claim Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of claim (if any)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Describe the nature of any recent claims
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Specialty Items & Additional Coverage */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Specialty Items & Additional Coverage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="home-e-bikes-detail-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Bikes Type/Details</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electric mountain bike, 2 bikes" {...field} />
                        </FormControl>
                        <FormDescription>
                          Describe any electric bikes you own
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-e-bikes-value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-Bikes Total Value</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5000" type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total value of all electric bikes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-scheduled-items-type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Items Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Jewelry, Art, Collectibles" {...field} />
                        </FormControl>
                        <FormDescription>
                          High-value items requiring special coverage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-scheduled-items-value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Items Value</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 25000" type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total value of items requiring scheduling
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-bankruptcy-foreclosure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Bankruptcy/Foreclosure History</FormLabel>
                          <FormDescription>
                            Have you had bankruptcy or foreclosure in the past 7 years?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="home-additional-notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Any additional information about the property..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Include any other relevant details about your property
                        </FormDescription>
                        <FormMessage />
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