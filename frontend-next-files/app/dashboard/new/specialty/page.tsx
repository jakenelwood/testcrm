'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SpecialtyQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMultiSelection, setIsMultiSelection] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  
  useEffect(() => {
    // Check if this page is part of a multi-selection flow
    const typesParam = searchParams.get('types');
    if (typesParam) {
      const types = typesParam.split(',');
      setSelectedTypes(types);
      setIsMultiSelection(types.length > 1);
      
      // Find the index of 'specialty' in the types array
      const specialtyIndex = types.indexOf('specialty');
      if (specialtyIndex >= 0) {
        setCurrentTypeIndex(specialtyIndex);
      }
    } else {
      // Try to get from sessionStorage if not in query params
      const storedTypes = sessionStorage.getItem('selectedInsuranceTypes');
      if (storedTypes) {
        try {
          const types = JSON.parse(storedTypes);
          if (Array.isArray(types) && types.length > 1) {
            setSelectedTypes(types);
            setIsMultiSelection(true);
            const specialtyIndex = types.indexOf('specialty');
            if (specialtyIndex >= 0) {
              setCurrentTypeIndex(specialtyIndex);
            }
          }
        } catch (e) {
          console.error('Error parsing stored insurance types', e);
        }
      }
    }
  }, [searchParams]);
  
  const handleSubmit = () => {
    if (isMultiSelection) {
      // Find the next form to navigate to
      const nextTypeIndex = selectedTypes.findIndex(
        (type, index) => index > currentTypeIndex && type !== 'specialty'
      );
      
      if (nextTypeIndex >= 0) {
        const nextType = selectedTypes[nextTypeIndex];
        const typesParam = new URLSearchParams({
          types: selectedTypes.join(',')
        }).toString();
        
        // Navigate to the next form with the same query parameters
        router.push(`/dashboard/new/${nextType}?${typesParam}`);
      } else {
        // This was the last form, go to dashboard
        // In a real implementation, you might go to a summary page
        sessionStorage.removeItem('selectedInsuranceTypes'); // Clean up
        router.push('/dashboard');
      }
    } else {
      // Single form flow - go back to dashboard
      router.push('/dashboard');
    }
  };
  
  return (
    <>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Specialty Insurance Quote</h1>
      </div>
      
      {isMultiSelection && (
        <Alert className="mb-6">
          <AlertTitle className="flex items-center">
            <Check className="h-4 w-4 mr-2" /> Multi-Selection Mode
          </AlertTitle>
          <AlertDescription>
            You selected multiple insurance types. You are on step {currentTypeIndex + 1} of {selectedTypes.length}.
            {currentTypeIndex === selectedTypes.length - 1 
              ? " This is the last form in your selection."
              : " After completing this form, you'll be directed to the next insurance type."}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground mb-6">
            Fill out this form to request a specialty insurance quote for RVs, motorcycles, boats, and other specialty items.
          </p>
          
          <div className="grid gap-6">
            <div className="p-6 border rounded-md bg-muted/50">
              <p className="text-center">Specialty insurance form fields will be implemented here.</p>
              <p className="text-center text-muted-foreground mt-2">Based on your implementation checklist, specialty insurance fields (104 fields) are still to be implemented.</p>
            </div>
            
            <Button onClick={handleSubmit}>
              {isMultiSelection && currentTypeIndex < selectedTypes.length - 1
                ? "Continue to Next Form"
                : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 