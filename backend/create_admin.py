import sys
import os
from getpass import getpass
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the parent directory to the path so we can import our app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User
from app.auth.authentication import get_password_hash

def create_admin_user(username, email, password):
    """Create an admin user in the database."""
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print(f"User with username '{username}' or email '{email}' already exists.")
            return
        
        # Create new admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"Admin user '{username}' created successfully!")
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

def main():
    """Main function to create an admin user interactively."""
    print("Create Admin User")
    print("-" * 30)
    
    # Get admin details
    username = input("Username: ")
    email = input("Email: ")
    password = getpass("Password: ")
    confirm_password = getpass("Confirm password: ")
    
    # Validate inputs
    if not username or not email or not password:
        print("Error: All fields are required")
        return
    
    if password != confirm_password:
        print("Error: Passwords don't match")
        return
    
    # Create the admin user
    create_admin_user(username, email, password)

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Run the main function
    main()