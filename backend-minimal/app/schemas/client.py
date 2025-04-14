from pydantic import BaseModel, EmailStr
from typing import Optional, List, ForwardRef
from datetime import datetime

# Use ForwardRef for QuoteBase to avoid circular imports
QuoteBase = ForwardRef("QuoteBase")

class ClientBase(BaseModel):
    name: str
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    mailing_address: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    date_of_birth: Optional[str] = None
    education_occupation: Optional[str] = None
    drivers_license: Optional[str] = None
    license_state: Optional[str] = None
    ssn: Optional[str] = None
    referred_by: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = None

class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ClientWithQuotes(Client):
    # Use string literal for forward reference
    quotes: List["QuoteBase"] = []
    
    class Config:
        from_attributes = True
