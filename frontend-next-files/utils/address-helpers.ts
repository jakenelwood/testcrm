import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Updates or creates an address in the database
 * @param supabase Supabase client
 * @param addressData Address data to update or create
 * @param existingAddressId Optional existing address ID to update
 * @returns The address ID and any error
 */
export async function updateOrCreateAddress(
  supabase: SupabaseClient,
  addressData: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    type?: string;
  },
  existingAddressId?: string
): Promise<{ addressId: string | null; error: any }> {
  try {
    // If no address data provided, return existing ID or null
    if (!addressData || (!addressData.street && !addressData.city && !addressData.state && !addressData.zip_code)) {
      return { addressId: existingAddressId || null, error: null };
    }

    // If we have an existing address ID, update it
    if (existingAddressId) {
      const { error } = await supabase
        .from('addresses')
        .update({
          street: addressData.street || null,
          city: addressData.city || null,
          state: addressData.state || null,
          zip_code: addressData.zip_code || null,
          type: addressData.type || 'Physical',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAddressId);

      if (error) {
        console.error('Error updating address:', error);
        return { addressId: existingAddressId, error };
      }

      return { addressId: existingAddressId, error: null };
    }

    // Otherwise, create a new address
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        street: addressData.street || null,
        city: addressData.city || null,
        state: addressData.state || null,
        zip_code: addressData.zip_code || null,
        type: addressData.type || 'Physical',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return { addressId: null, error };
    }

    return { addressId: data.id, error: null };
  } catch (error) {
    console.error('Error in updateOrCreateAddress:', error);
    return { addressId: null, error };
  }
}

/**
 * Updates a client's address information
 * @param supabase Supabase client
 * @param clientId Client ID
 * @param addressData Address data
 * @param addressType Type of address ('address' or 'mailing_address')
 * @returns Success status and any error
 */
export async function updateClientAddress(
  supabase: SupabaseClient,
  clientId: string,
  addressData: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  },
  addressType: 'address' | 'mailing_address' = 'address'
): Promise<{ success: boolean; error: any }> {
  try {
    // First, get the client to check if they have an existing address
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`id, address_id, mailing_address_id`)
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return { success: false, error: clientError };
    }

    // Determine which address ID to use
    const existingAddressId = addressType === 'address' 
      ? client.address_id 
      : client.mailing_address_id;
    
    // Update or create the address
    const { addressId, error: addressError } = await updateOrCreateAddress(
      supabase,
      {
        ...addressData,
        type: addressType === 'address' ? 'Physical' : 'Mailing'
      },
      existingAddressId
    );

    if (addressError) {
      return { success: false, error: addressError };
    }

    // Update the client with the new address ID
    const updateField = addressType === 'address' ? 'address_id' : 'mailing_address_id';
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        [updateField]: addressId,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client with address ID:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateClientAddress:', error);
    return { success: false, error };
  }
}
