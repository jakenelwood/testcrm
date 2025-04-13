from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    file_type: str  # DOCX, PDF
    
class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    quote_id: int
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuoteBase(BaseModel):
    effective_date: Optional[str] = None
    has_auto: bool = False
    has_home: bool = False
    has_specialty: bool = False
    auto_data: Optional[Dict[str, Any]] = None
    home_data: Optional[Dict[str, Any]] = None
    specialty_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class QuoteCreate(QuoteBase):
    client_id: int

class QuoteUpdate(QuoteBase):
    client_id: Optional[int] = None

class Quote(QuoteBase):
    id: int
    client_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class QuoteWithDocuments(Quote):
    documents: List[Document] = []

# Import client schema after defining Quote to avoid circular imports
from app.schemas.client import ClientWithQuotes

# Modern Pydantic doesn't accept localns arguments
ClientWithQuotes.update_forward_refs()
