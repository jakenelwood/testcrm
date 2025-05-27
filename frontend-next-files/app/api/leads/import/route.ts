import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q',
      {
        cookies: {
          get: (name: string) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name: string, value: string, options: any) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pipelineId = parseInt(formData.get('pipelineId') as string);
    const columnMappingsStr = formData.get('columnMappings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!pipelineId) {
      return NextResponse.json({ error: 'No pipeline ID provided' }, { status: 400 });
    }

    let columnMappings: ColumnMapping[] = [];
    try {
      columnMappings = JSON.parse(columnMappingsStr);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid column mappings' }, { status: 400 });
    }

    // Read and parse CSV file
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    // Create mapping from CSV column index to CRM field
    const fieldMapping: { [index: number]: string } = {};
    columnMappings.forEach(mapping => {
      const columnIndex = headers.indexOf(mapping.csvColumn);
      if (columnIndex !== -1 && mapping.crmField && mapping.crmField !== 'skip') {
        fieldMapping[columnIndex] = mapping.crmField;
      }
    });

    // Get the default status for the pipeline
    const { data: pipelineStatuses, error: statusError } = await supabase
      .from('pipeline_statuses')
      .select('id, name')
      .eq('pipeline_id', pipelineId)
      .order('display_order')
      .limit(1);

    if (statusError || !pipelineStatuses || pipelineStatuses.length === 0) {
      return NextResponse.json({ error: 'Could not find pipeline statuses' }, { status: 400 });
    }

    const defaultStatusId = pipelineStatuses[0].id;

    // Get default insurance type (Auto)
    const { data: insuranceTypes, error: insuranceError } = await supabase
      .from('insurance_types')
      .select('id, name')
      .eq('name', 'Auto')
      .limit(1);

    const defaultInsuranceTypeId = insuranceTypes?.[0]?.id || 1;

    // Process each row and create leads
    const leads = [];
    const errors = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
      const leadData: any = {
        pipeline_id: pipelineId,
        status_id: defaultStatusId,
        insurance_type_id: defaultInsuranceTypeId,
      };

      // Map CSV data to CRM fields
      Object.entries(fieldMapping).forEach(([columnIndex, crmField]) => {
        const value = row[parseInt(columnIndex)]?.trim();
        if (value) {
          leadData[crmField] = value;
        }
      });

      // Validate required fields - at least first name or last name is required
      if (!leadData.first_name && !leadData.last_name) {
        errors.push(`Row ${i + 2}: Missing both first name and last name`);
        continue;
      }

      // Set default values for required fields
      if (!leadData.first_name) leadData.first_name = '';
      if (!leadData.last_name) leadData.last_name = '';

      // Handle numeric fields
      if (leadData.premium) {
        const premiumValue = parseFloat(leadData.premium.replace(/[^0-9.-]/g, ''));
        if (!isNaN(premiumValue)) {
          leadData.premium = premiumValue;
        } else {
          delete leadData.premium;
        }
      }

      if (leadData.auto_premium) {
        const autoPremiumValue = parseFloat(leadData.auto_premium.replace(/[^0-9.-]/g, ''));
        if (!isNaN(autoPremiumValue)) {
          leadData.auto_premium = autoPremiumValue;
        } else {
          delete leadData.auto_premium;
        }
      }

      if (leadData.home_premium) {
        const homePremiumValue = parseFloat(leadData.home_premium.replace(/[^0-9.-]/g, ''));
        if (!isNaN(homePremiumValue)) {
          leadData.home_premium = homePremiumValue;
        } else {
          delete leadData.home_premium;
        }
      }

      if (leadData.specialty_premium) {
        const specialtyPremiumValue = parseFloat(leadData.specialty_premium.replace(/[^0-9.-]/g, ''));
        if (!isNaN(specialtyPremiumValue)) {
          leadData.specialty_premium = specialtyPremiumValue;
        } else {
          delete leadData.specialty_premium;
        }
      }

      leads.push(leadData);
    }

    if (leads.length === 0) {
      return NextResponse.json({
        error: 'No valid leads found in CSV',
        errors
      }, { status: 400 });
    }

    // Create leads directly in leads_ins_info table
    const { data: createdLeads, error: leadError } = await supabase
      .from('leads_ins_info')
      .insert(leads)
      .select('id');

    if (leadError) {
      console.error('Error creating leads:', leadError);
      return NextResponse.json({
        error: 'Failed to create leads',
        details: leadError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      importedCount: createdLeads.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
