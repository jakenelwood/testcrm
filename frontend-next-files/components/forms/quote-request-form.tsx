'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

// Define form schema with Zod
const formSchema = z.object({
  // Client Information
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  phoneNumber: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().length(2, {
    message: "Please use two-letter state code.",
  }),
  zipCode: z.string().min(5, {
    message: "Please enter a valid ZIP code.",
  }),
  
  // Auto Insurance Fields
  includeAuto: z.boolean().default(false),
  currentAutoCarrier: z.string().optional(),
  currentAutoPremium: z.string().optional(),
  effectiveDate: z.string().optional(),
  vehicleYear: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleVin: z.string().optional(),
  
  // Home Insurance Fields
  includeHome: z.boolean().default(false),
  currentHomeCarrier: z.string().optional(),
  currentHomePremium: z.string().optional(),
  yearBuilt: z.string().optional(),
  squareFootage: z.string().optional(),
  constructionType: z.string().optional(),
  roofType: z.string().optional(),
  
  // Specialty Insurance
  includeSpecialty: z.boolean().default(false),
  specialtyType: z.string().optional(),
  specialtyDescription: z.string().optional(),
  specialtyValue: z.string().optional(),
})

export type QuoteRequestFormValues = z.infer<typeof formSchema>

export function QuoteRequestForm() {
  const [step, setStep] = useState(1)
  
  // Initialize form
  const form = useForm<QuoteRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      phoneNumber: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      includeAuto: false,
      includeHome: false,
      includeSpecialty: false,
    },
  })

  // Form submission handler
  function onSubmit(values: QuoteRequestFormValues) {
    console.log(values)
    // TODO: Add API call to save data
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Client Information</h2>
            
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 555-5555" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="client@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2 md:col-span-2">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
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
                    <FormControl>
                      <Input placeholder="ST" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between pt-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Quote Types</h3>
                <p className="text-sm text-muted-foreground">Select the types of quotes to include</p>
                
                <div className="flex space-x-4 mt-4">
                  <FormField
                    control={form.control}
                    name="includeAuto"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Auto</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeHome"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Home</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeSpecialty"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel>Specialty</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Button type="button" onClick={() => setStep(2)}>
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && form.watch("includeAuto") && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Auto Insurance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentAutoCarrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Auto Carrier</FormLabel>
                    <FormControl>
                      <Input placeholder="Current insurance carrier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentAutoPremium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Premium</FormLabel>
                    <FormControl>
                      <Input placeholder="$" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="effectiveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <h3 className="text-lg font-medium pt-4">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="vehicleYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input placeholder="2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="vehicleVin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle Identification Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (form.watch("includeHome")) {
                    setStep(3)
                  } else if (form.watch("includeSpecialty")) {
                    setStep(4)
                  } else {
                    setStep(5)
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 3 && form.watch("includeHome") && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Home Insurance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentHomeCarrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Home Carrier</FormLabel>
                    <FormControl>
                      <Input placeholder="Current insurance carrier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentHomePremium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Premium</FormLabel>
                    <FormControl>
                      <Input placeholder="$" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input placeholder="1990" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="squareFootage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Square Footage</FormLabel>
                    <FormControl>
                      <Input placeholder="2000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="constructionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Construction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select construction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="frame">Frame</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                        <SelectItem value="brick">Brick</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="roofType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roof Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select roof type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asphalt">Asphalt Shingles</SelectItem>
                        <SelectItem value="metal">Metal</SelectItem>
                        <SelectItem value="tile">Tile</SelectItem>
                        <SelectItem value="slate">Slate</SelectItem>
                        <SelectItem value="wood">Wood Shakes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-between space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  if (form.watch("includeSpecialty")) {
                    setStep(4)
                  } else {
                    setStep(5)
                  }
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 4 && form.watch("includeSpecialty") && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Specialty Insurance</h2>
            
            <FormField
              control={form.control}
              name="specialtyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="boat">Boat/Watercraft</SelectItem>
                      <SelectItem value="rv">RV</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="art">Art/Collectibles</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="specialtyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Description of item(s)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="specialtyValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value</FormLabel>
                  <FormControl>
                    <Input placeholder="$" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between space-x-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (form.watch("includeHome")) {
                    setStep(3)
                  } else if (form.watch("includeAuto")) {
                    setStep(2) 
                  } else {
                    setStep(1)
                  }
                }}
              >
                Back
              </Button>
              <Button type="button" onClick={() => setStep(5)}>
                Next
              </Button>
            </div>
          </div>
        )}
        
        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Review & Submit</h2>
            <p className="text-muted-foreground">Please review your quote request details before submitting.</p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Name:</div>
                <div>{form.watch("clientName") || "Not provided"}</div>
                <div>Phone:</div>
                <div>{form.watch("phoneNumber") || "Not provided"}</div>
                <div>Email:</div>
                <div>{form.watch("email") || "Not provided"}</div>
                <div>Address:</div>
                <div>
                  {form.watch("address") ? 
                    `${form.watch("address")}, ${form.watch("city")}, ${form.watch("state")} ${form.watch("zipCode")}` : 
                    "Not provided"}
                </div>
              </div>
            </div>
            
            {form.watch("includeAuto") && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Auto Insurance</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Current Carrier:</div>
                  <div>{form.watch("currentAutoCarrier") || "Not provided"}</div>
                  <div>Current Premium:</div>
                  <div>{form.watch("currentAutoPremium") || "Not provided"}</div>
                  <div>Vehicle:</div>
                  <div>
                    {form.watch("vehicleYear") ? 
                      `${form.watch("vehicleYear")} ${form.watch("vehicleMake")} ${form.watch("vehicleModel")}` : 
                      "Not provided"}
                  </div>
                </div>
              </div>
            )}
            
            {form.watch("includeHome") && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Home Insurance</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Current Carrier:</div>
                  <div>{form.watch("currentHomeCarrier") || "Not provided"}</div>
                  <div>Current Premium:</div>
                  <div>{form.watch("currentHomePremium") || "Not provided"}</div>
                  <div>Year Built:</div>
                  <div>{form.watch("yearBuilt") || "Not provided"}</div>
                  <div>Construction:</div>
                  <div>{form.watch("constructionType") || "Not provided"}</div>
                </div>
              </div>
            )}
            
            {form.watch("includeSpecialty") && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium mb-2">Specialty Insurance</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Type:</div>
                  <div>{form.watch("specialtyType") || "Not provided"}</div>
                  <div>Description:</div>
                  <div>{form.watch("specialtyDescription") || "Not provided"}</div>
                  <div>Value:</div>
                  <div>{form.watch("specialtyValue") || "Not provided"}</div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button type="submit">
                Submit Quote Request
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
} 