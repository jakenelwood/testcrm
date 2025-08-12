"""
Asset models: Homes, Vehicles, Specialty Items
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, DECIMAL, 
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .base import Base


class Home(Base):
    __tablename__ = "homes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    address = Column(Text, nullable=False)
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    zip = Column(Text, nullable=False)
    year_built = Column(Integer)
    square_feet = Column(Integer)
    construction_type = Column(Text)
    roof_type = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("Client")
    lead = relationship("Lead")


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    make = Column(Text, nullable=False)
    model = Column(Text, nullable=False)
    year = Column(Integer)
    vin = Column(Text)
    license_plate = Column(Text)
    state = Column(Text)
    primary_use = Column(Text)
    annual_mileage = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("Client")
    lead = relationship("Lead")


class SpecialtyItem(Base):
    __tablename__ = "specialty_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    name = Column(Text, nullable=False)
    value = Column(DECIMAL(15, 2))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("Client")
    lead = relationship("Lead")
