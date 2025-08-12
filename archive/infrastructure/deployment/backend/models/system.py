"""
System models: Schema versioning, etc.
"""
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text
)
from sqlalchemy.sql import func

from .base import Base


class SchemaVersion(Base):
    __tablename__ = "schema_versions"
    
    id = Column(Integer, primary_key=True)
    version = Column(Text, nullable=False, unique=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    rolled_back_at = Column(DateTime(timezone=True))
