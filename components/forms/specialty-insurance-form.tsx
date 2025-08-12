'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { transformSpecialtyFormToApiFormat, SpecialtyVehicle } from "@/lib/form-transformers";

// Use the imported SpecialtyVehicle type instead of local definition

// Define form schema
const formSchema = z.object({
  specialtyVehicles: z.array(
    z.object({
      type: z.string().min(1, "Type is required"),
      year: z.string().min(4, "Year must be at least 4 characters"),
      make: z.string().min(1, "Make is required"),
      model: z.string().min(1, "Model is required"),
      vin: z.string().min(17, "VIN must be 17 characters").max(17),
      comprehensiveDeductible: z.string().min(1, "Comprehensive deductible is required"),
      collisionDeductible: z.string().min(1, "Collision deductible is required"),
      totalHp: z.string(),
      maxSpeed: z.string(),
      ccSize: z.string(),
      marketValue: z.string().min(1, "Market value is required"),
      storedLocation: z.string(),
    })
  ).min(1, "At least one specialty vehicle is required"),
  additionalInformation: z.string().optional(),
});

type SpecialtyInsuranceFormValues = z.infer<typeof formSchema>;

interface SpecialtyInsuranceFormProps {
  onSubmit: (data: any) => void;
  onPrevious?: () => void;
  showPreviousButton?: boolean;
}

export function SpecialtyInsuranceForm({ onSubmit, onPrevious, showPreviousButton = false }: SpecialtyInsuranceFormProps) {
  const [specialtyVehicles, setSpecialtyVehicles] = useState<SpecialtyVehicle[]>([
    {
      type: "",
      year: "",
      make: "",
      model: "",
      vin: "",
      comprehensiveDeductible: "",
      collisionDeductible: "",
      totalHp: "",
      maxSpeed: "",
      ccSize: "",
      marketValue: "",
      storedLocation: "",
    },
  ]);

  // Initialize form
  const form = useForm<SpecialtyInsuranceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specialtyVehicles: specialtyVehicles,
      additionalInformation: "",
    },
  });

  // Handle form submission
  const handleFormSubmit = (data: SpecialtyInsuranceFormValues) => {
    // Transform data to match API format using the utility function
    const apiFormatData = transformSpecialtyFormToApiFormat(data);
    onSubmit(apiFormatData);
  };

  // Add a new specialty vehicle
  const addSpecialtyVehicle = () => {
    if (specialtyVehicles.length < 8) {
      const newVehicle: SpecialtyVehicle = {
        type: "",
        year: "",
        make: "",
        model: "",
        vin: "",
        comprehensiveDeductible: "",
        collisionDeductible: "",
        totalHp: "",
        maxSpeed: "",
        ccSize: "",
        marketValue: "",
        storedLocation: "",
      };
      setSpecialtyVehicles([...specialtyVehicles, newVehicle]);
      const updatedVehicles = [...form.getValues().specialtyVehicles, newVehicle];
      form.setValue("specialtyVehicles", updatedVehicles);
    }
  };

  // Remove a specialty vehicle
  const removeSpecialtyVehicle = (index: number) => {
    if (specialtyVehicles.length > 1) {
      const updatedVehicles = [...specialtyVehicles];
      updatedVehicles.splice(index, 1);
      setSpecialtyVehicles(updatedVehicles);
      form.setValue("specialtyVehicles", updatedVehicles);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Specialty Vehicles</h2>
                  <Button
                    type="button"
                    onClick={addSpecialtyVehicle}
                    variant="outline"
                    size="sm"
                    disabled={specialtyVehicles.length >= 8}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>
                </div>

                <Accordion type="multiple" className="w-full">
                  {specialtyVehicles.map((vehicle, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="py-3">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>
                            Specialty Vehicle {index + 1}
                            {vehicle.type && vehicle.make && vehicle.model
                              ? ` - ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.type})`
                              : ""}
                          </span>
                          {specialtyVehicles.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSpecialtyVehicle(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="boat">Boat</SelectItem>
                                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                    <SelectItem value="rv">RV</SelectItem>
                                    <SelectItem value="atv">ATV</SelectItem>
                                    <SelectItem value="snowmobile">Snowmobile</SelectItem>
                                    <SelectItem value="jet_ski">Jet Ski</SelectItem>
                                    <SelectItem value="golf_cart">Golf Cart</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.year`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Year</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. 2020" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.make`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Make</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. Honda" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.model`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Model</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. Shadow" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.vin`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>VIN</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="17-character VIN" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.marketValue`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Market Value</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. 15000" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.comprehensiveDeductible`}
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

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.collisionDeductible`}
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

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.totalHp`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Horsepower</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. 150" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.maxSpeed`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Speed</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. 120" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.ccSize`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CC Size (for motorcycles)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. 750" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`specialtyVehicles.${index}.storedLocation`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Storage Location</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g. Garage, Marina" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <FormField
                control={form.control}
                name="additionalInformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional details about your specialty vehicles"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

                {/* Delete functionality not applicable for specialty insurance form */}

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