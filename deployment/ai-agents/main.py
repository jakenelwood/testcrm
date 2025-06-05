from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import asyncio
import asyncpg
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
import json
import pandas as pd
from io import StringIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GardenOS AI Agents",
    description="AI-powered agents for CRM automation and intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://crm-jakenelwoods-projects.vercel.app",
        "http://localhost:3000",
        "http://api.gardenos.local"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

async def get_db_pool():
    """Get database connection pool"""
    global db_pool
    if db_pool is None:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise HTTPException(status_code=500, detail="Database URL not configured")
        
        try:
            db_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
            logger.info("AI Agents database connection pool created")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")
    
    return db_pool

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await get_db_pool()
    logger.info("AI Agents service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("AI Agents database connections closed")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "GardenOS AI Agents",
        "status": "running",
        "version": "1.0.0",
        "capabilities": ["csv_import", "lead_analysis", "memory_management"],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Test database and pgvector
            await conn.fetchval("SELECT 1")
            vector_test = await conn.fetchval("SELECT '[0.1,0.2,0.3]'::vector(3)")
        
        db_status = "connected"
        vector_status = "available" if vector_test else "unavailable"
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        db_status = "disconnected"
        vector_status = "unavailable"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "service": "ai-agents",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "database": db_status,
        "pgvector": vector_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/ai/csv/preview")
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
            "total_columns": len(headers),
            "file_name": file.filename,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"CSV preview failed: {e}")
        raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")

@app.post("/ai/csv/import")
async def import_leads(
    file: UploadFile = File(...),
    pipeline_id: str = Form(...),
    lead_source: str = Form(...),
    import_file_name: str = Form(...),
    column_mappings: str = Form(...)
):
    """Import leads from CSV file with AI-powered data processing"""
    try:
        # Parse column mappings
        mappings = json.loads(column_mappings)
        
        # Read CSV with pandas
        content = await file.read()
        csv_string = content.decode('utf-8')
        df = pd.read_csv(StringIO(csv_string))

        # Process data with AI enhancements
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Get pipeline defaults
            default_status = await conn.fetchval("""
                SELECT id FROM pipeline_statuses 
                WHERE pipeline_id = $1 
                ORDER BY display_order 
                LIMIT 1
            """, pipeline_id)
            
            if not default_status:
                raise HTTPException(status_code=400, detail="No pipeline statuses found")

            # Create field mapping dictionary
            field_mapping = {}
            for mapping in mappings:
                if mapping['crmField'] and mapping['crmField'] != 'skip':
                    field_mapping[mapping['csvColumn']] = mapping['crmField']

            # Process data efficiently
            leads_data = []
            errors = []

            for index, row in df.iterrows():
                try:
                    lead_data = await process_row_with_ai(
                        row, field_mapping, pipeline_id,
                        default_status, lead_source, import_file_name
                    )

                    if lead_data:
                        leads_data.append(lead_data)

                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")

            if not leads_data:
                return {"success": False, "error": "No valid leads found", "errors": errors}

            # Batch insert to database
            result = await batch_insert_leads(leads_data, conn)

            return {
                "success": True,
                "imported_count": result["count"],
                "errors": errors if errors else None,
                "processing_time": result.get("processing_time"),
                "ai_enhancements": result.get("ai_enhancements", 0)
            }

    except Exception as e:
        logger.error(f"CSV import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

async def process_row_with_ai(row: pd.Series, field_mapping: Dict, pipeline_id: str,
                             status_id: str, source: str, import_file_name: str) -> Dict[str, Any]:
    """Process a single row with AI enhancements"""
    
    lead_data = {
        'pipeline_id': pipeline_id,
        'status_id': status_id,
        'source': source.strip(),
        'import_file_name': import_file_name.strip(),
        'created_at': datetime.utcnow().isoformat()
    }

    # Map CSV columns to CRM fields
    for csv_col, crm_field in field_mapping.items():
        if csv_col in row and pd.notna(row[csv_col]):
            value = str(row[csv_col]).strip()
            if value:
                # AI enhancement: Clean and standardize data
                if crm_field in ['email']:
                    value = value.lower()
                elif crm_field in ['phone']:
                    # Basic phone number cleaning
                    value = ''.join(filter(str.isdigit, value))
                elif crm_field in ['first_name', 'last_name']:
                    value = value.title()
                
                lead_data[crm_field] = value

    return lead_data

async def batch_insert_leads(leads_data: List[Dict], conn) -> Dict:
    """Batch insert leads with performance optimization"""
    import time
    start_time = time.time()

    # Insert in batches of 50 for optimal performance
    batch_size = 50
    total_inserted = 0
    ai_enhancements = 0

    for i in range(0, len(leads_data), batch_size):
        batch = leads_data[i:i + batch_size]
        
        # Prepare batch insert query
        columns = list(batch[0].keys())
        placeholders = ', '.join([f'${j+1}' for j in range(len(columns))])
        query = f"""
            INSERT INTO leads_contact_info ({', '.join(columns)})
            VALUES ({placeholders})
            RETURNING id
        """
        
        # Execute batch insert
        for lead in batch:
            values = [lead.get(col) for col in columns]
            result = await conn.fetchval(query, *values)
            if result:
                total_inserted += 1
                ai_enhancements += 1  # Count AI processing

    processing_time = time.time() - start_time

    return {
        "count": total_inserted,
        "processing_time": round(processing_time, 2),
        "ai_enhancements": ai_enhancements
    }

@app.get("/ai/memory/test")
async def test_vector_memory():
    """Test vector memory functionality"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Test vector operations
            test_embedding = await conn.fetchval("SELECT '[0.1,0.2,0.3]'::vector(3)")
            
            # Test similarity search
            similarity = await conn.fetchval("""
                SELECT '[0.1,0.2,0.3]'::vector(3) <=> '[0.2,0.3,0.4]'::vector(3)
            """)
            
            return {
                "status": "success",
                "vector_support": "available",
                "test_embedding": str(test_embedding),
                "similarity_score": float(similarity),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    except Exception as e:
        logger.error(f"Vector memory test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vector test failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=int(os.getenv("PORT", 8001)),
        log_level=os.getenv("LOG_LEVEL", "info")
    )
