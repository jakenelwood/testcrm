from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import datetime
from app.services.database import get_db_service

# Import our routers
from app.routers import users, clients, quotes, documents

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Quote Request Generator",
    description="API for generating insurance quote requests",
    version="0.1.0"
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["quotes"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Quote Request Generator API"}

@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on startup."""
    db_service = get_db_service()
    try:
        await db_service.connect()
        # Create tables if they don't exist
        await db_service.create_tables()
    except Exception as e:
        logger.error(f"Failed to connect to LanceDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    db_service = get_db_service()
    if db_service.connected:
        # If there's a specific disconnect method, call it here
        db_service.connected = False
        logger.info("Disconnected from LanceDB")

@app.get("/api/health-check")
async def health_check():
    """Health check endpoint that verifies the API and database are running."""
    db_service = get_db_service()
    db_status = "connected" if db_service.connected else "disconnected"
    
    return {
        "status": "ok",
        "timestamp": datetime.datetime.now().isoformat(),
        "database": db_status
    }
