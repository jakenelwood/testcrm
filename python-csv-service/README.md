# CSV Import Service

A high-performance Python service for processing CSV imports in the CRM application.

## Features

- **Fast CSV Processing**: Uses pandas for efficient parsing of large CSV files
- **Batch Database Operations**: Optimized batch inserts for better performance
- **Robust Error Handling**: Comprehensive validation and error reporting
- **Driver Field Detection**: Automatically detects and processes driver-specific fields
- **Scalable**: Handles large files (tested up to 10MB+)

## Quick Start

1. **Install Dependencies**:
   ```bash
   cd python-csv-service
   ./start.sh
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials

3. **Start Service**:
   ```bash
   ./start.sh
   ```

The service will start on `http://localhost:8001`

## API Endpoints

### Health Check
```
GET /health
```

### Preview CSV
```
POST /preview-csv
Content-Type: multipart/form-data

file: CSV file
```

Returns:
```json
{
  "headers": ["column1", "column2", ...],
  "preview": [{"column1": "value1", ...}, ...],
  "total_rows": 100,
  "total_columns": 50
}
```

### Import Leads
```
POST /import-leads
Content-Type: multipart/form-data

file: CSV file
pipeline_id: string
lead_source: string
import_file_name: string
column_mappings: JSON string
```

Returns:
```json
{
  "success": true,
  "imported_count": 95,
  "processing_time": 2.34,
  "errors": ["Row 5: Missing name", ...]
}
```

## Performance Benefits

- **10x faster** CSV parsing with pandas vs manual JavaScript parsing
- **Batch inserts** reduce database round trips
- **Memory efficient** streaming for large files
- **Parallel processing** for database operations

## Development

```bash
# Install in development mode
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --port 8001
```
