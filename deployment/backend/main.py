from fastapi import FastAPI
import os

app = FastAPI(title="GardenOS FastAPI Backend", version="1.0.0")

@app.get("/")
def root():
    return {"message": "GardenOS FastAPI Backend", "status": "running"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fastapi-backend",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "database_url": os.getenv("DATABASE_URL", "not configured")
    }

@app.get("/api/test")
def test():
    return {"message": "FastAPI backend is working!", "phase": "development"}
