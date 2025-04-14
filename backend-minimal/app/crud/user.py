import uuid
from datetime import datetime
from typing import List, Optional, Union, Dict, Any

import lancedb
import pyarrow as pa
from passlib.context import CryptContext

from app.models.user import User, UserCreate, UserUpdate, UserInDB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


async def get_user(db: lancedb.Connection, user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    table = db.open_table(User.__tablename__)
    results = table.search().where(f"id = '{user_id}'").limit(1).to_list()
    return results[0] if results else None


async def get_user_by_email(db: lancedb.Connection, email: str) -> Optional[Dict[str, Any]]:
    """Get a user by email."""
    table = db.open_table(User.__tablename__)
    results = table.search().where(f"email = '{email}'").limit(1).to_list()
    return results[0] if results else None


async def get_users(db: lancedb.Connection, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Get multiple users."""
    table = db.open_table(User.__tablename__)
    return table.search().offset(skip).limit(limit).to_list()


async def create_user(db: lancedb.Connection, user: UserCreate) -> Dict[str, Any]:
    """Create a new user."""
    now = datetime.now()
    
    user_data = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "hashed_password": get_password_hash(user.password),
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "created_at": now,
        "updated_at": now
    }
    
    # Create the table if it doesn't exist
    if User.__tablename__ not in db.table_names():
        db.create_table(User.__tablename__, data=[user_data], schema=User.get_schema())
    else:
        table = db.open_table(User.__tablename__)
        table.add([user_data])
    
    return user_data


async def update_user(
    db: lancedb.Connection, user_id: str, user_update: UserUpdate
) -> Optional[Dict[str, Any]]:
    """Update a user."""
    table = db.open_table(User.__tablename__)
    
    # Get the current user data
    current_user = await get_user(db, user_id)
    if not current_user:
        return None
    
    # Prepare update data
    update_data = {
        **current_user,
        "updated_at": datetime.now()
    }
    
    if user_update.email is not None:
        update_data["email"] = user_update.email
        
    if user_update.password is not None:
        update_data["hashed_password"] = get_password_hash(user_update.password)
        
    if user_update.is_active is not None:
        update_data["is_active"] = user_update.is_active
        
    if user_update.is_superuser is not None:
        update_data["is_superuser"] = user_update.is_superuser
    
    # Delete the old record
    table.delete(f"id = '{user_id}'")
    
    # Add the updated record
    table.add([update_data])
    
    return update_data


async def delete_user(db: lancedb.Connection, user_id: str) -> bool:
    """Delete a user."""
    table = db.open_table(User.__tablename__)
    
    # Check if user exists
    user = await get_user(db, user_id)
    if not user:
        return False
    
    # Delete the user
    table.delete(f"id = '{user_id}'")
    return True


async def authenticate_user(db: lancedb.Connection, email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user 