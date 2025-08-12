"""
Communication and Quote models
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, DECIMAL, 
    ForeignKey, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .base import Base


class Communication(Base):
    __tablename__ = "communications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"))
    content_template_id = Column(UUID(as_uuid=True), ForeignKey("content_templates.id"))
    type = Column(Text, nullable=False)  # 'call', 'email', 'sms', 'meeting'
    direction = Column(Text)
    subject = Column(Text)
    content = Column(Text)
    status = Column(Text)
    duration = Column(Integer)  # in minutes
    outcome = Column(Text)
    ai_summary = Column(Text)
    ai_sentiment = Column(Text)
    ai_entities = Column(JSONB)
    ai_action_items = Column(JSONB)
    personalization_data = Column(JSONB)
    communication_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    scheduled_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    __table_args__ = (
        CheckConstraint("direction IN ('Inbound', 'Outbound')", name='check_communication_direction'),
    )
    
    # Relationships
    client = relationship("Client")
    lead = relationship("Lead")
    campaign = relationship("Campaign")
    ab_test = relationship("ABTest")
    content_template = relationship("ContentTemplate")


class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    insurance_type = Column(Text, nullable=False)
    carrier = Column(Text)
    paid_in_full_amount = Column(DECIMAL(10, 2))
    monthly_payment_amount = Column(DECIMAL(10, 2))
    contract_term = Column(Text)
    quote_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint("insurance_type IN ('Auto', 'Home', 'Renters', 'Specialty')", name='check_insurance_type'),
        CheckConstraint("contract_term IN ('6mo', '12mo')", name='check_contract_term'),
    )
    
    # Relationships
    lead = relationship("Lead")
