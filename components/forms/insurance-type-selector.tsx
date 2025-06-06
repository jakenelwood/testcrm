'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { Car, Home, Briefcase } from "lucide-react";

interface InsuranceType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export function InsuranceTypeSelector() {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<Record<string, boolean>>({
    auto: false,
    home: false,
    specialty: false
  });
  
  const insuranceTypes: InsuranceType[] = [
    {
      id: "auto",
      label: "Auto Insurance",
      description: "Car, truck, motorcycle, or other vehicle insurance",
      icon: <Car className="h-6 w-6 text-slate-500" />,
      href: "/dashboard/new/auto"
    },
    {
      id: "home",
      label: "Home Insurance",
      description: "Homeowners, renters, or condo insurance",
      icon: <Home className="h-6 w-6 text-slate-500" />,
      href: "/dashboard/new/home"
    },
    {
      id: "specialty",
      label: "Specialty Insurance",
      description: "RVs, boats, classic cars, and other specialty items",
      icon: <Briefcase className="h-6 w-6 text-slate-500" />,
      href: "/dashboard/new/specialty"
    }
  ];
  
  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedTypes(prev => ({
      ...prev,
      [id]: checked
    }));
  };
  
  const handleContinue = () => {
    // Get the selected insurance types
    const selectedTypeIds = Object.keys(selectedTypes).filter(id => selectedTypes[id]);
    
    if (selectedTypeIds.length === 0) {
      return; // Button should be disabled anyway, but this is a safety check
    } else if (selectedTypeIds.length === 1) {
      // If only one type is selected, go directly to that form
      const selectedType = insuranceTypes.find(type => type.id === selectedTypeIds[0]);
      if (selectedType) {
        router.push(selectedType.href);
      }
    } else {
      // For multiple selections, use query parameters to track the selected types
      // Create a URL with query parameters for the dashboard page
      const queryString = new URLSearchParams({
        types: selectedTypeIds.join(',')
      }).toString();
      
      // Store selected types in sessionStorage using useEffect to avoid hydration mismatch
      const saveToSession = () => {
        sessionStorage.setItem('selectedInsuranceTypes', JSON.stringify(selectedTypeIds));
      };
      
      // Execute immediately but safely
      if (typeof window !== 'undefined') {
        saveToSession();
      }
      
      // Navigate to the first form with the query parameter
      const firstSelected = insuranceTypes.find(type => type.id === selectedTypeIds[0]);
      if (firstSelected) {
        router.push(`${firstSelected.href}?${queryString}`);
      }
    }
  };
  
  const anySelected = Object.values(selectedTypes).some(selected => selected);
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {insuranceTypes.map(type => (
          <Card key={type.id} className="overflow-hidden">
            <div className="flex items-start space-x-4 p-6">
              <div className="flex h-6 items-center">
                <Checkbox
                  id={`type-${type.id}`}
                  checked={selectedTypes[type.id]}
                  onCheckedChange={(checked) => handleCheckboxChange(type.id, checked === true)}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  {type.icon}
                  <label
                    htmlFor={`type-${type.id}`}
                    className="ml-2 text-lg font-medium cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <Button
        onClick={handleContinue}
        disabled={!anySelected}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
} 