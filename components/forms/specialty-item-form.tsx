'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface SpecialtyItemFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function SpecialtyItemForm({ onSubmit, isSubmitting }: SpecialtyItemFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            onValueChange={(value) => handleSelectChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Boat">Boat</SelectItem>
              <SelectItem value="Motorcycle">Motorcycle</SelectItem>
              <SelectItem value="RV">RV</SelectItem>
              <SelectItem value="ATV">ATV</SelectItem>
              <SelectItem value="Snowmobile">Snowmobile</SelectItem>
              <SelectItem value="Jet Ski">Jet Ski</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("type", { required: "Type is required" })} />
          {errors.type && (
            <p className="text-sm text-red-500">{errors.type.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            {...register("make", { required: "Make is required" })}
          />
          {errors.make && (
            <p className="text-sm text-red-500">{errors.make.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            {...register("model", { required: "Model is required" })}
          />
          {errors.model && (
            <p className="text-sm text-red-500">{errors.model.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            {...register("year", { required: "Year is required" })}
          />
          {errors.year && (
            <p className="text-sm text-red-500">{errors.year.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            {...register("value")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="storage_location">Storage Location</Label>
          <Input
            id="storage_location"
            {...register("storage_location")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="usage">Usage</Label>
          <Select
            onValueChange={(value) => handleSelectChange("usage", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select usage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Recreational">Recreational</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("usage")} />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Specialty Item"}
      </Button>
    </form>
  );
}
