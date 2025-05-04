'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateMMDDYYYY, formatDateTimeMMDDYYYY } from "@/utils/date-format";
import { Lead, LeadNote, LeadCommunication } from "@/types/lead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import supabase from '@/utils/supabase/client';
import { ArrowLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OtherInsuredForm } from '@/components/forms/other-insured-form';
import { VehicleForm } from '@/components/forms/vehicle-form';
import { HomeForm } from '@/components/forms/home-form';
import { SpecialtyItemForm } from '@/components/forms/specialty-item-form';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [communications, setCommunications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [otherInsureds, setOtherInsureds] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [homes, setHomes] = useState<any[]>([]);
  const [specialtyItems, setSpecialtyItems] = useState<any[]>([]);

  // Edit states for each section
  const [isEditingOtherInsureds, setIsEditingOtherInsureds] = useState(false);
  const [isEditingVehicles, setIsEditingVehicles] = useState(false);
  const [isEditingHomes, setIsEditingHomes] = useState(false);
  const [isEditingSpecialtyItems, setIsEditingSpecialtyItems] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // New item form data
  const [newOtherInsured, setNewOtherInsured] = useState<any>({});
  const [newVehicle, setNewVehicle] = useState<any>({});
  const [newHome, setNewHome] = useState<any>({});
  const [newSpecialtyItem, setNewSpecialtyItem] = useState<any>({});

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            *,
            client:client_id(*),
            status:lead_statuses!inner(value),
            insurance_type:insurance_types!inner(name)
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching lead:', error);
          toast({
            title: "Error",
            description: "Failed to load lead details.",
            variant: "destructive"
          });
        } else if (data) {
          // Process the data before setting it
          const processedLead: Lead = {
            ...data,
            // Map joined fields to their expected properties
            status: typeof data.status === 'object' && data.status?.value ? data.status.value : 'New',
            insurance_type: typeof data.insurance_type === 'object' && data.insurance_type?.name ? data.insurance_type.name : 'Auto',

            // Add legacy fields from client data for backward compatibility
            first_name: typeof data.client === 'object' && data.client?.name ? data.client.name.split(' ')[0] : '',
            last_name: typeof data.client === 'object' && data.client?.name ? data.client.name.split(' ').slice(1).join(' ') : '',
            email: typeof data.client === 'object' ? data.client?.email || '' : '',
            phone_number: typeof data.client === 'object' ? data.client?.phone_number || '' : '',

            // Ensure we have status_legacy and insurance_type_legacy for compatibility
            status_legacy: typeof data.status === 'object' && data.status?.value ? data.status.value : 'New',
            insurance_type_legacy: typeof data.insurance_type === 'object' && data.insurance_type?.name ? data.insurance_type.name : 'Auto'
          };

          setLead(processedLead);

          // Initialize form data
          setFormData({
            // Lead fields
            status: processedLead?.status || processedLead?.status_legacy || 'New',
            insurance_type: processedLead?.insurance_type || processedLead?.insurance_type_legacy || 'Auto',
            current_carrier: processedLead?.current_carrier || '',
            premium: processedLead?.premium ? processedLead.premium.toString() : '',
            notes: processedLead?.notes || '',
            assigned_to: processedLead?.assigned_to || '',

            // Client fields (from joined client or legacy fields)
            client_name: processedLead?.client?.name || `${processedLead?.first_name || ''} ${processedLead?.last_name || ''}`.trim(),
            first_name: processedLead?.first_name || processedLead?.client?.name?.split(' ')[0] || '',
            last_name: processedLead?.last_name || (processedLead?.client?.name?.split(' ').slice(1).join(' ') || ''),
            email: processedLead?.client?.email || processedLead?.email || '',
            phone_number: processedLead?.client?.phone_number || processedLead?.phone_number || '',

            // Address fields (from joined address or empty)
            street_address: processedLead?.client?.address?.street || '',
            city: processedLead?.client?.address?.city || '',
            state: processedLead?.client?.address?.state || '',
            zip_code: processedLead?.client?.address?.zip_code || '',

            // Individual-specific fields
            date_of_birth: processedLead?.client?.date_of_birth || '',
            gender: processedLead?.client?.gender || '',
            marital_status: processedLead?.client?.marital_status || '',
            drivers_license: processedLead?.client?.drivers_license || '',
            license_state: processedLead?.client?.license_state || '',
            education_occupation: processedLead?.client?.education_occupation || '',
            referred_by: processedLead?.client?.referred_by || '',
          });
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
        toast({
          title: "Error",
          description: "Failed to load lead details.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchLead();
    }
  }, [params.id, toast]);

  // Fetch lead notes and communications
  useEffect(() => {
    if (params.id) {
      const fetchNotes = async () => {
        const { data, error } = await supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', params.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching notes:', error);
        } else {
          setNotes(data || []);
        }
      };

      const fetchCommunications = async () => {
        const { data, error } = await supabase
          .from('lead_communications')
          .select('*')
          .eq('lead_id', params.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching communications:', error);
        } else {
          setCommunications(data || []);
        }
      };

      const fetchOtherInsureds = async () => {
        try {
          // First check if the table exists
          const { error: tableError } = await supabase
            .from('other_insureds')
            .select('count')
            .limit(1)
            .single();

          if (tableError && tableError.code === '42P01') { // Table doesn't exist
            console.log('other_insureds table does not exist yet');
            return; // Exit early
          }

          const { data, error } = await supabase
            .from('other_insureds')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching other insureds:', error);
          } else {
            setOtherInsureds(data || []);
          }
        } catch (err) {
          console.log('Could not fetch other insureds, table may not exist yet');
          setOtherInsureds([]);
        }
      };

      const fetchVehicles = async () => {
        try {
          // First check if the table exists
          const { error: tableError } = await supabase
            .from('vehicles')
            .select('count')
            .limit(1)
            .single();

          if (tableError && tableError.code === '42P01') { // Table doesn't exist
            console.log('vehicles table does not exist yet');
            return; // Exit early
          }

          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching vehicles:', error);
          } else {
            setVehicles(data || []);
          }
        } catch (err) {
          console.log('Could not fetch vehicles, table may not exist yet');
          setVehicles([]);
        }
      };

      const fetchHomes = async () => {
        try {
          // First check if the table exists
          const { error: tableError } = await supabase
            .from('homes')
            .select('count')
            .limit(1)
            .single();

          if (tableError && tableError.code === '42P01') { // Table doesn't exist
            console.log('homes table does not exist yet');
            return; // Exit early
          }

          const { data, error } = await supabase
            .from('homes')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching homes:', error);
          } else {
            setHomes(data || []);
          }
        } catch (err) {
          console.log('Could not fetch homes, table may not exist yet');
          setHomes([]);
        }
      };

      const fetchSpecialtyItems = async () => {
        try {
          // First check if the table exists
          const { error: tableError } = await supabase
            .from('specialty_items')
            .select('count')
            .limit(1)
            .single();

          if (tableError && tableError.code === '42P01') { // Table doesn't exist
            console.log('specialty_items table does not exist yet');
            return; // Exit early
          }

          const { data, error } = await supabase
            .from('specialty_items')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching specialty items:', error);
          } else {
            setSpecialtyItems(data || []);
          }
        } catch (err) {
          console.log('Could not fetch specialty items, table may not exist yet');
          setSpecialtyItems([]);
        }
      };

      fetchNotes();
      fetchCommunications();
      fetchOtherInsureds();
      fetchVehicles();
      fetchHomes();
      fetchSpecialtyItems();
    }
  }, [params.id]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead) return;

    setIsSubmittingNote(true);
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: lead.id,
          note_content: newNote,
          created_by: 'Brian B',
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('Error adding note:', error);
        toast({
          title: "Error",
          description: "Failed to add note. Please try again.",
          variant: "destructive"
        });
      } else if (data) {
        setNotes([data[0], ...notes]);
        setNewNote('');

        // Also add to communications
        const { error: commError } = await supabase
          .from('lead_communications')
          .insert({
            lead_id: lead.id,
            type: 'Note',
            content: newNote,
            created_by: 'Brian B',
            created_at: new Date().toISOString(),
          });

        if (commError) {
          console.error('Error adding communication:', commError);
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle input changes for new items
  const handleOtherInsuredChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewOtherInsured(prev => ({ ...prev, [name]: value }));
  };

  const handleOtherInsuredSelectChange = (name: string, value: string) => {
    setNewOtherInsured(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleSelectChange = (name: string, value: string) => {
    setNewVehicle(prev => ({ ...prev, [name]: value }));
  };

  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewHome(prev => ({ ...prev, [name]: value }));
  };

  const handleHomeSelectChange = (name: string, value: string) => {
    setNewHome(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialtyItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSpecialtyItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecialtyItemSelectChange = (name: string, value: string) => {
    setNewSpecialtyItem(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding other insured
  const handleAddOtherInsured = async (data: any) => {
    if (!lead || !lead.client_id) return;

    setIsSubmittingItem(true);
    try {
      // Add the other insured to the database
      const { data: newInsured, error } = await supabase
        .from('other_insureds')
        .insert({
          client_id: lead.client_id,
          lead_id: lead.id,
          first_name: data.first_name,
          last_name: data.last_name,
          relationship: data.relationship,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          drivers_license: data.drivers_license,
          license_state: data.license_state,
          marital_status: data.marital_status,
          education_occupation: data.education_occupation,
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

        // Add the new insured to the state
        if (newInsured && newInsured.length > 0) {
          setOtherInsureds(prev => [newInsured[0], ...prev]);
        }

        // Close the dialog
        setOtherInsuredDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding other insured:', error);
      toast({
        title: "Error",
        description: "Failed to add other insured. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle adding vehicle
  const handleAddVehicle = async (data: any) => {
    if (!lead || !lead.client_id) return;

    setIsSubmittingItem(true);
    try {
      // Add the vehicle to the database
      const { data: newVehicle, error } = await supabase
        .from('vehicles')
        .insert({
          client_id: lead.client_id,
          lead_id: lead.id,
          year: data.year,
          make: data.make,
          model: data.model,
          vin: data.vin,
          usage: data.usage,
          annual_mileage: data.annual_mileage,
          ownership: data.ownership,
          primary_driver: data.primary_driver,
          collision: data.collision,
          comprehensive: data.comprehensive,
          gap_coverage: data.gap_coverage,
          glass_coverage: data.glass_coverage,
          rental_coverage: data.rental_coverage,
          towing_coverage: data.towing_coverage,
        })
        .select();

      if (error) {
        console.error('Error adding vehicle:', error);

        if (error.code === '42P01') { // Table doesn't exist
          toast({
            title: "Database Setup Required",
            description: "The vehicles table doesn't exist. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add vehicle. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Vehicle added successfully.",
        });

        // Add the new vehicle to the state
        if (newVehicle && newVehicle.length > 0) {
          setVehicles(prev => [newVehicle[0], ...prev]);
        }

        // Close the dialog
        setVehicleDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle adding home
  const handleAddHome = async (data: any) => {
    if (!lead || !lead.client_id) return;

    setIsSubmittingItem(true);
    try {
      // Add the home to the database
      const { data: newHome, error } = await supabase
        .from('homes')
        .insert({
          client_id: lead.client_id,
          lead_id: lead.id,
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

        // Add the new home to the state
        if (newHome && newHome.length > 0) {
          setHomes(prev => [newHome[0], ...prev]);
        }

        // Close the dialog
        setHomeDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding home:', error);
      toast({
        title: "Error",
        description: "Failed to add home. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Handle adding specialty item
  const handleAddSpecialtyItem = async (data: any) => {
    if (!lead || !lead.client_id) return;

    setIsSubmittingItem(true);
    try {
      // Add the specialty item to the database
      const { data: newItem, error } = await supabase
        .from('specialty_items')
        .insert({
          client_id: lead.client_id,
          lead_id: lead.id,
          type: data.type,
          make: data.make,
          model: data.model,
          year: data.year,
          value: data.value,
          storage_location: data.storage_location,
          usage: data.usage,
          cc_size: data.cc_size,
          total_hp: data.total_hp,
          max_speed: data.max_speed,
          collision_deductible: data.collision_deductible,
          comprehensive_deductible: data.comprehensive_deductible,
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

        // Add the new specialty item to the state
        if (newItem && newItem.length > 0) {
          setSpecialtyItems(prev => [newItem[0], ...prev]);
        }

        // Close the dialog
        setSpecialtyItemDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding specialty item:', error);
      toast({
        title: "Error",
        description: "Failed to add specialty item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Check if we have permission to update leads
  const checkPermissions = async () => {
    try {
      // Skip auth check in development environment
      console.log('Skipping auth check in development environment');

      // Try to get the RLS policies
      const { data: policyData, error: policyError } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

      console.log('Policy test result:', policyData, policyError);

      return !policyError;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!lead) return;

    setIsSaving(true);
    try {
      // Check permissions first
      const hasPermission = await checkPermissions();
      console.log('Has permission to update leads:', hasPermission);

      // Convert premium to number if provided
      const premium = formData.premium ? parseFloat(formData.premium) : null;

      // Get the status ID based on the status name
      let statusId = 1; // Default to "New" (ID: 1)
      switch (formData.status) {
        case 'New': statusId = 1; break;
        case 'Contacted': statusId = 2; break;
        case 'Quoted': statusId = 3; break;
        case 'Sold': statusId = 4; break;
        case 'Lost': statusId = 5; break;
      }

      // Get the insurance type ID based on the insurance type name
      let insuranceTypeId = 1; // Default to "Auto" (ID: 1)
      switch (formData.insurance_type) {
        case 'Auto': insuranceTypeId = 1; break;
        case 'Home': insuranceTypeId = 2; break;
        case 'Specialty': insuranceTypeId = 3; break;
        case 'Commercial': insuranceTypeId = 4; break;
        case 'Liability': insuranceTypeId = 5; break;
      }

      // First, update the client record with the new name and contact information
      const clientName = `${formData.first_name} ${formData.last_name}`.trim();

      // Make sure we have a client_id before trying to update
      if (!lead.client_id && lead.client?.id) {
        lead.client_id = lead.client.id;
      }

      if (!lead.client_id) {
        console.error('No client_id found for lead:', lead.id);
        throw new Error('No client_id found for lead');
      }

      console.log('Updating client record:', {
        client_id: lead.client_id,
        name: clientName,
        email: formData.email,
        phone_number: formData.phone_number
      });

      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: clientName,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.client_id);

      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }

      console.log('Client record updated successfully');

      // Then update lead in Supabase - only include fields that exist in the database
      const { data, error } = await supabase
        .from('leads')
        .update({
          status_id: statusId,
          insurance_type_id: insuranceTypeId,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)
        .select(`
          *,
          client:client_id(*),
          status:lead_statuses!inner(value),
          insurance_type:insurance_types!inner(name)
        `)
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        console.error('Error details:', error.details);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
        console.error('Update payload:', {
          status_id: statusId,
          insurance_type_id: insuranceTypeId,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
        });

        toast({
          title: "Error",
          description: `Failed to update lead: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      } else if (data) {
        // Process the data before setting it
        const processedLead: Lead = {
          ...data,
          // Map joined fields to their expected properties
          status: typeof data.status === 'object' && data.status?.value ? data.status.value : 'New',
          insurance_type: typeof data.insurance_type === 'object' && data.insurance_type?.name ? data.insurance_type.name : 'Auto',

          // Add legacy fields from client data for backward compatibility
          first_name: typeof data.client === 'object' && data.client?.name ? data.client.name.split(' ')[0] : '',
          last_name: typeof data.client === 'object' && data.client?.name ? data.client.name.split(' ').slice(1).join(' ') : '',
          email: typeof data.client === 'object' ? data.client?.email || '' : '',
          phone_number: typeof data.client === 'object' ? data.client?.phone_number || '' : '',

          // Ensure we have status_legacy and insurance_type_legacy for compatibility
          status_legacy: typeof data.status === 'object' && data.status?.value ? data.status.value : 'New',
          insurance_type_legacy: typeof data.insurance_type === 'object' && data.insurance_type?.name ? data.insurance_type.name : 'Auto'
        };

        setLead(processedLead);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Use the utility function for date formatting

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we load the lead details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Lead Not Found</h2>
            <p className="text-muted-foreground mb-4">The lead you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => router.push('/dashboard/leads')}>
              Back to Leads
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/leads')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.first_name} {lead.last_name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/leads')}>
            Back to Leads
          </Button>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            disabled={isSaving}
            className={isEditing ? "" : "bg-black hover:bg-gray-800 text-white"}
          >
            {isEditing ? "Cancel" : "Edit Lead"}
          </Button>
          {isEditing && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="insurance">Insurance Details</TabsTrigger>
          <TabsTrigger value="communications">Communication History</TabsTrigger>
          <TabsTrigger value="marketing">Marketing Automation</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Lead Information</CardTitle>
              <CardDescription className="text-sm">Basic details about this lead</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditing ? (
                // Editable form
                <>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="insurance_type">Insurance Type</Label>
                    <Select
                      value={formData.insurance_type}
                      onValueChange={(value) => handleSelectChange('insurance_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select insurance type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auto">Auto</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Specialty">Specialty</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Liability">Liability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_carrier">Current Carrier</Label>
                    <Input
                      id="current_carrier"
                      name="current_carrier"
                      value={formData.current_carrier}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="premium">Premium</Label>
                    <Input
                      id="premium"
                      name="premium"
                      type="number"
                      step="0.01"
                      value={formData.premium}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Quoted">Quoted</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                        <SelectItem value="Lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assigned To</Label>
                    <Input
                      id="assigned_to"
                      name="assigned_to"
                      value={formData.assigned_to}
                      onChange={handleInputChange}
                    />
                  </div>
                  {/* Address Information */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      name="street_address"
                      value={formData.street_address}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => handleSelectChange('gender', value)}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Marital Status</Label>
                    <Select
                      value={formData.marital_status || ''}
                      onValueChange={(value) => handleSelectChange('marital_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drivers_license">Driver's License</Label>
                    <Input
                      id="drivers_license"
                      name="drivers_license"
                      value={formData.drivers_license}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_state">License State</Label>
                    <Input
                      id="license_state"
                      name="license_state"
                      value={formData.license_state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referred_by">Referred By</Label>
                    <Input
                      id="referred_by"
                      name="referred_by"
                      value={formData.referred_by}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                // Read-only view
                <>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                    <div>{lead.first_name} {lead.last_name}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                    <div>{lead.email || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                    <div>{lead.phone_number || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Insurance Type</Label>
                    <div>
                      {typeof lead.insurance_type === 'string'
                        ? lead.insurance_type
                        : (lead.insurance_type as any)?.name || 'Auto'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Current Carrier</Label>
                    <div>{lead.current_carrier || 'None'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Premium</Label>
                    <div>
                      ${lead.premium
                        ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <div>
                      {typeof lead.status === 'string'
                        ? lead.status
                        : (lead.status as any)?.value || 'New'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Assigned To</Label>
                    <div>{lead.assigned_to || 'Unassigned'}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                    <div>
                      {lead.client?.address?.street ? (
                        <>
                          {lead.client.address.street}<br />
                          {lead.client.address.city}{lead.client.address.city && lead.client.address.state ? ', ' : ''}{lead.client.address.state} {lead.client.address.zip_code}
                        </>
                      ) : (
                        'No address'
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Date of Birth</Label>
                    <div>{lead.client?.date_of_birth ? formatDateMMDDYYYY(lead.client.date_of_birth) : 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                    <div>{lead.client?.gender || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Marital Status</Label>
                    <div>{lead.client?.marital_status || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Driver's License</Label>
                    <div>{lead.client?.drivers_license || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">License State</Label>
                    <div>{lead.client?.license_state || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Referred By</Label>
                    <div>{lead.client?.referred_by || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                    <div>{lead.notes || 'No notes'}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Details Tab */}
        <TabsContent value="insurance" className="space-y-4 mt-4">
          {/* Other Insureds Section */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Other Insureds</CardTitle>
                <CardDescription className="text-sm">Additional people insured under this policy</CardDescription>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setIsEditingOtherInsureds(!isEditingOtherInsureds)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditingOtherInsureds ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingOtherInsureds && (
                <Card className="mb-6 border-dashed border-2 border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Add New Insured</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={newOtherInsured.first_name || ''}
                          onChange={handleOtherInsuredChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={newOtherInsured.last_name || ''}
                          onChange={handleOtherInsuredChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship to Primary Insured</Label>
                        <Select
                          value={newOtherInsured.relationship || ''}
                          onValueChange={(value) => handleOtherInsuredSelectChange('relationship', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={newOtherInsured.date_of_birth || ''}
                          onChange={handleOtherInsuredChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={newOtherInsured.gender || ''}
                          onValueChange={(value) => handleOtherInsuredSelectChange('gender', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="drivers_license">Driver's License</Label>
                        <Input
                          id="drivers_license"
                          name="drivers_license"
                          value={newOtherInsured.drivers_license || ''}
                          onChange={handleOtherInsuredChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_state">License State</Label>
                        <Input
                          id="license_state"
                          name="license_state"
                          value={newOtherInsured.license_state || ''}
                          onChange={handleOtherInsuredChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marital_status">Marital Status</Label>
                        <Select
                          value={newOtherInsured.marital_status || ''}
                          onValueChange={(value) => handleOtherInsuredSelectChange('marital_status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select marital status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                            <SelectItem value="Separated">Separated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="education_occupation">Education/Occupation</Label>
                        <Input
                          id="education_occupation"
                          name="education_occupation"
                          value={newOtherInsured.education_occupation || ''}
                          onChange={handleOtherInsuredChange}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddOtherInsured(newOtherInsured)}
                      disabled={isSubmittingItem || !newOtherInsured.first_name || !newOtherInsured.last_name}
                      className="w-full"
                    >
                      {isSubmittingItem ? "Adding..." : "Add Other Insured"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {otherInsureds.length > 0 ? (
                <div className="space-y-4">
                  {otherInsureds.map((insured, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                            <div>{insured.first_name} {insured.last_name}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Relationship</Label>
                            <div>{insured.relationship || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Date of Birth</Label>
                            <div>{insured.date_of_birth ? formatDateMMDDYYYY(insured.date_of_birth) : 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                            <div>{insured.gender || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Driver's License</Label>
                            <div>{insured.drivers_license || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">License State</Label>
                            <div>{insured.license_state || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Marital Status</Label>
                            <div>{insured.marital_status || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Education/Occupation</Label>
                            <div>{insured.education_occupation || 'N/A'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No other insureds added yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicles Section */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Vehicles</CardTitle>
                <CardDescription className="text-sm">Vehicles covered under this policy</CardDescription>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setIsEditingVehicles(!isEditingVehicles)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditingVehicles ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingVehicles && (
                <Card className="mb-6 border-dashed border-2 border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Add New Vehicle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          name="year"
                          type="number"
                          value={newVehicle.year || ''}
                          onChange={handleVehicleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          name="make"
                          value={newVehicle.make || ''}
                          onChange={handleVehicleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          name="model"
                          value={newVehicle.model || ''}
                          onChange={handleVehicleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vin">VIN</Label>
                        <Input
                          id="vin"
                          name="vin"
                          value={newVehicle.vin || ''}
                          onChange={handleVehicleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usage">Usage</Label>
                        <Select
                          value={newVehicle.usage || ''}
                          onValueChange={(value) => handleVehicleSelectChange('usage', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="annual_mileage">Annual Mileage</Label>
                        <Input
                          id="annual_mileage"
                          name="annual_mileage"
                          type="number"
                          value={newVehicle.annual_mileage || ''}
                          onChange={handleVehicleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownership">Ownership</Label>
                        <Select
                          value={newVehicle.ownership || ''}
                          onValueChange={(value) => handleVehicleSelectChange('ownership', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primary_driver">Primary Driver</Label>
                        <Input
                          id="primary_driver"
                          name="primary_driver"
                          value={newVehicle.primary_driver || ''}
                          onChange={handleVehicleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collision">Collision Coverage</Label>
                        <Select
                          value={newVehicle.collision || ''}
                          onValueChange={(value) => handleVehicleSelectChange('collision', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comprehensive">Comprehensive Coverage</Label>
                        <Select
                          value={newVehicle.comprehensive || ''}
                          onValueChange={(value) => handleVehicleSelectChange('comprehensive', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gap_coverage">GAP Coverage</Label>
                        <Select
                          value={newVehicle.gap_coverage || ''}
                          onValueChange={(value) => handleVehicleSelectChange('gap_coverage', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="glass_coverage">Glass Coverage</Label>
                        <Select
                          value={newVehicle.glass_coverage || ''}
                          onValueChange={(value) => handleVehicleSelectChange('glass_coverage', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rental_coverage">Rental Car Reimbursement</Label>
                        <Select
                          value={newVehicle.rental_coverage || ''}
                          onValueChange={(value) => handleVehicleSelectChange('rental_coverage', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="towing_coverage">Towing Coverage</Label>
                        <Select
                          value={newVehicle.towing_coverage || ''}
                          onValueChange={(value) => handleVehicleSelectChange('towing_coverage', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddVehicle(newVehicle)}
                      disabled={isSubmittingItem || !newVehicle.year || !newVehicle.make || !newVehicle.model}
                      className="w-full"
                    >
                      {isSubmittingItem ? "Adding..." : "Add Vehicle"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles.map((vehicle, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Vehicle</Label>
                            <div>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">VIN</Label>
                            <div>{vehicle.vin || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Usage</Label>
                            <div>{vehicle.usage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Annual Mileage</Label>
                            <div>{vehicle.annual_mileage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Ownership</Label>
                            <div>{vehicle.ownership || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Primary Driver</Label>
                            <div>{vehicle.primary_driver || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Collision Coverage</Label>
                            <div>{vehicle.collision || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Comprehensive Coverage</Label>
                            <div>{vehicle.comprehensive || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">GAP Coverage</Label>
                            <div>{vehicle.gap_coverage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Glass Coverage</Label>
                            <div>{vehicle.glass_coverage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Rental Car Reimbursement</Label>
                            <div>{vehicle.rental_coverage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Towing Coverage</Label>
                            <div>{vehicle.towing_coverage || 'N/A'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No vehicles added yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Homes Section */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Homes</CardTitle>
                <CardDescription className="text-sm">Properties covered under this policy</CardDescription>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setIsEditingHomes(!isEditingHomes)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditingHomes ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingHomes && (
                <Card className="mb-6 border-dashed border-2 border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Add New Home</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="address_street">Street Address</Label>
                        <Input
                          id="address_street"
                          name="address_street"
                          value={newHome.address_street || ''}
                          onChange={handleHomeChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_city">City</Label>
                        <Input
                          id="address_city"
                          name="address_city"
                          value={newHome.address_city || ''}
                          onChange={handleHomeChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_state">State</Label>
                        <Input
                          id="address_state"
                          name="address_state"
                          value={newHome.address_state || ''}
                          onChange={handleHomeChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_zip">ZIP Code</Label>
                        <Input
                          id="address_zip"
                          name="address_zip"
                          value={newHome.address_zip || ''}
                          onChange={handleHomeChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year_built">Year Built</Label>
                        <Input
                          id="year_built"
                          name="year_built"
                          type="number"
                          value={newHome.year_built || ''}
                          onChange={handleHomeChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="square_feet">Square Feet</Label>
                        <Input
                          id="square_feet"
                          name="square_feet"
                          type="number"
                          value={newHome.square_feet || ''}
                          onChange={handleHomeChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="construction_type">Construction Type</Label>
                        <Select
                          value={newHome.construction_type || ''}
                          onValueChange={(value) => handleHomeSelectChange('construction_type', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roof_type">Roof Type</Label>
                        <Select
                          value={newHome.roof_type || ''}
                          onValueChange={(value) => handleHomeSelectChange('roof_type', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number_of_stories">Number of Stories</Label>
                        <Input
                          id="number_of_stories"
                          name="number_of_stories"
                          type="number"
                          value={newHome.number_of_stories || ''}
                          onChange={handleHomeChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownership_type">Ownership Type</Label>
                        <Select
                          value={newHome.ownership_type || ''}
                          onValueChange={(value) => handleHomeSelectChange('ownership_type', value)}
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
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddHome(newHome)}
                      disabled={isSubmittingItem || !newHome.address_street || !newHome.address_city || !newHome.address_state || !newHome.address_zip}
                      className="w-full"
                    >
                      {isSubmittingItem ? "Adding..." : "Add Home"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {homes.length > 0 ? (
                <div className="space-y-4">
                  {homes.map((home, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label className="text-xs font-medium text-muted-foreground">Address</Label>
                            <div>
                              {home.address_street}<br />
                              {home.address_city}, {home.address_state} {home.address_zip}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Year Built</Label>
                            <div>{home.year_built || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Square Feet</Label>
                            <div>{home.square_feet || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Construction Type</Label>
                            <div>{home.construction_type || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Roof Type</Label>
                            <div>{home.roof_type || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Number of Stories</Label>
                            <div>{home.number_of_stories || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Ownership Type</Label>
                            <div>{home.ownership_type || 'N/A'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No homes added yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specialty Items Section */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Specialty Items</CardTitle>
                <CardDescription className="text-sm">Specialty items covered under this policy</CardDescription>
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setIsEditingSpecialtyItems(!isEditingSpecialtyItems)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isEditingSpecialtyItems ? "Cancel" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingSpecialtyItems && (
                <Card className="mb-6 border-dashed border-2 border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Add New Specialty Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select
                          value={newSpecialtyItem.type || ''}
                          onValueChange={(value) => handleSpecialtyItemSelectChange('type', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="make">Make</Label>
                        <Input
                          id="make"
                          name="make"
                          value={newSpecialtyItem.make || ''}
                          onChange={handleSpecialtyItemChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          name="model"
                          value={newSpecialtyItem.model || ''}
                          onChange={handleSpecialtyItemChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          name="year"
                          type="number"
                          value={newSpecialtyItem.year || ''}
                          onChange={handleSpecialtyItemChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          name="value"
                          type="number"
                          step="0.01"
                          value={newSpecialtyItem.value || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storage_location">Storage Location</Label>
                        <Input
                          id="storage_location"
                          name="storage_location"
                          value={newSpecialtyItem.storage_location || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usage">Usage</Label>
                        <Select
                          value={newSpecialtyItem.usage || ''}
                          onValueChange={(value) => handleSpecialtyItemSelectChange('usage', value)}
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cc_size">CC Size</Label>
                        <Input
                          id="cc_size"
                          name="cc_size"
                          type="number"
                          value={newSpecialtyItem.cc_size || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_hp">Total HP</Label>
                        <Input
                          id="total_hp"
                          name="total_hp"
                          type="number"
                          value={newSpecialtyItem.total_hp || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max_speed">Max Speed</Label>
                        <Input
                          id="max_speed"
                          name="max_speed"
                          type="number"
                          value={newSpecialtyItem.max_speed || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="collision_deductible">Collision Deductible</Label>
                        <Input
                          id="collision_deductible"
                          name="collision_deductible"
                          type="number"
                          value={newSpecialtyItem.collision_deductible || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comprehensive_deductible">Comprehensive Deductible</Label>
                        <Input
                          id="comprehensive_deductible"
                          name="comprehensive_deductible"
                          type="number"
                          value={newSpecialtyItem.comprehensive_deductible || ''}
                          onChange={handleSpecialtyItemChange}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleAddSpecialtyItem(newSpecialtyItem)}
                      disabled={isSubmittingItem || !newSpecialtyItem.type || !newSpecialtyItem.make || !newSpecialtyItem.model || !newSpecialtyItem.year}
                      className="w-full"
                    >
                      {isSubmittingItem ? "Adding..." : "Add Specialty Item"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {specialtyItems.length > 0 ? (
                <div className="space-y-4">
                  {specialtyItems.map((item, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                            <div>{item.type || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Item</Label>
                            <div>{item.year} {item.make} {item.model}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Value</Label>
                            <div>
                              ${item.value
                                ? parseFloat(item.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '0.00'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Storage Location</Label>
                            <div>{item.storage_location || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Usage</Label>
                            <div>{item.usage || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">CC Size</Label>
                            <div>{item.cc_size || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Total HP</Label>
                            <div>{item.total_hp || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Max Speed</Label>
                            <div>{item.max_speed || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Collision Deductible</Label>
                            <div>{item.collision_deductible || 'N/A'}</div>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">Comprehensive Deductible</Label>
                            <div>{item.comprehensive_deductible || 'N/A'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No specialty items added yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto Insurance Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Auto Insurance Details</CardTitle>
              <CardDescription className="text-sm">Information specific to auto insurance</CardDescription>
            </CardHeader>
            <CardContent>
              {lead.insurance_type === 'Auto' && lead.auto_data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Current Auto Insurance Carrier</Label>
                    <div>{lead.auto_current_insurance_carrier || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Months with Current Carrier</Label>
                    <div>{lead.auto_months_with_current_carrier || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Auto Premium</Label>
                    <div>
                      ${lead.auto_premium
                        ? lead.auto_premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                  </div>

                  {/* Display auto_data fields */}
                  {lead.auto_data && Object.entries(lead.auto_data).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs font-medium text-muted-foreground">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <div>{value?.toString() || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {lead.insurance_type === 'Auto'
                    ? 'No auto insurance details available'
                    : 'This lead is not for auto insurance'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Home Insurance Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Home Insurance Details</CardTitle>
              <CardDescription className="text-sm">Information specific to home insurance</CardDescription>
            </CardHeader>
            <CardContent>
              {lead.insurance_type === 'Home' && lead.home_data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Home Premium</Label>
                    <div>
                      ${lead.home_premium
                        ? lead.home_premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                  </div>

                  {/* Display home_data fields */}
                  {lead.home_data && Object.entries(lead.home_data).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs font-medium text-muted-foreground">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <div>{value?.toString() || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {lead.insurance_type === 'Home'
                    ? 'No home insurance details available'
                    : 'This lead is not for home insurance'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specialty Insurance Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Specialty Insurance Details</CardTitle>
              <CardDescription className="text-sm">Information specific to specialty insurance</CardDescription>
            </CardHeader>
            <CardContent>
              {lead.insurance_type === 'Specialty' && (lead.specialty_data || lead.specialty_type) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Specialty Type</Label>
                    <div>{lead.specialty_type || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Make</Label>
                    <div>{lead.specialty_make || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                    <div>{lead.specialty_model || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Year</Label>
                    <div>{lead.specialty_year || 'N/A'}</div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Specialty Premium</Label>
                    <div>
                      ${lead.specialty_premium
                        ? lead.specialty_premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                  </div>

                  {/* Display specialty_data fields */}
                  {lead.specialty_data && Object.entries(lead.specialty_data).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs font-medium text-muted-foreground">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                      <div>{value?.toString() || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {lead.insurance_type === 'Specialty'
                    ? 'No specialty insurance details available'
                    : 'This lead is not for specialty insurance'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication History Tab */}
        <TabsContent value="communications" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Add Note</CardTitle>
              <CardDescription className="text-sm">Add a note about this lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your note here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={handleAddNote} disabled={isSubmittingNote || !newNote.trim()}>
                  {isSubmittingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Communication History</CardTitle>
              <CardDescription className="text-sm">All interactions with this lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...notes, ...communications].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).map((item, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">
                          {item.type || 'Note'} {item.direction ? `(${item.direction})` : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTimeMMDDYYYY(item.created_at)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.created_by || 'System'}
                      </div>
                    </div>
                    <div className="mt-2">
                      {item.note_content || item.content}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {notes.length === 0 && communications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No communication history yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Marketing Automation Tab */}
        <TabsContent value="marketing" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Marketing Campaigns</CardTitle>
              <CardDescription className="text-sm">
                Enable or disable marketing campaigns for this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Marketing automation features coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
