from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import logging
import shutil
from pathlib import Path

from app.db.database import get_db
from app.models.quote import Document, Quote
from app.schemas.quote import Document as DocumentSchema, DocumentCreate
from app.services.document_generator import generate_quote_document
from app.auth.jwt import get_current_active_user, TokenData

# Set up logging
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

router = APIRouter()

# Create directory for document storage if it doesn't exist
DOCUMENT_DIR = Path("./documents")
DOCUMENT_DIR.mkdir(exist_ok=True)

@router.post("/{quote_id}/generate", response_model=DocumentSchema, status_code=status.HTTP_201_CREATED)
async def generate_document(
    request: Request,
    quote_id: int,
    file_type: str = Query("docx", description="Document type to generate (docx or pdf)"),
    background_tasks: BackgroundTasks = None,
    template_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Generate a document from a quote.
    
    Parameters:
    - quote_id: ID of the quote to generate a document for
    - file_type: Type of document to generate (docx or pdf)
    - template_type: Optional template type to use
    """
    logger.info(f"Document generation request received for quote {quote_id}, type: {file_type}")
    
    # Log client information
    client_host = request.client.host if request.client else "unknown"
    logger.info(f"Request from: {client_host}")
    
    # Check if quote exists
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        logger.warning(f"Quote not found: {quote_id}")
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Validate file type
    if file_type.lower() not in ["docx", "pdf"]:
        logger.warning(f"Invalid file type requested: {file_type}")
        raise HTTPException(status_code=400, detail="File type must be 'docx' or 'pdf'")
    
    try:
        # Generate document
        logger.info(f"Calling document generator for quote {quote_id}")
        filename, file_path = generate_quote_document(quote, file_type.lower())
        
        # Create document record in database
        document = Document(
            quote_id=quote_id,
            filename=filename,
            file_path=file_path,
            file_type=file_type.lower()
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        logger.info(f"Document generated successfully: {filename}")
        
        return document
    except Exception as e:
        logger.error(f"Error generating document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")

@router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Download a document by its ID.
    
    Parameters:
    - document_id: ID of the document to download
    """
    logger.info(f"Document download request received for document {document_id}")
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        logger.warning(f"Document not found: {document_id}")
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = document.file_path
    if not os.path.exists(file_path):
        logger.error(f"Document file not found at path: {file_path}")
        raise HTTPException(status_code=404, detail="Document file not found")
    
    # Determine the content type based on file extension
    content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if document.file_type.lower() == "pdf":
        content_type = "application/pdf"
    
    logger.info(f"Serving document: {document.filename}")
    
    return FileResponse(
        path=file_path,
        filename=document.filename,
        media_type=content_type
    )

@router.get("/quote/{quote_id}", response_model=List[DocumentSchema])
async def list_quote_documents(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    List all documents for a quote.
    
    Parameters:
    - quote_id: ID of the quote to list documents for
    """
    logger.info(f"Document list request received for quote {quote_id}")
    
    # Check if quote exists
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        logger.warning(f"Quote not found: {quote_id}")
        raise HTTPException(status_code=404, detail="Quote not found")
    
    logger.info(f"Returning {len(quote.documents)} documents for quote {quote_id}")
    
    return quote.documents

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_active_user)
):
    """
    Delete a document.
    
    Parameters:
    - document_id: ID of the document to delete
    """
    logger.info(f"Document deletion request received for document {document_id}")
    
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        logger.warning(f"Document not found: {document_id}")
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the file if it exists
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
            logger.info(f"Deleted file: {document.file_path}")
        except Exception as e:
            logger.error(f"Error deleting file {document.file_path}: {str(e)}")
            # Continue with database deletion even if file deletion fails
    else:
        logger.warning(f"File not found for deletion: {document.file_path}")
    
    # Delete from database
    db.delete(document)
    db.commit()
    
    logger.info(f"Document {document_id} deleted successfully")
    
    return None
