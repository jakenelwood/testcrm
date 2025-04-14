from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

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

# Configure CORS - get allowed origins from env or use default
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3015,https://quote-request-fresh-ao4t9nrjp-jakenelwoods-projects.vercel.app").split(",")
print(f"Allowed origins: {allowed_origins}")
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
    """Root endpoint for health checks."""
    return {
        "status": "ok",
        "message": "API is running",
        "version": "1.0.0",
        "timestamp": "2025-04-14T04:05:16_488Z",
        "allowed_origins": allowed_origins
    }

@app.get("/api/health-check")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "API is healthy",
        "allowed_origins": allowed_origins
    }
