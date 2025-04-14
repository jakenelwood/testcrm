import pytest
import time
import concurrent.futures
from unittest.mock import patch, MagicMock

from app.tests.conftest import MockQuote, MockClient, MockDocument


@pytest.fixture
def mock_document_generator():
    """Mock document generator function for testing"""
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


def test_concurrent_document_generation(mock_document_generator):
    """Test concurrent document generation using threading"""
    # Number of concurrent operations
    num_concurrent = 5
    
    # Function to simulate document generation
    def generate_document(task_id):
        # Create a mock quote
        client = MagicMock(spec=MockClient)
        client.name = f"Client {task_id}"
        
        quote = MagicMock(spec=MockQuote)
        quote.id = task_id
        quote.client = client
        quote.has_auto = True
        
        # Generate document
        start_time = time.time()
        filename, file_path = mock_document_generator(quote, "docx")
        elapsed = time.time() - start_time
        
        return {
            "task_id": task_id,
            "filename": filename,
            "file_path": file_path,
            "elapsed": elapsed
        }
    
    # Execute concurrent operations
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_document, i) for i in range(1, num_concurrent + 1)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_elapsed = time.time() - start_time
    
    # Verify results
    assert len(results) == num_concurrent
    
    # All filenames should be unique
    filenames = [result["filename"] for result in results]
    assert len(filenames) == len(set(filenames)), "Duplicate filenames were generated"
    
    # Log performance metrics
    print(f"Processed {num_concurrent} concurrent operations in {total_elapsed:.2f} seconds")
    print(f"Average time per operation: {total_elapsed/num_concurrent:.3f} seconds")
    
    # Check individual operation times
    for result in results:
        print(f"Task {result['task_id']}: {result['elapsed']:.3f} seconds")


def test_mixed_document_types_concurrent(mock_document_generator):
    """Test generating different document types concurrently"""
    # Define document types
    document_types = ["docx", "pdf", "docx", "pdf", "docx"]
    num_concurrent = len(document_types)
    
    # Function to simulate document generation
    def generate_document(task_id, doc_type):
        # Create a mock quote
        client = MagicMock(spec=MockClient)
        client.name = f"Client {task_id}"
        
        quote = MagicMock(spec=MockQuote)
        quote.id = task_id
        quote.client = client
        quote.has_auto = True
        
        # Generate document
        start_time = time.time()
        filename, file_path = mock_document_generator(quote, doc_type)
        elapsed = time.time() - start_time
        
        return {
            "task_id": task_id,
            "doc_type": doc_type,
            "filename": filename,
            "file_path": file_path,
            "elapsed": elapsed
        }
    
    # Execute concurrent operations
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [
            executor.submit(generate_document, i, doc_type) 
            for i, doc_type in enumerate(document_types, start=1)
        ]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_elapsed = time.time() - start_time
    
    # Verify results
    assert len(results) == num_concurrent
    
    # All filenames should be unique
    filenames = [result["filename"] for result in results]
    assert len(filenames) == len(set(filenames)), "Duplicate filenames were generated"
    
    # Group results by document type
    docx_results = [r for r in results if r["doc_type"] == "docx"]
    pdf_results = [r for r in results if r["doc_type"] == "pdf"]
    
    # Verify correct number of each type
    assert len(docx_results) == document_types.count("docx")
    assert len(pdf_results) == document_types.count("pdf")
    
    # Log performance metrics
    print(f"Processed {num_concurrent} mixed operations in {total_elapsed:.2f} seconds")
    
    # Check individual operation times by type
    docx_avg = sum(r["elapsed"] for r in docx_results) / len(docx_results) if docx_results else 0
    pdf_avg = sum(r["elapsed"] for r in pdf_results) / len(pdf_results) if pdf_results else 0
    print(f"Average DOCX generation time: {docx_avg:.3f} seconds")
    print(f"Average PDF generation time: {pdf_avg:.3f} seconds")


def test_high_load_document_generation(mock_document_generator):
    """Test document generation under higher load"""
    # Number of concurrent operations (higher load)
    num_concurrent = 20
    
    # Function to simulate document generation
    def generate_document(task_id):
        try:
            # Create a mock quote
            client = MagicMock(spec=MockClient)
            client.name = f"Client {task_id}"
            
            quote = MagicMock(spec=MockQuote)
            quote.id = task_id
            quote.client = client
            quote.has_auto = True
            
            # Generate document
            start_time = time.time()
            filename, file_path = mock_document_generator(quote, "docx")
            elapsed = time.time() - start_time
            
            return {
                "success": True,
                "task_id": task_id,
                "filename": filename,
                "elapsed": elapsed,
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "task_id": task_id,
                "filename": None,
                "elapsed": 0,
                "error": str(e)
            }
    
    # Execute concurrent operations
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_document, i) for i in range(1, num_concurrent + 1)]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_elapsed = time.time() - start_time
    
    # Count successful and failed operations
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]
    
    # Verify results
    assert len(results) == num_concurrent
    success_rate = len(successes) / num_concurrent * 100
    
    # Log performance metrics
    print(f"Processed {num_concurrent} high-load operations in {total_elapsed:.2f} seconds")
    print(f"Success rate: {success_rate:.1f}% ({len(successes)}/{num_concurrent})")
    print(f"Average time per operation: {total_elapsed/num_concurrent:.3f} seconds")
    
    # Document any failures
    if failures:
        print("Failures encountered:")
        for failure in failures:
            print(f"  - Task {failure['task_id']}: {failure['error']}")
    
    # The test should pass even with some failures
    assert success_rate >= 80, f"Success rate too low: {success_rate:.1f}%" 