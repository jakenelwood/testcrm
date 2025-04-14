import pyarrow as pa
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

from app.db.database import Base


class User(Base):
    """User model for LanceDB."""
    __tablename__ = "users"
    
    @classmethod
    def get_schema(cls):
        return pa.schema([
            pa.field("id", pa.string()),
            pa.field("email", pa.string()),
            pa.field("hashed_password", pa.string()),
            pa.field("is_active", pa.bool_()),
            pa.field("is_superuser", pa.bool_()),
            pa.field("created_at", pa.timestamp('us')),
            pa.field("updated_at", pa.timestamp('us'))
        ])


class UserCreate(BaseModel):
    """Schema for creating a user."""
    email: str
    password: str
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserInDB(BaseModel):
    """Schema for user in database."""
    id: str
    email: str
    hashed_password: str
    is_active: bool
    is_superuser: bool
    created_at: Any
    updated_at: Any


class UserResponse(BaseModel):
    """Schema for user response."""
    id: str
    email: str
    is_active: bool
    is_superuser: bool
    created_at: Any
    updated_at: Any
