"""
AI Agent models: Agents, Memory, Interactions
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


class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    role = Column(Text, nullable=False)  # 'follow_up', 'insight', 'design', 'support'
    description = Column(Text)
    config = Column(JSONB)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    memories = relationship("AgentMemory", back_populates="agent", cascade="all, delete-orphan")
    interactions = relationship("AIInteraction", back_populates="agent")


class AgentMemory(Base):
    __tablename__ = "agent_memory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(Text, nullable=False)  # 'client', 'lead', 'global'
    entity_id = Column(UUID(as_uuid=True))
    memory_type = Column(Text, nullable=False)  # 'conversation', 'insight', 'preference'
    content = Column(Text)
    # Note: VECTOR type would need pgvector extension and custom type
    # embedding = Column(VECTOR(1536))  # OpenAI embedding dimension
    memory_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    agent = relationship("AIAgent", back_populates="memories")


class AIInteraction(Base):
    __tablename__ = "ai_interactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("ai_agents.id"))
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    type = Column(Text)
    source = Column(Text)
    content = Column(Text)
    ai_response = Column(Text)
    summary = Column(Text)
    model_used = Column(Text)
    temperature = Column(DECIMAL(precision=3, scale=2))
    interaction_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "type IN ('Chat', 'Follow-Up', 'Summary', 'Prediction', 'PromptResponse')", 
            name='check_interaction_type'
        ),
        CheckConstraint(
            "source IN ('Agent UI', 'Marketing Automation', 'AI Assistant', 'Backend Middleware')", 
            name='check_interaction_source'
        ),
    )
    
    # Relationships
    agent = relationship("AIAgent", back_populates="interactions")
    client = relationship("Client")
    lead = relationship("Lead")
