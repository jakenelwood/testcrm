'use client';

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeInsuranceForm } from "@/components/home-insurance-form";
import { AutoInsuranceForm } from "@/components/forms/auto-insurance-form";
import { SpecialtyInsuranceForm } from "@/components/forms/specialty-insurance-form";
import { LeadInfoForm, LeadInfoFormValues } from "@/components/forms/lead-info-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { prepareQuoteDataForSubmission } from "@/lib/form-transformers";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Define the types of insurance
type InsuranceType = 'auto' | 'home' | 'specialty';

export function QuoteFormContainer() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeInsuranceTypes, setActiveInsuranceTypes] = useState<InsuranceType[]>([]);
  const [activeTab, setActiveTab] = useState<string>("client");
  const [formData, setFormData] = useState({
    client: {},
    auto: {},
    home: {},
    specialty: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle insurance type selection
  const toggleInsuranceType = (type: InsuranceType, isChecked: boolean) => {
    setActiveInsuranceTypes(prev =>
      isChecked
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  // Handle client form submission
  const handleClientFormSubmit = (clientData: LeadInfoFormValues) => {
    // Extract insurance type selections from client form data
    const newActiveTypes: InsuranceType[] = [];
    if (clientData.includeAuto) newActiveTypes.push('auto');
    if (clientData.includeHome) newActiveTypes.push('home');
    if (clientData.includeSpecialty) newActiveTypes.push('specialty');

    setActiveInsuranceTypes(newActiveTypes);
    setFormData(prev => ({ ...prev, client: clientData }));

    // If no insurance types selected, show error
    if (newActiveTypes.length === 0) {
      toast({
        title: "No insurance types selected",
        description: "Please select at least one insurance type.",
        variant: "destructive"
      });
      return;
    }

    // Navigate to first selected insurance type tab
    setActiveTab(newActiveTypes[0]);
  };

  // Handle auto form submission
  const handleAutoFormSubmit = (autoData: any) => {
    setFormData(prev => ({ ...prev, auto: autoData }));

    // Find next tab to navigate to
    const currentIndex = activeInsuranceTypes.indexOf('auto');
    if (currentIndex < activeInsuranceTypes.length - 1) {
      setActiveTab(activeInsuranceTypes[currentIndex + 1]);
    } else {
      handleFinalSubmit();
    }
  };

  // Handle home form submission
  const handleHomeFormSubmit = (homeData: any) => {
    setFormData(prev => ({ ...prev, home: homeData }));

    // Find next tab to navigate to
    const currentIndex = activeInsuranceTypes.indexOf('home');
    if (currentIndex < activeInsuranceTypes.length - 1) {
      setActiveTab(activeInsuranceTypes[currentIndex + 1]);
    } else {
      handleFinalSubmit();
    }
  };

  // Handle specialty form submission
  const handleSpecialtyFormSubmit = (specialtyData: any) => {
    setFormData(prev => ({ ...prev, specialty: specialtyData }));
    handleFinalSubmit();
  };

  // Handle final form submission to API
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Prepare the final data with only selected insurance types
      const finalData = prepareQuoteDataForSubmission({
        client: formData.client,
        has_auto: activeInsuranceTypes.includes('auto'),
        has_home: activeInsuranceTypes.includes('home'),
        has_specialty: activeInsuranceTypes.includes('specialty'),
        auto: activeInsuranceTypes.includes('auto') ? formData.auto : undefined,
        home: activeInsuranceTypes.includes('home') ? formData.home : undefined,
        specialty: activeInsuranceTypes.includes('specialty') ? formData.specialty : undefined,
      });

      // Submit to API
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quote request');
      }

      // Show success message
      toast({
        title: "Quote request submitted",
        description: "Your quote request has been submitted successfully.",
      });

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>New Lead</CardTitle>
          <CardDescription>
            Create a new insurance lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="client">Client Info</TabsTrigger>
              {activeInsuranceTypes.includes('auto') && (
                <TabsTrigger value="auto">Auto</TabsTrigger>
              )}
              {activeInsuranceTypes.includes('home') && (
                <TabsTrigger value="home">Home</TabsTrigger>
              )}
              {activeInsuranceTypes.includes('specialty') && (
                <TabsTrigger value="specialty">Specialty</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="client">
              <LeadInfoForm onSubmit={handleClientFormSubmit} />
            </TabsContent>

            {activeInsuranceTypes.includes('auto') && (
              <TabsContent value="auto">
                <AutoInsuranceForm onSubmit={handleAutoFormSubmit} />
              </TabsContent>
            )}

            {activeInsuranceTypes.includes('home') && (
              <TabsContent value="home">
                <HomeInsuranceForm onSubmitForm={handleHomeFormSubmit} />
              </TabsContent>
            )}

            {activeInsuranceTypes.includes('specialty') && (
              <TabsContent value="specialty">
                <SpecialtyInsuranceForm onSubmit={handleSpecialtyFormSubmit} />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Cancel
          </Button>
          <Button disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Save Progress"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}