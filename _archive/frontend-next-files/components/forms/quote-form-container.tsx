'use client';

import { useState, useEffect } from "react";
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
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false);
  const [isNewLead, setIsNewLead] = useState(true);

  // Load draft data on component mount
  useEffect(() => {
    // Check if we're on the new lead page (no ID in URL)
    const isNewLeadPage = window.location.pathname === '/dashboard/new';

    if (isNewLeadPage) {
      // For new leads, clear any existing draft data to start fresh
      // This prevents old draft data from showing the "Draft loaded" message
      localStorage.removeItem('lead-form-draft');
      setIsNewLead(true);
    } else {
      // For editing existing leads, check if there's draft data
      const savedDraft = localStorage.getItem('lead-form-draft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          // Only show draft loaded message if there's meaningful data (not just empty fields)
          if (draftData.client && Object.keys(draftData.client).length > 0) {
            // Check if there's actual meaningful data (not just empty strings)
            const hasActualData = Object.values(draftData.client).some(value => {
              if (typeof value === 'string') return value.trim().length > 0;
              if (typeof value === 'boolean') return value === true;
              if (Array.isArray(value)) return value.length > 0;
              return value != null;
            });

            if (hasActualData) {
              setFormData(prev => ({ ...prev, client: draftData.client }));
              setIsNewLead(false); // Mark as not a new lead since we have draft data
              toast({
                title: "Draft loaded",
                description: "Your previous form data has been restored.",
              });
            } else {
              // Clear empty draft data to prevent future false positives
              localStorage.removeItem('lead-form-draft');
            }
          }
        } catch (error) {
          console.error('Failed to load draft data:', error);
          // Clear corrupted draft data
          localStorage.removeItem('lead-form-draft');
        }
      }
    }
  }, [toast]);

  // Track when user navigates away from client tab
  useEffect(() => {
    if (activeTab !== "client") {
      setHasNavigatedAway(true);
    }
  }, [activeTab]);

  // Toggle insurance type selection
  const toggleInsuranceType = (type: InsuranceType, isChecked: boolean) => {
    setActiveInsuranceTypes(prev =>
      isChecked
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  // Auto-save function
  const handleAutoSave = async (data: any) => {
    setIsAutoSaving(true);
    try {
      // Check if there's actual meaningful data to save
      const hasActualData = Object.values(data).some(value => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'boolean') return value === true;
        if (Array.isArray(value)) return value.length > 0;
        return value != null;
      });

      // Only save if there's meaningful data AND we're not on a fresh new lead
      if (hasActualData && window.location.pathname === '/dashboard/new') {
        localStorage.setItem('lead-form-draft', JSON.stringify({
          ...formData,
          client: data,
          lastSaved: new Date().toISOString()
        }));
        setIsNewLead(false); // Mark as not new once we have actual data
      } else if (hasActualData && window.location.pathname !== '/dashboard/new') {
        // For editing existing leads, always save meaningful data
        localStorage.setItem('lead-form-draft', JSON.stringify({
          ...formData,
          client: data,
          lastSaved: new Date().toISOString()
        }));
      }

      // Here you could also save to the backend if needed
      // await fetch('/api/leads/draft', { method: 'POST', body: JSON.stringify(data) });

    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Handle previous button
  const handlePrevious = () => {
    router.back();
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

      // Clear draft data after successful submission
      localStorage.removeItem('lead-form-draft');

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
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="client">Lead Info</TabsTrigger>
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
              <LeadInfoForm
                onSubmit={handleClientFormSubmit}
                onAutoSave={handleAutoSave}
                onPrevious={() => setActiveTab("client")}
                showPreviousButton={false}
                showDeleteButton={true}
                onDelete={() => {
                  const userInput = prompt('To delete this lead, please type "DELETE" to confirm:');
                  if (userInput && userInput.toLowerCase() === 'delete') {
                    // Clear draft data when deleting
                    localStorage.removeItem('lead-form-draft');
                    router.push('/dashboard/leads');
                  } else if (userInput !== null) {
                    alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
                  }
                }}
                defaultValues={formData.client as any}
              />
            </TabsContent>

            {activeInsuranceTypes.includes('auto') && (
              <TabsContent value="auto">
                <AutoInsuranceForm
                  onSubmit={handleAutoFormSubmit}
                  onPrevious={() => setActiveTab("client")}
                  showPreviousButton={true}
                  showDeleteButton={true}
                  onDelete={() => {
                    const userInput = prompt('To delete this lead, please type "DELETE" to confirm:');
                    if (userInput && userInput.toLowerCase() === 'delete') {
                      // Clear draft data when deleting
                      localStorage.removeItem('lead-form-draft');
                      router.push('/dashboard/leads');
                    } else if (userInput !== null) {
                      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
                    }
                  }}
                />
              </TabsContent>
            )}

            {activeInsuranceTypes.includes('home') && (
              <TabsContent value="home">
                <HomeInsuranceForm
                  onSubmitForm={handleHomeFormSubmit}
                  onPrevious={() => setActiveTab("client")}
                  showPreviousButton={true}
                  showDeleteButton={true}
                  onDelete={() => {
                    const userInput = prompt('To delete this lead, please type "DELETE" to confirm:');
                    if (userInput && userInput.toLowerCase() === 'delete') {
                      // Clear draft data when deleting
                      localStorage.removeItem('lead-form-draft');
                      router.push('/dashboard/leads');
                    } else if (userInput !== null) {
                      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
                    }
                  }}
                />
              </TabsContent>
            )}

            {activeInsuranceTypes.includes('specialty') && (
              <TabsContent value="specialty">
                <SpecialtyInsuranceForm
                  onSubmit={handleSpecialtyFormSubmit}
                  onPrevious={() => setActiveTab("client")}
                  showPreviousButton={true}
                  showDeleteButton={true}
                  onDelete={() => {
                    const userInput = prompt('To delete this lead, please type "DELETE" to confirm:');
                    if (userInput && userInput.toLowerCase() === 'delete') {
                      // Clear draft data when deleting
                      localStorage.removeItem('lead-form-draft');
                      router.push('/dashboard/leads');
                    } else if (userInput !== null) {
                      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
                    }
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}