#!/usr/bin/env python3

import http.server
import socketserver
import json
import csv
import io
import os
import urllib.parse
from typing import Dict, List, Any
import requests

# Simple HTTP server for CSV processing
class CSVHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "healthy", "service": "csv-import"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/preview-csv':
            self.handle_preview_csv()
        elif self.path == '/import-leads':
            self.handle_import_leads()
        else:
            self.send_response(404)
            self.end_headers()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "csv-import"}

@app.post("/preview-csv")
async def preview_csv(file: UploadFile = File(...)):
    """Preview CSV file structure and return headers + sample rows"""
    try:
        # Read CSV content
        content = await file.read()
        csv_string = content.decode('utf-8')

        # Use pandas for robust CSV parsing
        df = pd.read_csv(StringIO(csv_string))

        # Get headers
        headers = df.columns.tolist()

        # Get first 5 rows as preview
        preview_data = df.head(5).fillna('').to_dict('records')

        return {
            "headers": headers,
            "preview": preview_data,
            "total_rows": len(df),
            "total_columns": len(headers)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

@app.post("/import-leads")
async def import_leads(
    file: UploadFile = File(...),
    pipeline_id: str = Form(...),
    lead_source: str = Form(...),
    import_file_name: str = Form(...),
    column_mappings: str = Form(...)
):
    """Import leads from CSV file with optimized batch processing"""
    try:
        # Parse column mappings
        mappings = json.loads(column_mappings)

        # Read CSV with pandas (much faster than manual parsing)
        content = await file.read()
        csv_string = content.decode('utf-8')
        df = pd.read_csv(StringIO(csv_string))

        # Get pipeline defaults in parallel
        pipeline_status_task = get_pipeline_default_status(pipeline_id)
        insurance_type_task = get_default_insurance_type()

        default_status_id, default_insurance_type_id = await asyncio.gather(
            pipeline_status_task, insurance_type_task
        )

        # Create field mapping dictionary
        field_mapping = {}
        for mapping in mappings:
            if mapping['crmField'] and mapping['crmField'] != 'skip':
                field_mapping[mapping['csvColumn']] = mapping['crmField']

        # Process data efficiently with pandas
        leads_data = []
        errors = []

        for index, row in df.iterrows():
            try:
                lead_data = process_row(
                    row, field_mapping, pipeline_id,
                    default_status_id, default_insurance_type_id,
                    lead_source, import_file_name
                )

                if lead_data:
                    leads_data.append(lead_data)

            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")

        if not leads_data:
            return {"success": False, "error": "No valid leads found", "errors": errors}

        # Batch insert to database (much faster than individual inserts)
        result = await batch_insert_leads(leads_data)

        return {
            "success": True,
            "imported_count": result["count"],
            "errors": errors if errors else None,
            "processing_time": result.get("processing_time")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

async def get_pipeline_default_status(pipeline_id: str) -> str:
    """Get default status for pipeline"""
    result = supabase.table('pipeline_statuses').select('id').eq('pipeline_id', pipeline_id).order('display_order').limit(1).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="No pipeline statuses found")

    return result.data[0]['id']

async def get_default_insurance_type() -> str:
    """Get default insurance type (Auto)"""
    result = supabase.table('insurance_types').select('id').eq('name', 'Auto').limit(1).execute()
    return result.data[0]['id'] if result.data else 1

def process_row(row: pd.Series, field_mapping: Dict, pipeline_id: str,
               status_id: str, insurance_type_id: str, source: str,
               import_file_name: str) -> Dict[str, Any]:
    """Process a single row efficiently"""

    lead_data = {
        'pipeline_id': pipeline_id,
        'status_id': status_id,
        'insurance_type_id': insurance_type_id,
        'source': source.strip(),
        'import_file_name': import_file_name.strip()
    }

    additional_drivers = []

    # Process mapped fields
    for csv_column, crm_field in field_mapping.items():
        if csv_column not in row.index:
            continue

        value = row[csv_column]

        # Skip empty values
        if pd.isna(value) or str(value).strip() == '':
            continue

        value = str(value).strip()

        # Handle driver fields
        if crm_field.startswith('driver_'):
            parts = crm_field.split('_')
            if len(parts) >= 3:
                driver_num = int(parts[1])
                field_name = '_'.join(parts[2:])

                # Ensure we have enough driver slots
                while len(additional_drivers) < driver_num:
                    additional_drivers.append({})

                # Handle boolean fields
                if field_name in ['sr22', 'military']:
                    additional_drivers[driver_num - 1][field_name] = value.lower() in ['yes', 'true', '1']
                else:
                    additional_drivers[driver_num - 1][field_name] = value
        else:
            # Handle boolean fields for primary driver
            if crm_field in ['sr22', 'military']:
                lead_data[crm_field] = value.lower() in ['yes', 'true', '1']
            # Handle numeric fields
            elif crm_field in ['premium', 'auto_premium', 'home_premium', 'specialty_premium']:
                try:
                    # Remove currency symbols and convert to float
                    numeric_value = float(''.join(c for c in value if c.isdigit() or c in '.-'))
                    lead_data[crm_field] = numeric_value
                except ValueError:
                    pass  # Skip invalid numeric values
            else:
                lead_data[crm_field] = value

    # Add additional drivers if any
    if additional_drivers:
        # Filter out empty driver records
        valid_drivers = [d for d in additional_drivers if d.get('first_name') or d.get('last_name')]
        if valid_drivers:
            lead_data['additional_insureds'] = valid_drivers

    # Validate required fields
    if not lead_data.get('first_name') and not lead_data.get('last_name'):
        raise ValueError("Missing both first name and last name")

    # Set defaults for required fields
    if not lead_data.get('first_name'):
        lead_data['first_name'] = ''
    if not lead_data.get('last_name'):
        lead_data['last_name'] = ''

    return lead_data

async def batch_insert_leads(leads_data: List[Dict]) -> Dict:
    """Batch insert leads for better performance"""
    import time
    start_time = time.time()

    # Insert in batches of 100 for optimal performance
    batch_size = 100
    total_inserted = 0

    for i in range(0, len(leads_data), batch_size):
        batch = leads_data[i:i + batch_size]

        result = supabase.table('leads_ins_info').insert(batch).execute()

        if result.data:
            total_inserted += len(result.data)

    processing_time = time.time() - start_time

    return {
        "count": total_inserted,
        "processing_time": round(processing_time, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
