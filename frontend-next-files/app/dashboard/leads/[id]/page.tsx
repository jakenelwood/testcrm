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
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { getStatusStyles, statusBadgeStyles } from "@/utils/status-styles";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { OtherInsuredForm } from '@/components/forms/other-insured-form';
import { VehicleForm } from '@/components/forms/vehicle-form';
import { HomeForm } from '@/components/forms/home-form';
import { SpecialtyItemForm } from '@/components/forms/specialty-item-form';
import { DevelopmentModeBanner } from "@/components/ui/development-mode-banner";
import ClientDetails from "@/components/client/client-details";

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

  // State for tracking errors
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState<boolean>(false);

  // Mock data for development mode
  const mockLead: Lead = {
    id: params.id as string,
    first_name: 'Demo',
    last_name: 'User',
    email: 'demo@example.com',
    phone_number: '555-123-4567',
    status: 'New',
    insurance_type: 'Auto',
    current_carrier: 'State Farm',
    premium: 1200,
    notes: 'This is a demo lead for development purposes.',
    assigned_to: 'Brian B',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client: {
      id: '123',
      name: 'Demo User',
      email: 'demo@example.com',
      phone_number: '555-123-4567',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip_code: '12345'
      },
      date_of_birth: '1990-01-01',
      gender: 'Male',
      marital_status: 'Single',
      drivers_license: 'DL12345',
      license_state: 'CA',
      referred_by: 'Website'
    }
  };

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      setIsLoading(true);
      setFetchError(null);

      // Check if we're in development mode
      const isDev = process.env.NODE_ENV === 'development';
      setIsDevelopmentMode(isDev);

      try {
        // First check if the leads table exists and has the required structure
        try {
          const { data: tableCheck, error: tableError } = await supabase
            .from('leads')
            .select('id')
            .limit(1);

          if (tableError) {
            if (tableError.code === '42P01') { // Table doesn't exist
              if (isDev) {
                console.log('Using mock data in development mode because leads table does not exist');
                setLead(mockLead);

                // Initialize form data with mock data
                setFormData({
                  status: mockLead.status,
                  insurance_type: mockLead.insurance_type,
                  current_carrier: mockLead.current_carrier || '',
                  premium: mockLead.premium ? mockLead.premium.toString() : '',
                  notes: mockLead.notes || '',
                  assigned_to: mockLead.assigned_to || '',
                  first_name: mockLead.first_name,
                  last_name: mockLead.last_name,
                  email: mockLead.email,
                  phone_number: mockLead.phone_number,
                  street_address: mockLead.client?.address?.street || '',
                  city: mockLead.client?.address?.city || '',
                  state: mockLead.client?.address?.state || '',
                  zip_code: mockLead.client?.address?.zip_code || '',
                  date_of_birth: mockLead.client?.date_of_birth || '',
                  gender: mockLead.client?.gender || '',
                  marital_status: mockLead.client?.marital_status || '',
                  drivers_license: mockLead.client?.drivers_license || '',
                  license_state: mockLead.client?.license_state || '',
                  education_occupation: '',
                  referred_by: mockLead.client?.referred_by || '',
                  client_name: mockLead.client?.name || `${mockLead.first_name} ${mockLead.last_name}`,
                });

                setIsLoading(false);
                return;
              } else {
                setFetchError('The leads table does not exist in the database. Please set up the database schema first.');
                setIsLoading(false);
                return;
              }
            }
          }
        } catch (tableCheckError) {
          console.error('Error checking leads table:', tableCheckError);
        }

        // Try to fetch from the lead_details view first
        try {
          // Use the new lead_details view which includes address information
          const { data, error } = await supabase
            .from('lead_details')
            .select('*')
            .eq('id', params.id)
            .single();

          if (error) {
            // If the join fails, try a simpler query
            console.warn('Join query failed, trying simple query:', error);

            // Check if this is a 400 error (likely schema mismatch)
            if (error.code === '400' || error.code === 400) {
              if (isDev) {
                console.log('Using mock data in development mode due to schema mismatch');
                setLead(mockLead);

                // Initialize form data with mock data
                setFormData({
                  status: mockLead.status,
                  insurance_type: mockLead.insurance_type,
                  current_carrier: mockLead.current_carrier || '',
                  premium: mockLead.premium ? mockLead.premium.toString() : '',
                  notes: mockLead.notes || '',
                  assigned_to: mockLead.assigned_to || '',
                  first_name: mockLead.first_name,
                  last_name: mockLead.last_name,
                  email: mockLead.email,
                  phone_number: mockLead.phone_number,
                  street_address: mockLead.client?.address?.street || '',
                  city: mockLead.client?.address?.city || '',
                  state: mockLead.client?.address?.state || '',
                  zip_code: mockLead.client?.address?.zip_code || '',
                  date_of_birth: mockLead.client?.date_of_birth || '',
                  gender: mockLead.client?.gender || '',
                  marital_status: mockLead.client?.marital_status || '',
                  drivers_license: mockLead.client?.drivers_license || '',
                  license_state: mockLead.client?.license_state || '',
                  education_occupation: '',
                  referred_by: mockLead.client?.referred_by || '',
                  client_name: mockLead.client?.name || `${mockLead.first_name} ${mockLead.last_name}`,
                });

                setIsLoading(false);
                return;
              }
            }

            // Try a simpler query without joins
            const { data: simpleData, error: simpleError } = await supabase
              .from('leads')
              .select('*')
              .eq('id', params.id)
              .single();

            if (simpleError) {
              // If simple query also fails and we're in dev mode, use mock data
              if (isDev) {
                console.log('Using mock data in development mode due to failed queries');
                setLead(mockLead);

                // Initialize form data with mock data
                setFormData({
                  status: mockLead.status,
                  insurance_type: mockLead.insurance_type,
                  current_carrier: mockLead.current_carrier || '',
                  premium: mockLead.premium ? mockLead.premium.toString() : '',
                  notes: mockLead.notes || '',
                  assigned_to: mockLead.assigned_to || '',
                  first_name: mockLead.first_name,
                  last_name: mockLead.last_name,
                  email: mockLead.email,
                  phone_number: mockLead.phone_number,
                  street_address: mockLead.client?.address?.street || '',
                  city: mockLead.client?.address?.city || '',
                  state: mockLead.client?.address?.state || '',
                  zip_code: mockLead.client?.address?.zip_code || '',
                  date_of_birth: mockLead.client?.date_of_birth || '',
                  gender: mockLead.client?.gender || '',
                  marital_status: mockLead.client?.marital_status || '',
                  drivers_license: mockLead.client?.drivers_license || '',
                  license_state: mockLead.client?.license_state || '',
                  education_occupation: '',
                  referred_by: mockLead.client?.referred_by || '',
                  client_name: mockLead.client?.name || `${mockLead.first_name} ${mockLead.last_name}`,
                });

                setIsLoading(false);
                return;
              }

              throw simpleError;
            } else if (simpleData) {
              // Process the simple data
              const processedLead: Lead = {
                ...simpleData,
                status: simpleData.status || 'New',
                insurance_type: simpleData.insurance_type || 'Auto',
                first_name: simpleData.first_name || '',
                last_name: simpleData.last_name || '',
                email: simpleData.email || '',
                phone_number: simpleData.phone_number || '',
              };

              setLead(processedLead);

              // Initialize form data with simple data
              setFormData({
                status: processedLead.status || 'New',
                insurance_type: processedLead.insurance_type || 'Auto',
                current_carrier: processedLead.current_carrier || '',
                premium: processedLead.premium ? processedLead.premium.toString() : '',
                notes: processedLead.notes || '',
                assigned_to: processedLead.assigned_to || '',
                first_name: processedLead.first_name || '',
                last_name: processedLead.last_name || '',
                email: processedLead.email || '',
                phone_number: processedLead.phone_number || '',
                street_address: '',
                city: '',
                state: '',
                zip_code: '',
                date_of_birth: '',
                gender: '',
                marital_status: '',
                drivers_license: '',
                license_state: '',
                education_occupation: '',
                referred_by: '',
                client_name: `${processedLead.first_name || ''} ${processedLead.last_name || ''}`.trim(),
              });
            }
          } else if (data) {
            // Process the data with joins
            const processedLead: Lead = {
              ...data,
              // Try to get status from joined table or fallback to direct property
              status: typeof data.status === 'object' && data.status?.value
                ? data.status.value
                : (data.status || 'New'),

              // Try to get insurance_type from joined table or fallback to direct property
              insurance_type: typeof data.insurance_type === 'object' && data.insurance_type?.name
                ? data.insurance_type.name
                : (data.insurance_type || 'Auto'),

              // Add legacy fields from client data for backward compatibility
              first_name: data.first_name || (typeof data.client === 'object' && data.client?.name
                ? data.client.name.split(' ')[0]
                : ''),

              last_name: data.last_name || (typeof data.client === 'object' && data.client?.name
                ? data.client.name.split(' ').slice(1).join(' ')
                : ''),

              email: typeof data.client === 'object'
                ? data.client?.email || ''
                : (data.email || ''),

              phone_number: typeof data.client === 'object'
                ? data.client?.phone_number || ''
                : (data.phone_number || ''),
            };

            setLead(processedLead);

            // Initialize form data
            setFormData({
              // Lead fields
              status: processedLead?.status || 'New',
              insurance_type: processedLead?.insurance_type || 'Auto',
              current_carrier: processedLead?.current_carrier || '',
              premium: processedLead?.premium ? processedLead.premium.toString() : '',
              notes: processedLead?.notes || '',
              assigned_to: processedLead?.assigned_to || '',

              // Client fields (from joined client or legacy fields)
              client_name: processedLead?.client?.name || `${processedLead?.first_name || ''} ${processedLead?.last_name || ''}`.trim(),
              first_name: processedLead?.first_name || (processedLead?.client?.name ? processedLead.client.name.split(' ')[0] : ''),
              last_name: processedLead?.last_name || (processedLead?.client?.name ? processedLead.client.name.split(' ').slice(1).join(' ') : ''),
              email: processedLead?.client?.email || processedLead?.email || '',
              phone_number: processedLead?.client?.phone_number || processedLead?.phone_number || '',

              // Physical Address fields (from lead_details view)
              street_address: processedLead?.address_street || '',
              city: processedLead?.address_city || '',
              state: processedLead?.address_state || '',
              zip_code: processedLead?.address_zip_code || '',

              // Mailing Address fields (from lead_details view)
              mailing_street_address: processedLead?.mailing_address_street || '',
              mailing_city: processedLead?.mailing_address_city || '',
              mailing_state: processedLead?.mailing_address_state || '',
              mailing_zip_code: processedLead?.mailing_address_zip_code || '',

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
        } catch (joinError) {
          console.error('Error with all query attempts:', joinError);

          // If we're in development mode, use mock data
          if (isDev) {
            console.log('Using mock data in development mode due to query errors');
            setLead(mockLead);

            // Initialize form data with mock data
            setFormData({
              status: mockLead.status,
              insurance_type: mockLead.insurance_type,
              current_carrier: mockLead.current_carrier || '',
              premium: mockLead.premium ? mockLead.premium.toString() : '',
              notes: mockLead.notes || '',
              assigned_to: mockLead.assigned_to || '',
              first_name: mockLead.first_name,
              last_name: mockLead.last_name,
              email: mockLead.email,
              phone_number: mockLead.phone_number,
              street_address: mockLead.client?.address?.street || '',
              city: mockLead.client?.address?.city || '',
              state: mockLead.client?.address?.state || '',
              zip_code: mockLead.client?.address?.zip_code || '',
              date_of_birth: mockLead.client?.date_of_birth || '',
              gender: mockLead.client?.gender || '',
              marital_status: mockLead.client?.marital_status || '',
              drivers_license: mockLead.client?.drivers_license || '',
              license_state: mockLead.client?.license_state || '',
              education_occupation: '',
              referred_by: mockLead.client?.referred_by || '',
              client_name: mockLead.client?.name || `${mockLead.first_name} ${mockLead.last_name}`,
            });
          } else {
            setFetchError('Failed to load lead details. The database schema may not be properly set up.');
            toast({
              title: "Error",
              description: "Failed to load lead details. The database schema may not be properly set up.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error fetching lead:', error);

        // If we're in development mode, use mock data
        if (isDev) {
          console.log('Using mock data in development mode due to error');
          setLead(mockLead);

          // Initialize form data with mock data
          setFormData({
            status: mockLead.status,
            insurance_type: mockLead.insurance_type,
            current_carrier: mockLead.current_carrier || '',
            premium: mockLead.premium ? mockLead.premium.toString() : '',
            notes: mockLead.notes || '',
            assigned_to: mockLead.assigned_to || '',
            first_name: mockLead.first_name,
            last_name: mockLead.last_name,
            email: mockLead.email,
            phone_number: mockLead.phone_number,
            street_address: mockLead.client?.address?.street || '',
            city: mockLead.client?.address?.city || '',
            state: mockLead.client?.address?.state || '',
            zip_code: mockLead.client?.address?.zip_code || '',
            date_of_birth: mockLead.client?.date_of_birth || '',
            gender: mockLead.client?.gender || '',
            marital_status: mockLead.client?.marital_status || '',
            drivers_license: mockLead.client?.drivers_license || '',
            license_state: mockLead.client?.license_state || '',
            education_occupation: '',
            referred_by: mockLead.client?.referred_by || '',
            client_name: mockLead.client?.name || `${mockLead.first_name} ${mockLead.last_name}`,
          });
        } else {
          setFetchError('Failed to load lead details. Please try again later.');
          toast({
            title: "Error",
            description: "Failed to load lead details. Please try again later.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchLead();
    }
  }, [params.id, toast]);

  // Mock data for notes and communications
  const mockNotes = [
    {
      id: '1',
      lead_id: params?.id as string,
      note_content: 'Initial contact made. Client is interested in auto insurance.',
      created_by: 'Brian B',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
    },
    {
      id: '2',
      lead_id: params?.id as string,
      note_content: 'Followed up with client. Scheduled a call for next week.',
      created_by: 'Brian B',
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];

  const mockCommunications = [
    {
      id: '1',
      lead_id: params?.id as string,
      type: 'Email',
      direction: 'Outbound',
      content: 'Sent initial quote information.',
      created_by: 'Brian B',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
      id: '2',
      lead_id: params?.id as string,
      type: 'Call',
      direction: 'Inbound',
      content: 'Client called with questions about coverage options.',
      created_by: 'Brian B',
      created_at: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    }
  ];

  // Mock data for other insureds, vehicles, homes, and specialty items
  const mockOtherInsureds = [
    {
      id: '1',
      lead_id: params?.id as string,
      client_id: '123',
      first_name: 'Jane',
      last_name: 'User',
      relationship: 'Spouse',
      date_of_birth: '1992-05-15',
      gender: 'Female',
      drivers_license: 'DL67890',
      license_state: 'CA',
      marital_status: 'Married',
      education_occupation: 'Teacher',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    }
  ];

  const mockVehicles = [
    {
      id: '1',
      lead_id: params?.id as string,
      client_id: '123',
      year: '2020',
      make: 'Toyota',
      model: 'RAV4',
      vin: 'JTMWFREV2ND123456',
      usage: 'Commute',
      annual_mileage: '12000',
      ownership: 'Owned',
      primary_driver: 'Demo User',
      collision: true,
      comprehensive: true,
      gap_coverage: false,
      glass_coverage: true,
      rental_coverage: true,
      towing_coverage: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    }
  ];

  const mockHomes = [
    {
      id: '1',
      lead_id: params?.id as string,
      client_id: '123',
      address_street: '123 Main St',
      address_city: 'Anytown',
      address_state: 'CA',
      address_zip: '12345',
      year_built: '1995',
      square_feet: '2200',
      construction_type: 'Frame',
      roof_type: 'Composite Shingle',
      number_of_stories: '2',
      ownership_type: 'Owned',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    }
  ];

  const mockSpecialtyItems = [
    {
      id: '1',
      lead_id: params?.id as string,
      client_id: '123',
      type: 'Boat',
      year: '2018',
      make: 'Sea Ray',
      model: 'Sundancer 320',
      identification_number: 'BOAT123456789XYZ',
      value: '120000',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    }
  ];

  // Fetch lead notes and communications
  useEffect(() => {
    if (params?.id) {
      const isDev = process.env.NODE_ENV === 'development';

      const fetchNotes = async () => {
        try {
          // In development mode, use mock data if there are database issues
          if (isDev) {
            try {
              // First check if the lead_notes table exists
              try {
                const { data: tableCheck, error: tableError } = await supabase
                  .from('lead_notes')
                  .select('count')
                  .limit(1);

                if (tableError && tableError.code === '42P01') { // Table doesn't exist
                  console.log('lead_notes table does not exist yet, using mock data');
                  setNotes(mockNotes);
                  return;
                }
              } catch (tableCheckError) {
                console.error('Error checking lead_notes table:', tableCheckError);
              }

              const { data, error } = await supabase
                .from('lead_notes')
                .select('*')
                .eq('lead_id', params.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching notes:', error);
                // Use mock data in development mode
                console.log('Using mock notes data due to error');
                setNotes(mockNotes);
              } else {
                setNotes(data || []);
              }
            } catch (error) {
              console.error('Error fetching notes:', error);
              // Use mock data in development mode
              console.log('Using mock notes data due to error');
              setNotes(mockNotes);
            }
          } else {
            // Production mode - normal behavior
            try {
              // First check if the lead_notes table exists
              try {
                const { data: tableCheck, error: tableError } = await supabase
                  .from('lead_notes')
                  .select('count')
                  .limit(1);

                if (tableError && tableError.code === '42P01') { // Table doesn't exist
                  console.log('lead_notes table does not exist yet');
                  return;
                }
              } catch (tableCheckError) {
                console.error('Error checking lead_notes table:', tableCheckError);
              }

              const { data, error } = await supabase
                .from('lead_notes')
                .select('*')
                .eq('lead_id', params.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching notes:', error);
                // Don't show an error toast here, just log it
              } else {
                setNotes(data || []);
              }
            } catch (error) {
              console.error('Error fetching notes:', error);
              // Don't show an error toast here, just log it
            }
          }
        } catch (error) {
          console.error('Error in fetchNotes:', error);
        }
      };

      const fetchCommunications = async () => {
        try {
          // In development mode, use mock data if there are database issues
          if (isDev) {
            try {
              // First check if the lead_communications table exists
              try {
                const { data: tableCheck, error: tableError } = await supabase
                  .from('lead_communications')
                  .select('count')
                  .limit(1);

                if (tableError && tableError.code === '42P01') { // Table doesn't exist
                  console.log('lead_communications table does not exist yet, using mock data');
                  setCommunications(mockCommunications);
                  return;
                }
              } catch (tableCheckError) {
                console.error('Error checking lead_communications table:', tableCheckError);
              }

              const { data, error } = await supabase
                .from('lead_communications')
                .select('*')
                .eq('lead_id', params.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching communications:', error);
                // Use mock data in development mode
                console.log('Using mock communications data due to error');
                setCommunications(mockCommunications);
              } else {
                setCommunications(data || []);
              }
            } catch (error) {
              console.error('Error fetching communications:', error);
              // Use mock data in development mode
              console.log('Using mock communications data due to error');
              setCommunications(mockCommunications);
            }
          } else {
            // Production mode - normal behavior
            try {
              // First check if the lead_communications table exists
              try {
                const { data: tableCheck, error: tableError } = await supabase
                  .from('lead_communications')
                  .select('count')
                  .limit(1);

                if (tableError && tableError.code === '42P01') { // Table doesn't exist
                  console.log('lead_communications table does not exist yet');
                  return;
                }
              } catch (tableCheckError) {
                console.error('Error checking lead_communications table:', tableCheckError);
              }

              const { data, error } = await supabase
                .from('lead_communications')
                .select('*')
                .eq('lead_id', params.id)
                .order('created_at', { ascending: false });

              if (error) {
                console.error('Error fetching communications:', error);
                // Don't show an error toast here, just log it
              } else {
                setCommunications(data || []);
              }
            } catch (error) {
              console.error('Error fetching communications:', error);
              // Don't show an error toast here, just log it
            }
          }
        } catch (error) {
          console.error('Error in fetchCommunications:', error);
        }
      };

      const fetchOtherInsureds = async () => {
        // In development mode, use mock data by default
        if (isDev) {
          // Check if we should attempt to connect to the database
          const shouldTryDatabase = localStorage.getItem('crm_try_database') === 'true';

          if (!shouldTryDatabase) {
            console.log('Using mock other insureds data in development mode');
            setOtherInsureds(mockOtherInsureds);
            return;
          }
        }

        try {
          const { data, error } = await supabase
            .from('other_insureds')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            if (isDev) {
              console.log('Using mock other insureds data due to database error');
              setOtherInsureds(mockOtherInsureds);
            } else {
              console.error('Error fetching other insureds:', error);
              setOtherInsureds([]);
            }
          } else {
            setOtherInsureds(data || []);
          }
        } catch (err) {
          if (isDev) {
            console.log('Using mock other insureds data due to exception');
            setOtherInsureds(mockOtherInsureds);
          } else {
            console.error('Error fetching other insureds:', err);
            setOtherInsureds([]);
          }
        }
      };

      const fetchVehicles = async () => {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            // Handle the error gracefully
            console.error('Error fetching vehicles:', error);
            setVehicles([]);
          } else {
            setVehicles(data || []);
          }
        } catch (err) {
          console.error('Error fetching vehicles:', err);
          setVehicles([]);
        }
      };

      const fetchHomes = async () => {
        try {
          const { data, error } = await supabase
            .from('homes')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            // Handle the error gracefully
            console.error('Error fetching homes:', error);
            setHomes([]);
          } else {
            setHomes(data || []);
          }
        } catch (err) {
          console.error('Error fetching homes:', err);
          setHomes([]);
        }
      };

      const fetchSpecialtyItems = async () => {
        try {
          const { data, error } = await supabase
            .from('specialty_items')
            .select('*')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false });

          if (error) {
            // Handle the error gracefully
            console.error('Error fetching specialty items:', error);
            setSpecialtyItems([]);
          } else {
            setSpecialtyItems(data || []);
          }
        } catch (err) {
          console.error('Error fetching specialty items:', err);
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

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';

    try {
      // In development mode, use optimistic updates if there are database issues
      if (isDev) {
        try {
          // First check if the lead_notes table exists
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from('lead_notes')
              .select('count')
              .limit(1);

            if (tableError && tableError.code === '42P01') { // Table doesn't exist
              console.log('lead_notes table does not exist yet, using optimistic update');

              // Create a mock note
              const mockNote = {
                id: `mock-${Date.now()}`,
                lead_id: lead.id,
                note_content: newNote,
                created_by: 'Brian B',
                created_at: new Date().toISOString(),
              };

              // Add the note to the local state
              setNotes([mockNote, ...notes]);
              setNewNote('');

              toast({
                title: "Development Mode",
                description: "Note added locally (database tables don't exist yet).",
              });

              setIsSubmittingNote(false);
              return;
            }
          } catch (tableCheckError) {
            console.error('Error checking lead_notes table:', tableCheckError);
          }

          // Try to add the note
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

            // In development mode, use optimistic updates
            console.log('Using optimistic update in development mode due to error');

            // Create a mock note
            const mockNote = {
              id: `mock-${Date.now()}`,
              lead_id: lead.id,
              note_content: newNote,
              created_by: 'Brian B',
              created_at: new Date().toISOString(),
            };

            // Add the note to the local state
            setNotes([mockNote, ...notes]);
            setNewNote('');

            toast({
              title: "Development Mode",
              description: "Note added locally (database error occurred).",
            });
          } else if (data) {
            // Add the note to the local state
            const newNoteObj = {
              id: data[0].id,
              lead_id: lead.id,
              note_content: newNote,
              created_by: 'Brian B',
              created_at: new Date().toISOString(),
            };

            setNotes([newNoteObj, ...notes]);
            setNewNote('');

            toast({
              title: "Success",
              description: "Note added successfully.",
            });

            // Try to add to communications if that table exists
            try {
              // Check if communications table exists
              const { data: commTableCheck, error: commTableError } = await supabase
                .from('lead_communications')
                .select('count')
                .limit(1);

              if (commTableError && commTableError.code === '42P01') {
                console.log('lead_communications table does not exist yet');
                return;
              }

              // Add to communications
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
            } catch (commError) {
              console.error('Error with communications table:', commError);
            }
          }
        } catch (error) {
          console.error('Error adding note:', error);

          // In development mode, use optimistic updates
          console.log('Using optimistic update in development mode due to error');

          // Create a mock note
          const mockNote = {
            id: `mock-${Date.now()}`,
            lead_id: lead.id,
            note_content: newNote,
            created_by: 'Brian B',
            created_at: new Date().toISOString(),
          };

          // Add the note to the local state
          setNotes([mockNote, ...notes]);
          setNewNote('');

          toast({
            title: "Development Mode",
            description: "Note added locally (error occurred).",
          });
        }
      } else {
        // Production mode - normal behavior
        try {
          // First check if the lead_notes table exists
          try {
            const { data: tableCheck, error: tableError } = await supabase
              .from('lead_notes')
              .select('count')
              .limit(1);

            if (tableError && tableError.code === '42P01') { // Table doesn't exist
              toast({
                title: "Database Setup Required",
                description: "The lead_notes table doesn't exist yet. Please contact your administrator to set up the database schema.",
                variant: "destructive"
              });
              setIsSubmittingNote(false);
              return;
            }
          } catch (tableCheckError) {
            console.error('Error checking lead_notes table:', tableCheckError);
          }

          // Try to add the note
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

            if (error.code === '42P01') {
              toast({
                title: "Database Setup Required",
                description: "The lead_notes table doesn't exist yet. Please contact your administrator.",
                variant: "destructive"
              });
            } else if (error.code === '23503') { // Foreign key violation
              toast({
                title: "Error",
                description: "Failed to add note. The lead may not exist in the database.",
                variant: "destructive"
              });
            } else {
              toast({
                title: "Error",
                description: "Failed to add note. Please try again.",
                variant: "destructive"
              });
            }
          } else if (data) {
            // Add the note to the local state
            const newNoteObj = {
              id: data[0].id,
              lead_id: lead.id,
              note_content: newNote,
              created_by: 'Brian B',
              created_at: new Date().toISOString(),
            };

            setNotes([newNoteObj, ...notes]);
            setNewNote('');

            toast({
              title: "Success",
              description: "Note added successfully.",
            });

            // Try to add to communications if that table exists
            try {
              // Check if communications table exists
              const { data: commTableCheck, error: commTableError } = await supabase
                .from('lead_communications')
                .select('count')
                .limit(1);

              if (commTableError && commTableError.code === '42P01') {
                console.log('lead_communications table does not exist yet');
                return;
              }

              // Add to communications
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
            } catch (commError) {
              console.error('Error with communications table:', commError);
            }
          }
        } catch (error) {
          console.error('Error adding note:', error);
          toast({
            title: "Error",
            description: "Failed to add note. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error in handleAddNote:', error);
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

      // With the updated schema, leads don't have client_id anymore
      // We'll store contact information directly in the lead record
      console.log('Updating lead record:', {
        lead_id: lead.id,
        name: clientName,
        email: formData.email,
        phone_number: formData.phone_number
      });

      // Handle address update using the improved address-helpers functions
      console.log('DEBUG: Lead address information before update:', {
        leadId: lead.id,
        formData: {
          street: formData.street_address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code
        }
      });

      // Import the updateLeadAddress function
      const { updateLeadAddress } = await import('@/utils/address-helpers');

      // Check if we have physical address data to update
      if (formData.street_address || formData.city || formData.state || formData.zip_code) {
        console.log('DEBUG: Updating physical address information using updateLeadAddress helper');

        // Use the helper function to update the lead's physical address directly
        const { success, error } = await updateLeadAddress(
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
          console.error('DEBUG: Error updating physical address:', error);
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

      // With the updated schema, we don't need to update a client record
      // All contact information is stored directly in the lead record

      // Then update lead in Supabase with all information including contact details
      const { data, error } = await supabase
        .from('leads_ins_info')
        .update({
          status_id: statusId,
          insurance_type_id: insuranceTypeId,
          current_carrier: formData.current_carrier || null,
          premium: premium,
          notes: formData.notes || null,
          assigned_to: formData.assigned_to || null,
          // Add contact information directly to the lead
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) {
        console.error('Error updating lead:', error);
        throw error;
      }

      // Fetch the updated lead data from the lead_details view to get the latest address information
      const { data: updatedLeadData, error: fetchError } = await supabase
        .from('lead_details')
        .select('*')
        .eq('id', lead.id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated lead data:', fetchError);
        console.error('Error details:', fetchError.details);
        console.error('Error message:', fetchError.message);
        console.error('Error hint:', fetchError.hint);
        console.error('Error code:', fetchError.code);

        toast({
          title: "Warning",
          description: `Lead updated but couldn't refresh the latest data. Please refresh the page.`,
          variant: "default"
        });

        // Continue with the data we have from the update operation
        const { data: fallbackData, error: statusError } = await supabase
          .from('leads_ins_info')
          .select(`
            *,
            status:lead_statuses!inner(value),
            insurance_type:insurance_types!inner(name)
          `)
          .eq('id', lead.id)
          .single();

        if (statusError) {
          console.error('Error fetching fallback lead data:', statusError);
          toast({
            title: "Error",
            description: `Failed to update lead: ${statusError.message || 'Unknown error'}`,
            variant: "destructive"
          });
          return;
        }

        // Process the fallback data
        const processedLead: Lead = {
          ...fallbackData,
          // Map joined fields to their expected properties
          status: typeof fallbackData.status === 'object' && fallbackData.status?.value ? fallbackData.status.value : 'New',
          insurance_type: typeof fallbackData.insurance_type === 'object' && fallbackData.insurance_type?.name ? fallbackData.insurance_type.name : 'Auto',

          // Contact information is now directly on the lead
          first_name: fallbackData.first_name || '',
          last_name: fallbackData.last_name || '',
          email: fallbackData.email || '',
          phone_number: fallbackData.phone_number || '',

          // Ensure we have status_legacy and insurance_type_legacy for compatibility
          status_legacy: typeof fallbackData.status === 'object' && fallbackData.status?.value ? fallbackData.status.value : 'New',
          insurance_type_legacy: typeof fallbackData.insurance_type === 'object' && fallbackData.insurance_type?.name ? fallbackData.insurance_type.name : 'Auto'
        };

        setLead(processedLead);
        setIsEditing(false);

      } else if (updatedLeadData) {
        // Process the data from lead_details view before setting it
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

        setLead(processedLead);
        setIsEditing(false);

        // Create a more detailed success message
        let successMessage = "Lead updated successfully";

        // Add address information to the success message if address was updated
        if (formData.street_address || formData.city || formData.state || formData.zip_code) {
          successMessage = "Lead and physical address information updated successfully";

          // Log address update details for debugging
          console.log('DEBUG: Physical address information in success handler:', {
            street: formData.street_address,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            addressId: data.address_id
          });
        }

        // Add mailing address information to the success message if mailing address was updated
        if (formData.mailing_street_address || formData.mailing_city || formData.mailing_state || formData.mailing_zip_code) {
          successMessage = successMessage.includes("physical address")
            ? "Lead, physical address, and mailing address information updated successfully"
            : "Lead and mailing address information updated successfully";

          // Log mailing address update details for debugging
          console.log('DEBUG: Mailing address information in success handler:', {
            street: formData.mailing_street_address,
            city: formData.mailing_city,
            state: formData.mailing_state,
            zip_code: formData.mailing_zip_code
          });
        }

        toast({
          title: "Success",
          description: successMessage,
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
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Loading Lead Details</h2>
            <p className="text-gray-500">Please wait while we fetch the lead information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Error</h2>
            <p className="text-gray-600 mb-6">{fetchError}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/dashboard/leads')}
                variant="outline"
                className="border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                Back to Leads
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="gradient"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center max-w-md">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
            <p className="text-gray-600 mb-6">The lead you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button
              onClick={() => router.push('/dashboard/leads')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              Back to Leads
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Development Mode Banner */}
      <DevelopmentModeBanner
        message="Connected to Supabase database. Some tables may be missing or have permission issues."
        onRefresh={() => window.location.reload()}
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/leads')}
            className="border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </div>
      </div>

      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {lead.first_name ? lead.first_name.charAt(0).toUpperCase() :
               lead.client?.name ? lead.client.name.charAt(0).toUpperCase() : ''}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {lead.first_name || (lead.client?.name ? lead.client.name : '')}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-gray-500">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {lead.email || 'No email'}
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {lead.phone_number || 'No phone'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/leads')}
              className="border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
            <Button
              variant={isEditing ? "outline" : "outline"}
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
                variant="gradient"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-5 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="basic"
            className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Basic Information
          </TabsTrigger>
          <TabsTrigger
            value="client"
            className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Client Details
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="text-gray-700 rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all duration-200"
          >
            Insurance Details
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

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Lead Information</CardTitle>
              <CardDescription className="text-gray-500">Basic details about this lead</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
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
                  {/* Physical Address */}
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

                  {/* Mailing Address */}
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
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Name</Label>
                    <div className="font-medium text-gray-900">
                      {lead.first_name && lead.last_name ?
                        `${lead.first_name} ${lead.last_name}` :
                        lead.client?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Email</Label>
                    <div className="text-gray-700">{lead.email || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Phone</Label>
                    <div className="text-gray-700">{lead.phone_number || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Insurance Type</Label>
                    <div className="text-gray-700">
                      {typeof lead.insurance_type === 'string'
                        ? lead.insurance_type
                        : (lead.insurance_type as any)?.name || 'Auto'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Current Carrier</Label>
                    <div className="text-gray-700">{lead.current_carrier || 'None'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Premium</Label>
                    <div className="text-gray-700 font-medium">
                      ${lead.premium
                        ? lead.premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Status</Label>
                    <div className="text-gray-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusStyles(
                        typeof lead.status === 'string' ? lead.status : (lead.status as any)?.value || 'New',
                        'badge'
                      )}`}>
                        {typeof lead.status === 'string'
                          ? lead.status
                          : (lead.status as any)?.value || 'New'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Assigned To</Label>
                    <div className="text-gray-700">
                      {lead.assigned_to ? (
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm mr-2">
                            {lead.assigned_to.charAt(0).toUpperCase()}
                          </div>
                          <span>{lead.assigned_to}</span>
                        </div>
                      ) : (
                        'Unassigned'
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Physical Address</Label>
                    <div className="text-gray-700">
                      {lead.address_street ? (
                        <>
                          {lead.address_street}<br />
                          {lead.address_city}{lead.address_city && lead.address_state ? ', ' : ''}{lead.address_state} {lead.address_zip_code}
                        </>
                      ) : (
                        'No address'
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Mailing Address</Label>
                    <div className="text-gray-700">
                      {lead.mailing_address_street ? (
                        <>
                          {lead.mailing_address_street}<br />
                          {lead.mailing_address_city}{lead.mailing_address_city && lead.mailing_address_state ? ', ' : ''}{lead.mailing_address_state} {lead.mailing_address_zip_code}
                        </>
                      ) : (
                        'Same as physical address'
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Date of Birth</Label>
                    <div className="text-gray-700">{lead.client?.date_of_birth ? formatDateMMDDYYYY(lead.client.date_of_birth) : 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Gender</Label>
                    <div className="text-gray-700">{lead.client?.gender || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Marital Status</Label>
                    <div className="text-gray-700">{lead.client?.marital_status || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Driver's License</Label>
                    <div className="text-gray-700">{lead.client?.drivers_license || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">License State</Label>
                    <div className="text-gray-700">{lead.client?.license_state || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Referred By</Label>
                    <div className="text-gray-700">{lead.client?.referred_by || 'N/A'}</div>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Label className="text-xs font-medium text-gray-500 mb-1 block">Notes</Label>
                    <div className="text-gray-700 whitespace-pre-wrap">{lead.notes || 'No notes'}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Details Tab */}
        <TabsContent value="client" className="space-y-6 mt-6">
          {lead && lead.client_id ? (
            <ClientDetails clientId={lead.client_id} />
          ) : (
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-900">Client Information</CardTitle>
                <CardDescription className="text-gray-500">Client details not available</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Client Associated</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    This lead does not have an associated client record. Update the lead to associate it with a client.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insurance Details Tab */}
        <TabsContent value="insurance" className="space-y-4 mt-4">
          {/* Auto Insurance Details Section */}
          {lead.auto_data && (
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
                <CardTitle className="text-lg font-medium">Auto Insurance Details</CardTitle>
                <CardDescription className="text-sm">Details about auto insurance coverage</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Drivers Section */}
                {lead.auto_data.drivers && lead.auto_data.drivers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-3">Drivers</h3>
                    <div className="space-y-4">
                      {lead.auto_data.drivers.map((driver: any, index: number) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicles Section */}
                {lead.auto_data.vehicles && lead.auto_data.vehicles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-3">Vehicles</h3>
                    <div className="space-y-4">
                      {lead.auto_data.vehicles.map((vehicle: any, index: number) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coverages Section */}
                {lead.auto_data.coverages && (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Coverage Details</h3>
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Home Insurance Details Section */}
          {lead.home_data && (
            <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
                <CardTitle className="text-lg font-medium">Home Insurance Details</CardTitle>
                <CardDescription className="text-sm">Details about home insurance coverage</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {lead.home_data.year_built && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Label className="text-xs font-medium text-muted-foreground">Year Built</Label>
                      <div>{lead.home_data.year_built}</div>
                    </div>
                  )}
                  {lead.home_data.square_feet && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Label className="text-xs font-medium text-muted-foreground">Square Feet</Label>
                      <div>{lead.home_data.square_feet}</div>
                    </div>
                  )}
                  {lead.home_data.roof_type && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Label className="text-xs font-medium text-muted-foreground">Roof Type</Label>
                      <div>{lead.home_data.roof_type}</div>
                    </div>
                  )}
                  {lead.home_data.construction_type && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <Label className="text-xs font-medium text-muted-foreground">Construction Type</Label>
                      <div>{lead.home_data.construction_type}</div>
                    </div>
                  )}
                </div>

                {/* Coverage Information */}
                {lead.home_data.coverages && (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Coverage Details</h3>
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
        <TabsContent value="communications" className="space-y-6 mt-6">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Add Note</CardTitle>
              <CardDescription className="text-gray-500">Add a note about this lead</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your note here..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={isSubmittingNote || !newNote.trim()}
                  variant="gradient"
                  className="w-full sm:w-auto"
                >
                  {isSubmittingNote ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Note
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Communication History</CardTitle>
              <CardDescription className="text-gray-500">All interactions with this lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {[...notes, ...communications].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              ).map((item, index) => (
                <Card key={index} className="bg-gray-50 border border-gray-100 overflow-hidden">
                  <div className={`h-1 w-full ${item.type === 'Email' ? 'bg-blue-500' : item.type === 'Call' ? 'bg-green-500' : item.type === 'SMS' ? 'bg-purple-500' : 'bg-gray-500'}`}></div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {item.type === 'Email' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : item.type === 'Call' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : item.type === 'SMS' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          )}
                          {item.type || 'Note'} {item.direction ? `(${item.direction})` : ''}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTimeMMDDYYYY(item.created_at)}
                        </div>
                      </div>
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                        {item.created_by || 'System'}
                      </div>
                    </div>
                    <div className="mt-3 text-gray-700 border-t border-gray-100 pt-3 whitespace-pre-wrap">
                      {item.note_content || item.content}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {notes.length === 0 && communications.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Communication History</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    There are no notes or communications with this lead yet. Add a note to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Marketing Automation Tab */}
        <TabsContent value="marketing" className="space-y-6 mt-6">
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Marketing Campaigns</CardTitle>
              <CardDescription className="text-gray-500">
                Enable or disable marketing campaigns for this lead
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Marketing automation features are currently in development and will be available soon.
                </p>
                <Button variant="outline" className="border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                  Join Waitlist
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
