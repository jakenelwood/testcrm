#!/usr/bin/env python3
"""
Test script to verify LanceDB connection.

Usage:
    python test-lancedb.py
"""
import asyncio
import logging
import os
import sys
import time
from datetime import datetime

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the database service
from app.services.database import get_db_service

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_lancedb():
    """Test the LanceDB connection and basic operations."""
    logger.info("Starting LanceDB connection test")
    
    db_service = get_db_service()
    
    try:
        # Connect to LanceDB
        await db_service.connect()
        logger.info("Connected to LanceDB successfully")
        
        # Get the clients table
        clients_table = await db_service.get_table("clients")
        logger.info("Opened clients table successfully")
        
        # Create a test client
        test_client = {
            "id": f"test-client-{int(time.time())}",
            "name": "Test Client",
            "email": "test@example.com",
            "phone": "555-123-4567",
            "address": "123 Test St, Testville, MN 55123",
            "created_at": datetime.now().isoformat()
        }
        
        # Add the test client
        await clients_table.add([test_client])
        logger.info(f"Added test client: {test_client['id']}")
        
        # Query for the client we just added
        result = await clients_table.search().filter(f"id = '{test_client['id']}'").execute()
        retrieved_client = result.data[0] if result.data else None
        
        if retrieved_client:
            logger.info(f"Retrieved client: {retrieved_client}")
        else:
            logger.error("Failed to retrieve client")
        
        # Clean up - delete the test client
        await clients_table.delete().filter(f"id = '{test_client['id']}'").execute()
        logger.info(f"Deleted test client: {test_client['id']}")
        
        # Verify deletion
        result = await clients_table.search().filter(f"id = '{test_client['id']}'").execute()
        if not result.data:
            logger.info("Verified deletion successful")
        else:
            logger.warning("Deletion verification failed - client still exists")
        
        logger.info("LanceDB test completed successfully")
        
    except Exception as e:
        logger.error(f"LanceDB test error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_lancedb()) 