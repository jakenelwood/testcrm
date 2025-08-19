import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  driverNumber?: number;
  fieldType?: 'primary' | 'driver' | 'general';
}

interface DriverData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  drivers_license?: string;
  license_state?: string;
  education?: string;
  occupation?: string;
  relation_to_primary?: string;
  sr22?: boolean;
  military?: boolean;
}

// Improved CSV parsing function that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Helper function to process driver data from row
function processDriverData(row: string[], fieldMapping: { [index: number]: string }): {
  primaryDriver: any;
  additionalDrivers: DriverData[];
} {
  const primaryDriver: any = {};
  const driversByNumber: { [driverNumber: number]: DriverData } = {};

  // Process all mapped fields
  Object.entries(fieldMapping).forEach(([columnIndex, crmField]) => {
    const value = row[parseInt(columnIndex)]?.trim();
    if (!value) return;

    // Check if this is a driver field
    const driverMatch = crmField.match(/^driver_(\d+)_(.+)$/);
    if (driverMatch && driverMatch[1] && driverMatch[2]) {
      const driverNumber = parseInt(driverMatch[1]);
      const fieldName = driverMatch[2];

      if (!driversByNumber[driverNumber]) {
        driversByNumber[driverNumber] = {};
      }

      // Convert boolean fields
      if (fieldName === 'sr22' || fieldName === 'military') {
        (driversByNumber[driverNumber] as any)[fieldName] =
          value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1';
      } else {
        (driversByNumber[driverNumber] as any)[fieldName] = value;
      }
    } else {
      // Primary driver or general field
      if (crmField === 'sr22' || crmField === 'military') {
        primaryDriver[crmField] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1';
      } else {
        primaryDriver[crmField] = value;
      }
    }
  });

  // Convert drivers object to array, filtering out incomplete drivers
  const additionalDrivers = Object.entries(driversByNumber)
    .map(([driverNum, driverData]) => driverData)
    .filter(driver => driver.first_name || driver.last_name); // Only include drivers with at least a name

  return { primaryDriver, additionalDrivers };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pipelineId = parseInt(formData.get('pipelineId') as string);
    const columnMappingsStr = formData.get('columnMappings') as string;
    const leadSource = formData.get('leadSource') as string;
    const importFileName = formData.get('importFileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!pipelineId) {
      return NextResponse.json({ error: 'No pipeline ID provided' }, { status: 400 });
    }

    if (!leadSource || !leadSource.trim()) {
      return NextResponse.json({ error: 'Lead source is required' }, { status: 400 });
    }

    let columnMappings: ColumnMapping[] = [];
    try {
      columnMappings = JSON.parse(columnMappingsStr);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid column mappings' }, { status: 400 });
    }

    // Read and parse CSV file with proper CSV parsing
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]!).map(h => h.replace(/"/g, ''));
    const dataRows = lines.slice(1);

    // Create mapping from CSV column index to CRM field
    const fieldMapping: { [index: number]: string } = {};
    columnMappings.forEach(mapping => {
      const columnIndex = headers.indexOf(mapping.csvColumn);
      if (columnIndex !== -1 && mapping.crmField && mapping.crmField !== 'skip') {
        fieldMapping[columnIndex] = mapping.crmField;
      }
    });

    // Get pipeline status and insurance type in parallel for better performance
    const [pipelineStatusResult, insuranceTypeResult] = await Promise.all([
      supabase
        .from('pipeline_statuses')
        .select('id, name')
        .eq('pipeline_id', pipelineId)
        .order('display_order')
        .limit(1),
      supabase
        .from('insurance_types')
        .select('id, name')
        .eq('name', 'Auto')
        .limit(1)
    ]);

    if (pipelineStatusResult.error || !pipelineStatusResult.data || pipelineStatusResult.data.length === 0) {
      return NextResponse.json({ error: 'Could not find pipeline statuses' }, { status: 400 });
    }

    const defaultStatusId = pipelineStatusResult.data[0]!.id;
    const defaultInsuranceTypeId = insuranceTypeResult.data?.[0]?.id || 1;



    // Process each row and create leads
    const leads: any[] = [];
    const errors: string[] = [];

    // Pre-compile regex for better performance
    const numericRegex = /[^0-9.-]/g;

    for (let i = 0; i < dataRows.length; i++) {
      const row = parseCSVLine(dataRows[i]!).map(cell => cell.replace(/"/g, ''));

      // Process driver data from the row
      const { primaryDriver, additionalDrivers } = processDriverData(row, fieldMapping);

      const leadData: any = {
        pipeline_id: pipelineId,
        status_id: defaultStatusId,
        insurance_type_id: defaultInsuranceTypeId,
        source: leadSource.trim(),
        import_file_name: importFileName.trim() || file.name,
        ...primaryDriver, // Spread primary driver data
      };

      // Add additional drivers to JSONB field if any exist
      if (additionalDrivers.length > 0) {
        leadData.additional_insureds = additionalDrivers;
      }

      // Validate required fields - at least first name or last name is required
      if (!leadData.first_name && !leadData.last_name) {
        errors.push(`Row ${i + 2}: Missing both first name and last name`);
        continue;
      }

      // Set default values for required fields
      if (!leadData.first_name) leadData.first_name = '';
      if (!leadData.last_name) leadData.last_name = '';

      // Helper function to process numeric fields efficiently
      const processNumericField = (fieldName: string) => {
        if (leadData[fieldName]) {
          const numericValue = parseFloat(leadData[fieldName].replace(numericRegex, ''));
          if (!isNaN(numericValue)) {
            leadData[fieldName] = numericValue;
          } else {
            delete leadData[fieldName];
          }
        }
      };

      // Process all numeric fields
      ['premium', 'auto_premium', 'home_premium', 'specialty_premium'].forEach(processNumericField);

      leads.push(leadData);
    }

    if (leads.length === 0) {
      return NextResponse.json({
        error: 'No valid leads found in CSV',
        errors
      }, { status: 400 });
    }

    // Create leads directly in leads table
    const { data: createdLeads, error: leadError } = await supabase
      .from('leads')
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
