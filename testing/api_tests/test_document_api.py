import pytest
import os
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from pathlib import Path

from backend.app.main import app
from backend.app.models.quote import Document

# Create test client
client = TestClient(app)

@pytest.fixture
def mock_auth_token():
    """Create a mock authentication token for testing"""
    # Mock the authentication dependency
    with patch("backend.app.routers.documents.get_current_active_user") as mock_auth:
        # Configure mock to return a test user
        mock_user = MagicMock()
        mock_user.username = "testuser"
        mock_user.id = 1
        mock_auth.return_value = mock_user
        
        # Return token value that can be used in headers
        yield "test_token"

@pytest.fixture
def mock_db_session():
    """Create a mock database session for testing"""
    with patch("backend.app.routers.documents.get_db") as mock_db:
        # Create a mock session
        mock_session = MagicMock()
        
        # Configure the session to return test data
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        # Configure the mock db function to return our session
        mock_db.return_value = mock_session
        
        yield mock_session

@pytest.fixture
def mock_document_generator():
    """Mock the document generator function"""
    with patch("backend.app.routers.documents.generate_quote_document") as mock_gen:
        # Configure mock to return a test document path
        mock_gen.return_value = ("test_document.docx", "/tmp/test_document.docx")
        yield mock_gen

def test_generate_document_endpoint(mock_auth_token, mock_db_session, mock_document_generator):
    """Test the document generation endpoint"""
    # Mock a quote for testing
    mock_quote = MagicMock()
    mock_quote.id = 1
    mock_quote.client = MagicMock()
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_quote
    
    # Mock document record creation
    mock_document = MagicMock(spec=Document)
    mock_document.id = 1
    mock_document.quote_id = 1
    mock_document.filename = "test_document.docx"
    mock_document.file_path = "/tmp/test_document.docx"
    mock_document.file_type = "docx"
    
    # Configure the database session to handle document creation
    def mock_add(document):
        nonlocal mock_document
        # Update mock document with attributes from the created document
        for attr in ["quote_id", "filename", "file_path", "file_type"]:
            setattr(mock_document, attr, getattr(document, attr))
        return None
    
    mock_db_session.add.side_effect = mock_add
    mock_db_session.refresh.return_value = None
    
    # Make request to generate document
    response = client.post(
        "/api/documents/1/generate?file_type=docx",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 200
    assert "filename" in response.json()
    assert response.json()["filename"] == "test_document.docx"
    assert response.json()["file_type"] == "docx"
    
    # Verify the document generator was called correctly
    mock_document_generator.assert_called_once()
    args, _ = mock_document_generator.call_args
    assert args[0] == mock_quote
    assert args[1] == "docx"
    
    # Verify database operations
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
    mock_db_session.refresh.assert_called_once()

def test_generate_document_quote_not_found(mock_auth_token, mock_db_session):
    """Test document generation with non-existent quote"""
    # Configure DB to return no quote
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Make request to generate document
    response = client.post(
        "/api/documents/999/generate?file_type=docx",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

def test_generate_document_invalid_file_type(mock_auth_token, mock_db_session):
    """Test document generation with invalid file type"""
    # Mock a quote for testing
    mock_quote = MagicMock()
    mock_quote.id = 1
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_quote
    
    # Make request with invalid file type
    response = client.post(
        "/api/documents/1/generate?file_type=invalid",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 400
    assert "detail" in response.json()
    assert "file type" in response.json()["detail"].lower()

def test_generate_document_error_handling(mock_auth_token, mock_db_session, mock_document_generator):
    """Test error handling during document generation"""
    # Mock a quote for testing
    mock_quote = MagicMock()
    mock_quote.id = 1
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_quote
    
    # Configure document generator to raise an exception
    mock_document_generator.side_effect = Exception("Test error")
    
    # Make request to generate document
    response = client.post(
        "/api/documents/1/generate?file_type=docx",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 500
    assert "detail" in response.json()
    assert "error" in response.json()["detail"].lower()

def test_download_document(mock_auth_token, mock_db_session):
    """Test document download endpoint"""
    # Create a test document file
    test_doc_path = "/tmp/test_download.docx"
    with open(test_doc_path, "w") as f:
        f.write("Test document content")
    
    # Mock document in database
    mock_document = MagicMock(spec=Document)
    mock_document.id = 1
    mock_document.quote_id = 1
    mock_document.filename = "test_download.docx"
    mock_document.file_path = test_doc_path
    mock_document.file_type = "docx"
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_document
    
    # Mock file response
    with patch("backend.app.routers.documents.FileResponse") as mock_file_response:
        mock_file_response.return_value = {"filename": "test_download.docx"}
        
        # Mock os.path.exists to return True
        with patch("os.path.exists") as mock_exists:
            mock_exists.return_value = True
            
            # Make request to download document
            response = client.get(
                "/api/documents/1/download",
                headers={"Authorization": f"Bearer {mock_auth_token}"}
            )
            
            # Since we can't actually test the file response in TestClient,
            # we check that the mocked FileResponse was called correctly
            mock_file_response.assert_called_once()
            args, kwargs = mock_file_response.call_args
            assert kwargs["path"] == test_doc_path
            assert kwargs["filename"] == "test_download.docx"
            
    # Clean up test file
    if os.path.exists(test_doc_path):
        os.remove(test_doc_path)

def test_download_document_not_found(mock_auth_token, mock_db_session):
    """Test document download with non-existent document"""
    # Configure DB to return no document
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Make request to download document
    response = client.get(
        "/api/documents/999/download",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

def test_download_document_file_not_found(mock_auth_token, mock_db_session):
    """Test document download when file is missing"""
    # Mock document in database
    mock_document = MagicMock(spec=Document)
    mock_document.id = 1
    mock_document.quote_id = 1
    mock_document.filename = "missing_file.docx"
    mock_document.file_path = "/tmp/missing_file.docx"
    mock_document.file_type = "docx"
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_document
    
    # Mock os.path.exists to return False (file doesn't exist)
    with patch("os.path.exists") as mock_exists:
        mock_exists.return_value = False
        
        # Make request to download document
        response = client.get(
            "/api/documents/1/download",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        # Verify the response
        assert response.status_code == 404
        assert "detail" in response.json()
        assert "file not found" in response.json()["detail"]

def test_list_quote_documents(mock_auth_token, mock_db_session):
    """Test listing documents for a quote"""
    # Mock a quote with documents
    mock_quote = MagicMock()
    mock_quote.id = 1
    
    # Create mock documents
    mock_documents = [
        MagicMock(spec=Document, id=1, quote_id=1, filename="doc1.docx", file_type="docx"),
        MagicMock(spec=Document, id=2, quote_id=1, filename="doc2.pdf", file_type="pdf")
    ]
    
    # Set up document serialization
    for doc in mock_documents:
        doc.__dict__ = {
            "id": doc.id,
            "quote_id": doc.quote_id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "created_at": "2023-01-01T00:00:00",
            "file_path": f"/tmp/{doc.filename}"
        }
    
    mock_quote.documents = mock_documents
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_quote
    
    # Make request to list documents
    response = client.get(
        "/api/documents/quote/1",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 2
    assert response.json()[0]["filename"] == "doc1.docx"
    assert response.json()[1]["filename"] == "doc2.pdf"

def test_list_documents_quote_not_found(mock_auth_token, mock_db_session):
    """Test listing documents for non-existent quote"""
    # Configure DB to return no quote
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Make request to list documents
    response = client.get(
        "/api/documents/quote/999",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

def test_delete_document(mock_auth_token, mock_db_session):
    """Test document deletion"""
    # Create a test document file
    test_doc_path = "/tmp/test_delete.docx"
    with open(test_doc_path, "w") as f:
        f.write("Test document content")
    
    # Mock document in database
    mock_document = MagicMock(spec=Document)
    mock_document.id = 1
    mock_document.quote_id = 1
    mock_document.filename = "test_delete.docx"
    mock_document.file_path = test_doc_path
    mock_document.file_type = "docx"
    
    mock_db_session.query.return_value.filter.return_value.first.return_value = mock_document
    
    # Mock os.path.exists and os.remove
    with patch("os.path.exists") as mock_exists, patch("os.remove") as mock_remove:
        mock_exists.return_value = True
        
        # Make request to delete document
        response = client.delete(
            "/api/documents/1",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        # Verify the response
        assert response.status_code == 204
        
        # Verify the correct operations were performed
        mock_exists.assert_called_once_with(test_doc_path)
        mock_remove.assert_called_once_with(test_doc_path)
        mock_db_session.delete.assert_called_once_with(mock_document)
        mock_db_session.commit.assert_called_once()

def test_delete_document_not_found(mock_auth_token, mock_db_session):
    """Test document deletion with non-existent document"""
    # Configure DB to return no document
    mock_db_session.query.return_value.filter.return_value.first.return_value = None
    
    # Make request to delete document
    response = client.delete(
        "/api/documents/999",
        headers={"Authorization": f"Bearer {mock_auth_token}"}
    )
    
    # Verify the response
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

def test_api_authentication_required():
    """Test that authentication is required for all document endpoints"""
    # List of endpoints to test
    endpoints = [
        ("POST", "/api/documents/1/generate?file_type=docx"),
        ("GET", "/api/documents/1/download"),
        ("GET", "/api/documents/quote/1"),
        ("DELETE", "/api/documents/1")
    ]
    
    # Test each endpoint without authentication
    for method, url in endpoints:
        if method == "POST":
            response = client.post(url)
        elif method == "GET":
            response = client.get(url)
        elif method == "DELETE":
            response = client.delete(url)
        
        # Verify authentication is required
        assert response.status_code in [401, 403], f"Endpoint {method} {url} doesn't require authentication"

if __name__ == "__main__":
    pytest.main(["-v", "test_document_api.py"]) 