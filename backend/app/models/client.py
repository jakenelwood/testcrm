from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic client info (primary named insured)
    name = Column(String, index=True)  # pniname
    phone_number = Column(String)      # pniphone
    email = Column(String)             # pniemail
    address = Column(String)           # pniaddr
    mailing_address = Column(String)   # pni-mailingaddr
    
    # Extended client info
    gender = Column(String)            # pnig
    marital_status = Column(String)    # pnims
    date_of_birth = Column(String)     # pnidob
    education_occupation = Column(String) # pniedocc
    drivers_license = Column(String)   # pnidln
    license_state = Column(String)     # pnidls
    ssn = Column(String)               # pnissn
    
    # Referral info
    referred_by = Column(String)       # referred-by
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    quotes = relationship("Quote", back_populates="client", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Client {self.name}>"
