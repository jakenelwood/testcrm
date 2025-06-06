'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { QuoteSection } from "@/components/ui/quote-section";

// Define form schema for renters insurance
const rentersInsuranceFormSchema = z.object({
  // Property Details
  rentalAddress: z.string().min(1, "Rental address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  numberOfRooms: z.string().optional(),
  squareFootage: z.string().optional(),
  
  // Current Insurance
  currentCarrier: z.string().optional(),
  currentPremium: z.string().optional(),
  expirationDate: z.string().optional(),
  
  // Coverage Details
  personalPropertyValue: z.string().min(1, "Personal property value is required"),
  liabilityLimit: z.string().min(1, "Liability limit is required"),
  deductible: z.string().min(1, "Deductible is required"),
  
  // Additional Coverage
  identityTheft: z.boolean().optional(),
  waterBackup: z.boolean().optional(),
  earthquakeCoverage: z.boolean().optional(),
  
  // Claims History
  claimsHistory: z.string().optional(),
  claimsDescription: z.string().optional(),
  
  // Additional Information
  additionalNotes: z.string().optional(),
});

type RentersInsuranceFormValues = z.infer<typeof rentersInsuranceFormSchema>;

interface RentersInsuranceFormProps {
  onSubmit: (data: any) => void;
  onPrevious?: () => void;
  showPreviousButton?: boolean;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  leadId?: string;
}

export function RentersInsuranceForm({ 
  onSubmit, 
  onPrevious, 
  showPreviousButton = false,
  onDelete,
  showDeleteButton = false,
  leadId
}: RentersInsuranceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RentersInsuranceFormValues>({
    resolver: zodResolver(rentersInsuranceFormSchema),
    defaultValues: {
      rentalAddress: "",
      propertyType: "",
      numberOfRooms: "",
      squareFootage: "",
      currentCarrier: "",
      currentPremium: "",
      expirationDate: "",
      personalPropertyValue: "",
      liabilityLimit: "",
      deductible: "",
      identityTheft: false,
      waterBackup: false,
      earthquakeCoverage: false,
      claimsHistory: "",
      claimsDescription: "",
      additionalNotes: "",
    },
  });

  const handleFormSubmit = async (data: RentersInsuranceFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Renters Insurance Information</CardTitle>
          <CardDescription>
            Please provide details about your rental property and insurance needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Property Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rentalAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Rental Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="duplex">Duplex</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Rooms</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2" type="number" {...field} />
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
                          <Input placeholder="e.g., 1200" type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Current Insurance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Current Insurance (if any)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentCarrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Carrier</FormLabel>
                        <FormControl>
                          <Input placeholder="Insurance company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentPremium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Premium</FormLabel>
                        <FormControl>
                          <Input placeholder="$0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
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

              {/* Coverage Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Coverage Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="personalPropertyValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal Property Value</FormLabel>
                        <FormControl>
                          <Input placeholder="$25,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="liabilityLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Liability Limit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select limit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="100000">$100,000</SelectItem>
                            <SelectItem value="300000">$300,000</SelectItem>
                            <SelectItem value="500000">$500,000</SelectItem>
                            <SelectItem value="1000000">$1,000,000</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deductible"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deductible</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select deductible" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                </div>
              </div>

              {/* Quote Section */}
              {leadId && (
                <QuoteSection
                  leadId={leadId}
                  insuranceType="Renters"
                  className="mt-6"
                />
              )}

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6">
                <div>
                  {showPreviousButton && (
                    <Button type="button" variant="outline" onClick={onPrevious}>
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {showDeleteButton && onDelete && (
                    <Button type="button" variant="destructive" onClick={onDelete}>
                      Delete
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
