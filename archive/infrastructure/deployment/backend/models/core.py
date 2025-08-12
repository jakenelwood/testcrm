"""
Core CRM models: Users, Clients, Leads, and supporting tables
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, DECIMAL, 
    ForeignKey, ARRAY, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .base import Base


class LeadStatus(Base):
    __tablename__ = "lead_statuses"
    
    id = Column(Integer, primary_key=True)
    value = Column(Text, nullable=False, unique=True)
    description = Column(Text)
    is_final = Column(Boolean, default=False)
    display_order = Column(Integer)
    color_hex = Column(Text)
    icon_name = Column(Text)
    ai_action_template = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class InsuranceType(Base):
    __tablename__ = "insurance_types"
    
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False, unique=True)
    is_personal = Column(Boolean, default=True)
    is_commercial = Column(Boolean, default=False)
    description = Column(Text)
    icon_name = Column(Text)
    form_schema = Column(JSONB)
    ai_prompt_template = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Pipeline(Base):
    __tablename__ = "pipelines"
    
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    is_default = Column(Boolean, default=False)
    display_order = Column(Integer)
    lead_type = Column(Text, default='Personal')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint("lead_type IN ('Personal', 'Business')", name='check_lead_type'),
    )
    
    # Relationships
    statuses = relationship("PipelineStatus", back_populates="pipeline", cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="pipeline")


class PipelineStatus(Base):
    __tablename__ = "pipeline_statuses"
    
    id = Column(Integer, primary_key=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    is_final = Column(Boolean, default=False)
    display_order = Column(Integer, nullable=False)
    color_hex = Column(Text)
    icon_name = Column(Text)
    ai_action_template = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    pipeline = relationship("Pipeline", back_populates="statuses")


class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    street = Column(Text)
    city = Column(Text)
    state = Column(Text)
    zip_code = Column(Text)
    type = Column(Text)
    is_verified = Column(Boolean, default=False)
    geocode_lat = Column(DECIMAL(10, 8))
    geocode_lng = Column(DECIMAL(11, 8))
    address_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    verified_at = Column(DateTime(timezone=True))
    
    __table_args__ = (
        CheckConstraint("type IN ('Physical', 'Mailing', 'Business', 'Location')", name='check_address_type'),
    )


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(Text, unique=True)
    full_name = Column(Text)
    avatar_url = Column(Text)
    role = Column(Text, default='user')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin', 'agent', 'manager')", name='check_user_role'),
    )
    
    # Relationships
    assigned_leads = relationship("Lead", back_populates="assigned_user")


class Client(Base):
    __tablename__ = "clients"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_type = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    email = Column(Text)
    phone_number = Column(Text)
    address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"))
    mailing_address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"))
    
    # Individual-specific fields
    date_of_birth = Column(Text)
    gender = Column(Text)
    marital_status = Column(Text)
    drivers_license = Column(Text)
    license_state = Column(Text)
    education_occupation = Column(Text)
    referred_by = Column(Text)
    
    # Business-specific fields
    business_type = Column(Text)
    industry = Column(Text)
    tax_id = Column(Text)
    year_established = Column(Text)
    annual_revenue = Column(DECIMAL(15, 2))
    number_of_employees = Column(Integer)
    
    # AI fields
    ai_summary = Column(Text)
    ai_next_action = Column(Text)
    ai_risk_score = Column(Integer)
    ai_lifetime_value = Column(DECIMAL(15, 2))
    
    # Flexible data
    client_metadata = Column(JSONB)
    tags = Column(ARRAY(Text))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_contact_at = Column(DateTime(timezone=True))
    next_contact_at = Column(DateTime(timezone=True))
    converted_from_lead_id = Column(UUID(as_uuid=True))
    
    __table_args__ = (
        CheckConstraint("client_type IN ('Individual', 'Business')", name='check_client_type'),
    )
    
    # Relationships
    address = relationship("Address", foreign_keys=[address_id])
    mailing_address = relationship("Address", foreign_keys=[mailing_address_id])
    leads = relationship("Lead", back_populates="client")


class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"))
    status_id = Column(Integer, ForeignKey("lead_statuses.id"))
    insurance_type_id = Column(Integer, ForeignKey("insurance_types.id"))
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Core insurance fields
    current_carrier = Column(Text)
    premium = Column(DECIMAL(10, 2))
    auto_premium = Column(DECIMAL(10, 2))
    home_premium = Column(DECIMAL(10, 2))
    specialty_premium = Column(DECIMAL(10, 2))
    commercial_premium = Column(DECIMAL(10, 2))
    
    # Insurance-specific JSONB data
    auto_data = Column(JSONB)
    home_data = Column(JSONB)
    specialty_data = Column(JSONB)
    commercial_data = Column(JSONB)
    liability_data = Column(JSONB)
    additional_insureds = Column(JSONB)
    additional_locations = Column(JSONB)
    
    # AI fields
    ai_summary = Column(Text)
    ai_next_action = Column(Text)
    ai_quote_recommendation = Column(Text)
    ai_follow_up_priority = Column(Integer)
    
    # Marketing fields
    campaign_id = Column(UUID(as_uuid=True))
    ab_test_id = Column(UUID(as_uuid=True))
    content_template_id = Column(UUID(as_uuid=True))
    attribution_data = Column(JSONB)
    
    # Flexible data
    lead_metadata = Column(JSONB)
    tags = Column(ARRAY(Text))
    notes = Column(Text)
    
    # Import tracking
    source = Column(Text, default='Manual Entry')
    import_file_name = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status_changed_at = Column(DateTime(timezone=True))
    last_contact_at = Column(DateTime(timezone=True))
    next_contact_at = Column(DateTime(timezone=True))
    quote_generated_at = Column(DateTime(timezone=True))
    sold_at = Column(DateTime(timezone=True))
    lost_at = Column(DateTime(timezone=True))
    
    # Relationships
    client = relationship("Client", back_populates="leads")
    status = relationship("LeadStatus")
    insurance_type = relationship("InsuranceType")
    pipeline = relationship("Pipeline", back_populates="leads")
    assigned_user = relationship("User", back_populates="assigned_leads")
