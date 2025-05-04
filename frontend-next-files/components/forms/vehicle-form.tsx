'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface VehicleFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function VehicleForm({ onSubmit, isSubmitting }: VehicleFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Label htmlFor="vin">VIN</Label>
          <Input
            id="vin"
            {...register("vin")}
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
              <SelectItem value="Commute">Commute</SelectItem>
              <SelectItem value="Pleasure">Pleasure</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Farm">Farm</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("usage")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="annual_mileage">Annual Mileage</Label>
          <Input
            id="annual_mileage"
            type="number"
            {...register("annual_mileage")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ownership">Ownership</Label>
          <Select
            onValueChange={(value) => handleSelectChange("ownership", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Owned">Owned</SelectItem>
              <SelectItem value="Financed">Financed</SelectItem>
              <SelectItem value="Leased">Leased</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("ownership")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="primary_driver">Primary Driver</Label>
          <Input
            id="primary_driver"
            {...register("primary_driver")}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Vehicle"}
      </Button>
    </form>
  );
}
