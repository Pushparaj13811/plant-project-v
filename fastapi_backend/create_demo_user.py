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

def create_demo_user():
    """
    Create a demo user with user-provided credentials
    """
    print("\nCreating demo user:")
    print("-----------------")
    
    # Get user input for demo user
    while True:
        email = input("Demo user email: ")
        if "@" in email and "." in email:
            break
        print("Please enter a valid email address")
    
    # Get password
    while True:
        password = getpass.getpass("Demo user password: ")
        if len(password) >= 6:
            password_confirm = getpass.getpass("Confirm password: ")
            if password == password_confirm:
                break
            print("Passwords don't match, try again")
        else:
            print("Password must be at least 6 characters")
    
    first_name = input("Demo user first name: ")
    last_name = input("Demo user last name: ")
    
    # Create a new database session
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists")
            return False
        
        # Create or get user role
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            user_role = Role(
                name="user",
                description="Standard user with limited access",
                category="USER"
            )
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
        
        # Create demo user
        demo_user = User(
            email=email,
            hashed_password=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_superuser=False,
            role_id=user_role.id
        )
        db.add(demo_user)
        db.commit()
        
        print(f"Demo user created successfully:")
        print(f"Email: {email}")
        print(f"Password: ********")
        return True
        
    finally:
        db.close()

if __name__ == "__main__":
    print("=============================================")
    print("Creating demo user for FastAPI Plant Management")
    print("=============================================")
    
    success = create_demo_user()
    
    if success:
        print("=============================================")
        print("Demo user created successfully!")
        print("=============================================")
    else:
        print("=============================================")
        print("Failed to create demo user.")
        print("=============================================") 