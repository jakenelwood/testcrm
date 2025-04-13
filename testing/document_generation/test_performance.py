import pytest
import os
import time
import concurrent.futures
from pathlib import Path
from unittest.mock import patch, MagicMock
import psutil

# Test paths
TEST_DIR = Path("./testing/document_generation")
TEST_DIR.mkdir(exist_ok=True, parents=True)
PERF_OUTPUT_DIR = TEST_DIR / "perf_output"
PERF_OUTPUT_DIR.mkdir(exist_ok=True)

# Constants for performance testing
SMALL_DOCUMENT_SIZE = 10  # Small document with 10 placeholders
MEDIUM_DOCUMENT_SIZE = 50  # Medium document with 50 placeholders
LARGE_DOCUMENT_SIZE = 200  # Large document with 200 placeholders
EXTRA_LARGE_DOCUMENT_SIZE = 500  # Extra large document with 500 placeholders

@pytest.fixture
def mock_document_data(request):
    """Create sample document data for performance testing with different sizes"""
    # Get the size parameter from the test, default to medium size
    size = getattr(request, "param", MEDIUM_DOCUMENT_SIZE)
    
    # Create a dictionary with the specified number of placeholders
    data = {}
    for i in range(size):
        data[f"placeholder_{i}"] = f"Value for placeholder {i}"
    
    return data

@pytest.fixture
def mock_quote_with_size(request):
    """Create a mock quote with configurable data size"""
    # Get the size parameter from the test
    size = getattr(request, "param", MEDIUM_DOCUMENT_SIZE)
    
    # Create client
    client = MagicMock()
    client.name = "Test Client"
    client.phone_number = "555-123-4567"
    client.email = "test@example.com"
    client.address = "123 Test St, Test City, TS 12345"
    
    # Create a quote with auto data of the specified size
    quote = MagicMock()
    quote.id = 1
    quote.client = client
    quote.has_auto = True
    quote.has_home = True
    quote.has_specialty = True
    
    # Create auto data with many vehicles
    auto_data = {
        "current_carrier": "Test Insurance",
        "months_with_carrier": "24",
        "vehicles": []
    }
    
    # Add vehicles based on size
    num_vehicles = min(8, size // 10)  # Up to 8 vehicles
    for i in range(num_vehicles):
        vehicle = {
            "year": f"20{20+i}",
            "make": f"Make {i}",
            "model": f"Model {i}",
            "vin": f"VIN{i}{'X'*14}",
            "usage": "Commute",
            "mileage": f"{i+1}0000",
            "driver": f"Driver {i}",
            "comprehensive": f"${i+1}00",
            "collision": f"${i+1}00",
            "glass": i % 2 == 0,
            "towing": i % 2 == 0,
            "rental_reimbursement": i % 2 == 0
        }
        auto_data["vehicles"].append(vehicle)
    
    # Create home data of appropriate size
    home_data = {}
    for i in range(min(size, 56)):  # Max 56 home fields
        home_data[f"field_{i}"] = f"Value {i}"
    
    # Create specialty data with items
    specialty_data = {"items": []}
    num_specialty_items = min(8, size // 20)  # Up to 8 specialty items
    for i in range(num_specialty_items):
        item = {
            "type_toy": f"Type {i}",
            "year": f"20{20+i}",
            "make": f"Make {i}",
            "model": f"Model {i}",
            "vin": f"VIN{i}{'X'*14}",
            "comprehensive_deductible": f"${i+1}00",
            "market_value": f"${i+1}0000"
        }
        specialty_data["items"].append(item)
    
    quote.auto_data = auto_data
    quote.home_data = home_data
    quote.specialty_data = specialty_data
    
    return quote

def test_document_generation_small_performance(mock_quote_with_size):
    """Test performance with small document size"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("test_small.docx", "/tmp/test_small.docx")
        
        # Measure performance
        start_time = time.time()
        mem_before = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        
        # Generate document
        filename, file_path = generate_quote_document(mock_quote_with_size, "docx")
        
        # Measure performance after
        elapsed_time = time.time() - start_time
        mem_after = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        mem_used = mem_after - mem_before
        
        # Log performance metrics
        print(f"Small document generation time: {elapsed_time:.4f} seconds")
        print(f"Memory used: {mem_used:.2f} MB")
        
        # Basic assertion to ensure reasonable performance
        assert elapsed_time < 1.0, "Small document generation should be fast"

@pytest.mark.parametrize("mock_quote_with_size", [MEDIUM_DOCUMENT_SIZE], indirect=True)
def test_document_generation_medium_performance(mock_quote_with_size):
    """Test performance with medium document size"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("test_medium.docx", "/tmp/test_medium.docx")
        
        # Measure performance
        start_time = time.time()
        mem_before = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        
        # Generate document
        filename, file_path = generate_quote_document(mock_quote_with_size, "docx")
        
        # Measure performance after
        elapsed_time = time.time() - start_time
        mem_after = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        mem_used = mem_after - mem_before
        
        # Log performance metrics
        print(f"Medium document generation time: {elapsed_time:.4f} seconds")
        print(f"Memory used: {mem_used:.2f} MB")
        
        # Basic assertion to ensure reasonable performance
        assert elapsed_time < 2.0, "Medium document generation should be reasonably fast"

@pytest.mark.parametrize("mock_quote_with_size", [LARGE_DOCUMENT_SIZE], indirect=True)
def test_document_generation_large_performance(mock_quote_with_size):
    """Test performance with large document size"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("test_large.docx", "/tmp/test_large.docx")
        
        # Measure performance
        start_time = time.time()
        mem_before = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        
        # Generate document
        filename, file_path = generate_quote_document(mock_quote_with_size, "docx")
        
        # Measure performance after
        elapsed_time = time.time() - start_time
        mem_after = psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024  # MB
        mem_used = mem_after - mem_before
        
        # Log performance metrics
        print(f"Large document generation time: {elapsed_time:.4f} seconds")
        print(f"Memory used: {mem_used:.2f} MB")
        
        # Basic assertion to ensure reasonable performance
        assert elapsed_time < 5.0, "Large document generation should complete within 5 seconds"

def test_concurrent_document_generation_performance():
    """Test performance with concurrent document generation"""
    import concurrent.futures
    from backend.app.services.document_generator import generate_quote_document
    
    # Number of concurrent documents to generate
    num_concurrent = 10
    
    # Create mock quotes of different sizes
    mock_quotes = []
    for i in range(num_concurrent):
        # Create a client
        client = MagicMock()
        client.name = f"Client {i}"
        
        # Create a quote
        quote = MagicMock()
        quote.id = i + 1
        quote.client = client
        quote.has_auto = i % 3 == 0
        quote.has_home = i % 3 == 1
        quote.has_specialty = i % 3 == 2
        
        # Add basic data
        if quote.has_auto:
            quote.auto_data = {"vehicles": [{"year": "2020", "make": "Test", "model": "Model"}]}
        if quote.has_home:
            quote.home_data = {"field_1": "Value 1"}
        if quote.has_specialty:
            quote.specialty_data = {"items": [{"type_toy": "Type", "year": "2020"}]}
            
        mock_quotes.append(quote)
    
    # Function to perform document generation with mocked components
    def generate_document(quote, doc_type):
        # Create patches for document generation
        with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
            # Configure mock to return a test document path
            mock_generate_docx.return_value = (f"test_{quote.id}.{doc_type}", f"/tmp/test_{quote.id}.{doc_type}")
            
            # For PDF tests, also patch the PDF conversion
            if doc_type == "pdf":
                with patch('backend.app.services.document_generator._generate_pdf') as mock_generate_pdf:
                    mock_generate_pdf.return_value = (f"test_{quote.id}.pdf", f"/tmp/test_{quote.id}.pdf")
            
            # Measure performance
            start_time = time.time()
            
            # Generate document
            filename, file_path = generate_quote_document(quote, doc_type)
            
            # Measure elapsed time
            elapsed_time = time.time() - start_time
            
            return {
                "quote_id": quote.id,
                "doc_type": doc_type,
                "elapsed_time": elapsed_time,
                "filename": filename,
                "file_path": file_path
            }
    
    # Create a mix of DOCX and PDF documents to generate concurrently
    tasks = []
    for i, quote in enumerate(mock_quotes):
        doc_type = "pdf" if i % 2 == 0 else "docx"
        tasks.append((quote, doc_type))
    
    # Execute concurrent document generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_document, quote, doc_type) for quote, doc_type in tasks]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_time = time.time() - start_time
    
    # Analyze results
    docx_results = [r for r in results if r["doc_type"] == "docx"]
    pdf_results = [r for r in results if r["doc_type"] == "pdf"]
    
    # Calculate performance metrics
    docx_avg_time = sum(r["elapsed_time"] for r in docx_results) / len(docx_results) if docx_results else 0
    pdf_avg_time = sum(r["elapsed_time"] for r in pdf_results) / len(pdf_results) if pdf_results else 0
    
    # Log performance metrics
    print(f"Concurrent generation total time: {total_time:.4f} seconds")
    print(f"DOCX average time: {docx_avg_time:.4f} seconds")
    print(f"PDF average time: {pdf_avg_time:.4f} seconds")
    print(f"Throughput: {num_concurrent / total_time:.2f} documents/second")
    
    # Basic assertions for performance
    assert total_time < num_concurrent * 0.5, "Concurrent generation should be significantly faster than sequential"

def test_high_load_document_generation():
    """Test document generation under high load"""
    import concurrent.futures
    from backend.app.services.document_generator import generate_quote_document
    
    # Number of concurrent documents to generate
    num_concurrent = 20
    
    # Create mock quotes
    mock_quotes = []
    for i in range(num_concurrent):
        # Create a client
        client = MagicMock()
        client.name = f"Client {i}"
        
        # Create a quote with minimal data to reduce overhead
        quote = MagicMock()
        quote.id = i + 1
        quote.client = client
        quote.has_auto = True
        quote.has_home = False
        quote.has_specialty = False
        quote.auto_data = {"vehicles": [{"year": "2020", "make": "Test", "model": "Model"}]}
            
        mock_quotes.append(quote)
    
    # Function to perform document generation with mocked components
    def generate_document(quote):
        try:
            # Create patches for document generation
            with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
                # Configure mock to return a test document path
                mock_generate_docx.return_value = (f"test_{quote.id}.docx", f"/tmp/test_{quote.id}.docx")
                
                # Measure performance
                start_time = time.time()
                
                # Generate document
                filename, file_path = generate_quote_document(quote, "docx")
                
                # Measure elapsed time
                elapsed_time = time.time() - start_time
                
                return {
                    "quote_id": quote.id,
                    "success": True,
                    "elapsed_time": elapsed_time,
                    "error": None
                }
        except Exception as e:
            # Record any errors
            return {
                "quote_id": quote.id,
                "success": False,
                "elapsed_time": 0,
                "error": str(e)
            }
    
    # Execute concurrent document generation with high load
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
        futures = [executor.submit(generate_document, quote) for quote in mock_quotes]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_time = time.time() - start_time
    
    # Analyze results
    successful_results = [r for r in results if r["success"]]
    failed_results = [r for r in results if not r["success"]]
    
    # Calculate performance metrics
    success_rate = len(successful_results) / num_concurrent * 100
    avg_time = sum(r["elapsed_time"] for r in successful_results) / len(successful_results) if successful_results else 0
    
    # Log performance metrics
    print(f"High load generation total time: {total_time:.4f} seconds")
    print(f"Success rate: {success_rate:.1f}% ({len(successful_results)}/{num_concurrent})")
    print(f"Average time per document: {avg_time:.4f} seconds")
    print(f"Throughput: {len(successful_results) / total_time:.2f} documents/second")
    
    # List any errors
    if failed_results:
        print("Errors encountered:")
        for failure in failed_results:
            print(f"  - Quote {failure['quote_id']}: {failure['error']}")
    
    # Assertions for high load performance
    assert success_rate >= 80, f"Success rate too low: {success_rate:.1f}%"
    assert total_time < num_concurrent * 0.5, "High load generation should be efficient"

def test_memory_profile_document_generation():
    """Test memory usage during document generation"""
    import tracemalloc
    from backend.app.services.document_generator import generate_quote_document, _create_data_dictionary
    
    # Create a large mock quote
    mock_quote = MagicMock()
    mock_client = MagicMock()
    mock_quote.client = mock_client
    mock_quote.has_auto = True
    mock_quote.has_home = True
    mock_quote.has_specialty = True
    
    # Add lots of data
    auto_data = {"vehicles": []}
    for i in range(8):  # Maximum 8 vehicles
        vehicle = {f"field_{j}": f"Value {j}" for j in range(20)}  # 20 fields per vehicle
        auto_data["vehicles"].append(vehicle)
    
    home_data = {f"field_{i}": f"Value {i}" for i in range(50)}  # 50 home fields
    
    specialty_data = {"items": []}
    for i in range(8):  # Maximum 8 specialty items
        item = {f"field_{j}": f"Value {j}" for j in range(20)}  # 20 fields per specialty item
        specialty_data["items"].append(item)
    
    mock_quote.auto_data = auto_data
    mock_quote.home_data = home_data
    mock_quote.specialty_data = specialty_data
    
    # Start memory tracking
    tracemalloc.start()
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("test_memory.docx", "/tmp/test_memory.docx")
        
        # Take snapshot before
        snapshot1 = tracemalloc.take_snapshot()
        
        # Generate data dictionary
        data = _create_data_dictionary(mock_quote, mock_client)
        
        # Take snapshot after data dictionary creation
        snapshot2 = tracemalloc.take_snapshot()
        
        # Generate document
        filename, file_path = generate_quote_document(mock_quote, "docx")
        
        # Take snapshot after document generation
        snapshot3 = tracemalloc.take_snapshot()
    
    # Calculate memory usage
    dict_stats = snapshot2.compare_to(snapshot1, 'lineno')
    gen_stats = snapshot3.compare_to(snapshot2, 'lineno')
    
    # Log memory statistics
    total_dict_memory = sum(stat.size_diff for stat in dict_stats)
    total_gen_memory = sum(stat.size_diff for stat in gen_stats)
    
    print(f"Memory for data dictionary: {total_dict_memory / 1024:.2f} KB")
    print(f"Memory for document generation: {total_gen_memory / 1024:.2f} KB")
    print(f"Total memory usage: {(total_dict_memory + total_gen_memory) / 1024:.2f} KB")
    
    # Print top memory consumers
    print("\nTop 5 memory consumers for data dictionary:")
    for stat in dict_stats[:5]:
        print(f"{stat.size_diff / 1024:.2f} KB: {stat.traceback.format()[0]}")
    
    print("\nTop 5 memory consumers for document generation:")
    for stat in gen_stats[:5]:
        print(f"{stat.size_diff / 1024:.2f} KB: {stat.traceback.format()[0]}")
    
    # Stop memory tracking
    tracemalloc.stop()
    
    # Basic assertion to ensure memory usage is reasonable
    assert total_dict_memory + total_gen_memory < 10 * 1024 * 1024, "Memory usage should be under 10 MB"

if __name__ == "__main__":
    pytest.main(["-v", "test_performance.py"]) 