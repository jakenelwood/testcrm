"""
Marketing analytics models: Campaigns, A/B Tests, Content Templates, etc.
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


class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    campaign_type = Column(Text, nullable=False)
    status = Column(Text, default='Draft')
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    budget = Column(DECIMAL(15, 2))
    target_audience = Column(JSONB)
    goals = Column(JSONB)
    campaign_metadata = Column(JSONB)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "campaign_type IN ('Email', 'SMS', 'Phone', 'Social', 'Direct Mail', 'Digital Ads')", 
            name='check_campaign_type'
        ),
        CheckConstraint(
            "status IN ('Draft', 'Active', 'Paused', 'Completed', 'Cancelled')", 
            name='check_campaign_status'
        ),
    )
    
    # Relationships
    ab_tests = relationship("ABTest", back_populates="campaign")
    touchpoints = relationship("CustomerTouchpoint", back_populates="campaign")


class ABTest(Base):
    __tablename__ = "ab_tests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    description = Column(Text)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    test_type = Column(Text, nullable=False)
    status = Column(Text, default='Draft')
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    traffic_split = Column(JSONB)  # {"variant_a": 50, "variant_b": 50}
    success_metric = Column(Text)
    statistical_significance = Column(DECIMAL(5, 2))
    winner_variant = Column(Text)
    variants = Column(JSONB)
    results = Column(JSONB)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "test_type IN ('Subject Line', 'Content', 'Send Time', 'Call Script', 'Landing Page')", 
            name='check_test_type'
        ),
        CheckConstraint(
            "status IN ('Draft', 'Running', 'Completed', 'Cancelled')", 
            name='check_ab_test_status'
        ),
    )
    
    # Relationships
    campaign = relationship("Campaign", back_populates="ab_tests")
    touchpoints = relationship("CustomerTouchpoint", back_populates="ab_test")


class ContentTemplate(Base):
    __tablename__ = "content_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    template_type = Column(Text, nullable=False)
    subject = Column(Text)
    content = Column(Text, nullable=False)
    variables = Column(JSONB)  # Template variables for personalization
    category = Column(Text)
    tags = Column(ARRAY(Text))
    usage_count = Column(Integer, default=0)
    performance_score = Column(DECIMAL(5, 2))
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "template_type IN ('Email', 'SMS', 'Call Script', 'Social Post', 'Ad Copy')", 
            name='check_template_type'
        ),
    )


class CustomerTouchpoint(Base):
    __tablename__ = "customer_touchpoints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"))
    touchpoint_type = Column(Text, nullable=False)
    channel = Column(Text, nullable=False)
    source = Column(Text)
    medium = Column(Text)
    content = Column(Text)
    attribution_weight = Column(DECIMAL(5, 4), default=1.0)
    conversion_value = Column(DECIMAL(15, 2))
    touchpoint_metadata = Column(JSONB)
    occurred_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "touchpoint_type IN ('Email Open', 'Email Click', 'SMS Click', 'Phone Call', 'Website Visit', 'Form Submit', 'Ad Click')", 
            name='check_touchpoint_type'
        ),
    )
    
    # Relationships
    client = relationship("Client")
    lead = relationship("Lead")
    campaign = relationship("Campaign", back_populates="touchpoints")
    ab_test = relationship("ABTest", back_populates="touchpoints")


class CommunicationMetric(Base):
    __tablename__ = "communication_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    communication_id = Column(UUID(as_uuid=True), ForeignKey("communications.id"))
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"))
    ab_test_id = Column(UUID(as_uuid=True), ForeignKey("ab_tests.id"))
    content_template_id = Column(UUID(as_uuid=True), ForeignKey("content_templates.id"))
    
    # Engagement metrics
    delivered_at = Column(DateTime(timezone=True))
    opened_at = Column(DateTime(timezone=True))
    clicked_at = Column(DateTime(timezone=True))
    replied_at = Column(DateTime(timezone=True))
    bounced_at = Column(DateTime(timezone=True))
    unsubscribed_at = Column(DateTime(timezone=True))
    
    # Performance data
    open_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    forward_count = Column(Integer, default=0)
    
    # Attribution
    conversion_attributed = Column(Boolean, default=False)
    conversion_value = Column(DECIMAL(15, 2))
    attribution_model = Column(Text, default='last_touch')

    metric_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    communication = relationship("Communication")
    campaign = relationship("Campaign")
    ab_test = relationship("ABTest")
    content_template = relationship("ContentTemplate")
