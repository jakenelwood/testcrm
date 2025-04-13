from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key relationship
    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="quotes")
    
    # Basic quote info
    effective_date = Column(String)  # effective-date
    
    # Quote sections flags (which parts are included)
    has_auto = Column(Boolean, default=False)
    has_home = Column(Boolean, default=False)
    has_specialty = Column(Boolean, default=False)
    
    # Auto section data stored as JSON
    auto_data = Column(JSON, nullable=True)
    
    # Home section data stored as JSON
    home_data = Column(JSON, nullable=True)
    
    # Specialty section data stored as JSON
    specialty_data = Column(JSON, nullable=True)
    
    # Document history and tracking
    documents = relationship("Document", back_populates="quote", cascade="all, delete-orphan")
    
    # Notes and additional information
    notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Quote {self.id} for client {self.client_id}>"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key relationship
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    quote = relationship("Quote", back_populates="documents")
    
    # Document info
    filename = Column(String)
    file_path = Column(String)
    file_type = Column(String)  # DOCX, PDF, etc.
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Document {self.filename} for quote {self.quote_id}>"
