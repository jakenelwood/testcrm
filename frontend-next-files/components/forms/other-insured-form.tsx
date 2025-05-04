'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface OtherInsuredFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function OtherInsuredForm({ onSubmit, isSubmitting }: OtherInsuredFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            {...register("first_name", { required: "First name is required" })}
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            {...register("last_name", { required: "Last name is required" })}
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Select
            onValueChange={(value) => handleSelectChange("relationship", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Spouse">Spouse</SelectItem>
              <SelectItem value="Child">Child</SelectItem>
              <SelectItem value="Parent">Parent</SelectItem>
              <SelectItem value="Sibling">Sibling</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("relationship")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register("date_of_birth")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            onValueChange={(value) => handleSelectChange("gender", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("gender")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="drivers_license">Driver's License</Label>
          <Input
            id="drivers_license"
            {...register("drivers_license")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="license_state">License State</Label>
          <Input
            id="license_state"
            {...register("license_state")}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Other Insured"}
      </Button>
    </form>
  );
}
