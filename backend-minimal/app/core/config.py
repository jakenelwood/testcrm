import os
from pathlib import Path
from pydantic import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables with defaults."""
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./quoterequest.db")
    
    # LanceDB settings
    LANCEDB_DATA_DIR: str = os.getenv("LANCEDB_PATH", "./data/lancedb")
    
    # JWT Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "0594b899fd067b9363a2aeee3532a1a771c56194d1b8fe5a7543abd106342433")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS Settings
    ALLOWED_ORIGINS: list = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # Server Settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    class Config:
        env_file = ".env"

# Create global settings object
settings = Settings() 