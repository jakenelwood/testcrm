import os
import logging
from typing import Any, Dict, List, Optional
from lancedb import connect

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for interacting with LanceDB."""
    
    def __init__(self):
        self.connection = None
        self.db = None
        self.connected = False
        self.lancedb_url = os.getenv("LANCEDB_URI", "/app/lancedb-data")
    
    async def connect(self) -> Any:
        """Connect to LanceDB."""
        try:
            # Connect to LanceDB using local file storage
            self.connection = await connect(self.lancedb_url)
            self.db = self.connection
            self.connected = True
            logger.info(f"Connected to LanceDB at {self.lancedb_url}")
            return self.db
        except Exception as e:
            logger.error(f"Error connecting to LanceDB: {e}")
            self.connected = False
            raise
    
    async def ensure_connection(self) -> None:
        """Ensure that we have a connection to LanceDB."""
        if not self.connected:
            await self.connect()
    
    async def get_table(self, table_name: str) -> Any:
        """Get a table from LanceDB, creating it if it doesn't exist."""
        await self.ensure_connection()
        
        try:
            return await self.db.open_table(table_name)
        except Exception as e:
            if "does not exist" in str(e):
                # Create table if it doesn't exist
                logger.info(f"Creating table {table_name}")
                return await self.db.create_table(table_name, [])
            logger.error(f"Error getting table {table_name}: {e}")
            raise
    
    async def create_tables(self) -> None:
        """Create the necessary tables in LanceDB if they don't exist."""
        await self.ensure_connection()
        
        # Define the tables
        tables = [
            {
                "name": "clients",
                "sample": {
                    "id": "sample-client",
                    "name": "Sample Client",
                    "email": "sample@example.com",
                    "phone": "555-123-4567",
                    "address": "123 Sample St, Sampleville, MN 55123",
                    "created_at": "2023-01-01T00:00:00Z"
                }
            },
            {
                "name": "quote_requests",
                "sample": {
                    "id": "sample-quote-request",
                    "client_id": "sample-client",
                    "type": "auto",
                    "status": "draft",
                    "created_at": "2023-01-01T00:00:00Z",
                    "updated_at": "2023-01-01T00:00:00Z",
                    "data": {
                        "pniname": "Sample Client",
                        "pniaddr": "123 Sample St, Sampleville, MN 55123"
                    }
                }
            },
            {
                "name": "documents",
                "sample": {
                    "id": "sample-document",
                    "quote_request_id": "sample-quote-request",
                    "filename": "sample-document.docx",
                    "file_path": "/app/documents/sample-document.docx",
                    "created_at": "2023-01-01T00:00:00Z",
                    "file_type": "docx",
                    "file_size": 1024
                }
            }
        ]
        
        for table_info in tables:
            try:
                table = await self.get_table(table_info["name"])
                # Check if table is empty
                count = await table.count_rows()
                if count == 0:
                    # Add sample data
                    await table.add([table_info["sample"]])
                    logger.info(f"Added sample data to {table_info['name']}")
            except Exception as e:
                logger.error(f"Error creating table {table_info['name']}: {e}")

# Create singleton instance
db_service = DatabaseService()

# Function to get the database service instance
def get_db_service() -> DatabaseService:
    return db_service 
