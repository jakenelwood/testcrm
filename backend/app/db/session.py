import os
import lancedb
from pathlib import Path
from typing import Generator

from app.core.config import settings

# Create data directory if it doesn't exist
DATA_DIR = Path(settings.LANCEDB_DATA_DIR)
DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_db() -> Generator:
    """
    Get a LanceDB connection for dependency injection.
    """
    db = lancedb.connect(str(DATA_DIR))
    try:
        yield db
    finally:
        # LanceDB doesn't have an explicit close method like SQLAlchemy
        # The connection will be closed when the object is garbage collected
        pass 