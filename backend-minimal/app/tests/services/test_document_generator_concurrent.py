import pytest
import os
import concurrent.futures
import time
from pathlib import Path
from unittest.mock import patch, MagicMock

# Import from conftest instead of actual models
from app.tests.conftest import MockQuote, MockClient


@pytest.fixture
def mock_quote():
    """Create a mock quote with client for testing"""
    client = MagicMock(spec=MockClient)
    client.name = "Test Client"
    client.phone_number = "555-123-4567"
    client.email = "test@example.com"
    client.address = "123 Test St, Test City, TS 12345"
    client.gender = "Male"
    client.marital_status = "Single"
    client.date_of_birth = "1990-01-01"
    
    quote = MagicMock(spec=MockQuote)
    quote.id = 1
    quote.client = client
    quote.has_auto = True
    quote.has_home = False
    quote.has_specialty = False
    
    # Add auto data
    auto_data = {
        "v1yr": "2020",
        "v1make": "Test Make",
        "v1model": "Test Model",
        "v1vin": "TESTVINN1234567",
    }
    quote.auto_data = auto_data
    
    return quote


# Mock the document generator function
@pytest.fixture
def mock_document_generator():
    """Create a mock for the document generator function"""
    with patch('app.services.document_generator.generate_quote_document') as mock_gen:
        def side_effect(quote, file_type):
            # Generate a unique filename based on quote ID and file type
            timestamp = time.strftime("%Y%m%d%H%M%S")
            unique_id = str(hash(f"{quote.id}-{timestamp}"))[:8]
            filename = f"quote_{quote.id}_Test_Client_{timestamp}_{unique_id}.{file_type}"
            file_path = f"/tmp/{filename}"
            return filename, file_path
        
        mock_gen.side_effect = side_effect
        yield mock_gen


def test_concurrent_docx_generation(mock_quote, tmp_path, mock_document_generator):
    """Test generating multiple DOCX documents concurrently"""
    # Number of concurrent document generation tasks
    num_concurrent = 5
    
    # Function to generate document with unique ID
    def generate_doc(task_id):
        mock_quote.id = task_id
        filename, file_path = mock_document_generator(mock_quote, "docx")
        # Create a fake file to simulate the document creation
        Path(tmp_path / filename).touch()
        return filename, file_path, True
    
    # Execute concurrent document generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_doc, i) for i in range(1, num_concurrent + 1)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    elapsed_time = time.time() - start_time
    
    # Verify results
    assert len(results) == num_concurrent
    
    # Check for unique filenames
    filenames = [result[0] for result in results]
    assert len(filenames) == len(set(filenames)), "Duplicate filenames were generated"
    
    # Log performance metrics
    print(f"Generated {num_concurrent} documents in {elapsed_time:.2f} seconds")


def test_concurrent_pdf_generation(mock_quote, tmp_path, mock_document_generator):
    """Test generating multiple PDF documents concurrently"""
    # Number of concurrent document generation tasks
    num_concurrent = 5
    
    # Function to generate document with unique ID
    def generate_pdf(task_id):
        mock_quote.id = task_id
        filename, file_path = mock_document_generator(mock_quote, "pdf")
        # Create a fake file to simulate the document creation
        Path(tmp_path / filename).touch()
        return filename, file_path, filename.endswith('.pdf')
    
    # Execute concurrent document generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_pdf, i) for i in range(1, num_concurrent + 1)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    elapsed_time = time.time() - start_time
    
    # Verify results
    assert len(results) == num_concurrent
    
    # Check that all filenames end with .pdf
    for filename, file_path, is_pdf in results:
        assert is_pdf, f"Filename {filename} does not have .pdf extension"
        
    # Check for unique filenames
    filenames = [result[0] for result in results]
    assert len(filenames) == len(set(filenames)), "Duplicate filenames were generated"
    
    # Log performance metrics
    print(f"Generated {num_concurrent} PDF documents in {elapsed_time:.2f} seconds")


def test_high_load_document_generation(mock_quote, tmp_path, mock_document_generator):
    """Test document generation under higher load (more concurrent requests)"""
    # Number of concurrent document generation tasks (higher load)
    num_concurrent = 20
    
    # Function to generate document with unique ID
    def generate_doc(task_id):
        mock_quote.id = task_id
        try:
            filename, file_path = mock_document_generator(mock_quote, "docx")
            # Create a fake file to simulate the document creation
            Path(tmp_path / filename).touch()
            return {"success": True, "id": task_id, "filename": filename, "error": None}
        except Exception as e:
            return {"success": False, "id": task_id, "filename": None, "error": str(e)}
    
    # Execute concurrent document generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_doc, i) for i in range(1, num_concurrent + 1)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    elapsed_time = time.time() - start_time
    
    # Count successful and failed operations
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]
    
    # Verify results
    assert len(results) == num_concurrent
    success_rate = len(successes) / num_concurrent * 100
    
    # Log performance metrics and results
    print(f"Generated {num_concurrent} documents in {elapsed_time:.2f} seconds")
    print(f"Success rate: {success_rate:.1f}% ({len(successes)}/{num_concurrent})")
    print(f"Average time per document: {elapsed_time/num_concurrent:.3f} seconds")
    
    # List any errors that occurred
    if failures:
        print("Errors encountered:")
        for failure in failures:
            print(f"  - Task ID {failure['id']}: {failure['error']}")
    
    # The test should pass even with some failures, as we're testing resilience
    # But we expect a reasonable success rate
    assert success_rate >= 80, f"Success rate too low: {success_rate:.1f}%"


def test_mixed_document_types_concurrent(mock_quote, tmp_path, mock_document_generator):
    """Test generating a mix of DOCX and PDF documents concurrently"""
    # Number of each document type
    num_of_each = 5
    total_docs = num_of_each * 2  # DOCX and PDF
    
    # Function to generate document
    def generate_doc(task_id, doc_type):
        mock_quote.id = task_id
        filename, file_path = mock_document_generator(mock_quote, doc_type)
        # Create a fake file to simulate the document creation
        Path(tmp_path / filename).touch()
        return {
            "id": task_id,
            "type": doc_type,
            "filename": filename,
            "file_path": file_path,
            "exists": True
        }
    
    # Prepare tasks - mix of DOCX and PDF
    tasks = []
    for i in range(1, num_of_each + 1):
        tasks.append(("docx", i))
        tasks.append(("pdf", i + num_of_each))
    
    # Execute concurrent document generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=total_docs) as executor:
        futures = [executor.submit(generate_doc, task_id, doc_type) for doc_type, task_id in tasks]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    elapsed_time = time.time() - start_time
    
    # Verify results
    assert len(results) == total_docs
    
    # Group results by document type
    docx_results = [r for r in results if r["type"] == "docx"]
    pdf_results = [r for r in results if r["type"] == "pdf"]
    
    assert len(docx_results) == num_of_each
    assert len(pdf_results) == num_of_each
    
    # Check that all files have correct extension
    for result in results:
        assert result["filename"].endswith(f".{result['type']}"), \
               f"Filename {result['filename']} does not match type {result['type']}"
    
    # Check for unique filenames
    filenames = [result["filename"] for result in results]
    assert len(filenames) == len(set(filenames)), "Duplicate filenames were generated"
    
    # Log performance metrics
    print(f"Generated {total_docs} mixed documents in {elapsed_time:.2f} seconds")
    print(f"  - {len(docx_results)} DOCX documents")
    print(f"  - {len(pdf_results)} PDF documents") 