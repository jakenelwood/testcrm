'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { OtherInsuredForm } from "./other-insured-form";
import { HomeForm } from "./home-form";
import { SpecialtyItemForm } from "./specialty-item-form";
import supabase from '@/utils/supabase/client';

interface AddItemsFormProps {
  leadId: string;
  clientId: string;
  onItemAdded: () => void;
}

export function AddItemsForm({ leadId, clientId, onItemAdded }: AddItemsFormProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("insured");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tablesCreated, setTablesCreated] = useState(false);

  // Check if tables exist
  useEffect(() => {
    const checkTables = async () => {
      try {
        // We'll just try to query each table to see if it exists
        // If it doesn't, we'll handle the error gracefully

        // Check other_insureds table
        const { error: otherInsuredsError } = await supabase
          .from('other_insureds')
          .select('count')
          .limit(1)
          .single();

        // Check vehicles table
        const { error: vehiclesError } = await supabase
          .from('vehicles')
          .select('count')
          .limit(1)
          .single();

        // Check homes table
        const { error: homesError } = await supabase
          .from('homes')
          .select('count')
          .limit(1)
          .single();

        // Check specialty_items table
        const { error: specialtyItemsError } = await supabase
          .from('specialty_items')
          .select('count')
          .limit(1)
          .single();

        // If any of the tables don't exist, show a message to the user
        if (otherInsuredsError?.code === '42P01' ||
            vehiclesError?.code === '42P01' ||
            homesError?.code === '42P01' ||
            specialtyItemsError?.code === '42P01') {
          toast({
            title: "Database Setup Required",
            description: "Some tables need to be created. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          setTablesCreated(true);
        }
      } catch (error) {
        console.error('Error checking tables:', error);
        toast({
          title: "Database Error",
          description: "There was an error checking the database tables. Please try again later.",
          variant: "destructive"
        });
      }
    };

    checkTables();
  }, [toast]);

  const handleAddOtherInsured = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (!tablesCreated) {
        toast({
          title: "Database Not Ready",
          description: "The database tables are not set up yet. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // Add the other insured to the database
      const { data: newInsured, error } = await supabase
        .from('other_insureds')
        .insert({
          client_id: clientId,
          lead_id: leadId,
          first_name: data.first_name,
          last_name: data.last_name,
          relationship: data.relationship,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          drivers_license: data.drivers_license,
          license_state: data.license_state,
        })
        .select();

      if (error) {
        console.error('Error adding other insured:', error);

        if (error.code === '42P01') { // Table doesn't exist
          toast({
            title: "Database Setup Required",
            description: "The other_insureds table doesn't exist. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add other insured. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Other insured added successfully.",
        });
        onItemAdded();
      }
    } catch (error) {
      console.error('Error adding other insured:', error);
      toast({
        title: "Error",
        description: "Failed to add other insured. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleAddHome = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (!tablesCreated) {
        toast({
          title: "Database Not Ready",
          description: "The database tables are not set up yet. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // Add the home to the database
      const { data: newHome, error } = await supabase
        .from('homes')
        .insert({
          client_id: clientId,
          lead_id: leadId,
          address_street: data.address_street,
          address_city: data.address_city,
          address_state: data.address_state,
          address_zip: data.address_zip,
          year_built: data.year_built,
          square_feet: data.square_feet,
          construction_type: data.construction_type,
          roof_type: data.roof_type,
          number_of_stories: data.number_of_stories,
          ownership_type: data.ownership_type,
        })
        .select();

      if (error) {
        console.error('Error adding home:', error);

        if (error.code === '42P01') { // Table doesn't exist
          toast({
            title: "Database Setup Required",
            description: "The homes table doesn't exist. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add home. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Home added successfully.",
        });
        onItemAdded();
      }
    } catch (error) {
      console.error('Error adding home:', error);
      toast({
        title: "Error",
        description: "Failed to add home. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSpecialtyItem = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (!tablesCreated) {
        toast({
          title: "Database Not Ready",
          description: "The database tables are not set up yet. Please contact your administrator.",
          variant: "destructive"
        });
        return;
      }

      // Add the specialty item to the database
      const { data: newItem, error } = await supabase
        .from('specialty_items')
        .insert({
          client_id: clientId,
          lead_id: leadId,
          type: data.type,
          make: data.make,
          model: data.model,
          year: data.year,
          value: data.value,
          storage_location: data.storage_location,
          usage: data.usage,
        })
        .select();

      if (error) {
        console.error('Error adding specialty item:', error);

        if (error.code === '42P01') { // Table doesn't exist
          toast({
            title: "Database Setup Required",
            description: "The specialty_items table doesn't exist. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add specialty item. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Specialty item added successfully.",
        });
        onItemAdded();
      }
    } catch (error) {
      console.error('Error adding specialty item:', error);
      toast({
        title: "Error",
        description: "Failed to add specialty item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Items</CardTitle>
        <CardDescription>
          Add other insureds, homes, or specialty items to this lead
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!tablesCreated ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Database tables need to be set up before you can add items.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to set up the required database tables.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="insured">Other Insured</TabsTrigger>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="specialty">Specialty Item</TabsTrigger>
            </TabsList>

            <TabsContent value="insured">
              <OtherInsuredForm onSubmit={handleAddOtherInsured} isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="home">
              <HomeForm onSubmit={handleAddHome} isSubmitting={isSubmitting} />
            </TabsContent>

            <TabsContent value="specialty">
              <SpecialtyItemForm onSubmit={handleAddSpecialtyItem} isSubmitting={isSubmitting} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
