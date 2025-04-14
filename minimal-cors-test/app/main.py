from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create FastAPI app
app = FastAPI(title="CORS Test API")

# Configure CORS - get allowed origins from env or use default
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3015,https://quote-request-fresh-ao4t9nrjp-jakenelwoods-projects.vercel.app").split(",")
print(f"Allowed origins: {allowed_origins}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint for health checks."""
    return {
        "status": "ok",
        "message": "CORS test API is running",
        "allowed_origins": allowed_origins
    } 