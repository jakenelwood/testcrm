import os
import lancedb
from typing import Generator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get LanceDB path from environment variable, with a fallback for testing
LANCEDB_PATH = os.getenv("LANCEDB_PATH", "./data/lancedb")

# Create LanceDB connection
db = lancedb.connect(LANCEDB_PATH)

# Create base class for models (this will be different from SQLAlchemy but kept for compatibility)
class Base:
    """Base class for LanceDB models. This replaces SQLAlchemy's declarative_base."""
    __tablename__ = None
    
    @classmethod
    def get_schema(cls):
        """Return the schema for this collection. To be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement get_schema()")

# Dependency to get DB connection
def get_db() -> Generator:
    """Dependency to get the database connection."""
    try:
        yield db
    finally:
        # LanceDB doesn't have a close method like SQLAlchemy
        # Connections are managed automatically
        pass
