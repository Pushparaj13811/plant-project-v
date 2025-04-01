import os
import sys
from pathlib import Path
import getpass

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, Role
from app.core.security import get_password_hash
from app.core.logging import setup_logging

# Setup logging
setup_logging()

def create_superuser(email: str, password: str, full_name: str):
    """
    Create a superuser with admin privileges
    """
    # Create a new database session
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists")
            return False
        
        # Create or get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(
                name="admin",
                description="Administrator role with full access",
                category="ADMIN"
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        # Create superuser
        superuser = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=True,
            is_superuser=True,
            role_id=admin_role.id
        )
        db.add(superuser)
        db.commit()
        
        print(f"Superuser {email} created successfully!")
        return True
        
    finally:
        db.close()

def main():
    print("=============================================")
    print("Create FastAPI Plant Management Superuser")
    print("=============================================")
    
    # Get input from user with validation
    while True:
        email = input("Email: ")
        if "@" in email and "." in email:
            break
        print("Please enter a valid email address")
    
    # Get password (hidden input)
    while True:
        password = getpass.getpass("Password: ")
        if len(password) >= 6:
            password_confirm = getpass.getpass("Confirm password: ")
            if password == password_confirm:
                break
            print("Passwords don't match, try again")
        else:
            print("Password must be at least 6 characters")
    
    full_name = input("Full name: ")
    
    # Create the superuser
    success = create_superuser(email, password, full_name)
    
    if success:
        print("=============================================")
        print("Superuser created successfully!")
        print("=============================================")
    else:
        print("=============================================")
        print("Failed to create superuser.")
        print("=============================================")

if __name__ == "__main__":
    main() 