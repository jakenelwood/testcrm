'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";

interface HomeFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function HomeForm({ onSubmit, isSubmitting }: HomeFormProps) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  
  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="address_street">Street Address</Label>
          <Input
            id="address_street"
            {...register("address_street", { required: "Street address is required" })}
          />
          {errors.address_street && (
            <p className="text-sm text-red-500">{errors.address_street.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address_city">City</Label>
          <Input
            id="address_city"
            {...register("address_city", { required: "City is required" })}
          />
          {errors.address_city && (
            <p className="text-sm text-red-500">{errors.address_city.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address_state">State</Label>
          <Input
            id="address_state"
            {...register("address_state", { required: "State is required" })}
          />
          {errors.address_state && (
            <p className="text-sm text-red-500">{errors.address_state.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address_zip">ZIP Code</Label>
          <Input
            id="address_zip"
            {...register("address_zip", { required: "ZIP code is required" })}
          />
          {errors.address_zip && (
            <p className="text-sm text-red-500">{errors.address_zip.message as string}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="year_built">Year Built</Label>
          <Input
            id="year_built"
            type="number"
            {...register("year_built")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="square_feet">Square Feet</Label>
          <Input
            id="square_feet"
            type="number"
            {...register("square_feet")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="construction_type">Construction Type</Label>
          <Select
            onValueChange={(value) => handleSelectChange("construction_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select construction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Frame">Frame</SelectItem>
              <SelectItem value="Masonry">Masonry</SelectItem>
              <SelectItem value="Brick">Brick</SelectItem>
              <SelectItem value="Stone">Stone</SelectItem>
              <SelectItem value="Concrete">Concrete</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("construction_type")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="roof_type">Roof Type</Label>
          <Select
            onValueChange={(value) => handleSelectChange("roof_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asphalt Shingle">Asphalt Shingle</SelectItem>
              <SelectItem value="Metal">Metal</SelectItem>
              <SelectItem value="Tile">Tile</SelectItem>
              <SelectItem value="Slate">Slate</SelectItem>
              <SelectItem value="Wood Shake">Wood Shake</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("roof_type")} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="number_of_stories">Number of Stories</Label>
          <Input
            id="number_of_stories"
            type="number"
            {...register("number_of_stories")}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ownership_type">Ownership Type</Label>
          <Select
            onValueChange={(value) => handleSelectChange("ownership_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ownership type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Own">Own</SelectItem>
              <SelectItem value="Rent">Rent</SelectItem>
              <SelectItem value="Mortgage">Mortgage</SelectItem>
            </SelectContent>
          </Select>
          <input type="hidden" {...register("ownership_type")} />
        </div>
      </div>
      
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Home"}
      </Button>
    </form>
  );
}
