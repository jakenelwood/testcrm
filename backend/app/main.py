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

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
