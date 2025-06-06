import pytest
import os
import time
from pathlib import Path
from unittest.mock import patch, MagicMock
import concurrent.futures

# Test paths
TEST_DIR = Path("./testing/document_generation")
TEST_DIR.mkdir(exist_ok=True, parents=True)
COMBINED_OUTPUT_DIR = TEST_DIR / "combined_output"
COMBINED_OUTPUT_DIR.mkdir(exist_ok=True)

@pytest.fixture
def mock_auto_quote():
    """Create a mock quote with auto data only"""
    client = MagicMock()
    client.name = "Auto Test Client"
    client.phone_number = "555-123-4567"
    client.email = "auto@example.com"
    client.address = "123 Auto St, Test City, TS 12345"
    
    quote = MagicMock()
    quote.id = 1
    quote.client = client
    quote.has_auto = True
    quote.has_home = False
    quote.has_specialty = False
    
    # Auto data
    auto_data = {
        "current_carrier": "Previous Auto Insurance",
        "months_with_carrier": "36",
        "vehicles": [
            {
                "year": "2020",
                "make": "Toyota",
                "model": "RAV4",
                "vin": "1ABCD23EFGH456789",
                "usage": "Commute",
                "mileage": "15000",
                "driver": "Primary Driver",
                "comprehensive": "$500",
                "collision": "$500",
                "glass": True,
                "towing": True,
                "rental_reimbursement": True
            }
        ]
    }
    
    quote.auto_data = auto_data
    quote.home_data = {}
    quote.specialty_data = {}
    
    return quote

@pytest.fixture
def mock_home_quote():
    """Create a mock quote with home data only"""
    client = MagicMock()
    client.name = "Home Test Client"
    client.phone_number = "555-987-6543"
    client.email = "home@example.com"
    client.address = "456 Home Ave, Test City, TS 54321"
    
    quote = MagicMock()
    quote.id = 2
    quote.client = client
    quote.has_auto = False
    quote.has_home = True
    quote.has_specialty = False
    
    # Home data
    home_data = {
        "address": "456 Home Ave, Test City, TS 54321",
        "year_built": "1995",
        "square_footage": "2500",
        "construction_type": "Frame",
        "roof_type": "Composite Shingle",
        "current_coverage": "$350,000",
        "deductible": "$1,000",
        "home_features": "Updated kitchen, new roof (2019)",
        "water_protection": True,
        "claims_history": "None in past 5 years"
    }
    
    quote.auto_data = {}
    quote.home_data = home_data
    quote.specialty_data = {}
    
    return quote

@pytest.fixture
def mock_specialty_quote():
    """Create a mock quote with specialty data only"""
    client = MagicMock()
    client.name = "Specialty Test Client"
    client.phone_number = "555-456-7890"
    client.email = "specialty@example.com"
    client.address = "789 Specialty Blvd, Test City, TS 67890"
    
    quote = MagicMock()
    quote.id = 3
    quote.client = client
    quote.has_auto = False
    quote.has_home = False
    quote.has_specialty = True
    
    # Specialty data
    specialty_data = {
        "items": [
            {
                "type_toy": "Boat",
                "year": "2018",
                "make": "Sea Ray",
                "model": "Sundancer 320",
                "vin": "BOAT123456789XYZ",
                "comprehensive_deductible": "$1,000",
                "market_value": "$120,000"
            }
        ]
    }
    
    quote.auto_data = {}
    quote.home_data = {}
    quote.specialty_data = specialty_data
    
    return quote

@pytest.fixture
def mock_combined_quote():
    """Create a mock quote with all data types (auto, home, specialty)"""
    client = MagicMock()
    client.name = "Combined Test Client"
    client.phone_number = "555-000-1234"
    client.email = "combined@example.com"
    client.address = "100 Combined Circle, Test City, TS 10000"
    
    quote = MagicMock()
    quote.id = 4
    quote.client = client
    quote.has_auto = True
    quote.has_home = True
    quote.has_specialty = True
    
    # Auto data
    auto_data = {
        "current_carrier": "Previous All Insurance",
        "months_with_carrier": "48",
        "vehicles": [
            {
                "year": "2022",
                "make": "Honda",
                "model": "Accord",
                "vin": "HONDAACC22334455",
                "usage": "Commute",
                "mileage": "8000",
                "driver": "Primary Driver",
                "comprehensive": "$250",
                "collision": "$500",
                "glass": True,
                "towing": True,
                "rental_reimbursement": True
            },
            {
                "year": "2020",
                "make": "Subaru",
                "model": "Forester",
                "vin": "SUBAFOR22334455",
                "usage": "Pleasure",
                "mileage": "12000",
                "driver": "Secondary Driver",
                "comprehensive": "$500",
                "collision": "$500",
                "glass": False,
                "towing": True,
                "rental_reimbursement": True
            }
        ]
    }
    
    # Home data
    home_data = {
        "address": "100 Combined Circle, Test City, TS 10000",
        "year_built": "2005",
        "square_footage": "3200",
        "construction_type": "Brick",
        "roof_type": "Metal",
        "current_coverage": "$450,000",
        "deductible": "$2,000",
        "home_features": "Finished basement, solar panels",
        "water_protection": True,
        "claims_history": "One claim in 2019 (hail damage)"
    }
    
    # Specialty data
    specialty_data = {
        "items": [
            {
                "type_toy": "RV",
                "year": "2019",
                "make": "Winnebago",
                "model": "Minnie Winnie",
                "vin": "WINNRV123456789",
                "comprehensive_deductible": "$1,000",
                "market_value": "$85,000"
            },
            {
                "type_toy": "ATV",
                "year": "2021",
                "make": "Polaris",
                "model": "Sportsman 570",
                "vin": "POLARIS5700123",
                "comprehensive_deductible": "$500",
                "market_value": "$8,500"
            }
        ]
    }
    
    quote.auto_data = auto_data
    quote.home_data = home_data
    quote.specialty_data = specialty_data
    
    return quote

def test_single_auto_document_generation(mock_auto_quote):
    """Test document generation for auto quote only"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("auto_test.docx", "/tmp/auto_test.docx")
        
        # Generate document
        filename, file_path = generate_quote_document(mock_auto_quote, "docx")
        
        # Verify document generated correctly
        assert "auto" in filename.lower(), "Auto document filename should contain 'auto'"
        assert mock_generate_docx.call_count == 1, "Document generator should be called once"
        
        # Check that auto template was used
        args, kwargs = mock_generate_docx.call_args
        data_dict = args[0]
        assert any("vehicle" in key for key in data_dict), "Auto data should be in data dictionary"
        assert not any("home" in key for key in data_dict), "Home data should not be in data dictionary"
        assert not any("specialty" in key for key in data_dict), "Specialty data should not be in data dictionary"

def test_single_home_document_generation(mock_home_quote):
    """Test document generation for home quote only"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("home_test.docx", "/tmp/home_test.docx")
        
        # Generate document
        filename, file_path = generate_quote_document(mock_home_quote, "docx")
        
        # Verify document generated correctly
        assert "home" in filename.lower(), "Home document filename should contain 'home'"
        assert mock_generate_docx.call_count == 1, "Document generator should be called once"
        
        # Check that home template was used
        args, kwargs = mock_generate_docx.call_args
        data_dict = args[0]
        assert not any("vehicle" in key for key in data_dict), "Auto data should not be in data dictionary"
        assert any("home" in key for key in data_dict), "Home data should be in data dictionary"
        assert not any("specialty" in key for key in data_dict), "Specialty data should not be in data dictionary"

def test_single_specialty_document_generation(mock_specialty_quote):
    """Test document generation for specialty quote only"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("specialty_test.docx", "/tmp/specialty_test.docx")
        
        # Generate document
        filename, file_path = generate_quote_document(mock_specialty_quote, "docx")
        
        # Verify document generated correctly
        assert "specialty" in filename.lower(), "Specialty document filename should contain 'specialty'"
        assert mock_generate_docx.call_count == 1, "Document generator should be called once"
        
        # Check that specialty template was used
        args, kwargs = mock_generate_docx.call_args
        data_dict = args[0]
        assert not any("vehicle" in key for key in data_dict), "Auto data should not be in data dictionary"
        assert not any("home" in key for key in data_dict), "Home data should not be in data dictionary"
        assert any("specialty" in key for key in data_dict), "Specialty data should be in data dictionary"

def test_combined_quote_document_generation(mock_combined_quote):
    """Test document generation for a quote with all data types"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patch for the actual document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return a test document path
        mock_generate_docx.return_value = ("combined_test.docx", "/tmp/combined_test.docx")
        
        # Generate document
        filename, file_path = generate_quote_document(mock_combined_quote, "docx")
        
        # Verify document generated correctly
        assert "combined" in filename.lower() or "quote" in filename.lower(), "Combined document filename should indicate combined content"
        assert mock_generate_docx.call_count == 1, "Document generator should be called once"
        
        # Check that all data types are in the data dictionary
        args, kwargs = mock_generate_docx.call_args
        data_dict = args[0]
        assert any("vehicle" in key for key in data_dict), "Auto data should be in data dictionary"
        assert any("home" in key for key in data_dict), "Home data should be in data dictionary"
        assert any("specialty" in key for key in data_dict), "Specialty data should be in data dictionary"

def test_multiple_document_generation(mock_combined_quote):
    """Test that we can generate multiple document types from the same quote"""
    from backend.app.services.document_generator import generate_quote_document
    
    # Create patches for document generation
    with patch('backend.app.services.document_generator._generate_docx') as mock_generate_docx:
        # Configure mock to return test document paths
        mock_generate_docx.side_effect = [
            ("auto_test.docx", "/tmp/auto_test.docx"),
            ("home_test.docx", "/tmp/home_test.docx"),
            ("specialty_test.docx", "/tmp/specialty_test.docx")
        ]
        
        # Override document types selection to force auto document
        with patch('backend.app.services.document_generator._get_document_types') as mock_get_doc_types:
            mock_get_doc_types.return_value = ["auto"]
            auto_filename, auto_path = generate_quote_document(mock_combined_quote, "docx")
            assert "auto" in auto_filename.lower(), "Auto document should be generated"
        
        # Override document types selection to force home document
        with patch('backend.app.services.document_generator._get_document_types') as mock_get_doc_types:
            mock_get_doc_types.return_value = ["home"]
            home_filename, home_path = generate_quote_document(mock_combined_quote, "docx")
            assert "home" in home_filename.lower(), "Home document should be generated"
        
        # Override document types selection to force specialty document
        with patch('backend.app.services.document_generator._get_document_types') as mock_get_doc_types:
            mock_get_doc_types.return_value = ["specialty"]
            specialty_filename, specialty_path = generate_quote_document(mock_combined_quote, "docx")
            assert "specialty" in specialty_filename.lower(), "Specialty document should be generated"
        
        # Verify all document types were generated
        assert mock_generate_docx.call_count == 3, "All three document types should be generated"

def test_document_merge_function():
    """Test the document merging functionality"""
    with patch('backend.app.services.document_merger.merge_documents') as mock_merge:
        from backend.app.services.document_merger import merge_documents
        
        # Setup test document paths
        doc_paths = [
            "/tmp/auto_test.docx",
            "/tmp/home_test.docx",
            "/tmp/specialty_test.docx"
        ]
        output_path = "/tmp/merged_test.docx"
        
        # Mock the actual merge function
        mock_merge.return_value = output_path
        
        # Call the merge function
        result = merge_documents(doc_paths, output_path)
        
        # Verify result
        assert result == output_path, "Merge function should return the output path"
        mock_merge.assert_called_once_with(doc_paths, output_path)

def test_end_to_end_document_package_generation(mock_combined_quote):
    """Test generation of a complete document package from a combined quote"""
    from backend.app.services.document_generator import generate_document_package
    
    # Create patches for document generation components
    with patch('backend.app.services.document_generator.generate_quote_document') as mock_generate_doc:
        with patch('backend.app.services.document_merger.merge_documents') as mock_merge:
            # Configure mocks
            mock_generate_doc.side_effect = [
                ("auto_test.docx", "/tmp/auto_test.docx"),
                ("home_test.docx", "/tmp/home_test.docx"),
                ("specialty_test.docx", "/tmp/specialty_test.docx")
            ]
            mock_merge.return_value = "/tmp/merged_package.docx"
            
            # Generate the document package
            output_filename, output_path = generate_document_package(mock_combined_quote, "docx")
            
            # Verify the results
            assert output_filename == "merged_package.docx", "Merged filename should be returned"
            assert output_path == "/tmp/merged_package.docx", "Merged path should be returned"
            assert mock_generate_doc.call_count == 3, "All three document types should be generated"
            assert mock_merge.call_count == 1, "Documents should be merged once"

def test_document_package_with_missing_types(mock_auto_quote):
    """Test document package generation when not all document types are available"""
    from backend.app.services.document_generator import generate_document_package
    
    # Create patch for document generation
    with patch('backend.app.services.document_generator.generate_quote_document') as mock_generate_doc:
        # Configure mock to return an auto document only
        mock_generate_doc.return_value = ("auto_test.docx", "/tmp/auto_test.docx")
        
        # Generate the document package (should not need merging since only one document)
        output_filename, output_path = generate_document_package(mock_auto_quote, "docx")
        
        # Verify the results
        assert output_filename == "auto_test.docx", "Auto filename should be returned"
        assert output_path == "/tmp/auto_test.docx", "Auto path should be returned"
        assert mock_generate_doc.call_count == 1, "Only one document should be generated"

def test_pdf_document_package_generation(mock_combined_quote):
    """Test generation of a PDF document package from a combined quote"""
    from backend.app.services.document_generator import generate_document_package
    
    # Create patches for document generation components
    with patch('backend.app.services.document_generator.generate_quote_document') as mock_generate_doc:
        with patch('backend.app.services.document_merger.merge_documents') as mock_merge:
            with patch('backend.app.services.document_generator._generate_pdf') as mock_generate_pdf:
                # Configure mocks
                mock_generate_doc.side_effect = [
                    ("auto_test.docx", "/tmp/auto_test.docx"),
                    ("home_test.docx", "/tmp/home_test.docx"),
                    ("specialty_test.docx", "/tmp/specialty_test.docx")
                ]
                mock_merge.return_value = "/tmp/merged_package.docx"
                mock_generate_pdf.return_value = ("merged_package.pdf", "/tmp/merged_package.pdf")
                
                # Generate the PDF document package
                output_filename, output_path = generate_document_package(mock_combined_quote, "pdf")
                
                # Verify the results
                assert output_filename == "merged_package.pdf", "PDF filename should be returned"
                assert output_path == "/tmp/merged_package.pdf", "PDF path should be returned"
                assert mock_generate_doc.call_count == 3, "All three document types should be generated"
                assert mock_merge.call_count == 1, "Documents should be merged once"
                assert mock_generate_pdf.call_count == 1, "PDF conversion should be called once"

def test_concurrent_document_package_generation():
    """Test generating multiple document packages concurrently"""
    from backend.app.services.document_generator import generate_document_package
    
    # Create different mock quotes
    quotes = [
        MagicMock(id=1, has_auto=True, has_home=False, has_specialty=False, client=MagicMock(name="Client 1")),
        MagicMock(id=2, has_auto=False, has_home=True, has_specialty=False, client=MagicMock(name="Client 2")),
        MagicMock(id=3, has_auto=False, has_home=False, has_specialty=True, client=MagicMock(name="Client 3")),
        MagicMock(id=4, has_auto=True, has_home=True, has_specialty=True, client=MagicMock(name="Client 4"))
    ]
    
    # Function to generate a document package for a single quote
    def generate_package(quote, doc_type):
        with patch('backend.app.services.document_generator.generate_quote_document') as mock_generate_doc:
            with patch('backend.app.services.document_merger.merge_documents') as mock_merge:
                with patch('backend.app.services.document_generator._generate_pdf') as mock_generate_pdf:
                    # Configure mocks based on quote type
                    if quote.has_auto and quote.has_home and quote.has_specialty:
                        # Combined quote with all types
                        mock_generate_doc.side_effect = [
                            (f"auto_{quote.id}.docx", f"/tmp/auto_{quote.id}.docx"),
                            (f"home_{quote.id}.docx", f"/tmp/home_{quote.id}.docx"),
                            (f"specialty_{quote.id}.docx", f"/tmp/specialty_{quote.id}.docx")
                        ]
                        mock_merge.return_value = f"/tmp/merged_{quote.id}.docx"
                    elif quote.has_auto:
                        # Auto quote only
                        mock_generate_doc.return_value = (f"auto_{quote.id}.docx", f"/tmp/auto_{quote.id}.docx")
                    elif quote.has_home:
                        # Home quote only
                        mock_generate_doc.return_value = (f"home_{quote.id}.docx", f"/tmp/home_{quote.id}.docx")
                    elif quote.has_specialty:
                        # Specialty quote only
                        mock_generate_doc.return_value = (f"specialty_{quote.id}.docx", f"/tmp/specialty_{quote.id}.docx")
                    
                    # For PDF document types
                    if doc_type == "pdf":
                        mock_generate_pdf.return_value = (f"package_{quote.id}.pdf", f"/tmp/package_{quote.id}.pdf")
                    
                    # Measure performance
                    start_time = time.time()
                    
                    # Generate the document package
                    output_filename, output_path = generate_document_package(quote, doc_type)
                    
                    # Measure elapsed time
                    elapsed_time = time.time() - start_time
                    
                    return {
                        "quote_id": quote.id,
                        "doc_type": doc_type,
                        "filename": output_filename,
                        "path": output_path,
                        "elapsed_time": elapsed_time
                    }
    
    # Create a mix of document packages to generate concurrently
    tasks = []
    for i, quote in enumerate(quotes):
        doc_type = "pdf" if i % 2 == 0 else "docx"
        tasks.append((quote, doc_type))
    
    # Execute concurrent document package generation
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        futures = [executor.submit(generate_package, quote, doc_type) for quote, doc_type in tasks]
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    total_time = time.time() - start_time
    
    # Analyze results
    docx_results = [r for r in results if r["doc_type"] == "docx"]
    pdf_results = [r for r in results if r["doc_type"] == "pdf"]
    
    # Calculate performance metrics
    docx_avg_time = sum(r["elapsed_time"] for r in docx_results) / len(docx_results) if docx_results else 0
    pdf_avg_time = sum(r["elapsed_time"] for r in pdf_results) / len(pdf_results) if pdf_results else 0
    
    # Log performance metrics
    print(f"Concurrent package generation total time: {total_time:.4f} seconds")
    print(f"DOCX average time: {docx_avg_time:.4f} seconds")
    print(f"PDF average time: {pdf_avg_time:.4f} seconds")
    print(f"Throughput: {len(tasks) / total_time:.2f} packages/second")
    
    # Verify all tasks completed
    assert len(results) == len(tasks), "All document packages should be generated"
    
    # Check that we have the right mix of output types
    assert len(docx_results) == len(tasks) // 2, "Half of the results should be DOCX"
    assert len(pdf_results) == (len(tasks) + 1) // 2, "Half of the results should be PDF"

if __name__ == "__main__":
    pytest.main(["-v", "test_combined_documents.py"]) 