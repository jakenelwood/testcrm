'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateMMDDYYYY, formatDateTimeMMDDYYYY } from "@/utils/date-format";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Lead, LeadNote, InsuranceType, LeadStatus } from "@/types/lead";
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
import { Phone, MessageSquare, PhoneOff } from "lucide-react";
import { makeRingCentralCall, sendRingCentralSMS } from "@/utils/ringcentral";
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

  // State for new interfaces
  const [showCallConfirm, setShowCallConfirm] = useState(false);
  const [showSmsInterface, setShowSmsInterface] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [callId, setCallId] = useState<string | null>(null);
  const [activePhoneNumber, setActivePhoneNumber] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ callId: string, phoneNumber: string } | null>(null);

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
    client_name: lead?.client?.name || `${lead?.first_name || 'Unknown'} ${lead?.last_name || ''}`.trim(),
    first_name: lead?.first_name || lead?.client?.name?.split(' ')[0] || 'Unknown',
    last_name: lead?.last_name || (lead?.client?.name?.split(' ').slice(1).join(' ') || ''),
    email: lead?.client?.email || lead?.email || '',
    phone_number: lead?.client?.phone_number || lead?.phone_number || '',

    // Address fields (directly from lead)
    street_address: lead?.address_street || '',
    city: lead?.address_city || '',
    state: lead?.address_state || '',
    zip_code: lead?.address_zip_code || '',

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
        client_name: lead?.client?.name || `${lead?.first_name || 'Unknown'}${lead?.last_name ? ` ${lead?.last_name}` : ''}`.trim(),
        first_name: lead?.first_name || (lead?.client?.client_type === 'Business' ? lead?.client?.name : lead?.client?.name?.split(' ')[0]) || 'Unknown',
        last_name: lead?.last_name || (lead?.client?.client_type === 'Business' ? '' : (lead?.client?.name?.split(' ').slice(1).join(' ') || '')),
        email: lead?.client?.email || lead?.email || '',
        phone_number: lead?.client?.phone_number || lead?.phone_number || '',

        // Physical Address fields (directly from lead)
        street_address: lead?.address_street || '',
        city: lead?.address_city || '',
        state: lead?.address_state || '',
        zip_code: lead?.address_zip_code || '',

        // Mailing Address fields (directly from lead)
        mailing_street_address: lead?.mailing_address_street || '',
        mailing_city: lead?.mailing_address_city || '',
        mailing_state: lead?.mailing_address_state || '',
        mailing_zip_code: lead?.mailing_address_zip_code || '',

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
            type_id: 4, // 4 is the ID for 'Note' in communication_types
            direction: 'Outbound',
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

  // Function to initiate RingCentral Call
  const initiateRingCentralCall = async () => {
    let targetPhoneNumber = formData.phone_number || lead?.phone_number || '';

    // Standardize phone number format (assuming US numbers)
    if (targetPhoneNumber) {
      // Remove any non-digit characters
      const digitsOnly = targetPhoneNumber.replace(/\D/g, '');

      // If it's a 10-digit number, add +1 prefix (US)
      if (digitsOnly.length === 10) {
        targetPhoneNumber = `+1${digitsOnly}`;
      }
      // If it already has country code (11 digits starting with 1)
      else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        targetPhoneNumber = `+${digitsOnly}`;
      }
      // Other cases - just add + if missing
      else if (!targetPhoneNumber.startsWith('+')) {
        targetPhoneNumber = `+${digitsOnly}`;
      }
    }

    if (!targetPhoneNumber) {
      toast({
        title: "Error",
        description: "Phone number is not available.",
        variant: "destructive",
      });
      setShowCallConfirm(false);
      return;
    }

    toast({
      title: "Initiating call...",
      description: `Calling ${targetPhoneNumber} via RingCentral`,
    });

    const hardcodedFromNumber = '+16124643934'; // YOUR ACTUAL RingCentral From Number
    console.log('[LeadDetailsModal] Attempting call. To:', targetPhoneNumber, 'Using Hardcoded From:', hardcodedFromNumber);

    // SUPER-ROBUST DEBUGGING APPROACH
    console.log('======================= DEBUGGING =======================');
    console.log('1. VARIABLES BEING PASSED:');
    console.log('   To number:', targetPhoneNumber);
    console.log('   From number:', hardcodedFromNumber);

    try {
      // *** DIRECT API APPROACH - MATCHING THE TEST PAGE ***
      console.log('Using direct API call with the same parameter names as the test page');

      // Create the payload with the EXACT SAME parameter names as the test page
      const payload = {
        to: targetPhoneNumber,  // IMPORTANT: 'to' not 'toNumber'
        from: hardcodedFromNumber  // IMPORTANT: 'from' not 'fromNumber'
      };

      console.log('   Payload:', payload);

      const response = await fetch('/api/ringcentral/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('   Direct API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('   Direct API error response:', errorText);
        throw new Error(`Call failed: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('   Direct API success response:', responseData);

      // IMPORTANT: Set callId and activePhoneNumber separately like the test page does
      const newCallId = responseData.callId || responseData.id;

      if (newCallId) {
        console.log('Setting call ID to:', newCallId);
        // Set both the new state variables and the legacy activeCall object
        setCallId(newCallId);
        setActivePhoneNumber(targetPhoneNumber);
        setActiveCall({ callId: newCallId, phoneNumber: targetPhoneNumber });

        toast({
          title: "Call initiated",
          description: "You should receive a call on your phone shortly. Call ID: " + newCallId,
        });

        await supabase
          .from('lead_communications')
          .insert({
            lead_id: lead.id,
            type_id: 3, // 3 is the ID for 'Call' in communication_types
            direction: 'Outbound',
            content: `RingCentral call initiated to ${targetPhoneNumber}. Call ID: ${newCallId}`,
            created_by: 'User',
            created_at: new Date().toISOString(),
          });

        const { data: newComms } = await supabase
          .from('lead_communications')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });
        if (newComms) setCommunications(newComms);
      } else {
        throw new Error("Failed to retrieve Call ID from RingCentral call initiation.");
      }
    } catch (error: any) {
      console.error('RingCentral call error:', error);
      toast({
        title: "Call failed",
        description: error.message || "Failed to initiate RingCentral call. See console for details.",
        variant: "destructive"
      });
      setShowCallConfirm(false); // Close dialog on failure
    }
    console.log('===================== END DEBUGGING =====================');
  };

  // Function to hang up RingCentral Call
  const hangUpRingCentralCall = async () => {
    if (!callId) {
      toast({
        title: "No active call",
        description: "There is no active call to hang up.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Ending call...",
      description: `Hanging up call to ${activePhoneNumber || "unknown number"}`,
    });

    try {
      // Using direct API approach to mirror our successful call initiation
      console.log('Attempting to end call with ID:', callId);

      const response = await fetch('/api/ringcentral/end-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: callId }),
      });

      console.log('End call response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('End call error response:', errorText);
        throw new Error(`Failed to hang up call: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('End call success response:', responseData);

      toast({
        title: "Call Ended",
        description: `Call to ${activePhoneNumber || "destination"} has been ended.`,
      });

      await supabase
        .from('lead_communications')
        .insert({
          lead_id: lead.id,
          type_id: 3,
          direction: 'Outbound',
          content: `RingCentral call to ${activePhoneNumber || "unknown number"} ended. Call ID: ${callId}`,
          created_by: 'User',
          created_at: new Date().toISOString(),
          status: 'Completed' // Optional: Add a status for ended calls
        });

      // Clear ALL call state
      setCallId(null);
      setActivePhoneNumber(null);
      setActiveCall(null);
      setShowCallConfirm(false); // Close the dialog after hanging up

      const { data: newComms } = await supabase
          .from('lead_communications')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });
      if (newComms) setCommunications(newComms);

    } catch (error: any) {
      console.error('RingCentral hang up error:', error);
      toast({
        title: "Hang Up Failed",
        description: error.message || "Failed to end RingCentral call. See console for details.",
        variant: "destructive"
      });
      // Even if the API call fails, we'll consider the call ended from UI perspective
      // This prevents the user from getting stuck with a call they can't hang up
      setCallId(null);
      setActivePhoneNumber(null);
      setActiveCall(null);
      setShowCallConfirm(false);
    }
  };

  // Function to initiate RingCentral SMS
  const initiateRingCentralSMS = async () => {
    let targetPhoneNumber = formData.phone_number || lead?.phone_number || '';

    // Standardize phone number format (assuming US numbers) - same logic as test page
    if (targetPhoneNumber) {
      // Remove any non-digit characters
      const digitsOnly = targetPhoneNumber.replace(/\D/g, '');

      // If it's a 10-digit number, add +1 prefix (US)
      if (digitsOnly.length === 10) {
        targetPhoneNumber = `+1${digitsOnly}`;
      }
      // If it already has country code (11 digits starting with 1)
      else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        targetPhoneNumber = `+${digitsOnly}`;
      }
      // Other cases - just add + if missing
      else if (!targetPhoneNumber.startsWith('+')) {
        targetPhoneNumber = `+${digitsOnly}`;
      }
    }

    // Check for formatting issues specific to our area code
    if (targetPhoneNumber.startsWith('+612')) {
      targetPhoneNumber = `+1${targetPhoneNumber.substring(4)}`;
      console.log(`Reformatted number from +612... to +1612... format: ${targetPhoneNumber}`);
    }

    const leadFirstName = formData.first_name || lead?.first_name || 'Customer';

    if (!targetPhoneNumber) {
       toast({ title: "Error", description: "Phone number is not available.", variant: "destructive" });
       setShowSmsInterface(false);
       return;
    }
    if (!smsMessage.trim()) {
      toast({ title: "Error", description: "SMS message cannot be empty.", variant: "destructive" });
      return;
    }

    toast({
      title: "Sending message...",
      description: `Texting ${targetPhoneNumber} via RingCentral`,
    });

    const hardcodedFromNumber = '+16124643934'; // YOUR ACTUAL RingCentral From Number
    console.log('[LeadDetailsModal] Attempting to send SMS. To:', targetPhoneNumber, 'From:', hardcodedFromNumber, 'Message:', smsMessage);

    try {
      // Using the exact same API call structure as the test page
      const response = await fetch('/api/ringcentral/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetPhoneNumber,
          from: hardcodedFromNumber,
          text: smsMessage
        })
      });

      console.log('SMS API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('SMS API error response:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to send SMS: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('SMS API success response:', responseData);

      toast({
        title: "Message sent",
        description: "Your message has been sent via RingCentral.",
      });
      await supabase
        .from('lead_communications')
        .insert({
          lead_id: lead.id,
          type_id: 2, // 2 is the ID for 'SMS' in communication_types
          direction: 'Outbound',
          content: `SMS sent to ${targetPhoneNumber}: ${smsMessage}`,
          created_by: 'User',
          created_at: new Date().toISOString(),
        });

      const { data: newComms } = await supabase
        .from('lead_communications')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      if (newComms) setCommunications(newComms);

      setShowSmsInterface(false);
      setSmsMessage('');
    } catch (error: any) {
      console.error('RingCentral SMS error:', error);
      toast({
        title: "Message failed",
        description: error.message || "Failed to send RingCentral SMS. See console for details.",
        variant: "destructive"
      });
      // Don't close the interface on error so user can try again
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
        .from('leads_ins_info')
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

      // Get the client ID from either client_id or leads_contact_info_id
      let clientId = lead.client_id || lead.leads_contact_info_id;

      // If we still don't have it, try to get it from the client object
      if (!clientId && lead.client?.id) {
        clientId = lead.client.id;
      }

      if (!clientId) {
        console.error('No client ID found for lead:', lead.id);
        console.log('Lead object:', lead);
        throw new Error('No client ID found for lead');
      }

      console.log('Updating client record:', {
        client_id: clientId,
        name: clientName,
        email: formData.email,
        phone_number: formData.phone_number
      });

      const { error: clientError } = await supabase
        .from('leads_contact_info')
        .update({
          name: clientName,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      if (clientError) {
        console.error('Error updating client:', clientError);
        throw clientError;
      }

      console.log('Client record updated successfully');

      // Import the updateLeadAddress function
      const { updateLeadAddress } = await import('@/utils/address-helpers');

      // Check if we have physical address data to update
      if (formData.street_address || formData.city || formData.state || formData.zip_code) {
        console.log('DEBUG: Updating physical address information using updateLeadAddress helper');

        // Use the helper function to update the lead's physical address directly
        const { success, error: addressError } = await updateLeadAddress(
          supabase,
          lead.id,
          {
            street: formData.street_address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code
          },
          'address' // Use the primary address
        );

        if (!success) {
          console.error('DEBUG: Error updating physical address:', addressError);
          // Continue with lead update even if address update fails
          console.warn('DEBUG: Continuing with lead update despite physical address update failure');
        } else {
          console.log('DEBUG: Physical address updated successfully');
        }
      }

      // Check if we have mailing address data to update
      if (formData.mailing_street_address || formData.mailing_city || formData.mailing_state || formData.mailing_zip_code) {
        console.log('DEBUG: Updating mailing address information using updateLeadAddress helper');

        // Use the helper function to update the lead's mailing address directly
        const { success, error: mailingAddressError } = await updateLeadAddress(
          supabase,
          lead.id,
          {
            street: formData.mailing_street_address,
            city: formData.mailing_city,
            state: formData.mailing_state,
            zip_code: formData.mailing_zip_code
          },
          'mailing_address' // Use the mailing address
        );

        if (!success) {
          console.error('DEBUG: Error updating mailing address:', mailingAddressError);
          // Continue with lead update even if address update fails
          console.warn('DEBUG: Continuing with lead update despite mailing address update failure');
        } else {
          console.log('DEBUG: Mailing address updated successfully');
        }
      }

      // Then update lead in Supabase - only include fields that exist in the database
      const { data, error } = await supabase
        .from('leads_ins_info')
        .update({
          status_id: statusId,
          insurance_type_id: insuranceTypeId,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

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
      } else {
        // Fetch the updated lead data from the lead_details view to get the latest address information
        const { data: updatedLeadData, error: fetchError } = await supabase
          .from('lead_details')
          .select('*')
          .eq('id', lead.id)
          .single();

        if (fetchError) {
          console.error('Error fetching updated lead data:', fetchError);

          // Fallback to fetching from lead_details view
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('lead_details')
            .select('*')
            .eq('id', lead.id)
            .single();

          if (fallbackError) {
            console.error('Error fetching fallback lead data:', fallbackError);
            toast({
              title: "Warning",
              description: "Lead updated but couldn't refresh the latest data.",
              variant: "default"
            });
            return;
          }

          // Process the fallback data
          const processedLead: Lead = {
            ...fallbackData,
            // Map joined fields to their expected properties
            status: typeof fallbackData.status === 'object' && fallbackData.status?.value ? fallbackData.status.value : 'New',
            insurance_type: typeof fallbackData.insurance_type === 'object' && fallbackData.insurance_type?.name ? fallbackData.insurance_type.name : 'Auto',

            // Add legacy fields from client data for backward compatibility
            first_name: typeof fallbackData.client === 'object' && fallbackData.client?.name ? fallbackData.client.name.split(' ')[0] : '',
            last_name: typeof fallbackData.client === 'object' && fallbackData.client?.name ? fallbackData.client.name.split(' ').slice(1).join(' ') : '',
            email: typeof fallbackData.client === 'object' ? fallbackData.client?.email || '' : '',
            phone_number: typeof fallbackData.client === 'object' ? fallbackData.client?.phone_number || '' : '',

            // Ensure we have status_legacy and insurance_type_legacy for compatibility
            status_legacy: typeof fallbackData.status === 'object' && fallbackData.status?.value ? fallbackData.status.value as LeadStatus : 'New',
            insurance_type_legacy: typeof fallbackData.insurance_type === 'object' && fallbackData.insurance_type?.name ? fallbackData.insurance_type.name as InsuranceType : 'Auto'
          };

          // Update the lead in the parent component
          onLeadUpdated(processedLead);
          setIsEditing(false);
          toast({
            title: "Success",
            description: `Lead and client information updated successfully. Name changed to ${clientName}.`,
          });

        } else {
          // Process the data from lead_details view
          const processedLead: Lead = {
            ...updatedLeadData,
            // Status and insurance type are already direct properties in lead_details
            status: updatedLeadData.status || 'New',
            insurance_type: updatedLeadData.insurance_type || 'Auto',

            // Contact information is now directly on the lead
            first_name: updatedLeadData.first_name || '',
            last_name: updatedLeadData.last_name || '',
            email: updatedLeadData.email || '',
            phone_number: updatedLeadData.phone_number || '',

            // Ensure we have status_legacy and insurance_type_legacy for compatibility
            status_legacy: updatedLeadData.status || 'New',
            insurance_type_legacy: updatedLeadData.insurance_type || 'Auto'
          };

          // Update the lead in the parent component
          onLeadUpdated(processedLead);
          setIsEditing(false);

          let successMessage = "Lead and client information updated successfully";

          // Check if physical address was updated
          if (formData.street_address || formData.city || formData.state || formData.zip_code) {
            successMessage += " with updated physical address";
          }

          // Check if mailing address was updated
          if (formData.mailing_street_address || formData.mailing_city || formData.mailing_state || formData.mailing_zip_code) {
            successMessage += " and mailing address";
          }

          toast({
            title: "Success",
            description: successMessage,
          });
        }
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
    <>
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
          className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border-gray-200 shadow-xl rounded-lg fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50"
        >
          <DialogDescription id="lead-details-description" className="sr-only">
            Lead details and communication history for {typeof lead.first_name === 'string' ? lead.first_name : ''} {typeof lead.last_name === 'string' ? lead.last_name : ''}
          </DialogDescription>
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-lg"></div>

          <DialogHeader className="border-b border-gray-200 pb-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50/30 -mx-6 px-6 pt-6 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900">
                  {typeof lead.first_name === 'string' ? lead.first_name : ''}{typeof lead.last_name === 'string' && lead.last_name ? ` ${lead.last_name}` : ''}
                  {lead.client?.client_type === 'Business' && <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Business</span>}
                </DialogTitle>
                <div className="text-sm text-blue-600 hover:text-blue-800 mt-1 flex items-center">
                  <a href={`/dashboard/leads/${lead.id}`} onClick={(e) => {
                    e.preventDefault();
                    onClose(); // Close the modal first
                    window.location.href = `/dashboard/leads/${lead.id}`; // Navigate to the full lead details page
                  }} className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View full lead details
                  </a>
                </div>
              </div>

              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {typeof lead.first_name === 'string' && lead.first_name ? lead.first_name.charAt(0).toUpperCase() : ''}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="data" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="data"
                className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                Lead Data
              </TabsTrigger>
              <TabsTrigger
                value="communications"
                className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                Communication History
              </TabsTrigger>
              <TabsTrigger
                value="marketing"
                className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
              >
                Marketing Automation
              </TabsTrigger>
            </TabsList>

            {/* Lead Data Tab */}
            <TabsContent value="data" className="space-y-4 mt-4">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg font-medium text-gray-900">Basic Information</CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isSaving}
                    className={isEditing ? "" : "bg-black hover:bg-gray-800 text-white"}
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <ScrollArea className="h-[500px] bg-white">
                  <CardContent className="grid grid-cols-2 gap-4 pt-4 bg-white">
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
                          <div className="flex space-x-2">
                            <Input
                              id="phone_number"
                              name="phone_number"
                              value={formData.phone_number}
                              onChange={handleInputChange}
                              className="flex-1"
                            />
                            {formData.phone_number && (
                              <>
                                <a
                                  href="#"
                                  className="inline-flex items-center justify-center mr-2 h-8 w-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                  title="Call via RingCentral"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCallConfirm(true);
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                                <a
                                  href="#"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                  title="Message via RingCentral"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const leadFirstName = formData.first_name || lead?.first_name || 'Customer';
                                    setSmsMessage(`Hi ${leadFirstName}, this is regarding your insurance quote.`);
                                    setShowSmsInterface(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </>
                            )}
                          </div>
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
                        {/* Physical Address Information */}
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="street_address" className="font-medium">Physical Address</Label>
                          <Input
                            id="street_address"
                            name="street_address"
                            value={formData.street_address}
                            onChange={handleInputChange}
                            placeholder="Street Address"
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

                        {/* Mailing Address Information */}
                        <div className="col-span-2 space-y-2 mt-4">
                          <Label htmlFor="mailing_street_address" className="font-medium">Mailing Address</Label>
                          <Input
                            id="mailing_street_address"
                            name="mailing_street_address"
                            value={formData.mailing_street_address}
                            onChange={handleInputChange}
                            placeholder="Street Address (leave blank if same as physical)"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mailing_city">City</Label>
                          <Input
                            id="mailing_city"
                            name="mailing_city"
                            value={formData.mailing_city}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mailing_state">State</Label>
                          <Input
                            id="mailing_state"
                            name="mailing_state"
                            value={formData.mailing_state}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mailing_zip_code">ZIP Code</Label>
                          <Input
                            id="mailing_zip_code"
                            name="mailing_zip_code"
                            value={formData.mailing_zip_code}
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
                          <Label className="text-xs font-medium text-muted-foreground">Client Type</Label>
                          <div>{lead.client?.client_type || 'Individual'}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                          <div>{lead.first_name || 'Unknown'}{lead.last_name ? ` ${lead.last_name}` : ''}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                          <div>{lead.email || 'N/A'}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                          <div className="flex items-center">
                            <span className="mr-3">{lead.phone_number || 'N/A'}</span>
                            {lead.phone_number && (
                              <>
                                <a
                                  href="#"
                                  className="inline-flex items-center justify-center mr-2 h-8 w-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                  title="Call via RingCentral"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCallConfirm(true);
                                  }}
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                                <a
                                  href="#"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                  title="Message via RingCentral"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const leadFirstName = lead?.first_name || formData.first_name || 'Customer';
                                    setSmsMessage(`Hi ${leadFirstName}, this is regarding your insurance quote.`);
                                    setShowSmsInterface(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </a>
                              </>
                            )}
                          </div>
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
                          <Label className="text-xs font-medium text-muted-foreground">Physical Address</Label>
                          <div>
                            {lead.address_street || formData.street_address ? (
                              <>
                                {lead.address_street || formData.street_address}<br />
                                {lead.address_city || formData.city}
                                {(lead.address_city || formData.city) && (lead.address_state || formData.state) ? ', ' : ''}
                                {lead.address_state || formData.state} {lead.address_zip_code || formData.zip_code}
                              </>
                            ) : (
                              'No address'
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Mailing Address</Label>
                          <div>
                            {lead.mailing_address_street ? (
                              <>
                                {lead.mailing_address_street}<br />
                                {lead.mailing_address_city}
                                {lead.mailing_address_city && lead.mailing_address_state ? ', ' : ''}
                                {lead.mailing_address_state} {lead.mailing_address_zip_code}
                              </>
                            ) : (
                              'Same as physical address'
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
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-lg font-medium text-gray-900">Auto Insurance Details</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Drivers Section */}
                      {lead.auto_data.drivers && lead.auto_data.drivers.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Drivers</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-md">
                            {lead.auto_data.drivers.map((driver: any, index: number) => (
                              <div key={index} className="col-span-2 border-b border-gray-200 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                                    <div>{driver.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Primary Driver</Label>
                                    <div>{driver.primary ? 'Yes' : 'No'}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">License</Label>
                                    <div>{driver.license}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">State</Label>
                                    <div>{driver.state}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vehicles Section */}
                      {lead.auto_data.vehicles && lead.auto_data.vehicles.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Vehicles</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-md">
                            {lead.auto_data.vehicles.map((vehicle: any, index: number) => (
                              <div key={index} className="col-span-2 border-b border-gray-200 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Make</Label>
                                    <div>{vehicle.make}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Model</Label>
                                    <div>{vehicle.model}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Year</Label>
                                    <div>{vehicle.year}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">VIN</Label>
                                    <div>{vehicle.vin}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Primary Use</Label>
                                    <div>{vehicle.primary_use}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">Annual Mileage</Label>
                                    <div>{vehicle.annual_mileage?.toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coverages Section */}
                      {lead.auto_data.coverages && (
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Coverage Details</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-md">
                            {lead.auto_data.coverages.liability && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Liability</Label>
                                <div>{lead.auto_data.coverages.liability}</div>
                              </div>
                            )}
                            {lead.auto_data.coverages.uninsured_motorist && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Uninsured Motorist</Label>
                                <div>{lead.auto_data.coverages.uninsured_motorist}</div>
                              </div>
                            )}
                            {lead.auto_data.coverages.collision_deductible && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Collision Deductible</Label>
                                <div>${lead.auto_data.coverages.collision_deductible}</div>
                              </div>
                            )}
                            {lead.auto_data.coverages.comprehensive_deductible && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Comprehensive Deductible</Label>
                                <div>${lead.auto_data.coverages.comprehensive_deductible}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show raw JSON in a collapsible section for developers */}
                      <details className="col-span-2 mt-4">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View Raw JSON Data
                        </summary>
                        <pre className="text-xs bg-gray-50 p-4 rounded-md overflow-auto mt-2">
                          {JSON.stringify(lead.auto_data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lead.insurance_type === 'Home' && lead.home_data && (
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-lg font-medium text-gray-900">Home Insurance Details</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {lead.home_data.year_built && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Year Built</Label>
                          <div>{lead.home_data.year_built}</div>
                        </div>
                      )}
                      {lead.home_data.square_feet && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Square Feet</Label>
                          <div>{lead.home_data.square_feet}</div>
                        </div>
                      )}
                      {lead.home_data.roof_type && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Roof Type</Label>
                          <div>{lead.home_data.roof_type}</div>
                        </div>
                      )}
                      {lead.home_data.construction_type && (
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Construction Type</Label>
                          <div>{lead.home_data.construction_type}</div>
                        </div>
                      )}

                      {/* Coverage Information */}
                      {lead.home_data.coverages && (
                        <div className="col-span-2">
                          <Label className="text-xs font-medium text-muted-foreground">Coverage Details</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-md">
                            {lead.home_data.coverages.dwelling && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Dwelling</Label>
                                <div>${lead.home_data.coverages.dwelling.toLocaleString()}</div>
                              </div>
                            )}
                            {lead.home_data.coverages.personal_property && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Personal Property</Label>
                                <div>${lead.home_data.coverages.personal_property.toLocaleString()}</div>
                              </div>
                            )}
                            {lead.home_data.coverages.liability && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Liability</Label>
                                <div>${lead.home_data.coverages.liability.toLocaleString()}</div>
                              </div>
                            )}
                            {lead.home_data.coverages.medical && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Medical</Label>
                                <div>${lead.home_data.coverages.medical.toLocaleString()}</div>
                              </div>
                            )}
                            {lead.home_data.coverages.deductible && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Deductible</Label>
                                <div>${lead.home_data.coverages.deductible.toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show raw JSON in a collapsible section for developers */}
                      <details className="col-span-2 mt-4">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View Raw JSON Data
                        </summary>
                        <pre className="text-xs bg-gray-50 p-4 rounded-md overflow-auto mt-2">
                          {JSON.stringify(lead.home_data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lead.insurance_type === 'Specialty' && lead.specialty_data && (
                <Card className="border border-gray-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                    <CardTitle className="text-lg font-medium text-gray-900">Specialty Insurance Details</CardTitle>
                  </CardHeader>
                  <CardContent className="bg-white pt-4">
                    <pre className="text-sm bg-gray-50 p-4 rounded-md overflow-auto">
                      {JSON.stringify(lead.specialty_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Communication History Tab */}
            <TabsContent value="communications" className="space-y-4 mt-4">
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg font-medium text-gray-900">Add Note</CardTitle>
                  <CardDescription className="text-sm">Add a note about this lead</CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
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

              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg font-medium text-gray-900">Communication History</CardTitle>
                  <CardDescription className="text-sm">All interactions with this lead</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-white pt-4">
                  {[...notes, ...communications].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  ).map((item, index) => (
                    <Card key={index} className="bg-gray-50 border border-gray-200">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-black">
                              {item.type || 'Note'} {item.direction ? `(${item.direction})` : ''}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDateTimeMMDDYYYY(item.created_at)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.created_by || 'System'}
                          </div>
                        </div>
                        <div className="mt-2 text-black">
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
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-2 bg-gray-50 border-b border-gray-100">
                  <CardTitle className="text-lg font-medium text-gray-900">Marketing Campaigns</CardTitle>
                  <CardDescription className="text-sm">
                    Enable or disable marketing campaigns for this lead
                  </CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    Marketing automation features coming soon
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Call Confirmation Dialog */}
      {showCallConfirm && (
        <Dialog
          open={showCallConfirm}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setShowCallConfirm(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md z-60 bg-white" aria-describedby="call-confirm-description">
            <DialogHeader>
              <DialogTitle>
                {callId ?
                  <div className="flex items-center">
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Call in Progress
                  </div>
                  : "Confirm Call"
                }
              </DialogTitle>
              <DialogDescription id="call-confirm-description">
                {callId
                  ? `Call to ${activePhoneNumber || formData.phone_number || lead?.phone_number} is currently active. (ID: ${callId})`
                  : `Are you sure you want to call ${formData.phone_number || lead?.phone_number || ''}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCallConfirm(false);
                }}
              >
                {callId ? "Close" : "Cancel"}
              </Button>
              {callId ? (
                <Button onClick={hangUpRingCentralCall} variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Hang Up
                </Button>
              ) : (
                <Button onClick={initiateRingCentralCall} disabled={!(formData.phone_number || lead?.phone_number)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* SMS Interface Dialog */}
      {showSmsInterface &&
        (() => {
          const currentPhoneNumber = formData.phone_number || lead?.phone_number || '';
          return (
            <Dialog open={showSmsInterface} onOpenChange={setShowSmsInterface}>
              <DialogContent className="sm:max-w-md z-60 bg-white" aria-describedby="sms-compose-description">
                <DialogHeader>
                  <DialogTitle>Send SMS</DialogTitle>
                  <DialogDescription id="sms-compose-description">
                    Compose and send an SMS to {currentPhoneNumber}.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="mt-4"
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSmsInterface(false);
                      setSmsMessage(''); // Reset message on cancel
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={initiateRingCentralSMS} disabled={!smsMessage.trim() || !currentPhoneNumber}>
                    Send SMS
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}
    </>
  );
}
