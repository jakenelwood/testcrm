'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import AddressForm from '@/components/forms/address-form';
import { Client } from '@/types/client';
import { createClient } from '@/utils/supabase/client';

interface ClientDetailsProps {
  clientId: string;
}

export default function ClientDetails({ clientId }: ClientDetailsProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingMailingAddress, setEditingMailingAddress] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch client data
  const fetchClient = async () => {
    setLoading(true);
    try {
      // Check if we're in development mode
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev) {
        console.log('Development mode: Using mock client data');
        // Create mock client data
        const mockClient = {
          id: clientId,
          name: 'Brian Berge',
          client_type: 'Individual',
          email: 'brian@example.com',
          phone_number: '555-123-4567',
          address: {
            id: 'mock-address-1',
            street: '123 Main St',
            city: 'Minneapolis',
            state: 'MN',
            zip_code: '55401',
            type: 'Physical'
          },
          mailing_address: {
            id: 'mock-address-2',
            street: '456 Market St',
            city: 'St. Paul',
            state: 'MN',
            zip_code: '55102',
            type: 'Mailing'
          },
          date_of_birth: '1985-06-15',
          gender: 'Male',
          marital_status: 'Married'
        };

        setClient(mockClient);
        setLoading(false);
        return;
      }

      // Production mode - try to fetch from database
      const { data, error } = await supabase
        .from('leads_contact_info')
        .select(`
          *,
          address:address_id(*),
          mailing_address:mailing_address_id(*)
        `)
        .eq('id', clientId)
        .single();

      if (error) {
        throw error;
      }

      setClient(data);
    } catch (error: any) {
      console.error('Error fetching client:', error);

      // Check if we're in development mode for fallback
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log('Development mode: Using fallback mock client data after error');
        // Create mock client data as fallback
        const mockClient = {
          id: clientId,
          name: 'Brian Berge',
          client_type: 'Individual',
          email: 'brian@example.com',
          phone_number: '555-123-4567',
          address: {
            id: 'mock-address-1',
            street: '123 Main St',
            city: 'Minneapolis',
            state: 'MN',
            zip_code: '55401',
            type: 'Physical'
          },
          mailing_address: null,
          date_of_birth: '1985-06-15',
          gender: 'Male',
          marital_status: 'Married'
        };

        setClient(mockClient);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load client information',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const handleAddressSuccess = () => {
    setEditingAddress(false);
    setEditingMailingAddress(false);
    fetchClient(); // Refresh client data
  };

  if (loading) {
    return <div className="p-4">Loading client information...</div>;
  }

  if (!client) {
    return <div className="p-4">Client not found</div>;
  }

  return (
    <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="info">Client Info</TabsTrigger>
        <TabsTrigger value="address">Addresses</TabsTrigger>
      </TabsList>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p>{client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p>{client.client_type}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p>{client.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p>{client.phone_number || 'Not provided'}</p>
              </div>
              {client.client_type === 'Individual' && (
                <>
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p>{client.date_of_birth || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p>{client.gender || 'Not provided'}</p>
                  </div>
                </>
              )}
              {client.client_type === 'Business' && (
                <>
                  <div>
                    <p className="text-sm font-medium">Business Type</p>
                    <p>{client.business_type || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p>{client.industry || 'Not provided'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Physical Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Physical Address</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAddress(!editingAddress)}
                >
                  {editingAddress ? 'Cancel' : 'Edit'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingAddress ? (
                <AddressForm
                  clientId={clientId}
                  addressType="address"
                  initialData={client.address || {}}
                  onSuccess={handleAddressSuccess}
                />
              ) : (
                <div>
                  {client.address ? (
                    <div className="space-y-1">
                      <p>{client.address.street || ''}</p>
                      <p>
                        {[
                          client.address.city,
                          client.address.state,
                          client.address.zip_code
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No address provided</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mailing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Mailing Address</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMailingAddress(!editingMailingAddress)}
                >
                  {editingMailingAddress ? 'Cancel' : 'Edit'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingMailingAddress ? (
                <AddressForm
                  clientId={clientId}
                  addressType="mailing_address"
                  initialData={client.mailing_address || {}}
                  onSuccess={handleAddressSuccess}
                />
              ) : (
                <div>
                  {client.mailing_address ? (
                    <div className="space-y-1">
                      <p>{client.mailing_address.street || ''}</p>
                      <p>
                        {[
                          client.mailing_address.city,
                          client.mailing_address.state,
                          client.mailing_address.zip_code
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Same as physical address</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
