'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDateMMDDYYYY, formatDateTimeMMDDYYYY } from "@/utils/date-format";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Lead, LeadNote, LeadCommunication, InsuranceType, LeadStatus, Client, Address } from "@/types/lead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { getStatusStyles, statusBadgeStyles } from "@/utils/status-styles";
import supabase from '@/utils/supabase/client';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onLeadUpdated: (lead: Lead) => void;
}

export function LeadDetailsModal({ isOpen, onClose, lead, onLeadUpdated }: LeadDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('data');
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [communications, setCommunications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Create a form state for the lead data based on the normalized schema
  const [formData, setFormData] = useState({
    // Lead fields
    status: lead?.status || lead?.status_legacy || 'New' as LeadStatus,
    insurance_type: lead?.insurance_type || lead?.insurance_type_legacy || 'Auto' as InsuranceType,
    current_carrier: lead?.current_carrier || '',
    premium: lead?.premium ? lead.premium.toString() : '',
    notes: lead?.notes || '',
    assigned_to: lead?.assigned_to || '',

    // Client fields (from joined client or legacy fields)
    client_name: lead?.client?.name || `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim(),
    first_name: lead?.first_name || lead?.client?.name?.split(' ')[0] || '',
    last_name: lead?.last_name || (lead?.client?.name?.split(' ').slice(1).join(' ') || ''),
    email: lead?.client?.email || lead?.email || '',
    phone_number: lead?.client?.phone_number || lead?.phone_number || '',

    // Address fields (from joined address or empty)
    street_address: lead?.client?.address?.street || '',
    city: lead?.client?.address?.city || '',
    state: lead?.client?.address?.state || '',
    zip_code: lead?.client?.address?.zip_code || '',

    // Individual-specific fields
    date_of_birth: lead?.client?.date_of_birth || '',
    gender: lead?.client?.gender || '',
    marital_status: lead?.client?.marital_status || '',
    drivers_license: lead?.client?.drivers_license || '',
    license_state: lead?.client?.license_state || '',
    education_occupation: lead?.client?.education_occupation || '',
    referred_by: lead?.client?.referred_by || '',
  });

  // Update form data when lead changes based on the normalized schema
  useEffect(() => {
    if (lead) {
      setFormData({
        // Lead fields
        status: lead?.status || lead?.status_legacy || 'New' as LeadStatus,
        insurance_type: lead?.insurance_type || lead?.insurance_type_legacy || 'Auto' as InsuranceType,
        current_carrier: lead?.current_carrier || '',
        premium: lead?.premium ? lead.premium.toString() : '',
        notes: lead?.notes || '',
        assigned_to: lead?.assigned_to || '',

        // Client fields (from joined client or legacy fields)
        client_name: lead?.client?.name || `${lead?.first_name || ''} ${lead?.last_name || ''}`.trim(),
        first_name: lead?.first_name || lead?.client?.name?.split(' ')[0] || '',
        last_name: lead?.last_name || (lead?.client?.name?.split(' ').slice(1).join(' ') || ''),
        email: lead?.client?.email || lead?.email || '',
        phone_number: lead?.client?.phone_number || lead?.phone_number || '',

        // Address fields (from joined address or empty)
        street_address: lead?.client?.address?.street || '',
        city: lead?.client?.address?.city || '',
        state: lead?.client?.address?.state || '',
        zip_code: lead?.client?.address?.zip_code || '',

        // Individual-specific fields
        date_of_birth: lead?.client?.date_of_birth || '',
        gender: lead?.client?.gender || '',
        marital_status: lead?.client?.marital_status || '',
        drivers_license: lead?.client?.drivers_license || '',
        license_state: lead?.client?.license_state || '',
        education_occupation: lead?.client?.education_occupation || '',
        referred_by: lead?.client?.referred_by || '',
      });
    }
  }, [lead]);

  // Fetch lead notes
  useEffect(() => {
    if (isOpen && lead) {
      const fetchNotes = async () => {
        const { data, error } = await supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', lead.id)
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
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching communications:', error);
        } else {
          setCommunications(data || []);
        }
      };

      fetchNotes();
      fetchCommunications();
    }
  }, [isOpen, lead]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

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
        alert('Failed to add note. Please try again.');
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
      alert('Failed to add note. Please try again.');
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

  // Check if we have permission to update leads
  const checkPermissions = async () => {
    try {
      // Skip auth check in development environment
      // In a production environment, you would want to properly handle authentication
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
        // Process the data before passing it to the parent component
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
          status_legacy: typeof data.status === 'object' && data.status?.value ? data.status.value as LeadStatus : 'New',
          insurance_type_legacy: typeof data.insurance_type === 'object' && data.insurance_type?.name ? data.insurance_type.name as InsuranceType : 'Auto'
        };

        // Update the lead in the parent component
        onLeadUpdated(processedLead);
        setIsEditing(false);
        toast({
          title: "Success",
          description: `Lead and client information updated successfully. Name changed to ${clientName}.`,
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Only call onClose when the dialog is being closed
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {typeof lead.first_name === 'string' ? lead.first_name : ''} {typeof lead.last_name === 'string' ? lead.last_name : ''}
          </DialogTitle>
          <div className="text-sm text-blue-500 hover:text-blue-700 mt-1">
            <a href={`/dashboard/leads/${lead.id}`} onClick={(e) => {
              e.preventDefault();
              onClose(); // Close the modal first
              window.location.href = `/dashboard/leads/${lead.id}`; // Navigate to the full lead details page
            }}>
              View full lead details
            </a>
          </div>
        </DialogHeader>

        <Tabs defaultValue="data" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="data">Lead Data</TabsTrigger>
            <TabsTrigger value="communications">Communication History</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Automation</TabsTrigger>
          </TabsList>

          {/* Lead Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                  className={isEditing ? "" : "bg-black hover:bg-gray-800 text-white"}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <CardContent className="grid grid-cols-2 gap-4">
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
                        <div>{typeof lead.first_name === 'string' ? lead.first_name : ''} {typeof lead.last_name === 'string' ? lead.last_name : ''}</div>
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
                          <span className={`${statusBadgeStyles} ${getStatusStyles(
                            typeof lead.status === 'string'
                              ? lead.status
                              : (lead.status as any)?.value || 'New'
                          )}`}>
                            {typeof lead.status === 'string'
                              ? lead.status.charAt(0).toUpperCase() + lead.status.slice(1)
                              : (lead.status as any)?.value || 'New'}
                          </span>
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
              </ScrollArea>
              {isEditing && (
                <CardFooter className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {lead.insurance_type === 'Auto' && lead.auto_data && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Auto Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.auto_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {lead.insurance_type === 'Home' && lead.home_data && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Home Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.home_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {lead.insurance_type === 'Specialty' && lead.specialty_data && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Specialty Insurance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                    {JSON.stringify(lead.specialty_data, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
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
      </DialogContent>
    </Dialog>
  );
}
