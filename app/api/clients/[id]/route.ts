import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Retrieve a client by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { id } = params;

    // Get client with address information
    const { data, error } = await supabase
      .from('leads_contact_info')
      .select(`
        *,
        address:address_id(*),
        mailing_address:mailing_address_id(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return NextResponse.json({
        error: 'Failed to fetch client'
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Client not found'
      }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in get client API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// PATCH - Update a client
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { id } = params;
    const body = await request.json();

    // First, check if client exists
    const { data: existingClient, error: checkError } = await supabase
      .from('leads_contact_info')
      .select('id, address_id, mailing_address_id')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking existing client:', checkError);
      return NextResponse.json({
        error: 'Failed to check if client exists'
      }, { status: 500 });
    }

    if (!existingClient) {
      return NextResponse.json({
        error: 'Client not found'
      }, { status: 404 });
    }

    // Handle address updates
    let addressId = existingClient.address_id;
    if (body.address) {
      if (addressId) {
        // Update existing address
        const { error: addressError } = await supabase
          .from('addresses')
          .update({
            street: body.address.street,
            city: body.address.city,
            state: body.address.state,
            zip_code: body.address.zip_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', addressId);

        if (addressError) {
          console.error('Error updating address:', addressError);
          return NextResponse.json({
            error: 'Failed to update address'
          }, { status: 500 });
        }
      } else {
        // Create new address
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert({
            street: body.address.street,
            city: body.address.city,
            state: body.address.state,
            zip_code: body.address.zip_code,
            type: 'Physical',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (addressError) {
          console.error('Error creating address:', addressError);
          return NextResponse.json({
            error: 'Failed to create address'
          }, { status: 500 });
        }

        addressId = newAddress.id;
      }
    }

    // Handle mailing address updates
    let mailingAddressId = existingClient.mailing_address_id;
    if (body.mailing_address) {
      if (mailingAddressId) {
        // Update existing mailing address
        const { error: mailingAddressError } = await supabase
          .from('addresses')
          .update({
            street: body.mailing_address.street,
            city: body.mailing_address.city,
            state: body.mailing_address.state,
            zip_code: body.mailing_address.zip_code,
            updated_at: new Date().toISOString()
          })
          .eq('id', mailingAddressId);

        if (mailingAddressError) {
          console.error('Error updating mailing address:', mailingAddressError);
          return NextResponse.json({
            error: 'Failed to update mailing address'
          }, { status: 500 });
        }
      } else {
        // Create new mailing address
        const { data: newMailingAddress, error: mailingAddressError } = await supabase
          .from('addresses')
          .insert({
            street: body.mailing_address.street,
            city: body.mailing_address.city,
            state: body.mailing_address.state,
            zip_code: body.mailing_address.zip_code,
            type: 'Mailing',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (mailingAddressError) {
          console.error('Error creating mailing address:', mailingAddressError);
          return NextResponse.json({
            error: 'Failed to create mailing address'
          }, { status: 500 });
        }

        mailingAddressId = newMailingAddress.id;
      }
    }

    // Update client with new address IDs if needed
    const clientUpdateData = {
      ...body,
      address_id: addressId,
      mailing_address_id: mailingAddressId,
      updated_at: new Date().toISOString()
    };

    // Remove nested address objects as they're not in the clients table
    delete clientUpdateData.address;
    delete clientUpdateData.mailing_address;

    // Update the client
    const { data, error } = await supabase
      .from('leads_contact_info')
      .update(clientUpdateData)
      .eq('id', id)
      .select(`
        *,
        address:address_id(*),
        mailing_address:mailing_address_id(*)
      `)
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({
        error: 'Failed to update client'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error in update client API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
