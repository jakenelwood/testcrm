from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User

# Password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def authenticate_user(db: Session, username: str, password: str):
    """Authenticate a user by username and password."""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return False
    
    if not verify_password(password, user.hashed_password):
        return False
    
    return user
