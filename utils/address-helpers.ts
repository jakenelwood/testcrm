import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Entity type for address updates
 */
export type EntityType = 'lead' | 'client';

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
    console.log('DEBUG: updateOrCreateAddress called with:', {
      addressData,
      existingAddressId
    });

    // If no address data provided, return existing ID or null
    if (!addressData || (!addressData.street && !addressData.city && !addressData.state && !addressData.zip_code)) {
      console.log('DEBUG: No address data provided, returning existing ID:', existingAddressId);
      return { addressId: existingAddressId || null, error: null };
    }

    // If we have an existing address ID, update it
    if (existingAddressId) {
      console.log('DEBUG: Checking if address exists with ID:', existingAddressId);
      // First, check if the address exists and is valid
      const { data: existingAddress, error: checkError } = await supabase
        .from('addresses')
        .select('id')
        .eq('id', existingAddressId)
        .single();

      // If the address doesn't exist or there's an error, create a new one instead
      if (checkError || !existingAddress) {
        console.warn('Address ID exists but address record not found. Creating new address.');
        console.log('DEBUG: Address check error:', checkError);
        // Skip to the create address code below
      } else {
        console.log('DEBUG: Address exists, updating it with data:', addressData);
        // Address exists, update it
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
          console.error('Address update error details:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
          return { addressId: existingAddressId, error };
        }

        console.log('DEBUG: Address updated successfully with ID:', existingAddressId);
        return { addressId: existingAddressId, error: null };
      }
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
 * Updates an entity's address information (works for both leads and clients)
 * @param supabase Supabase client
 * @param entityId Entity ID (lead or client ID)
 * @param entityType Type of entity ('lead' or 'client')
 * @param addressData Address data
 * @param addressType Type of address ('address' or 'mailing_address')
 * @returns Success status and any error
 */
export async function updateEntityAddress(
  supabase: SupabaseClient,
  entityId: string,
  entityType: EntityType,
  addressData: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  },
  addressType: 'address' | 'mailing_address' = 'address'
): Promise<{ success: boolean; error: any }> {
  try {
    console.log(`DEBUG: updateEntityAddress called for ${entityType}:`, {
      entityId,
      addressData,
      addressType
    });

    // First, get the entity to check if they have an existing address
    console.log(`DEBUG: Fetching ${entityType} with ID:`, entityId);
    const { data: entity, error: entityError } = await supabase
      .from(entityType === 'lead' ? 'leads_ins_info' : 'leads_contact_info')
      .select(`id, address_id, mailing_address_id`)
      .eq('id', entityId)
      .single();

    if (entityError) {
      console.error(`Error fetching ${entityType}:`, entityError);
      console.error(`${entityType} error details:`, {
        code: entityError.code,
        message: entityError.message,
        details: entityError.details
      });
      return { success: false, error: entityError };
    }

    console.log(`DEBUG: ${entityType} data retrieved:`, entity);

    // Determine which address ID to use
    const existingAddressId = addressType === 'address'
      ? entity.address_id
      : entity.mailing_address_id;

    console.log('DEBUG: Using existing address ID:', existingAddressId);

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

    // Update the entity with the new address ID
    const updateField = addressType === 'address' ? 'address_id' : 'mailing_address_id';
    const { error: updateError } = await supabase
      .from(entityType === 'lead' ? 'leads_ins_info' : 'leads_contact_info')
      .update({
        [updateField]: addressId,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId);

    if (updateError) {
      console.error(`Error updating ${entityType} with address ID:`, updateError);
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error in updateEntityAddress for ${entityType}:`, error);
    return { success: false, error };
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
  return updateEntityAddress(supabase, clientId, 'client', addressData, addressType);
}

/**
 * Updates a lead's address information
 * @param supabase Supabase client
 * @param leadId Lead ID
 * @param addressData Address data
 * @param addressType Type of address ('address' or 'mailing_address')
 * @returns Success status and any error
 */
export async function updateLeadAddress(
  supabase: SupabaseClient,
  leadId: string,
  addressData: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  },
  addressType: 'address' | 'mailing_address' = 'address'
): Promise<{ success: boolean; error: any }> {
  return updateEntityAddress(supabase, leadId, 'lead', addressData, addressType);
}
