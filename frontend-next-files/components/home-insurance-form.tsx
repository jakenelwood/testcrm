'use client';

import React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Safety & Additional Details */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Safety & Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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