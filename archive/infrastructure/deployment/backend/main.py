from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import asyncio
import asyncpg
import logging
from datetime import datetime
from typing import Optional, Dict, Any
import json
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Import SQLAlchemy models and database setup
from models.base import get_db, engine, Base
from models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')

# Initialize FastAPI app
app = FastAPI(
    title="RonRico CRM API",
    description="FastAPI backend for RonRico CRM system with Alembic migrations",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security
security = HTTPBearer()

# Secure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://crm-jakenelwoods-projects.vercel.app",
        "http://localhost:3000",
        "http://api.gardenos.local"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRF-Token"
    ],
    expose_headers=["X-Total-Count", "X-Page-Count"],
    max_age=600,  # 10 minutes
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
            db_pool = await asyncpg.create_pool(database_url, min_size=1, max_size=10)
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")

    return db_pool

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    await get_db_pool()
    logger.info("FastAPI backend started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database connections closed")

@app.get("/")
async def root():
    """Root endpoint"""
    REQUEST_COUNT.labels(method="GET", endpoint="/").inc()
    return {
        "message": "RonRico CRM API",
        "status": "running",
        "version": "2.0.0",
        "features": ["SQLAlchemy Models", "Alembic Migrations", "Prometheus Metrics"],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")

        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "service": "fastapi-api",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/test")
async def test_endpoint():
    """Test endpoint for API functionality"""
    return {
        "message": "FastAPI backend is working!",
        "api_version": "v1",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/database/test")
async def test_database():
    """Test database connectivity"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            # Test basic query
            result = await conn.fetchval("SELECT version()")

            # Test table existence
            tables = await conn.fetch("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('users', 'leads_contact_info', 'leads_ins_info')
                ORDER BY table_name
            """)

            return {
                "status": "success",
                "database_version": result,
                "tables_found": [row['table_name'] for row in tables],
                "timestamp": datetime.utcnow().isoformat()
            }

    except Exception as e:
        logger.error(f"Database test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database test failed: {str(e)}")

# Include API routes (we'll add more endpoints here)
@app.get("/api/v1/leads")
async def get_leads(limit: int = 10, offset: int = 0):
    """Get leads from database"""
    try:
        pool = await get_db_pool()
        async with pool.acquire() as conn:
            leads = await conn.fetch("""
                SELECT
                    lci.id,
                    lci.first_name,
                    lci.last_name,
                    lci.email,
                    lci.phone,
                    lci.created_at,
                    lii.insurance_type,
                    lii.coverage_type
                FROM leads_contact_info lci
                LEFT JOIN leads_ins_info lii ON lci.id = lii.lead_id
                ORDER BY lci.created_at DESC
                LIMIT $1 OFFSET $2
            """, limit, offset)

            return {
                "leads": [dict(lead) for lead in leads],
                "count": len(leads),
                "limit": limit,
                "offset": offset
            }

    except Exception as e:
        logger.error(f"Failed to fetch leads: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch leads: {str(e)}")

@app.post("/api/v1/migrations/upgrade")
async def upgrade_database():
    """Run database migrations (upgrade to latest)"""
    try:
        from alembic.config import Config
        from alembic import command

        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")

        return {
            "status": "success",
            "message": "Database upgraded to latest migration",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Migration upgrade failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration upgrade failed: {str(e)}")

@app.get("/api/v1/migrations/current")
async def get_current_migration():
    """Get current migration version"""
    try:
        from alembic.config import Config
        from alembic import command
        from alembic.script import ScriptDirectory
        from alembic.runtime.migration import MigrationContext

        alembic_cfg = Config("alembic.ini")
        script = ScriptDirectory.from_config(alembic_cfg)

        # Get current revision from database
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_rev = context.get_current_revision()

        # Get head revision from scripts
        head_rev = script.get_current_head()

        return {
            "current_revision": current_rev,
            "head_revision": head_rev,
            "is_up_to_date": current_rev == head_rev,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get migration status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get migration status: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        log_level=os.getenv("LOG_LEVEL", "info")
    )
