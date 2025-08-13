import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Try to get a list of tables by querying information_schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')
      .select();

    if (tablesError) {
      // Fallback: try to query specific tables to see which ones exist
      const tablesToCheck = [
        'leads_ins_info',
        'leads_contact_info', 
        'pipelines',
        'pipeline_statuses',
        'addresses',
        'insurance_types',
        'lead_statuses'
      ];

      const tableStatus = {};
      
      for (const tableName of tablesToCheck) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          tableStatus[tableName] = error ? `Error: ${error.message}` : 'Exists';
        } catch (err) {
          tableStatus[tableName] = `Error: ${err.message}`;
        }
      }

      return NextResponse.json({
        message: 'Could not get table list via RPC, checked individual tables',
        tableStatus,
        tablesError: tablesError.message
      });
    }

    return NextResponse.json({
      message: 'Database tables retrieved successfully',
      tables
    });

  } catch (error) {
    console.error('Error checking database tables:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check database tables',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
