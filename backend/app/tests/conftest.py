import pytest
from unittest.mock import MagicMock
from sqlalchemy.orm import Session
from pathlib import Path
import tempfile
import os
import sys
from unittest.mock import patch

# Mock the database models to avoid import errors
class MockBase:
    pass

class MockQuote:
    id = None
    client = None
    has_auto = None
    has_home = None
    has_specialty = None
    auto_data = None
    home_data = None
    specialty_data = None
    documents = []

class MockClient:
    name = None
    phone_number = None
    email = None
    address = None
    gender = None
    marital_status = None
    date_of_birth = None

class MockDocument:
    id = None
    quote_id = None
    filename = None
    file_path = None
    file_type = None


@pytest.fixture
def temp_document_dir():
    """Create a temporary directory for document storage during tests"""
    with tempfile.TemporaryDirectory() as tmpdirname:
        original_dir = os.getcwd()
        os.chdir(tmpdirname)
        temp_dir = Path(tmpdirname)
        
        # Create documents directory
        docs_dir = temp_dir / "documents"
        docs_dir.mkdir(exist_ok=True)
        
        # Create templates directory
        templates_dir = temp_dir / "app" / "templates"
        templates_dir.mkdir(parents=True, exist_ok=True)
        
        yield temp_dir
        
        os.chdir(original_dir)


@pytest.fixture
def sample_mock_quote():
    """Create a sample mock quote for tests"""
    client = MagicMock(spec=MockClient)
    client.name = "John Doe"
    client.phone_number = "555-123-4567"
    client.email = "john.doe@example.com"
    client.address = "123 Main St, Anytown, USA 12345"
    client.gender = "Male"
    client.marital_status = "Married"
    client.date_of_birth = "1980-01-01"
    
    quote = MagicMock(spec=MockQuote)
    quote.id = 1
    quote.client = client
    quote.has_auto = True
    quote.has_home = True
    quote.has_specialty = False
    
    # Auto data
    quote.auto_data = {
        "v1yr": "2020",
        "v1make": "Honda",
        "v1model": "Accord",
        "v1vin": "1HGCV1F34LA123456",
        "v1use": "Commute",
        "v1miles": "12000",
        "v1owner": "Owned",
        "v1park": "Garage",
    }
    
    # Home data
    quote.home_data = {
        "h-yearbuilt": "2005",
        "h-sqft": "2200",
        "h-construction": "Frame",
        "h-roof": "Asphalt Shingle",
        "h-occupancy": "Primary",
        "h-value": "350000",
        "h-address": "123 Main St, Anytown, USA 12345",
    }
    
    return quote


@pytest.fixture
def mock_db_session():
    """Create a mock database session for testing"""
    db = MagicMock(spec=Session)
    return db


# Apply patches to avoid import errors
@pytest.fixture(autouse=True)
def mock_imports():
    """Mock imports to avoid database connection errors"""
    modules_to_mock = [
        'app.db.database',
        'app.models.quote',
        'app.models.client',
        'lancedb'
    ]
    
    for module in modules_to_mock:
        sys.modules[module] = MagicMock()
